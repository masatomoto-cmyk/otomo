// Google などに「どのページがあるか」を伝えるサイトマップ。公開中の作品・募集・イベント・プロフィールを並べる
const STATIC = ['/', '/tracks', '/recruits', '/events', '/people', '/guide/band-member']
// 地域・パート別の募集ページ（src/lib/constants.js の AREA_SLUGS・PART_SLUGS と同じ対応）
const AREA_SLUGS = {
  北海道: 'hokkaido', 東北: 'tohoku', 関東: 'kanto', 中部: 'chubu', 近畿: 'kinki',
  中国: 'chugoku', 四国: 'shikoku', '九州・沖縄': 'kyushu-okinawa', オンライン: 'online',
}
const PART_SLUGS = {
  ボーカル: 'vocal', ギター: 'guitar', ベース: 'bass', ドラム: 'drums', キーボード: 'keyboard',
  'DTM・トラックメイク': 'dtm', DJ: 'dj', ラップ: 'rap', 管楽器: 'horns', 弦楽器: 'strings', エンジニア: 'engineer', その他: 'other',
}

async function rows(path) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  return res.ok ? res.json() : []
}

const day = (iso) => String(iso).slice(0, 10)

export default async function handler(req, res) {
  const origin = `https://${req.headers['x-forwarded-host'] ?? req.headers.host}`
  const now = new Date().toISOString()
  const [tracks, recruits, events, people] = await Promise.all([
    rows('tracks?select=id,created_at&order=created_at.desc&limit=5000'),
    rows('recruitments?select=id,created_at,area,parts&is_open=eq.true&order=created_at.desc&limit=5000'),
    // 終わったイベントは載せない
    rows(`events?select=id,created_at&starts_at=gte.${encodeURIComponent(now)}&order=starts_at&limit=5000`),
    rows('profiles?select=id,created_at&order=created_at.desc&limit=5000'),
  ])
  // 募集中の募集が1件以上ある地域・パートのページだけ載せる（空のページは検索に出さない）
  const latest = new Map()
  for (const r of recruits) {
    const keys = [AREA_SLUGS[r.area] && `/recruits/area/${AREA_SLUGS[r.area]}`, ...(r.parts ?? []).map((p) => PART_SLUGS[p] && `/recruits/part/${PART_SLUGS[p]}`)]
    for (const k of keys.filter(Boolean)) if (!latest.has(k) || latest.get(k) < r.created_at) latest.set(k, r.created_at)
  }
  const urls = [
    ...[...latest].map(([path, at]) => ({ loc: `${origin}${path}`, lastmod: day(at) })),
    ...STATIC.map((p) => ({ loc: `${origin}${p}`, lastmod: day(now) })),
    ...tracks.map((r) => ({ loc: `${origin}/tracks/${r.id}`, lastmod: day(r.created_at) })),
    ...recruits.map((r) => ({ loc: `${origin}/recruits/${r.id}`, lastmod: day(r.created_at) })),
    ...events.map((r) => ({ loc: `${origin}/events/${r.id}`, lastmod: day(r.created_at) })),
    ...people.map((r) => ({ loc: `${origin}/u/${r.id}`, lastmod: day(r.created_at) })),
  ]
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>`)
}
