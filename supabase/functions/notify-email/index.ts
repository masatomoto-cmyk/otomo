// まだメールしていない通知を、受け取る人ごとに1通にまとめて送る。pg_cron から15分ごとに呼ばれる。
// 送信には Resend を使う（シークレット RESEND_API_KEY・NOTIFY_FROM）。キーが未設定なら何もしない。
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://otomo-alpha.vercel.app'
const FROM = Deno.env.get('NOTIFY_FROM') ?? 'OTOMO <onboarding@resend.dev>'
const MAX_AGE_DAYS = 3 // 設定前に溜まっていた古い通知は送らない

const TARGET_LABEL: Record<string, string> = { post: '投稿', track: '作品', recruitment: '募集', event: 'イベント' }
const REACTION_LABEL: Record<string, string> = {
  listened: '🎧 聴いたよ', moved: '✨ 刺さった', collab: '🤝 一緒にやりたい', relate: '🙌 わかる', interested: '👀 気になる',
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

type Row = {
  id: string
  user_id: string
  type: string
  target_type: string
  target_id: string
  kind: string
  excerpt: string
  created_at: string
  actor: { display_name: string } | null
}

function line(n: Row) {
  const who = `${n.actor?.display_name ?? '誰か'}さん`
  const what = `あなたの${TARGET_LABEL[n.target_type] ?? '投稿'}`
  if (n.type === 'apply') return `${who}から${what}に応募・質問が届きました`
  if (n.type === 'comment') return `${who}が${what}にコメントしました`
  if (n.type === 'attend') return `${who}が${what}に参加を表明しました`
  return `${who}が${what}に「${REACTION_LABEL[n.kind] ?? 'リアクション'}」を送りました`
}

function render(rows: Row[]) {
  const items = rows.slice(0, 20)
  const more = rows.length - items.length
  const text = [
    `OTOMO に新しい通知が ${rows.length} 件あります。`,
    '',
    ...items.map((n) => `・${line(n)}${n.excerpt ? `「${n.excerpt}」` : ''}`),
    ...(more > 0 ? [`ほか ${more} 件`] : []),
    '',
    `通知を見る: ${SITE_URL}/notifications`,
    `メール通知の設定: ${SITE_URL}/settings`,
  ].join('\n')
  const html = `<div style="font-family:-apple-system,'Hiragino Sans',sans-serif;max-width:560px;margin:0 auto;color:#1f2328;line-height:1.6">
<p style="font-size:16px;font-weight:600">OTOMO に新しい通知が ${rows.length} 件あります</p>
<ul style="padding-left:18px">${items
    .map((n) => `<li style="margin:6px 0">${esc(line(n))}${n.excerpt ? `<br><span style="color:#59636e">「${esc(n.excerpt)}」</span>` : ''}</li>`)
    .join('')}${more > 0 ? `<li style="color:#59636e">ほか ${more} 件</li>` : ''}</ul>
<p><a href="${SITE_URL}/notifications" style="display:inline-block;background:#1f883d;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">通知を見る</a></p>
<p style="color:#59636e;font-size:12px">このメールが不要な場合は <a href="${SITE_URL}/settings" style="color:#0969da">設定</a> でオフにできます。</p>
</div>`
  return { subject: `OTOMO に新しい通知が ${rows.length} 件あります`, text, html }
}

Deno.serve(async (req) => {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // pg_cron だけが知っている合言葉で呼び出し元を確かめる
  const token = req.headers.get('x-notify-token') ?? ''
  const { data: ok } = await admin.rpc('check_notify_token', { token })
  if (!ok) return new Response('forbidden', { status: 403 })

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return Response.json({ configured: false })

  const since = new Date(Date.now() - MAX_AGE_DAYS * 86400_000).toISOString()
  // 古すぎるものは送らずに送信済み扱いにする
  await admin.from('notifications').update({ emailed_at: new Date().toISOString() }).is('emailed_at', null).lt('created_at', since)

  const { data: rows, error } = await admin
    .from('notifications')
    .select('id, user_id, type, target_type, target_id, kind, excerpt, created_at, actor:profiles!notifications_actor_id_fkey(display_name)')
    .is('emailed_at', null)
    .is('read_at', null)
    .order('created_at')
    .limit(1000)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const byUser = new Map<string, Row[]>()
  for (const r of (rows ?? []) as unknown as Row[]) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r])

  const { data: prefs } = await admin.from('profiles').select('id, email_notifications').in('id', [...byUser.keys()])
  const wantsEmail = new Set((prefs ?? []).filter((p) => p.email_notifications).map((p) => p.id))

  let sent = 0
  const failed: string[] = []
  for (const [userId, list] of byUser) {
    const ids = list.map((r) => r.id)
    if (wantsEmail.has(userId)) {
      const { data: u } = await admin.auth.admin.getUserById(userId)
      const to = u?.user?.email
      if (to) {
        const { subject, text, html } = render(list)
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM, to, subject, text, html }),
        })
        if (!res.ok) {
          console.error('resend', res.status, await res.text())
          failed.push(userId)
          continue // 失敗した人の分は次回また送る
        }
        sent++
        await new Promise((r) => setTimeout(r, 600)) // Resend の無料枠は毎秒2通まで
      }
    }
    // メールを送った人も、オフにしている人も、送信済みにする（次回また拾わないため）
    await admin.from('notifications').update({ emailed_at: new Date().toISOString() }).in('id', ids)
  }

  return Response.json({ configured: true, users: byUser.size, sent, failed: failed.length })
})
