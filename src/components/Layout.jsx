import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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
  const { user, profile, unread, refreshUnread } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // ページを移動するたびと、開いている間は1分ごとに未読数を確認する
  useEffect(() => {
    refreshUnread()
  }, [location.pathname, refreshUnread])
  useEffect(() => {
    const timer = setInterval(refreshUnread, 60_000)
    return () => clearInterval(timer)
  }, [refreshUnread])

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
              <Link to="/notifications" className="bell" aria-label={unread ? `通知（未読${unread}件）` : '通知'}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.71V4a2 2 0 1 0-4 0v.29A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
                </svg>
                {unread > 0 && <span className="badge-count">{unread > 99 ? '99+' : unread}</span>}
              </Link>
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
      <footer className="site-footer">
        <Link to="/recruits">バンドメンバー募集</Link>
        <Link to="/guide">音楽活動ガイド</Link>
        <Link to="/guide/band-member">メンバー募集の始め方</Link>
        <Link to="/guide/first-live">初ライブまでの流れ</Link>
        <Link to="/tools">音楽の道具箱</Link>
        <Link to="/tracks">作品シェア</Link>
        <Link to="/events">ライブ・イベント告知</Link>
        <Link to="/people">ミュージシャンを探す</Link>
      </footer>
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
