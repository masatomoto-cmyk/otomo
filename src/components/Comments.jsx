import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { Avatar } from './Avatar'
import { ReportButton } from './ReportButton'

export function Comments({ type, id, title = 'コメント', placeholder = 'コメントを書く' }) {
  const { user } = useAuth()
  const comments = useAsync(() => api.listComments(type, id), [type, id])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    setError('')
    try {
      const c = await api.addComment(type, id, body.trim())
      comments.setData([...(comments.data ?? []), c])
      setBody('')
    } catch {
      // ブロックされている相手の投稿にはコメントできない（RLS で拒否される）
      setError('コメントを送信できませんでした')
    } finally {
      setBusy(false)
    }
  }

  async function remove(cid) {
    if (!confirm('このコメントを削除しますか？')) return
    await api.remove('comments', cid)
    comments.setData(comments.data.filter((c) => c.id !== cid))
  }

  return (
    <section className="comments">
      <h3>
        {title} <span className="muted">{comments.data?.length ?? ''}</span>
      </h3>
      {comments.data?.length === 0 && <p className="muted small">まだありません。最初の一言をどうぞ。</p>}
      <ul>
        {comments.data?.map((c) => (
          <li key={c.id} className="comment">
            <Link to={`/u/${c.user_id}`}>
              <Avatar profile={c.profile} size={32} />
            </Link>
            <div className="comment-body">
              <div className="meta">
                <Link to={`/u/${c.user_id}`}>
                  <strong>{c.profile?.display_name}</strong>
                </Link>
                <span className="muted small">{timeAgo(c.created_at)}</span>
                {user?.id === c.user_id && (
                  <button className="link-btn small" onClick={() => remove(c.id)}>
                    削除
                  </button>
                )}
                <ReportButton type="comment" id={c.id} ownerId={c.user_id} />
              </div>
              <p className="pre">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {user ? (
        <form onSubmit={submit} className="comment-form">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} rows={2} maxLength={1000} />
          <button className="btn" disabled={busy || !body.trim()}>
            送信
          </button>
        </form>
      ) : (
        <p className="muted small">
          <Link to="/login">ログイン</Link>するとコメントできます
        </p>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  )
}
