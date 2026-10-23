import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserChip } from '../components/Avatar'
import { Composer, ErrorText, Field } from '../components/Composer'
import { MusicEmbed } from '../components/MusicEmbed'
import { api } from '../lib/api'
import { GENRES } from '../lib/constants'
import { isHttpUrl } from '../lib/embed'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'

export default function Tracks() {
  const [genre, setGenre] = useState('')
  const tracks = useAsync(() => api.list('tracks', { eq: genre ? { genre } : {} }), [genre])

  return (
    <div className="stack">
      <div className="page-head">
        <h1>作品シェア</h1>
        <p className="muted">自作曲・カバー・演奏動画を投稿して、感想やアドバイスをもらおう</p>
      </div>
      <Composer label="作品を投稿する">
        {(close) => <TrackForm onDone={(t) => { tracks.setData([t, ...(tracks.data ?? [])]); close() }} onCancel={close} />}
      </Composer>
      <div className="filters">
        <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="ジャンル">
          <option value="">すべてのジャンル</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>
      <ErrorText error={tracks.error} />
      {tracks.data?.map((t) => (
        <article key={t.id} className="card">
          <div className="row between">
            <UserChip profile={t.profile}>{timeAgo(t.created_at)}</UserChip>
            {t.want_feedback && <span className="badge">フィードバック募集中</span>}
          </div>
          <h2 className="card-title"><Link to={`/tracks/${t.id}`}>{t.title}</Link></h2>
          {t.genre && <span className="tag">{t.genre}</span>}
          <MusicEmbed url={t.url} />
          <Link to={`/tracks/${t.id}`} className="more">感想を書く →</Link>
        </article>
      ))}
      {tracks.data?.length === 0 && <p className="empty">まだ作品がありません</p>}
    </div>
  )
}

function TrackForm({ onDone, onCancel }) {
  const [form, setForm] = useState({ title: '', url: '', description: '', genre: '', want_feedback: true })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!isHttpUrl(form.url)) return setError(new Error('作品のURLを入力してください'))
    setBusy(true)
    try {
      onDone(await api.create('tracks', form))
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="stack-sm">
      <Field label="タイトル"><input autoFocus required maxLength={100} value={form.title} onChange={set('title')} /></Field>
      <Field label="URL" hint="YouTube / SoundCloud / Spotify など">
        <input type="url" required value={form.url} onChange={set('url')} placeholder="https://" />
      </Field>
      <Field label="ジャンル">
        <select value={form.genre} onChange={set('genre')}>
          <option value="">選択しない</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </Field>
      <Field label="説明・聴いてほしいポイント">
        <textarea rows={3} value={form.description} onChange={set('description')} />
      </Field>
      <label className="check"><input type="checkbox" checked={form.want_feedback} onChange={set('want_feedback')} /> フィードバックを募集する</label>
      <ErrorText error={error} />
      <div className="row end">
        <button type="button" className="btn ghost" onClick={onCancel}>キャンセル</button>
        <button className="btn" disabled={busy}>投稿</button>
      </div>
    </form>
  )
}
