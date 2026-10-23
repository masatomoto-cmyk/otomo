import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ErrorText } from '../components/Composer'
import { MusicEmbed } from '../components/MusicEmbed'
import { Tags } from '../components/Tags'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { EventCard } from './Events'
import { PostCard } from './Timeline'

const TABS = [
  { key: 'tracks', label: '作品' },
  { key: 'posts', label: '投稿' },
  { key: 'recruitments', label: '募集' },
  { key: 'events', label: 'イベント' },
]

export default function Profile() {
  const { id } = useParams()
  const { user } = useAuth()
  const [tab, setTab] = useState('tracks')
  const profile = useAsync(() => api.getProfile(id), [id])
  const items = useAsync(() => api.list(tab, { eq: { user_id: id } }), [tab, id])
  const p = profile.data

  if (profile.error) return <ErrorText error={profile.error} />
  if (profile.loading && !p) return null
  if (!p) return <p className="empty">ユーザーが見つかりません</p>

  return (
    <div className="stack">
      <section className="card profile-head">
        <Avatar profile={p} size={72} />
        <div className="stack-xs grow">
          <div className="row between">
            <h1>{p.display_name}</h1>
            {user?.id === id && <Link to="/settings" className="btn ghost small">プロフィール編集</Link>}
          </div>
          {p.area && <span className="muted small">📍 {p.area}</span>}
          <Tags items={p.parts} tone="accent" />
          <Tags items={p.genres} />
          {p.bio && <p className="pre">{p.bio}</p>}
          {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="small">🔗 {p.link}</a>}
        </div>
      </section>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 前のタブのデータで別タブの描画をしないよう、読み込み中は出さない */}
      {!items.loading && items.data?.map((item) => {
        if (tab === 'posts') return <PostCard key={item.id} post={item} onDeleted={items.reload} />
        if (tab === 'events') return <EventCard key={item.id} ev={item} />
        if (tab === 'tracks') {
          return (
            <article key={item.id} className="card">
              <h2 className="card-title"><Link to={`/tracks/${item.id}`}>{item.title}</Link></h2>
              <span className="muted small">{timeAgo(item.created_at)}</span>
              <MusicEmbed url={item.url} />
            </article>
          )
        }
        return (
          <article key={item.id} className="card">
            <div className="row between">
              <h2 className="card-title"><Link to={`/recruits/${item.id}`}>{item.title}</Link></h2>
              <span className={`badge ${item.is_open ? '' : 'gray'}`}>{item.is_open ? '募集中' : '締切'}</span>
            </div>
            <Tags items={item.parts} tone="accent" />
          </article>
        )
      })}
      {!items.loading && items.data?.length === 0 && <p className="empty">まだありません</p>}
    </div>
  )
}
