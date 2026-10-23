import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Avatar } from './Avatar'

const NAV = [
  { to: '/', label: 'タイムライン', icon: '💬', end: true },
  { to: '/tracks', label: '作品', icon: '🎧' },
  { to: '/recruits', label: 'メンバー募集', icon: '🤝' },
  { to: '/events', label: 'イベント', icon: '🎤' },
  { to: '/people', label: 'ミュージシャン', icon: '🎸' },
]

export function Layout() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  async function signOut() {
    await api.auth.signOut()
    navigate('/')
  }

  return (
    <div className="app">
      {api.mode === 'demo' && (
        <div className="demo-banner">デモモード：データはこのブラウザ内だけに保存されます</div>
      )}
      <header className="header">
        <Link to="/" className="logo">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          OTOMO
        </Link>
        <nav className="nav-top">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-user">
          {user ? (
            <>
              <Link to={`/u/${user.id}`} title="マイページ">
                <Avatar profile={profile ?? { id: user.id }} size={34} />
              </Link>
              <button className="link-btn small" onClick={signOut}>
                ログアウト
              </button>
            </>
          ) : (
            <Link to="/login" className="btn small">
              ログイン
            </Link>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <nav className="nav-bottom">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span aria-hidden>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
