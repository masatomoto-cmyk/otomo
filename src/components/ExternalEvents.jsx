import { useState } from 'react'
import { api } from '../lib/api'
import { useAsync } from '../lib/useAsync'

const fmtDate = (d) =>
  new Date(`${d.slice(0, 10)}T00:00:00+09:00`).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })

// 外部 API から取ってきた全国のライブハウス公演。OTOMO の外のページへリンクする
export function ExternalEvents({ area }) {
  const [small, setSmall] = useState(true)
  const res = useAsync(() => api.externalEvents({ area, small }), [area, small])

  if (res.loading && !res.data) return <p className="muted small">ライブ情報を読み込み中…</p>
  if (res.error) return <p className="error">{res.error.message}</p>
  if (!res.data?.configured) {
    return (
      <div className="card cta">
        ライブハウス情報は準備中です。もうしばらくお待ちください。
      </div>
    )
  }

  const events = res.data.events
  return (
    <div className="stack-sm">
      <label className="check">
        <input type="checkbox" checked={small} onChange={(e) => setSmall(e.target.checked)} /> 小さな会場だけ（〜500人規模・インディーズ向け）
      </label>
      {events.length === 0 && <p className="empty">条件に合うライブ情報が見つかりませんでした</p>}
      {events.map((ev) => {
        const d = new Date(`${ev.startDate.slice(0, 10)}T00:00:00+09:00`)
        return (
          <article key={ev.id} className="card event-card">
            <div className="date-box" aria-hidden>
              <span className="small">{d.getMonth() + 1}月</span>
              <strong>{d.getDate()}</strong>
            </div>
            <div className="stack-xs grow">
              <h2 className="card-title">
                <a href={ev.url || ev.ticketUrl} target="_blank" rel="noopener noreferrer">{ev.name}</a>
              </h2>
              <p className="muted small">
                🗓 {fmtDate(ev.startDate)}　📍 {ev.venue}{(ev.pref || ev.city) && `（${ev.pref || ev.city}）`}
                {ev.status === 'postponed' && <span className="badge attention">延期</span>}
              </p>
              {ev.performers.length > 0 && <p className="small">出演: {ev.performers.join(' / ')}</p>}
              {ev.ticketUrl && (
                <a className="more" href={ev.ticketUrl} target="_blank" rel="noopener noreferrer">チケット・詳細 ↗</a>
              )}
            </div>
          </article>
        )
      })}
      <p className="muted small credit">
        {res.data.source === 'jambase' ? (
          <>ライブ情報提供: <a href="https://www.jambase.com" target="_blank" rel="noopener noreferrer">JamBase</a></>
        ) : (
          'デモ用のサンプルデータです'
        )}
      </p>
    </div>
  )
}
