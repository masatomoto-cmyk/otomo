import { useState } from 'react'

// X への共有と、リンクのコピー。text は投稿文の先頭に入る
export function ShareButtons({ text, path, hashtags = ['OTOMO'] }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${path}`
  const x = `https://x.com/intent/post?${new URLSearchParams({ text, url, hashtags: hashtags.join(',') })}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('このリンクをコピーしてください', url)
    }
  }

  return (
    <div className="share" aria-label="共有">
      <span className="muted small">共有</span>
      <a className="chip-btn" href={x} target="_blank" rel="noopener noreferrer">𝕏 ポスト</a>
      <button type="button" className="chip-btn" onClick={copy}>{copied ? '✓ コピーしました' : '🔗 リンクをコピー'}</button>
    </div>
  )
}
