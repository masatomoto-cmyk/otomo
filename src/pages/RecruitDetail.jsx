import { useNavigate, useParams } from 'react-router-dom'
import { UserChip } from '../components/Avatar'
import { Comments } from '../components/Comments'
import { ErrorText } from '../components/Composer'
import { Reactions } from '../components/Reactions'
import { ReportButton } from '../components/ReportButton'
import { Tags } from '../components/Tags'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'

export default function RecruitDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const recruit = useAsync(() => api.get('recruitments', id), [id])
  const r = recruit.data
  const mine = user?.id === r?.user_id

  async function toggleOpen() {
    recruit.setData(await api.update('recruitments', id, { is_open: !r.is_open }))
  }
  async function remove() {
    if (!confirm('この募集を削除しますか？')) return
    await api.remove('recruitments', id)
    navigate('/recruits')
  }

  if (recruit.error) return <ErrorText error={recruit.error} />
  if (recruit.loading && !r) return null
  if (!r) return <p className="empty">募集が見つかりません</p>

  return (
    <article className="card stack-sm">
      <div className="row between">
        <UserChip profile={r.profile}>{timeAgo(r.created_at)}</UserChip>
        <span className={`badge ${r.is_open ? '' : 'gray'}`}>{r.is_open ? '募集中' : '締切'}</span>
      </div>
      <h1>{r.title}</h1>
      <div className="kv">
        <span className="muted small">募集パート</span><Tags items={r.parts} tone="accent" />
        {r.genres.length > 0 && <><span className="muted small">ジャンル</span><Tags items={r.genres} /></>}
        {r.area && <><span className="muted small">地域</span><span>{r.area}</span></>}
      </div>
      {r.body && <p className="pre">{r.body}</p>}
      <div className="row actions">
        <Reactions type="recruitment" id={r.id} ownerId={r.user_id} />
        {mine && (
          <>
            <button className="chip-btn push" onClick={toggleOpen}>{r.is_open ? '締め切る' : '募集を再開'}</button>
            <button className="link-btn small" onClick={remove}>削除</button>
          </>
        )}
        <ReportButton type="recruitment" id={r.id} ownerId={r.user_id} className="push" />
      </div>
      <Reactions type="recruitment" id={r.id} ownerId={r.user_id} showReceived />
      <Comments
        type="recruitment"
        id={r.id}
        title="応募・質問"
        placeholder={r.is_open ? '自己紹介や担当パート、参考音源のURLなどを添えて応募しよう' : '質問・コメントを書く'}
      />
    </article>
  )
}
