import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ErrorText } from '../components/Composer'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { REACTIONS } from '../lib/constants'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { usePageMeta } from '../lib/meta'

const TARGET_LABEL = { post: '投稿', track: '作品', recruitment: '募集', event: 'イベント' }

function message(n) {
  const what = `あなたの${TARGET_LABEL[n.target_type]}`
  if (n.type === 'apply') return `${what}に応募・質問が届きました`
  if (n.type === 'comment') return n.target_type === 'post' ? `${what}に返信しました` : `${what}にコメントしました`
  if (n.type === 'attend') return `${what}に参加を表明しました`
  const r = REACTIONS[n.kind]
  return `${what}に「${r ? `${r.emoji} ${r.label}` : 'リアクション'}」を送りました`
}

function linkTo(n, me) {
  if (n.target_type === 'track') return `/tracks/${n.target_id}`
  if (n.target_type === 'recruitment') return `/recruits/${n.target_id}`
  if (n.target_type === 'event') return `/events/${n.target_id}`
  return `/u/${me}` // タイムラインの投稿には個別ページがないのでプロフィールへ
}

export default function Notifications() {
  usePageMeta({ title: '通知', noindex: true })
  const { user, refreshUnread } = useAuth()
  const list = useAsync(() => api.listNotifications(), [])

  // 一覧を開いたら既読にする（未読の印は表示中は残す）
  useEffect(() => {
    if (list.data?.some((n) => !n.read_at)) api.markAllRead().then(refreshUnread)
  }, [list.data, refreshUnread])

  return (
    <div className="stack">
      <div className="page-head">
        <h1>通知</h1>
        <p className="muted">
          コメント・応募・リアクション・参加表明が届きます。<Link to="/settings">メール通知の設定</Link>
        </p>
      </div>
      <ErrorText error={list.error} />
      {list.data?.length === 0 && <p className="empty">まだ通知はありません</p>}
      <ul className="notifications">
        {list.data?.map((n) => (
          <li key={n.id} className={n.read_at ? '' : 'unread'}>
            <Link to={linkTo(n, user.id)} className="notification">
              <Avatar profile={n.actor} size={36} />
              <span className="grow">
                <strong>{n.actor?.display_name ?? '退会したユーザー'}</strong> {n.type === 'apply' ? 'さんから、' : 'さんが'}{message(n)}
                {n.excerpt && <span className="excerpt">「{n.excerpt}」</span>}
                <span className="muted small"> {timeAgo(n.created_at)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
