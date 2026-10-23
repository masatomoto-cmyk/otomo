import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorText, Field } from '../components/Composer'
import { TagPicker } from '../components/Tags'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { AREAS, GENRES, PARTS } from '../lib/constants'
import { isHttpUrl } from '../lib/embed'
import { useAsync } from '../lib/useAsync'
import { Avatar } from '../components/Avatar'

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const blocks = useAsync(() => api.listMyBlocks(), [])

  useEffect(() => {
    if (profile && !form) {
      const { display_name, bio, parts, genres, area, link } = profile
      setForm({ display_name, bio, parts, genres, area, link })
    }
  }, [profile, form])

  if (!form) return null
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (form.link && !isHttpUrl(form.link)) return setError(new Error('リンクのURLが正しくありません'))
    setBusy(true)
    try {
      await api.updateProfile(user.id, form)
      await refreshProfile()
      navigate(`/u/${user.id}`)
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  async function unblock(userId) {
    await api.unblock(userId)
    blocks.reload()
  }

  return (
    <div className="stack">
    <form onSubmit={submit} className="card stack-sm">
      <h1>プロフィール編集</h1>
      <Field label="表示名"><input required maxLength={30} value={form.display_name} onChange={set('display_name')} /></Field>
      <Field label="担当パート" group><TagPicker options={PARTS} value={form.parts} onChange={(parts) => setForm((f) => ({ ...f, parts }))} /></Field>
      <Field label="好きなジャンル" group><TagPicker options={GENRES} value={form.genres} onChange={(genres) => setForm((f) => ({ ...f, genres }))} /></Field>
      <Field label="活動地域">
        <select value={form.area} onChange={set('area')}>
          <option value="">選択しない</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </Field>
      <Field label="自己紹介"><textarea rows={4} maxLength={500} value={form.bio} onChange={set('bio')} placeholder="好きなアーティスト、使っている機材、活動の目標など" /></Field>
      <Field label="リンク" hint="SNS・SoundCloud・ポートフォリオなど"><input type="url" value={form.link} onChange={set('link')} placeholder="https://" /></Field>
      <ErrorText error={error} />
      <div className="row end">
        <button type="button" className="btn ghost" onClick={() => navigate(-1)}>キャンセル</button>
        <button className="btn" disabled={busy}>保存</button>
      </div>
    </form>
    <section className="card stack-sm">
      <h2>ブロック中のユーザー</h2>
      {blocks.data?.length === 0 && <p className="muted small">ブロックしているユーザーはいません</p>}
      <ul className="blocked-list">
        {blocks.data?.map((b) => (
          <li key={b.blocked_id}>
            <span className="user-chip">
              <Avatar profile={b.profile} size={28} />
              <strong>{b.profile?.display_name}</strong>
            </span>
            <button className="btn ghost small" onClick={() => unblock(b.blocked_id)}>解除</button>
          </li>
        ))}
      </ul>
    </section>
    </div>
  )
}
