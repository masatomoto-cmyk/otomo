import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { REPORT_REASONS } from '../lib/constants'

// 「通報」リンク。押すと理由を選ぶ小さなフォームが開く
export function ReportButton({ type, id, ownerId, className = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [state, setState] = useState('idle') // idle | sending | done | error

  if (user && user.id === ownerId) return null

  async function submit(e) {
    e.preventDefault()
    setState('sending')
    try {
      await api.report(type, id, reason, detail.trim())
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') return <span className="muted small">通報を受け付けました。ご協力ありがとうございます</span>

  if (!open) {
    return (
      <button type="button" className={`link-btn small ${className}`} onClick={() => (user ? setOpen(true) : navigate('/login'))}>
        通報
      </button>
    )
  }

  return (
    <form className="report-form" onSubmit={submit}>
      <strong className="small">通報する理由</strong>
      {Object.entries(REPORT_REASONS).map(([key, label]) => (
        <label key={key} className="check">
          <input type="radio" name={`reason-${id}`} value={key} checked={reason === key} onChange={() => setReason(key)} /> {label}
        </label>
      ))}
      <textarea rows={2} maxLength={1000} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="詳しい状況（任意）" />
      {state === 'error' && <p className="error">送信できませんでした。時間をおいて試してください</p>}
      <div className="row end">
        <button type="button" className="btn ghost small" onClick={() => setOpen(false)}>キャンセル</button>
        <button className="btn danger small" disabled={!reason || state === 'sending'}>通報する</button>
      </div>
      <p className="muted small">通報した内容は相手には通知されません。運営が確認します。</p>
    </form>
  )
}
