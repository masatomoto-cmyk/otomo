import { useNavigate, useParams } from 'react-router-dom'
import { UserChip } from '../components/Avatar'
import { Comments } from '../components/Comments'
import { ErrorText } from '../components/Composer'
import { MusicEmbed } from '../components/MusicEmbed'
import { Reactions } from '../components/Reactions'
import { ReportButton } from '../components/ReportButton'
import { ShareButtons } from '../components/ShareButtons'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { usePageMeta } from '../lib/meta'

export default function TrackDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const track = useAsync(() => api.get('tracks', id), [id])
  const t = track.data
  usePageMeta({
    title: t ? `${t.title} / ${t.profile?.display_name ?? ''}` : '作品',
    description: t ? t.description || `${t.profile?.display_name}さんの作品${t.genre ? `（${t.genre}）` : ''}。感想を届けよう。` : '',
  })

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
      <ShareButtons
        path={`/tracks/${t.id}`}
        text={user?.id === t.user_id ? `新しい作品「${t.title}」をOTOMOに投稿しました。感想もらえたら嬉しいです🎧` : `${t.profile?.display_name}さんの「${t.title}」`}
      />
      <Reactions type="track" id={t.id} ownerId={t.user_id} showReceived />
      <Comments type="track" id={t.id} title="フィードバック" placeholder="良かったところ・気になったところを伝えよう" />
    </article>
  )
}
