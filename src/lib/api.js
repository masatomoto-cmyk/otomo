import { createSupabaseApi } from './api-supabase'
import { createDemoApi } from './api-demo'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase の設定があれば本番データ、なければブラウザ内のデモデータで動く
const base = url && key ? createSupabaseApi(url, key) : createDemoApi()

// ブロックした人の投稿・コメント・プロフィールは、どの一覧からも見えなくする
let blocked = new Set()

async function refreshBlocked() {
  const rows = await base.listMyBlocks()
  blocked = new Set(rows.map((r) => r.blocked_id))
  return rows
}

const visible = (rows) => rows.filter((r) => !blocked.has(r.user_id))

export const api = {
  ...base,
  auth: {
    ...base.auth,
    onChange(cb) {
      return base.auth.onChange(async (user) => {
        if (user) await refreshBlocked()
        else blocked = new Set()
        cb(user)
      })
    },
    async getUser() {
      const user = await base.auth.getUser()
      if (user) await refreshBlocked()
      return user
    },
  },
  isBlocked: (userId) => blocked.has(userId),
  listMyBlocks: refreshBlocked,
  async block(userId) {
    await base.block(userId)
    await refreshBlocked()
  },
  async unblock(userId) {
    await base.unblock(userId)
    await refreshBlocked()
  },
  async list(table, opts) {
    return visible(await base.list(table, opts))
  },
  async listComments(type, id) {
    return visible(await base.listComments(type, id))
  },
  async listProfiles(opts) {
    return (await base.listProfiles(opts)).filter((p) => !blocked.has(p.id))
  },
  async getAttendees(eventId) {
    return (await base.getAttendees(eventId)).filter((p) => !blocked.has(p.id))
  },
}
