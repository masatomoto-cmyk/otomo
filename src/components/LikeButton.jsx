import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/useAsync'

export function LikeButton({ type, id, label = 'いいね' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const likes = useAsync(() => api.getLikes(type, id), [type, id, user?.id])

  async function onClick() {
    if (!user) return navigate('/login')
    likes.setData(await api.toggleLike(type, id))
  }

  const liked = likes.data?.liked
  return (
    <button type="button" className={`chip-btn ${liked ? 'active' : ''}`} onClick={onClick} aria-pressed={!!liked}>
      {liked ? '♥' : '♡'} {label} {likes.data?.count ?? ''}
    </button>
  )
}
