import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ErrorText } from '../components/Composer'
import { Tags } from '../components/Tags'
import { api } from '../lib/api'
import { AREAS, PARTS } from '../lib/constants'
import { useAsync } from '../lib/useAsync'

export default function People() {
  const [part, setPart] = useState('')
  const [area, setArea] = useState('')
  const people = useAsync(() => api.listProfiles({ part, area }), [part, area])

  return (
    <div className="stack">
      <div className="page-head">
        <h1>ミュージシャンを探す</h1>
        <p className="muted">パートや地域で絞り込んで、気になる人のプロフィールをチェック</p>
      </div>
      <div className="filters">
        <select value={part} onChange={(e) => setPart(e.target.value)} aria-label="パート">
          <option value="">すべてのパート</option>
          {PARTS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="地域">
          <option value="">すべての地域</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      <ErrorText error={people.error} />
      <div className="people-grid">
        {people.data?.map((p) => (
          <Link key={p.id} to={`/u/${p.id}`} className="card person">
            <Avatar profile={p} size={52} />
            <strong>{p.display_name}</strong>
            {p.area && <span className="muted small">📍 {p.area}</span>}
            <Tags items={p.parts} tone="accent" />
            {p.bio && <p className="small clamp">{p.bio}</p>}
          </Link>
        ))}
      </div>
      {people.data?.length === 0 && <p className="empty">条件に合う人がいません</p>}
    </div>
  )
}
