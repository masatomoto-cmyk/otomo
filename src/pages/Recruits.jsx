import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserChip } from '../components/Avatar'
import { Composer, ErrorText, Field } from '../components/Composer'
import { TagPicker, Tags } from '../components/Tags'
import { api } from '../lib/api'
import { AREAS, GENRES, PARTS } from '../lib/constants'
import { timeAgo } from '../lib/format'
import { useAsync } from '../lib/useAsync'

export default function Recruits() {
  const [part, setPart] = useState('')
  const [area, setArea] = useState('')
  const [openOnly, setOpenOnly] = useState(true)
  const recruits = useAsync(
    () =>
      api.list('recruitments', {
        eq: { ...(area && { area }), ...(openOnly && { is_open: true }) },
        contains: part ? { parts: part } : {},
      }),
    [part, area, openOnly],
  )

  return (
    <div className="stack">
      <div className="page-head">
        <h1>メンバー募集</h1>
        <p className="muted">バンドメンバー、セッション仲間、コラボ相手を探そう</p>
      </div>
      <Composer label="募集を出す">
        {(close) => <RecruitForm onDone={(r) => { recruits.setData([r, ...(recruits.data ?? [])]); close() }} onCancel={close} />}
      </Composer>
      <div className="filters">
        <select value={part} onChange={(e) => setPart(e.target.value)} aria-label="パート">
          <option value="">すべてのパート</option>
          {PARTS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="地域">
          <option value="">すべての地域</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} /> 募集中のみ</label>
      </div>
      <ErrorText error={recruits.error} />
      {recruits.data?.map((r) => <RecruitCard key={r.id} r={r} />)}
      {recruits.data?.length === 0 && <p className="empty">条件に合う募集がありません</p>}
    </div>
  )
}

function RecruitCard({ r }) {
  return (
    <article className={`card ${r.is_open ? '' : 'closed'}`}>
      <div className="row between">
        <UserChip profile={r.profile}>{timeAgo(r.created_at)}</UserChip>
        <span className={`badge ${r.is_open ? '' : 'gray'}`}>{r.is_open ? '募集中' : '締切'}</span>
      </div>
      <h2 className="card-title"><Link to={`/recruits/${r.id}`}>{r.title}</Link></h2>
      <div className="kv">
        <span className="muted small">募集パート</span><Tags items={r.parts} tone="accent" />
        {r.genres.length > 0 && <><span className="muted small">ジャンル</span><Tags items={r.genres} /></>}
        {r.area && <><span className="muted small">地域</span><span>{r.area}</span></>}
      </div>
      <p className="clamp">{r.body}</p>
      <Link to={`/recruits/${r.id}`} className="more">詳細・応募 →</Link>
    </article>
  )
}

function RecruitForm({ onDone, onCancel }) {
  const [form, setForm] = useState({ title: '', body: '', parts: [], genres: [], area: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (form.parts.length === 0) return setError(new Error('募集するパートを1つ以上選んでください'))
    setBusy(true)
    try {
      onDone(await api.create('recruitments', { ...form, is_open: true }))
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="stack-sm">
      <Field label="タイトル"><input autoFocus required maxLength={100} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="例：週末に活動できるベースさん募集" /></Field>
      <Field label="募集パート" group><TagPicker options={PARTS} value={form.parts} onChange={(parts) => setForm((f) => ({ ...f, parts }))} /></Field>
      <Field label="ジャンル" group><TagPicker options={GENRES} value={form.genres} onChange={(genres) => setForm((f) => ({ ...f, genres }))} /></Field>
      <Field label="地域">
        <select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}>
          <option value="">選択しない</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </Field>
      <Field label="詳細" hint="活動頻度・目標・参考アーティストなど">
        <textarea rows={4} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
      </Field>
      <ErrorText error={error} />
      <div className="row end">
        <button type="button" className="btn ghost" onClick={onCancel}>キャンセル</button>
        <button className="btn" disabled={busy}>募集を出す</button>
      </div>
    </form>
  )
}
