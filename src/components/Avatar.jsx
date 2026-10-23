import { Link } from 'react-router-dom'

const COLORS = ['#7c5cff', '#ff6b8b', '#22b8a7', '#f59f00', '#4c9aff', '#e8590c', '#40c057', '#be4bdb']

function colorFor(id = '') {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

export function Avatar({ profile, size = 40 }) {
  const name = profile?.display_name ?? '?'
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: colorFor(profile?.id) }} aria-hidden>
      {[...name][0]}
    </span>
  )
}

export function UserChip({ profile, size = 32, children }) {
  if (!profile) return null
  return (
    <Link to={`/u/${profile.id}`} className="user-chip">
      <Avatar profile={profile} size={size} />
      <span className="user-chip-text">
        <strong>{profile.display_name}</strong>
        {children && <span className="muted small">{children}</span>}
      </span>
    </Link>
  )
}
