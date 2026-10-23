import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserChip } from '../components/Avatar'
import { Comments } from '../components/Comments'
import { Composer, ErrorText, Field } from '../components/Composer'
import { MusicEmbed } from '../components/MusicEmbed'
import { Reactions } from '../components/Reactions'
import { ReportButton } from '../components/ReportButton'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { isHttpUrl } from '../lib/embed'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'

export default function Timeline() {
  const posts = useAsync(() => api.list('posts'), [])

  return (
    <div className="stack">
      <Hero />
      <Composer label="つぶやく">
        {(close) => <PostForm onDone={(p) => { posts.setData([p, ...(posts.data ?? [])]); close() }} onCancel={close} />}
      </Composer>
      <ErrorText error={posts.error} />
      {posts.data?.map((p) => (
        <PostCard key={p.id} post={p} onDeleted={() => posts.setData(posts.data.filter((x) => x.id !== p.id))} />
      ))}
      {posts.data?.length === 0 && <p className="empty">まだ投稿がありません</p>}
    </div>
  )
}

function Hero() {
  const { user } = useAuth()
  if (user) return null
  return (
    <section className="hero">
      <h1>音でつながる場所。</h1>
      <p>好きな音楽の話、作品へのフィードバック、バンドメンバー探し、ライブの告知。音楽好きとミュージシャンが気軽に交流できるコミュニティです。</p>
      <div className="hero-actions">
        <Link to="/login" className="btn">はじめる</Link>
        <Link to="/recruits" className="btn ghost">メンバー募集を見る</Link>
      </div>
    </section>
  )
}

function PostForm({ onDone, onCancel }) {
  const [body, setBody] = useState('')
  const [musicUrl, setMusicUrl] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (musicUrl && !isHttpUrl(musicUrl)) return setError(new Error('URLの形式が正しくありません'))
    setBusy(true)
    try {
      onDone(await api.create('posts', { body: body.trim(), music_url: musicUrl.trim() }))
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="stack-sm">
      <textarea autoFocus value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1000} placeholder="いま聴いてる曲、制作の進捗、なんでもどうぞ" />
      <Field label="音楽リンク" hint="任意・YouTube / SoundCloud / Spotify は埋め込み表示">
        <input type="url" value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder="https://" />
      </Field>
      <ErrorText error={error} />
      <div className="row end">
        <button type="button" className="btn ghost" onClick={onCancel}>キャンセル</button>
        <button className="btn" disabled={busy || !body.trim()}>投稿</button>
      </div>
    </form>
  )
}

export function PostCard({ post, onDeleted }) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)

  async function remove() {
    if (!confirm('この投稿を削除しますか？')) return
    await api.remove('posts', post.id)
    onDeleted?.()
  }

  return (
    <article className="card">
      <UserChip profile={post.profile}>{timeAgo(post.created_at)}</UserChip>
      <p className="pre post-body">{post.body}</p>
      <MusicEmbed url={post.music_url} />
      <div className="row actions">
        <Reactions type="post" id={post.id} ownerId={post.user_id} />
        <button className="chip-btn" onClick={() => setShowComments((v) => !v)} aria-expanded={showComments}>
          💬 返信
        </button>
        {user?.id === post.user_id && (
          <button className="link-btn small push" onClick={remove}>削除</button>
        )}
        <ReportButton type="post" id={post.id} ownerId={post.user_id} className="push" />
      </div>
      {showComments && (
        <>
          <Reactions type="post" id={post.id} ownerId={post.user_id} showReceived />
          <Comments type="post" id={post.id} title="返信" placeholder="返信を書く" />
        </>
      )}
    </article>
  )
}
