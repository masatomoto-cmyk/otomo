import { Link, useParams } from 'react-router-dom'
import { usePageMeta } from '../lib/meta'
import { GUIDES } from './guideContent'

// ガイド一覧（/guide）
export function GuideIndex() {
  usePageMeta({
    title: '音楽活動ガイド — バンド・ライブ・作曲・セッションの始め方',
    description: 'バンドメンバーの探し方、ライブハウスへの初出演、自作曲の感想のもらい方、セッション・オープンマイクの始め方など、音楽活動をはじめる人のためのガイド。',
  })
  return (
    <div className="stack">
      <div className="page-head">
        <h1>音楽活動ガイド</h1>
        <p className="muted">バンド・ライブ・作曲・セッション。音楽活動をはじめる人、もう一歩進みたい人のための読みもの。</p>
      </div>
      {GUIDES.map((g) => (
        <article key={g.slug} className="card">
          <h2 className="card-title"><Link to={`/guide/${g.slug}`}>{g.title}</Link></h2>
          <p className="muted small">{g.summary}</p>
        </article>
      ))}
    </div>
  )
}

// 各ガイド記事（/guide/:slug）。band-member だけは専用ページ
export function GuidePage() {
  const { slug } = useParams()
  const guide = GUIDES.find((g) => g.slug === slug && g.body)
  usePageMeta({
    title: guide?.title ?? 'ガイド',
    description: guide?.summary,
    noindex: !guide,
    jsonLd: guide && {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.summary,
      datePublished: guide.published,
      dateModified: guide.published,
      author: { '@type': 'Organization', name: 'OTOMO' },
      publisher: { '@type': 'Organization', name: 'OTOMO' },
      image: `${window.location.origin}/og.png`,
      mainEntityOfPage: window.location.href,
    },
  })
  if (!guide) return <p className="empty">ページが見つかりません</p>
  const Body = guide.body
  const others = GUIDES.filter((g) => g.slug !== slug)
  return (
    <article className="card guide">
      <nav className="crumbs small" aria-label="パンくずリスト">
        <Link to="/guide">音楽活動ガイド</Link> › <span>{guide.title.split(' — ')[0]}</span>
      </nav>
      <h1>{guide.title}</h1>
      <p className="muted small">更新日: {guide.published}</p>
      <Body />
      <h2>ほかのガイド</h2>
      <ul>
        {others.map((g) => (
          <li key={g.slug}><Link to={`/guide/${g.slug}`}>{g.title}</Link></li>
        ))}
      </ul>
    </article>
  )
}
