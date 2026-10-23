import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { UserChip } from '../components/Avatar'
import { Composer, ErrorText, Field } from '../components/Composer'
import { MusicEmbed } from '../components/MusicEmbed'
import { api } from '../lib/api'
import { fromSlug, GENRE_SLUGS, GENRES } from '../lib/constants'
import { isHttpUrl } from '../lib/embed'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { usePageMeta } from '../lib/meta'

export default function Tracks() {
  // ジャンルの絞り込みは URL（/tracks/genre/rock）で表し、ジャンルごとのページとして検索に載せる
  const navigate = useNavigate()
  const genre = fromSlug(GENRE_SLUGS, useParams().genreSlug)
  const setGenre = (g) => navigate(g ? `/tracks/genre/${GENRE_SLUGS[g]}` : '/tracks')
  const [waitingOnly, setWaitingOnly] = useState(false)
  const tracks = useAsync(() => api.list('tracks', { eq: genre ? { genre } : {} }), [genre])
  // 人気順は作らない。代わりにまだ誰からも感想をもらっていない作品を見つけやすくする
  const counts = useAsync(() => api.commentCounts('track'), [])
  const isWaiting = (t) => counts.data && !counts.data[t.id]
  const shown = tracks.data?.filter((t) => !waitingOnly || isWaiting(t))
  const h1 = genre ? `${genre}の自作曲・演奏動画` : '作品シェア'
  const lead = genre
    ? `${genre}の自作曲・カバー・演奏動画が集まっています。聴いた感想を一言届けてみませんか。自分の${genre}作品を投稿して感想をもらうこともできます。`
    : 'DTM・宅録・弾き語り・バンドの自作曲や演奏動画を投稿して、感想やアドバイスをもらえます。いいね数ではなく、ちゃんと言葉が届く場所です。'
  usePageMeta({
    title: genre ? `${h1} — 感想・フィードバックが届く` : '作品シェア — 自作曲・演奏動画に感想が届く',
    description: lead,
    noindex: genre && tracks.data?.length === 0,
  })

  return (
    <div className="stack">
      <div className="page-head">
        {genre && (
          <nav className="crumbs small" aria-label="パンくずリスト">
            <Link to="/tracks">作品シェア</Link> › <span>{h1}</span>
          </nav>
        )}
        <h1>{h1}</h1>
        <p className="muted">{lead}</p>
      </div>
      <Composer label="作品を投稿する">
        {(close) => <TrackForm onDone={(t) => { tracks.setData([t, ...(tracks.data ?? [])]); counts.reload(); close() }} onCancel={close} />}
      </Composer>
      <div className="filters">
        <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="ジャンル">
          <option value="">すべてのジャンル</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={waitingOnly} onChange={(e) => setWaitingOnly(e.target.checked)} /> 感想待ちだけ</label>
      </div>
      <ErrorText error={tracks.error} />
      {shown?.map((t) => (
        <article key={t.id} className="card">
          <div className="row between">
            <UserChip profile={t.profile}>{timeAgo(t.created_at)}</UserChip>
            {t.want_feedback && <span className="badge">フィードバック募集中</span>}
          </div>
          <h2 className="card-title"><Link to={`/tracks/${t.id}`}>{t.title}</Link></h2>
          {t.genre && <span className="tag">{t.genre}</span>}
          <MusicEmbed url={t.url} />
          {isWaiting(t) ? (
            <Link to={`/tracks/${t.id}`} className="first-voice">🌱 まだ感想がありません。最初のひとことを届けよう →</Link>
          ) : (
            <Link to={`/tracks/${t.id}`} className="more">感想を書く →</Link>
          )}
        </article>
      ))}
      {shown?.length === 0 && <p className="empty">{waitingOnly ? '感想待ちの作品はありません' : 'まだ作品がありません'}</p>}
      <section className="card browse">
        <h2>ジャンルから作品を探す</h2>
        <div className="tags">
          {GENRES.filter((g) => g !== 'その他').map((g) => (
            <Link key={g} className="tag" to={`/tracks/genre/${GENRE_SLUGS[g]}`}>{g}</Link>
          ))}
        </div>
        <p className="small">
          <Link to="/guide/feedback">自作曲の感想をもらう方法（DTM・宅録・弾き語り）</Link>
        </p>
      </section>
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
