import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, UserChip } from '../components/Avatar'
import { Comments } from '../components/Comments'
import { ErrorText } from '../components/Composer'
import { ReportButton } from '../components/ReportButton'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatDateTime } from '../lib/format'
import { useAsync } from '../lib/useAsync'

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const event = useAsync(() => api.get('events', id), [id])
  const attendees = useAsync(() => api.getAttendees(id), [id])
  const ev = event.data
  const going = attendees.data?.some((p) => p.id === user?.id)

  async function toggleAttend() {
    if (!user) return navigate('/login')
    attendees.setData(await api.toggleAttend(id))
  }
  async function remove() {
    if (!confirm('このイベントを削除しますか？')) return
    await api.remove('events', id)
    navigate('/events')
  }

  if (event.error) return <ErrorText error={event.error} />
  if (event.loading && !ev) return null
  if (!ev) return <p className="empty">イベントが見つかりません</p>

  return (
    <article className="card stack-sm">
      <UserChip profile={ev.profile}>主催</UserChip>
      <h1>{ev.title}</h1>
      <div className="kv">
        <span className="muted small">日時</span><span>{formatDateTime(ev.starts_at)}</span>
        <span className="muted small">会場</span><span>{ev.venue || '未定'}{ev.area && `（${ev.area}）`}</span>
        {ev.url && <><span className="muted small">詳細</span><a href={ev.url} target="_blank" rel="noopener noreferrer">{ev.url}</a></>}
      </div>
      {ev.body && <p className="pre">{ev.body}</p>}
      <div className="row actions">
        <button className={`btn ${going ? 'ghost' : ''}`} onClick={toggleAttend}>{going ? '✓ 参加予定' : '参加する'}</button>
        {user?.id === ev.user_id && <button className="link-btn small push" onClick={remove}>削除</button>}
        <ReportButton type="event" id={ev.id} ownerId={ev.user_id} className="push" />
      </div>
      <section>
        <h3>参加予定 <span className="muted">{attendees.data?.length ?? ''}</span></h3>
        <div className="avatar-row">
          {attendees.data?.map((p) => (
            <Link key={p.id} to={`/u/${p.id}`} title={p.display_name}><Avatar profile={p} size={34} /></Link>
          ))}
          {attendees.data?.length === 0 && <span className="muted small">まだいません</span>}
        </div>
      </section>
      <Comments type="event" id={ev.id} title="質問・コメント" />
    </article>
  )
}
