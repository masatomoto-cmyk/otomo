import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

// 「＋ 投稿する」で開くフォームの枠。ログインしていなければ誘導を出す
export function Composer({ label, children }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <div className="card cta">
        <Link to="/login">ログイン</Link>して参加しよう
      </div>
    )
  }
  if (!open) {
    return (
      <button className="btn wide" onClick={() => setOpen(true)}>
        ＋ {label}
      </button>
    )
  }
  return <div className="card form-card">{children(() => setOpen(false))}</div>
}

// group: タグ選択など複数の操作要素を含むときは label ではなく div にする
export function Field({ label, hint, group, children }) {
  const Tag = group ? 'div' : 'label'
  return (
    <Tag className="field" role={group ? 'group' : undefined}>
      <span className="field-label">
        {label}
        {hint && <span className="muted small"> {hint}</span>}
      </span>
      {children}
    </Tag>
  )
}

export function ErrorText({ error }) {
  return error ? <p className="error">{error.message ?? String(error)}</p> : null
}
