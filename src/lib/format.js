export function timeAgo(iso) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return 'たった今'
  if (sec < 3600) return `${Math.floor(sec / 60)}分前`
  if (sec < 86400) return `${Math.floor(sec / 3600)}時間前`
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)}日前`
  return new Date(iso).toLocaleDateString('ja-JP')
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// datetime-local の値 ⇔ ISO
export function localInputToIso(value) {
  return new Date(value).toISOString()
}
