// 退会: ログイン中の本人のアカウントとデータをすべて削除する。
// 呼び出し元の確認は、送られてきたログイントークンを Supabase Auth に問い合わせて行う。
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data, error } = await admin.auth.getUser(token)
  const user = data?.user
  if (error || !user) return json({ error: 'unauthorized' }, 401)

  // 1. 自分の投稿に付いた他の人のコメント・通知
  const prep = await admin.rpc('prepare_account_deletion', { target_user: user.id })
  if (prep.error) return json({ error: 'prepare failed' }, 500)

  // 2. アイコン画像（Storage はデータベースの連鎖削除の対象外）
  const { data: files } = await admin.storage.from('avatars').list(user.id)
  if (files?.length) await admin.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`))

  // 3. アカウント本体。profiles → 投稿・コメント・リアクション・参加表明・ブロック・通報・通知が連鎖して消える
  const del = await admin.auth.admin.deleteUser(user.id)
  if (del.error) return json({ error: 'delete failed' }, 500)

  return json({ deleted: true })
})
