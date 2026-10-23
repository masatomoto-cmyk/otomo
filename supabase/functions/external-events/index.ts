// 外部のライブ情報（JamBase Data API）を取得して OTOMO の形に揃えて返す。
// API キー（JAMBASE_API_KEY）はこの関数の中だけで使い、ブラウザには出さない。
// 同じ日の結果は external_events_cache に 6 時間キャッシュして、API の利用回数を抑える。
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const CACHE_HOURS = 6
const SMALL_VENUE_CAPACITY = 500 // インディーズ向けに、これ以下（または不明）の会場だけ出す

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// [都道府県, 地域, 県庁所在地の緯度, 経度]。JamBase は日本の都道府県を返さないので、会場の座標から最寄りの県を推定する
const PREFS: [string, string, number, number][] = [
  ['北海道', '北海道', 43.06, 141.35],
  ['青森県', '東北', 40.82, 140.74], ['岩手県', '東北', 39.7, 141.15], ['宮城県', '東北', 38.27, 140.87],
  ['秋田県', '東北', 39.72, 140.1], ['山形県', '東北', 38.24, 140.36], ['福島県', '東北', 37.75, 140.47],
  ['茨城県', '関東', 36.34, 140.45], ['栃木県', '関東', 36.57, 139.88], ['群馬県', '関東', 36.39, 139.06],
  ['埼玉県', '関東', 35.86, 139.65], ['千葉県', '関東', 35.61, 140.12], ['東京都', '関東', 35.69, 139.69],
  ['神奈川県', '関東', 35.45, 139.64],
  ['新潟県', '中部', 37.9, 139.02], ['富山県', '中部', 36.7, 137.21], ['石川県', '中部', 36.59, 136.63],
  ['福井県', '中部', 36.07, 136.22], ['山梨県', '中部', 35.66, 138.57], ['長野県', '中部', 36.65, 138.18],
  ['岐阜県', '中部', 35.39, 136.72], ['静岡県', '中部', 34.98, 138.38], ['愛知県', '中部', 35.18, 136.91],
  ['三重県', '近畿', 34.73, 136.51], ['滋賀県', '近畿', 35.0, 135.87], ['京都府', '近畿', 35.02, 135.76],
  ['大阪府', '近畿', 34.69, 135.52], ['兵庫県', '近畿', 34.69, 135.18], ['奈良県', '近畿', 34.69, 135.83],
  ['和歌山県', '近畿', 34.23, 135.17],
  ['鳥取県', '中国', 35.5, 134.24], ['島根県', '中国', 35.47, 133.05], ['岡山県', '中国', 34.66, 133.93],
  ['広島県', '中国', 34.4, 132.46], ['山口県', '中国', 34.19, 131.47],
  ['徳島県', '四国', 34.07, 134.56], ['香川県', '四国', 34.34, 134.04], ['愛媛県', '四国', 33.84, 132.77],
  ['高知県', '四国', 33.56, 133.53],
  ['福岡県', '九州・沖縄', 33.61, 130.42], ['佐賀県', '九州・沖縄', 33.25, 130.3], ['長崎県', '九州・沖縄', 32.74, 129.87],
  ['熊本県', '九州・沖縄', 32.79, 130.74], ['大分県', '九州・沖縄', 33.24, 131.61], ['宮崎県', '九州・沖縄', 31.91, 131.42],
  ['鹿児島県', '九州・沖縄', 31.56, 130.56], ['沖縄県', '九州・沖縄', 26.21, 127.68],
]

function nearestPref(lat?: number, lng?: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { pref: '', area: '' }
  const k = Math.cos((lat * Math.PI) / 180)
  let best = PREFS[0]
  let bestD = Infinity
  for (const p of PREFS) {
    const d = (p[2] - lat) ** 2 + ((p[3] - lng) * k) ** 2
    if (d < bestD) [best, bestD] = [p, d]
  }
  return { pref: best[0], area: best[1] }
}

// deno-lint-ignore no-explicit-any
function normalize(e: any) {
  const loc = e.location ?? {}
  const geo = loc.geo ?? {}
  const { pref, area } = nearestPref(Number(geo.latitude), Number(geo.longitude))
  const capacity = typeof loc.maximumAttendeeCapacity === 'number' ? loc.maximumAttendeeCapacity : null
  return {
    id: e.identifier,
    name: e['x-customTitle'] || e.name,
    startDate: e.startDate,
    status: e.eventStatus ?? 'scheduled',
    venue: loc.name ?? '',
    city: loc.address?.addressLocality ?? '',
    pref,
    area,
    capacity,
    // deno-lint-ignore no-explicit-any
    performers: (e.performer ?? []).map((p: any) => p.name).filter(Boolean).slice(0, 8),
    url: e.url ?? '',
    ticketUrl: e.offers?.[0]?.url ?? '',
    image: e.image ?? '',
  }
}

async function fetchJamBase(key: string, from: string) {
  const events = []
  for (let page = 1; page <= 3; page++) {
    const q = new URLSearchParams({
      geoCountryIso2: 'JP',
      eventType: 'concerts',
      eventDateFrom: from,
      sort: 'eventDate',
      perPage: '100',
      page: String(page),
    })
    const res = await fetch(`https://api.data.jambase.com/v3/events?${q}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`JamBase ${res.status}`)
    const body = await res.json()
    events.push(...(body.events ?? []).filter((e: { deletionStatus?: string }) => !e.deletionStatus).map(normalize))
    if (page >= (body.pagination?.totalPages ?? 1)) break
  }
  return events
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const key = Deno.env.get('JAMBASE_API_KEY')
  if (!key) return json({ configured: false, source: 'jambase', events: [] })

  const params = new URL(req.url).searchParams
  const area = params.get('area') ?? ''
  const smallOnly = params.get('small') !== '0'
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10) // JST の日付

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const cacheKey = `jambase:JP:${today}`

  let events
  const { data: cached } = await admin.from('external_events_cache').select('payload, fetched_at').eq('key', cacheKey).maybeSingle()
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_HOURS * 3600_000) {
    events = cached.payload
  } else {
    try {
      events = await fetchJamBase(key, today)
      await admin.from('external_events_cache').upsert({ key: cacheKey, payload: events, fetched_at: new Date().toISOString() })
    } catch (err) {
      console.error(err)
      // API が落ちていても、古いキャッシュがあればそれを返す
      if (cached) events = cached.payload
      else return json({ configured: true, source: 'jambase', events: [], error: 'upstream' }, 502)
    }
  }

  const filtered = events
    // deno-lint-ignore no-explicit-any
    .filter((e: any) => e.status !== 'cancelled')
    // deno-lint-ignore no-explicit-any
    .filter((e: any) => !area || e.area === area)
    // deno-lint-ignore no-explicit-any
    .filter((e: any) => !smallOnly || e.capacity === null || e.capacity <= SMALL_VENUE_CAPACITY)
    .slice(0, 100)

  return json({ configured: true, source: 'jambase', events: filtered })
})
