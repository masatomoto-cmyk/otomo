import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorText, Field } from '../components/Composer'
import { TagPicker } from '../components/Tags'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { AREAS, GENRES, PARTS } from '../lib/constants'
import { isHttpUrl } from '../lib/embed'
import { normalizeSocial, SOCIALS } from '../lib/social'
import { useAsync } from '../lib/useAsync'
import { Avatar } from '../components/Avatar'
import { toSquareWebp } from '../lib/image'
import { usePageMeta } from '../lib/meta'

export default function Settings() {
  usePageMeta({ title: 'プロフィール編集', noindex: true })
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const blocks = useAsync(() => api.listMyBlocks(), [])
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  // 退会フォーム（フックは早期 return より前に置く）
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (profile && !form) {
      const { display_name, bio, parts, genres, area, link, instagram = '', x = '', youtube = '', email_notifications = true } = profile
      setForm({ display_name, bio, parts, genres, area, link, instagram, x, youtube, email_notifications })
    }
  }, [profile, form])

  if (!form) return null
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (form.link && !isHttpUrl(form.link)) return setError(new Error('リンクのURLが正しくありません'))
    const socials = {}
    for (const s of SOCIALS) {
      const url = normalizeSocial(s, form[s.key])
      if (url === null) return setError(new Error(`${s.label} は @ユーザー名 か ${s.label} のURLで入力してください`))
      socials[s.key] = url
    }
    setBusy(true)
    try {
      await api.updateProfile(user.id, { ...form, ...socials })
      await refreshProfile()
      navigate(`/u/${user.id}`)
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  // アイコンはフォームの保存を待たずに、選んだ時点で反映する
  async function changeAvatar(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarBusy(true)
    setAvatarError('')
    try {
      const url = await api.uploadAvatar(await toSquareWebp(file))
      await api.updateProfile(user.id, { avatar_url: url })
      await refreshProfile()
    } catch (err) {
      setAvatarError(err.message || 'アップロードできませんでした')
    } finally {
      setAvatarBusy(false)
    }
  }

  async function deleteAvatar() {
    if (!confirm('アイコン画像を削除しますか？')) return
    setAvatarBusy(true)
    try {
      await api.updateProfile(user.id, { avatar_url: '' })
      await api.removeAvatar()
      await refreshProfile()
    } finally {
      setAvatarBusy(false)
    }
  }

  async function deleteAccount() {
    if (!confirm('本当に退会しますか？ この操作は取り消せません。')) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api.deleteAccount()
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  async function unblock(userId) {
    await api.unblock(userId)
    blocks.reload()
  }

  return (
    <div className="stack">
    <form onSubmit={submit} className="card stack-sm">
      <h1>プロフィール編集</h1>
      <div className="avatar-edit">
        <Avatar profile={profile} size={72} />
        <div className="stack-xs">
          <div className="row">
            <label className={`btn ghost small ${avatarBusy ? 'disabled' : ''}`}>
              {avatarBusy ? 'アップロード中…' : '画像を選ぶ'}
              <input type="file" accept="image/*" onChange={changeAvatar} disabled={avatarBusy} hidden />
            </label>
            {profile?.avatar_url && (
              <button type="button" className="link-btn small" onClick={deleteAvatar} disabled={avatarBusy}>削除</button>
            )}
          </div>
          <span className="muted small">正方形に切り抜いて保存します。写真の位置情報は取り除かれます</span>
          {avatarError && <p className="error">{avatarError}</p>}
        </div>
      </div>
      <Field label="表示名"><input required maxLength={30} value={form.display_name} onChange={set('display_name')} /></Field>
      <Field label="担当パート" group><TagPicker options={PARTS} value={form.parts} onChange={(parts) => setForm((f) => ({ ...f, parts }))} /></Field>
      <Field label="好きなジャンル" group><TagPicker options={GENRES} value={form.genres} onChange={(genres) => setForm((f) => ({ ...f, genres }))} /></Field>
      <Field label="活動地域">
        <select value={form.area} onChange={set('area')}>
          <option value="">選択しない</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </Field>
      <Field label="自己紹介"><textarea rows={4} maxLength={500} value={form.bio} onChange={set('bio')} placeholder="好きなアーティスト、使っている機材、活動の目標など" /></Field>
      {SOCIALS.map((s) => (
        <Field key={s.key} label={s.label} hint="任意">
          <input value={form[s.key]} onChange={set(s.key)} placeholder={s.placeholder} autoCapitalize="off" />
        </Field>
      ))}
      <label className="check">
        <input
          type="checkbox"
          checked={form.email_notifications}
          onChange={(e) => setForm((f) => ({ ...f, email_notifications: e.target.checked }))}
        />{' '}
        コメント・応募・リアクションをメールでも受け取る（15分ごとにまとめて届きます）
      </label>
      <Field label="その他のリンク" hint="SoundCloud・ポートフォリオなど"><input type="url" value={form.link} onChange={set('link')} placeholder="https://" /></Field>
      <ErrorText error={error} />
      <div className="row end">
        <button type="button" className="btn ghost" onClick={() => navigate(-1)}>キャンセル</button>
        <button className="btn" disabled={busy}>保存</button>
      </div>
    </form>
    <section className="card stack-sm">
      <h2>ブロック中のユーザー</h2>
      {blocks.data?.length === 0 && <p className="muted small">ブロックしているユーザーはいません</p>}
      <ul className="blocked-list">
        {blocks.data?.map((b) => (
          <li key={b.blocked_id}>
            <span className="user-chip">
              <Avatar profile={b.profile} size={28} />
              <strong>{b.profile?.display_name}</strong>
            </span>
            <button className="btn ghost small" onClick={() => unblock(b.blocked_id)}>解除</button>
          </li>
        ))}
      </ul>
    </section>
    <section className="card stack-sm danger-zone">
      <h2>退会する</h2>
      <p className="small">
        退会すると、アカウント・プロフィール・アイコン画像・投稿・作品・募集・イベント・コメント・リアクション・参加表明・ブロック・通報・通知が
        <strong>すべて削除され、元に戻せません</strong>。あなたの投稿に付いたほかの人のコメントも消えます。
        詳しくは <Link to="/privacy">プライバシーポリシー</Link> をご覧ください。
      </p>
      <Field label="確認のため「退会する」と入力してください">
        <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="退会する" autoComplete="off" />
      </Field>
      {deleteError && <p className="error">{deleteError}</p>}
      <div className="row end">
        <button type="button" className="btn danger" disabled={confirmText.trim() !== '退会する' || deleting} onClick={deleteAccount}>
          {deleting ? '削除しています…' : 'アカウントを削除して退会する'}
        </button>
      </div>
    </section>
    </div>
  )
}
