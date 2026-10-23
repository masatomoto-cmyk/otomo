// X・LINE・Discord などのクローラー向けに、ページごとのタイトルと説明を埋め込んだ HTML を返す。
// この SPA は JS を実行しないクローラーには中身が見えないため、vercel.json でクローラーだけここに回している。
const SITE = 'OTOMO'
const DEFAULT_TITLE = 'OTOMO — 音でつながる'
const DEFAULT_DESC = '作品に感想が届く。バンド仲間が見つかる。ライブを告知できる。音楽好きとミュージシャンのための交流アプリ。'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const clip = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}
const jstDate = (iso) =>
  new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })

async function fetchOne(path) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) return null
  return (await res.json())[0] ?? null
}

// 種類ごとにタイトル・説明を組み立てる（取得できなければ null でサイト共通の表示）
const BUILDERS = {
  tracks: async (id) => {
    const t = await fetchOne(`tracks?id=eq.${id}&select=title,description,genre,profile:profiles!tracks_user_id_fkey(display_name)`)
    if (!t) return null
    const name = t.profile?.display_name ?? ''
    return {
      title: `${t.title} / ${name}`,
      description: t.description || `${name}さんの作品${t.genre ? `（${t.genre}）` : ''}。OTOMOで感想を届けよう。`,
    }
  },
  recruits: async (id) => {
    const r = await fetchOne(`recruitments?id=eq.${id}&select=title,body,parts,area,is_open`)
    if (!r) return null
    const head = [r.parts?.length && `募集パート: ${r.parts.join('・')}`, r.area && `地域: ${r.area}`].filter(Boolean).join(' / ')
    return { title: `【${r.is_open ? 'メンバー募集' : '募集終了'}】${r.title}`, description: [head, r.body].filter(Boolean).join(' — ') }
  },
  events: async (id) => {
    const e = await fetchOne(`events?id=eq.${id}&select=title,body,venue,area,starts_at`)
    if (!e) return null
    const when = `${jstDate(e.starts_at)}${e.venue ? ` @ ${e.venue}` : ''}${e.area ? `（${e.area}）` : ''}`
    return { title: e.title, description: [when, e.body].filter(Boolean).join(' — ') }
  },
  u: async (id) => {
    const p = await fetchOne(`profiles?id=eq.${id}&select=display_name,bio,parts,area`)
    if (!p) return null
    const head = [p.parts?.length && p.parts.join('・'), p.area].filter(Boolean).join(' / ')
    return { title: `${p.display_name}さん`, description: [head, p.bio].filter(Boolean).join(' — ') || `${p.display_name}さんのOTOMOプロフィール` }
  },
}

export default async function handler(req, res) {
  const { kind, id } = req.query
  const origin = `https://${req.headers['x-forwarded-host'] ?? req.headers.host}`
  const pageUrl = `${origin}/${kind}/${id}`

  let meta = null
  if (BUILDERS[kind] && UUID.test(String(id))) {
    try {
      meta = await BUILDERS[kind](id)
    } catch {
      meta = null
    }
  }
  const title = meta ? `${clip(meta.title, 80)}｜${SITE}` : DEFAULT_TITLE
  const description = clip(meta?.description || DEFAULT_DESC, 160)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // 投稿の編集が数分でカードに反映されるよう、短めにキャッシュする
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  res.status(meta ? 200 : 404).send(`<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(pageUrl)}">
<meta property="og:site_name" content="${SITE}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ja_JP">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${origin}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${origin}/og.png">
</head><body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<p><a href="${esc(pageUrl)}">OTOMOで見る</a></p>
</body></html>`)
}
