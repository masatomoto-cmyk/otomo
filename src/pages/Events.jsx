import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { UserChip } from '../components/Avatar'
import { Composer, ErrorText, Field } from '../components/Composer'
import { ExternalEvents } from '../components/ExternalEvents'
import { api } from '../lib/api'
import { AREA_PLACES, AREA_SLUGS, AREAS, fromSlug } from '../lib/constants'
import { isHttpUrl } from '../lib/embed'
import { formatDateTime, localInputToIso } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { usePageMeta } from '../lib/meta'

export default function Events() {
  // 地域の絞り込みは URL（/events/area/kanto）で表し、検索エンジンが地域ごとのページとして扱えるようにする
  const navigate = useNavigate()
  const area = fromSlug(AREA_SLUGS, useParams().areaSlug)
  const setArea = (a) => navigate(a ? `/events/area/${AREA_SLUGS[a]}` : '/events')
  const [tab, setTab] = useState('otomo')
  // 開いた時点を基準に「これから」のイベントを出す
  const since = useMemo(() => new Date(Date.now() - 3 * 3600_000).toISOString(), [])
  const events = useAsync(
    () => api.list('events', { eq: area ? { area } : {}, gte: { starts_at: since }, order: 'starts_at', ascending: true }),
    [area, since],
  )
  const h1 = area ? `${area}のライブ・イベント情報` : 'ライブ・イベント告知'
  const lead = area
    ? area === 'オンライン'
      ? 'オンラインで参加できる作曲会・配信ライブ・リモートセッションの予定です。'
      : `${AREA_PLACES[area]}などで開かれるインディーズのライブ、セッション、オープンマイクの予定です。参加表明やコメントで気軽に交流できます。`
    : 'インディーズバンドのライブ、セッション、オープンマイク、オンライン作曲会の予定を探して参加表明できます。自分のライブも無料で告知できます。'
  usePageMeta({
    title: area ? `${h1}（ライブハウス・セッション・オープンマイク）` : 'ライブ・イベント告知 — ライブハウス・セッション・オープンマイク',
    description: lead,
    noindex: area && events.data?.length === 0,
  })

  return (
    <div className="stack">
      <div className="page-head">
        {area && (
          <nav className="crumbs small" aria-label="パンくずリスト">
            <Link to="/events">ライブ・イベント</Link> › <span>{h1}</span>
          </nav>
        )}
        <h1>{h1}</h1>
        <p className="muted">{lead}</p>
      </div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'otomo'} className={tab === 'otomo' ? 'on' : ''} onClick={() => setTab('otomo')}>
          OTOMOのイベント
        </button>
        <button role="tab" aria-selected={tab === 'external'} className={tab === 'external' ? 'on' : ''} onClick={() => setTab('external')}>
          全国のライブハウス
        </button>
      </div>
      {tab === 'otomo' && (
      <Composer label="イベントを告知する">
        {(close) => (
          <EventForm
            onDone={(ev) => {
              events.setData([...(events.data ?? []), ev].sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1)))
              close()
            }}
            onCancel={close}
          />
        )}
      </Composer>
      )}
      <div className="filters">
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="地域">
          <option value="">すべての地域</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      {tab === 'external' ? (
        <ExternalEvents area={area} />
      ) : (
        <>
          <ErrorText error={events.error} />
          {events.data?.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          {events.data?.length === 0 && (
            <div className="empty">
              <p>予定されているイベントはまだありません。</p>
              <p className="small">
                自分のライブやセッションを告知してみませんか？ 出演の流れは <Link to="/guide/first-live">初ライブまでの流れ</Link> で紹介しています。
              </p>
            </div>
          )}
        </>
      )}
      <section className="card browse">
        <h2>地域からイベントを探す</h2>
        <div className="tags">
          {AREAS.map((a) => (
            <Link key={a} className="tag" to={`/events/area/${AREA_SLUGS[a]}`}>{a}</Link>
          ))}
        </div>
        <p className="small">
          <Link to="/guide/first-live">ライブハウスに初出演するには</Link>・<Link to="/guide/session">セッション・オープンマイクの始め方</Link>
        </p>
      </section>
    </div>
  )
}

export function EventCard({ ev }) {
  const d = new Date(ev.starts_at)
  return (
    <article className="card event-card">
      <div className="date-box" aria-hidden>
        <span className="small">{d.getMonth() + 1}月</span>
        <strong>{d.getDate()}</strong>
      </div>
      <div className="stack-xs grow">
        <h2 className="card-title"><Link to={`/events/${ev.id}`}>{ev.title}</Link></h2>
        <p className="muted small">🕒 {formatDateTime(ev.starts_at)}　📍 {ev.venue || '未定'}{ev.area && `（${ev.area}）`}</p>
        <UserChip profile={ev.profile} size={24} />
      </div>
    </article>
  )
}

function EventForm({ onDone, onCancel }) {
  const [form, setForm] = useState({ title: '', starts_at: '', venue: '', area: '', url: '', body: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (form.url && !isHttpUrl(form.url)) return setError(new Error('URLの形式が正しくありません'))
    setBusy(true)
    try {
      onDone(await api.create('events', { ...form, starts_at: localInputToIso(form.starts_at) }))
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="stack-sm">
      <Field label="イベント名"><input autoFocus required maxLength={100} value={form.title} onChange={set('title')} /></Field>
      <div className="grid-2">
        <Field label="日時"><input type="datetime-local" required value={form.starts_at} onChange={set('starts_at')} /></Field>
        <Field label="地域">
          <select value={form.area} onChange={set('area')}>
            <option value="">選択しない</option>
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
      </div>
      <Field label="会場"><input value={form.venue} onChange={set('venue')} placeholder="ライブハウス名・オンラインなど" /></Field>
      <Field label="詳細URL" hint="任意・チケットページなど"><input type="url" value={form.url} onChange={set('url')} placeholder="https://" /></Field>
      <Field label="詳細"><textarea rows={3} value={form.body} onChange={set('body')} placeholder="出演者、料金、参加条件など" /></Field>
      <ErrorText error={error} />
      <div className="row end">
        <button type="button" className="btn ghost" onClick={onCancel}>キャンセル</button>
        <button className="btn" disabled={busy}>告知する</button>
      </div>
    </form>
  )
}
