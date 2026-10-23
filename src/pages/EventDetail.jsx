import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, UserChip } from '../components/Avatar'
import { Comments } from '../components/Comments'
import { ErrorText } from '../components/Composer'
import { ReportButton } from '../components/ReportButton'
import { ShareButtons } from '../components/ShareButtons'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatDateTime } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { usePageMeta } from '../lib/meta'

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const event = useAsync(() => api.get('events', id), [id])
  const attendees = useAsync(() => api.getAttendees(id), [id])
  const ev = event.data
  const going = attendees.data?.some((p) => p.id === user?.id)
  usePageMeta({
    title: ev ? ev.title : 'イベント',
    description: ev ? `${formatDateTime(ev.starts_at)}${ev.venue ? ` @ ${ev.venue}` : ''}${ev.area ? `（${ev.area}）` : ''}。${ev.body}` : '',
    // Google のイベント検索に載るための構造化データ（オンラインは場所の書き方が違う）
    jsonLd: ev && {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: ev.title,
      startDate: ev.starts_at,
      description: ev.body || undefined,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode:
        ev.area === 'オンライン' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
      location:
        ev.area === 'オンライン'
          ? { '@type': 'VirtualLocation', url: ev.url || window.location.href }
          : { '@type': 'Place', name: ev.venue || '未定', address: { '@type': 'PostalAddress', addressRegion: ev.area || undefined, addressCountry: 'JP' } },
      organizer: { '@type': 'Person', name: ev.profile?.display_name, url: `${window.location.origin}/u/${ev.user_id}` },
      url: window.location.href,
      image: `${window.location.origin}/og.png`,
    },
  })

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
      <ShareButtons path={`/events/${ev.id}`} text={`${ev.title} ${formatDateTime(ev.starts_at)}${ev.venue ? ` @${ev.venue}` : ''}`} />
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
