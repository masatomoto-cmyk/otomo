// 音楽リンクを埋め込みプレイヤーのURLに変換する（対応外は null）
export function toEmbed(url) {
  if (!url) return null
  let u
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\.|^m\./, '')

  if (host === 'youtube.com' || host === 'music.youtube.com') {
    const id = u.searchParams.get('v') || u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1]
    if (id) return { kind: 'youtube', src: `https://www.youtube.com/embed/${id}`, height: 220 }
  }
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1)
    if (id) return { kind: 'youtube', src: `https://www.youtube.com/embed/${id}`, height: 220 }
  }
  if (host === 'soundcloud.com') {
    return {
      kind: 'soundcloud',
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%231f883d&visual=false`,
      height: 166,
    }
  }
  if (host === 'open.spotify.com') {
    const m = u.pathname.match(/\/(track|album|playlist|episode)\/(\w+)/)
    if (m) return { kind: 'spotify', src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: m[1] === 'track' ? 152 : 352 }
  }
  return null
}

export function isHttpUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
