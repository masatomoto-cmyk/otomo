import { createClient } from '@supabase/supabase-js'

// events は event_attendees 経由でも profiles とつながるので、外部キー名で投稿者を明示する
const withProfile = (table) => `*, profile:profiles!${table}_user_id_fkey(id, display_name, avatar_url)`

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export function createSupabaseApi(url, key) {
  const sb = createClient(url, key)

  async function currentUserId() {
    const { data } = await sb.auth.getSession()
    return data.session?.user.id ?? null
  }

  return {
    mode: 'supabase',

    auth: {
      async getUser() {
        const { data } = await sb.auth.getSession()
        return data.session?.user ?? null
      },
      onChange(cb) {
        const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null))
        return () => data.subscription.unsubscribe()
      },
      async signUp({ email, password, displayName }) {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          // 確認メールのリンクから、このアプリに戻ってくる（Supabase の Redirect URLs に登録が必要）
          options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
        })
        if (error) throw new Error(error.message)
        return { needsConfirmation: !data.session }
      },
      async signIn({ email, password }) {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
      },
      async signOut() {
        await sb.auth.signOut()
      },
    },

    async getProfile(id) {
      return unwrap(await sb.from('profiles').select('*').eq('id', id).maybeSingle())
    },
    async updateProfile(id, patch) {
      return unwrap(await sb.from('profiles').update(patch).eq('id', id).select().single())
    },
    // アイコン画像を自分のフォルダに置いて公開 URL を返す。前の画像は消す
    async uploadAvatar(blob) {
      const me = await currentUserId()
      // Safari は webp を書き出せず png になることがあるので、実際の形式に合わせる
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'webp'
      const path = `${me}/${Date.now()}.${ext}`
      unwrap(await sb.storage.from('avatars').upload(path, blob, { contentType: blob.type || 'image/webp', cacheControl: '31536000' }))
      const { data: list } = await sb.storage.from('avatars').list(me)
      const old = (list ?? []).map((f) => `${me}/${f.name}`).filter((p) => p !== path)
      if (old.length) await sb.storage.from('avatars').remove(old)
      return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl
    },
    async removeAvatar() {
      const me = await currentUserId()
      const { data: list } = await sb.storage.from('avatars').list(me)
      if (list?.length) await sb.storage.from('avatars').remove(list.map((f) => `${me}/${f.name}`))
    },
    async listProfiles({ part, area } = {}) {
      let q = sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
      if (part) q = q.contains('parts', [part])
      if (area) q = q.eq('area', area)
      return unwrap(await q)
    },

    // filters: { eq: {col: v}, contains: {col: v}, gte: {col: v} }
    async list(table, { eq = {}, contains = {}, gte = {}, order = 'created_at', ascending = false, limit = 50 } = {}) {
      let q = sb.from(table).select(withProfile(table))
      for (const [col, v] of Object.entries(eq)) q = q.eq(col, v)
      for (const [col, v] of Object.entries(contains)) q = q.contains(col, [v])
      for (const [col, v] of Object.entries(gte)) q = q.gte(col, v)
      return unwrap(await q.order(order, { ascending }).limit(limit))
    },
    async get(table, id) {
      return unwrap(await sb.from(table).select(withProfile(table)).eq('id', id).maybeSingle())
    },
    async create(table, row) {
      return unwrap(await sb.from(table).insert(row).select(withProfile(table)).single())
    },
    async update(table, id, patch) {
      return unwrap(await sb.from(table).update(patch).eq('id', id).select(withProfile(table)).single())
    },
    async remove(table, id) {
      unwrap(await sb.from(table).delete().eq('id', id))
    },

    async listComments(targetType, targetId) {
      return unwrap(
        await sb
          .from('comments')
          .select(withProfile('comments'))
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .order('created_at'),
      )
    },
    async addComment(targetType, targetId, body) {
      return unwrap(
        await sb.from('comments').insert({ target_type: targetType, target_id: targetId, body }).select(withProfile('comments')).single(),
      )
    },

    // 自分が送ったリアクションの種類
    async getMyReactions(targetType, targetId) {
      const me = await currentUserId()
      if (!me) return []
      const rows = unwrap(
        await sb.from('reactions').select('kind').match({ user_id: me, target_type: targetType, target_id: targetId }),
      )
      return rows.map((r) => r.kind)
    },
    async toggleReaction(targetType, targetId, kind) {
      const me = await currentUserId()
      const mine = await this.getMyReactions(targetType, targetId)
      if (mine.includes(kind)) {
        unwrap(await sb.from('reactions').delete().match({ user_id: me, target_type: targetType, target_id: targetId, kind }))
      } else {
        unwrap(await sb.from('reactions').insert({ target_type: targetType, target_id: targetId, kind }))
      }
      return this.getMyReactions(targetType, targetId)
    },
    // 自分の投稿に届いたリアクション（RLS で受け手本人にしか返らない）
    async getReceivedReactions(targetType, targetId) {
      const me = await currentUserId()
      if (!me) return []
      return unwrap(
        await sb
          .from('reactions')
          .select('kind, created_at, profile:profiles!reactions_user_id_fkey(id, display_name, avatar_url)')
          .match({ owner_id: me, target_type: targetType, target_id: targetId })
          .order('created_at', { ascending: false }),
      )
    },

    // { [target_id]: コメント数 }
    async commentCounts(targetType) {
      const rows = unwrap(await sb.from('comment_counts').select('target_id, count').eq('target_type', targetType))
      return Object.fromEntries(rows.map((r) => [r.target_id, r.count]))
    },

    // 退会。サーバー側（Edge Function delete-account）でアカウントと全データを消してからログアウトする
    async deleteAccount() {
      const { error } = await sb.functions.invoke('delete-account', { method: 'POST' })
      if (error) throw new Error('退会の処理に失敗しました。時間をおいてもう一度お試しください')
      await sb.auth.signOut()
    },

    // 通知（コメント・応募・リアクション・参加表明。DB のトリガーで作られる）
    async listNotifications() {
      return unwrap(
        await sb
          .from('notifications')
          .select('*, actor:profiles!notifications_actor_id_fkey(id, display_name, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(50),
      )
    },
    async unreadCount() {
      if (!(await currentUserId())) return 0
      const { count, error } = await sb.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null)
      if (error) throw new Error(error.message)
      return count ?? 0
    },
    async markAllRead() {
      unwrap(await sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null))
    },

    // ブロック
    async listMyBlocks() {
      const me = await currentUserId()
      if (!me) return []
      return unwrap(
        await sb.from('blocks').select('blocked_id, profile:profiles!blocks_blocked_id_fkey(id, display_name, avatar_url)').order('created_at', { ascending: false }),
      )
    },
    async block(userId) {
      unwrap(await sb.from('blocks').insert({ blocked_id: userId }))
    },
    async unblock(userId) {
      const me = await currentUserId()
      unwrap(await sb.from('blocks').delete().match({ blocker_id: me, blocked_id: userId }))
    },

    // 通報。同じ対象への2回目は「受付済み」として扱う
    async report(targetType, targetId, reason, detail) {
      const { error } = await sb.from('reports').insert({ target_type: targetType, target_id: targetId, reason, detail })
      if (error && error.code !== '23505') throw new Error(error.message)
    },

    // 外部のライブ情報（Edge Function 経由。API キーはサーバー側にだけ置く）
    async externalEvents({ area = '', small = true } = {}) {
      const q = new URLSearchParams({ area, small: small ? '1' : '0' })
      const { data, error } = await sb.functions.invoke(`external-events?${q}`, { method: 'GET' })
      if (error) throw new Error('ライブ情報を取得できませんでした')
      return data
    },

    async getAttendees(eventId) {
      const rows = unwrap(await sb.from('event_attendees').select('profile:profiles(id, display_name, avatar_url)').eq('event_id', eventId))
      return rows.map((r) => r.profile)
    },
    async toggleAttend(eventId) {
      const me = await currentUserId()
      const attendees = await this.getAttendees(eventId)
      if (attendees.some((p) => p.id === me)) {
        unwrap(await sb.from('event_attendees').delete().match({ event_id: eventId, user_id: me }))
      } else {
        unwrap(await sb.from('event_attendees').insert({ event_id: eventId }))
      }
      return this.getAttendees(eventId)
    },
  }
}
