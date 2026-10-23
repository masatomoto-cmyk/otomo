import { useNavigate, useParams } from 'react-router-dom'
import { UserChip } from '../components/Avatar'
import { Comments } from '../components/Comments'
import { ErrorText } from '../components/Composer'
import { MusicEmbed } from '../components/MusicEmbed'
import { Reactions } from '../components/Reactions'
import { ReportButton } from '../components/ReportButton'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'

export default function TrackDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const track = useAsync(() => api.get('tracks', id), [id])
  const t = track.data

  async function remove() {
    if (!confirm('この作品を削除しますか？')) return
    await api.remove('tracks', id)
    navigate('/tracks')
  }

  if (track.error) return <ErrorText error={track.error} />
  if (track.loading && !t) return null
  if (!t) return <p className="empty">作品が見つかりません</p>

  return (
    <article className="card stack-sm">
      <UserChip profile={t.profile}>{timeAgo(t.created_at)}</UserChip>
      <h1>{t.title}</h1>
      <div className="row">
        {t.genre && <span className="tag">{t.genre}</span>}
        {t.want_feedback && <span className="badge">フィードバック募集中</span>}
      </div>
      <MusicEmbed url={t.url} />
      {t.description && <p className="pre">{t.description}</p>}
      <div className="row actions">
        <Reactions type="track" id={t.id} ownerId={t.user_id} />
        {user?.id === t.user_id && <button className="link-btn small push" onClick={remove}>削除</button>}
        <ReportButton type="track" id={t.id} ownerId={t.user_id} className="push" />
      </div>
      <Reactions type="track" id={t.id} ownerId={t.user_id} showReceived />
      <Comments type="track" id={t.id} title="フィードバック" placeholder="良かったところ・気になったところを伝えよう" />
    </article>
  )
}
