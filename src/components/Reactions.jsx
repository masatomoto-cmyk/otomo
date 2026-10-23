import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { REACTIONS, REACTIONS_BY_TYPE } from '../lib/constants'
import { useAsync } from '../lib/useAsync'
import { Avatar } from './Avatar'

// いいねの代わり。押した数は誰にも公開されず、投稿者本人にだけ「誰から何が届いたか」が見える
export function Reactions({ type, id, ownerId, showReceived = false }) {
  const { user } = useAuth()
  if (user && user.id === ownerId) return showReceived ? <Received type={type} id={id} /> : null
  return <ReactionButtons type={type} id={id} />
}

function ReactionButtons({ type, id }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const mine = useAsync(() => api.getMyReactions(type, id), [type, id, user?.id])

  async function toggle(kind) {
    if (!user) return navigate('/login')
    mine.setData(await api.toggleReaction(type, id, kind))
  }

  return REACTIONS_BY_TYPE[type].map((kind) => {
    const on = mine.data?.includes(kind)
    return (
      <button
        key={kind}
        type="button"
        className={`chip-btn ${on ? 'active' : ''}`}
        onClick={() => toggle(kind)}
        aria-pressed={!!on}
        title="投稿者にだけ届きます（数は公開されません）"
      >
        {REACTIONS[kind].emoji} {REACTIONS[kind].label}
      </button>
    )
  })
}

function Received({ type, id }) {
  const received = useAsync(() => api.getReceivedReactions(type, id), [type, id])
  if (!received.data) return null

  return (
    <section className="received">
      <h3>
        あなたに届いた声 <span className="muted small">（あなたにだけ表示）</span>
      </h3>
      {received.data.length === 0 ? (
        <p className="muted small">まだ届いていません</p>
      ) : (
        <ul>
          {received.data.map((r) => (
            <li key={`${r.profile?.id}-${r.kind}`}>
              <Link to={`/u/${r.profile?.id}`} className="user-chip">
                <Avatar profile={r.profile} size={24} />
                <strong>{r.profile?.display_name}</strong>
              </Link>
              <span>
                {REACTIONS[r.kind].emoji} {REACTIONS[r.kind].label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
