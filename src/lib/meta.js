import { useEffect } from 'react'

const SITE = 'OTOMO'
const DEFAULT_TITLE = 'OTOMO（オトモ）｜バンドメンバー募集・自作曲の感想・ライブ告知の音楽交流アプリ'
const DEFAULT_DESC = 'バンドメンバー募集、自作曲・演奏動画への感想、ライブ告知ができる無料の音楽交流アプリ。いいね数を競わず、言葉が届く。DTM・宅録・弾き語り・バンドの人へ。'

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/)
    el.setAttribute(key, name)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

// ページごとのタイトル・説明・正規 URL を設定する（Google が JS 実行後に読む）
// noindex: ログインやマイページなど、検索結果に出す必要のないページ
// jsonLd: 構造化データ（イベントなど）
export function usePageMeta({ title, description, noindex = false, jsonLd = null }) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : ''
  useEffect(() => {
    document.title = title ? `${title}｜${SITE}` : DEFAULT_TITLE
    setMeta('meta[name="description"]', 'content', (description || DEFAULT_DESC).replace(/\s+/g, ' ').slice(0, 160))
    setMeta('link[rel="canonical"]', 'href', `${window.location.origin}${window.location.pathname}`)
    setMeta('meta[name="robots"]', 'content', noindex ? 'noindex' : 'index,follow')

    let script = null
    if (ld) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = ld
      document.head.appendChild(script)
    }
    return () => script?.remove()
  }, [title, description, noindex, ld])
}
