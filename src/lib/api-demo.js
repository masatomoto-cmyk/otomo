// Supabase 未設定時に使う、localStorage だけで動くデモ用データ層。
// api-supabase.js と同じインターフェースを持つ。
const DB_KEY = 'otomo-demo-db-v3'
const USER_KEY = 'otomo-demo-user'

const now = Date.now()
const ago = (h) => new Date(now - h * 3600_000).toISOString()
const later = (d) => new Date(now + d * 86400_000).toISOString()

function seed() {
  const p = (id, display_name, parts, genres, area, bio) => ({
    id, email: `${id}@demo.local`, display_name, parts, genres, area, bio, link: '', created_at: ago(500),
  })
  return {
    profiles: [
      p('u-saki', 'さき', ['ボーカル', 'キーボード'], ['ポップス', 'R&B'], '関東', '週末に宅録してます。ネオソウル好き。'),
      p('u-ken', 'ケン', ['ドラム'], ['ロック', 'パンク'], '近畿', 'ドラム歴10年。スタジオ練は大阪市内が多いです。'),
      p('u-mio', 'mio', ['DTM・トラックメイク'], ['エレクトロ', 'アニソン・ボカロ'], 'オンライン', 'ボカロP。歌ってくれる人いつでも募集中！'),
    ],
    posts: [
      { id: 'p1', user_id: 'u-mio', body: '新曲のミックスやっと終わった…！低音の処理で3日溶けた', music_url: '', created_at: ago(2) },
      { id: 'p2', user_id: 'u-saki', body: '最近ずっとこれ聴いてる。コード進行が本当に気持ちいい', music_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', created_at: ago(9) },
      { id: 'p3', user_id: 'u-ken', body: '新しいスネア買いました。明日スタジオで試す🥁', music_url: '', created_at: ago(30) },
    ],
    tracks: [
      { id: 't1', user_id: 'u-mio', title: 'Neon Rain（デモ）', url: 'https://soundcloud.com/forss/flickermood', description: 'サビのシンセの音色に迷っています。率直な感想ください！', genre: 'エレクトロ', want_feedback: true, created_at: ago(5) },
      { id: 't2', user_id: 'u-saki', title: '夜明けのうた 弾き語り', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: '初めて人前に出すオリジナル曲です。', genre: 'アコースティック', want_feedback: true, created_at: ago(48) },
    ],
    recruitments: [
      { id: 'r1', user_id: 'u-ken', title: '関西でオリジナル曲のロックバンド組みませんか', body: 'ギターボーカルとベースを探しています。月2〜3回スタジオ、半年後にライブが目標。', parts: ['ギター', 'ベース', 'ボーカル'], genres: ['ロック'], area: '近畿', is_open: true, created_at: ago(12) },
      { id: 'r2', user_id: 'u-mio', title: 'ボカロ曲の歌ってみた・コラボ歌い手さん募集', body: 'オンラインで完結します。データ納品でOK。', parts: ['ボーカル'], genres: ['アニソン・ボカロ'], area: 'オンライン', is_open: true, created_at: ago(70) },
    ],
    events: [
      { id: 'e1', user_id: 'u-ken', title: '月例オープンマイク @ 心斎橋', body: '初心者歓迎！1組15分。機材はドラム・アンプ常設。', venue: '心斎橋 Live Bar XX', area: '近畿', starts_at: later(9), url: '', created_at: ago(20) },
      { id: 'e2', user_id: 'u-saki', title: 'オンライン作曲もくもく会', body: 'Discordで集まって各自作業、最後に1曲ずつ発表します。', venue: 'Discord', area: 'オンライン', starts_at: later(3), url: '', created_at: ago(40) },
    ],
    event_attendees: [{ event_id: 'e1', user_id: 'u-saki', created_at: ago(10) }],
    comments: [
      { id: 'c1', user_id: 'u-saki', target_type: 'track', target_id: 't1', body: 'イントロから引き込まれました！サビはもう少し明るい音色でも合いそう', created_at: ago(3) },
      { id: 'c2', user_id: 'u-mio', target_type: 'recruitment', target_id: 'r1', body: '素敵な企画ですね、応援してます！', created_at: ago(8) },
    ],
    blocks: [],
    reports: [],
    reactions: [
      { user_id: 'u-ken', target_type: 'post', target_id: 'p1', kind: 'relate', owner_id: 'u-mio', created_at: ago(1) },
      { user_id: 'u-saki', target_type: 'track', target_id: 't1', kind: 'moved', owner_id: 'u-mio', created_at: ago(3) },
      { user_id: 'u-ken', target_type: 'track', target_id: 't2', kind: 'listened', owner_id: 'u-saki', created_at: ago(6) },
    ],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // 壊れていたら作り直す
  }
  const db = seed()
  save(db)
  return db
}

function save(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // プライベートモード等では保存しない
  }
}

function getUserId() {
  try {
    return localStorage.getItem(USER_KEY)
  } catch {
    return null
  }
}

const delay = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 80))

export function createDemoApi() {
  const db = load()
  const listeners = new Set()
  const commit = () => save(db)
  const publicProfile = (id) => {
    const p = db.profiles.find((x) => x.id === id)
    return p ? { id: p.id, display_name: p.display_name } : null
  }
  const withProfile = (row) => row && { ...row, profile: publicProfile(row.user_id) }
  const requireUser = () => {
    const id = getUserId()
    if (!id) throw new Error('ログインが必要です')
    return id
  }
  const setUser = (id) => {
    try {
      id ? localStorage.setItem(USER_KEY, id) : localStorage.removeItem(USER_KEY)
    } catch {
      // ignore
    }
    listeners.forEach((cb) => cb(id ? { id } : null))
  }

  return {
    mode: 'demo',

    auth: {
      async getUser() {
        const id = getUserId()
        return id && db.profiles.some((p) => p.id === id) ? { id } : null
      },
      onChange(cb) {
        listeners.add(cb)
        return () => listeners.delete(cb)
      },
      async signUp({ email, displayName }) {
        if (db.profiles.some((p) => p.email === email)) throw new Error('このメールアドレスは登録済みです')
        const id = crypto.randomUUID()
        db.profiles.push({
          id, email, display_name: displayName || '名無しさん', bio: '', parts: [], genres: [], area: '', link: '',
          created_at: new Date().toISOString(),
        })
        commit()
        setUser(id)
        return { needsConfirmation: false }
      },
      async signIn({ email }) {
        const p = db.profiles.find((x) => x.email === email)
        if (!p) throw new Error('アカウントが見つかりません（デモ: 新規登録してください）')
        setUser(p.id)
      },
      async signOut() {
        setUser(null)
      },
    },

    async getProfile(id) {
      const p = db.profiles.find((x) => x.id === id)
      if (!p) return delay(null)
      const { email: _email, ...rest } = p
      return delay(rest)
    },
    async updateProfile(id, patch) {
      if (requireUser() !== id) throw new Error('権限がありません')
      Object.assign(db.profiles.find((x) => x.id === id), patch)
      commit()
      return this.getProfile(id)
    },
    async listProfiles({ part, area } = {}) {
      const rows = db.profiles
        .filter((p) => (!part || p.parts.includes(part)) && (!area || p.area === area))
        .map(({ email: _email, ...rest }) => rest)
      return delay(rows)
    },

    async list(table, { eq = {}, contains = {}, gte = {}, order = 'created_at', ascending = false, limit = 50 } = {}) {
      const rows = db[table]
        .filter(
          (r) =>
            Object.entries(eq).every(([c, v]) => r[c] === v) &&
            Object.entries(contains).every(([c, v]) => r[c].includes(v)) &&
            Object.entries(gte).every(([c, v]) => r[c] >= v),
        )
        .sort((a, b) => (a[order] < b[order] ? -1 : 1) * (ascending ? 1 : -1))
        .slice(0, limit)
        .map(withProfile)
      return delay(rows)
    },
    async get(table, id) {
      return delay(withProfile(db[table].find((r) => r.id === id)) ?? null)
    },
    async create(table, row) {
      const created = { id: crypto.randomUUID(), ...row, user_id: requireUser(), created_at: new Date().toISOString() }
      db[table].push(created)
      commit()
      return delay(withProfile(created))
    },
    async update(table, id, patch) {
      const row = db[table].find((r) => r.id === id)
      if (row?.user_id !== requireUser()) throw new Error('権限がありません')
      Object.assign(row, patch)
      commit()
      return delay(withProfile(row))
    },
    async remove(table, id) {
      const me = requireUser()
      const idx = db[table].findIndex((r) => r.id === id && r.user_id === me)
      if (idx < 0) throw new Error('権限がありません')
      db[table].splice(idx, 1)
      commit()
    },

    async listComments(targetType, targetId) {
      return this.list('comments', { eq: { target_type: targetType, target_id: targetId }, ascending: true, limit: 500 })
    },
    async addComment(targetType, targetId, body) {
      return this.create('comments', { target_type: targetType, target_id: targetId, body })
    },

    async getMyReactions(targetType, targetId) {
      const me = getUserId()
      return delay(
        db.reactions.filter((r) => r.user_id === me && r.target_type === targetType && r.target_id === targetId).map((r) => r.kind),
      )
    },
    async toggleReaction(targetType, targetId, kind) {
      const me = requireUser()
      const table = { post: 'posts', track: 'tracks', recruitment: 'recruitments' }[targetType]
      const owner = db[table].find((r) => r.id === targetId)?.user_id
      if (!owner) throw new Error('対象が見つかりません')
      const idx = db.reactions.findIndex(
        (r) => r.user_id === me && r.target_type === targetType && r.target_id === targetId && r.kind === kind,
      )
      if (idx >= 0) db.reactions.splice(idx, 1)
      else db.reactions.push({ user_id: me, target_type: targetType, target_id: targetId, kind, owner_id: owner, created_at: new Date().toISOString() })
      commit()
      return this.getMyReactions(targetType, targetId)
    },
    async getReceivedReactions(targetType, targetId) {
      const me = getUserId()
      const rows = db.reactions
        .filter((r) => r.owner_id === me && r.target_type === targetType && r.target_id === targetId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map((r) => ({ kind: r.kind, created_at: r.created_at, profile: publicProfile(r.user_id) }))
      return delay(rows)
    },

    async commentCounts(targetType) {
      const counts = {}
      for (const c of db.comments) if (c.target_type === targetType) counts[c.target_id] = (counts[c.target_id] ?? 0) + 1
      return delay(counts)
    },

    async listMyBlocks() {
      const me = getUserId()
      return delay(db.blocks.filter((b) => b.blocker_id === me).map((b) => ({ blocked_id: b.blocked_id, profile: publicProfile(b.blocked_id) })))
    },
    async block(userId) {
      const me = requireUser()
      if (!db.blocks.some((b) => b.blocker_id === me && b.blocked_id === userId)) {
        db.blocks.push({ blocker_id: me, blocked_id: userId, created_at: new Date().toISOString() })
        commit()
      }
    },
    async unblock(userId) {
      const me = requireUser()
      db.blocks = db.blocks.filter((b) => !(b.blocker_id === me && b.blocked_id === userId))
      commit()
    },
    async report(targetType, targetId, reason, detail) {
      const me = requireUser()
      if (!db.reports.some((r) => r.reporter_id === me && r.target_type === targetType && r.target_id === targetId)) {
        db.reports.push({ reporter_id: me, target_type: targetType, target_id: targetId, reason, detail, created_at: new Date().toISOString() })
        commit()
      }
    },
    async externalEvents({ area = '', small = true } = {}) {
      const events = [
        { id: 'demo-1', name: '下北沢 平日ブッキング 4マン', startDate: later(2).slice(0, 10), venue: '下北沢 某ライブハウス', city: '世田谷区', area: '関東', performers: ['バンドA', 'バンドB', 'バンドC', 'バンドD'], url: 'https://example.com', capacity: 250 },
        { id: 'demo-2', name: '心斎橋 弾き語りナイト', startDate: later(5).slice(0, 10), venue: '心斎橋 某カフェバー', city: '大阪市', area: '近畿', performers: ['シンガーE', 'シンガーF'], url: 'https://example.com', capacity: 60 },
      ]
      return delay({
        configured: true,
        source: 'demo',
        events: events.filter((e) => (!area || e.area === area) && (!small || e.capacity <= 500)),
      })
    },

    async getAttendees(eventId) {
      return delay(db.event_attendees.filter((a) => a.event_id === eventId).map((a) => publicProfile(a.user_id)))
    },
    async toggleAttend(eventId) {
      const me = requireUser()
      const idx = db.event_attendees.findIndex((a) => a.event_id === eventId && a.user_id === me)
      if (idx >= 0) db.event_attendees.splice(idx, 1)
      else db.event_attendees.push({ event_id: eventId, user_id: me, created_at: new Date().toISOString() })
      commit()
      return this.getAttendees(eventId)
    },
  }
}
