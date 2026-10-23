// Google などに「どのページがあるか」を伝えるサイトマップ。公開中の作品・募集・イベント・プロフィールを並べる
const STATIC = ['/', '/tracks', '/recruits', '/events', '/people']

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
    rows('recruitments?select=id,created_at&is_open=eq.true&order=created_at.desc&limit=5000'),
    // 終わったイベントは載せない
    rows(`events?select=id,created_at&starts_at=gte.${encodeURIComponent(now)}&order=starts_at&limit=5000`),
    rows('profiles?select=id,created_at&order=created_at.desc&limit=5000'),
  ])
  const urls = [
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
