// プロフィールの SNS リンク。URL でも @ユーザー名 でも入力でき、保存前に正式な URL に揃える
export const SOCIALS = [
  {
    key: 'instagram',
    label: 'Instagram',
    hosts: ['instagram.com', 'www.instagram.com'],
    fromHandle: (h) => `https://www.instagram.com/${h}/`,
    placeholder: '@username または URL',
  },
  {
    key: 'x',
    label: 'X',
    hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
    fromHandle: (h) => `https://x.com/${h}`,
    placeholder: '@username または URL',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
    fromHandle: (h) => `https://www.youtube.com/@${h}`,
    placeholder: '@チャンネル名 または URL',
  },
]

// 空文字はそのまま、正しくなければ null を返す
export function normalizeSocial(social, input) {
  const value = input.trim()
  if (!value) return ''
  const handle = value.replace(/^@/, '')
  if (/^[\w.-]{1,50}$/.test(handle)) return social.fromHandle(handle)
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    if (!social.hosts.includes(url.hostname.toLowerCase()) || url.pathname.length < 2) return null
    url.protocol = 'https:'
    return url.toString()
  } catch {
    return null
  }
}
