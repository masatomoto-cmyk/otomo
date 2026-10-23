import { createClient } from '@supabase/supabase-js'

const WITH_PROFILE = '*, profile:profiles(id, display_name)'

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
          options: { data: { display_name: displayName } },
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
    async listProfiles({ part, area } = {}) {
      let q = sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
      if (part) q = q.contains('parts', [part])
      if (area) q = q.eq('area', area)
      return unwrap(await q)
    },

    // filters: { eq: {col: v}, contains: {col: v}, gte: {col: v} }
    async list(table, { eq = {}, contains = {}, gte = {}, order = 'created_at', ascending = false, limit = 50 } = {}) {
      let q = sb.from(table).select(WITH_PROFILE)
      for (const [col, v] of Object.entries(eq)) q = q.eq(col, v)
      for (const [col, v] of Object.entries(contains)) q = q.contains(col, [v])
      for (const [col, v] of Object.entries(gte)) q = q.gte(col, v)
      return unwrap(await q.order(order, { ascending }).limit(limit))
    },
    async get(table, id) {
      return unwrap(await sb.from(table).select(WITH_PROFILE).eq('id', id).maybeSingle())
    },
    async create(table, row) {
      return unwrap(await sb.from(table).insert(row).select(WITH_PROFILE).single())
    },
    async update(table, id, patch) {
      return unwrap(await sb.from(table).update(patch).eq('id', id).select(WITH_PROFILE).single())
    },
    async remove(table, id) {
      unwrap(await sb.from(table).delete().eq('id', id))
    },

    async listComments(targetType, targetId) {
      return unwrap(
        await sb
          .from('comments')
          .select(WITH_PROFILE)
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .order('created_at'),
      )
    },
    async addComment(targetType, targetId, body) {
      return unwrap(
        await sb.from('comments').insert({ target_type: targetType, target_id: targetId, body }).select(WITH_PROFILE).single(),
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
          .select('kind, created_at, profile:profiles!reactions_user_id_fkey(id, display_name)')
          .match({ owner_id: me, target_type: targetType, target_id: targetId })
          .order('created_at', { ascending: false }),
      )
    },

    // { [target_id]: コメント数 }
    async commentCounts(targetType) {
      const rows = unwrap(await sb.from('comment_counts').select('target_id, count').eq('target_type', targetType))
      return Object.fromEntries(rows.map((r) => [r.target_id, r.count]))
    },

    async getAttendees(eventId) {
      const rows = unwrap(await sb.from('event_attendees').select('profile:profiles(id, display_name)').eq('event_id', eventId))
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
