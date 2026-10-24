import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ErrorText, Field } from '../components/Composer'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { usePageMeta } from '../lib/meta'

export default function Login() {
  usePageMeta({ title: 'ログイン・新規登録', noindex: true })
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const demo = api.mode === 'demo'

  if (user) return <Navigate to="/" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await api.auth.signUp(form)
        if (needsConfirmation) {
          setNotice('確認メールを送りました。メール内のリンクを開いてからログインしてください。')
          setMode('signin')
          return
        }
        navigate('/settings')
      } else {
        await api.auth.signIn(form)
        navigate('/')
      }
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <form onSubmit={submit} className="card stack-sm">
        <h1>{mode === 'signin' ? 'ログイン' : '新規登録'}</h1>
        {demo && (
          <p className="muted small">
            デモモードではパスワードは確認しません。登録済みのデモユーザー：<code>u-saki@demo.local</code>
          </p>
        )}
        {mode === 'signup' && (
          <Field label="表示名"><input required maxLength={30} value={form.displayName} onChange={set('displayName')} autoComplete="nickname" /></Field>
        )}
        <Field label="メールアドレス"><input type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="パスワード" hint={mode === 'signup' ? '6文字以上' : undefined}>
          <input
            type="password"
            required={!demo}
            minLength={demo ? undefined : 6}
            value={form.password}
            onChange={set('password')}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </Field>
        {notice && <p className="notice">{notice}</p>}
        <ErrorText error={error} />
        {mode === 'signup' && (
          <label className="check">
            <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />{' '}
            <span>
              <Link to="/terms" target="_blank">利用規約</Link>と<Link to="/privacy" target="_blank">プライバシーポリシー</Link>に同意します
            </span>
          </label>
        )}
        <button className="btn wide" disabled={busy || (mode === 'signup' && !agreed)}>{mode === 'signin' ? 'ログイン' : '登録する'}</button>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}>
          {mode === 'signin' ? 'アカウントを作る' : 'ログインはこちら'}
        </button>
      </form>
    </div>
  )
}
