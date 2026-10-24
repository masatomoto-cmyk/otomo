import { Link, useParams } from 'react-router-dom'
import { usePageMeta } from '../lib/meta'
import { TOOLS } from './toolContent'

const INDEX_TITLE = '音楽の道具箱 — BPM計測・ディレイ計算・移調・カポ・セトリ時間'
const INDEX_DESC = 'タップでBPMを測る、BPMからディレイタイムを出す、コード進行を移調する、カポの位置を調べる、ライブの持ち時間を計算する。作曲・DTM・バンド・弾き語りで使う計算を、登録なし・無料で。'

// 道具箱の一覧（/tools）
export function ToolIndex() {
  usePageMeta({
    title: INDEX_TITLE,
    description: INDEX_DESC,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '音楽の道具箱',
      description: INDEX_DESC,
      url: `${window.location.origin}/tools`,
      inLanguage: 'ja',
      isPartOf: { '@type': 'WebSite', name: 'OTOMO', url: `${window.location.origin}/` },
    },
  })
  return (
    <div className="stack">
      <div className="page-head">
        <h1>音楽の道具箱</h1>
        <p className="muted">曲作りや練習、ライブの準備でちょっと必要になる計算を、ブラウザだけで。登録は不要で、入力した内容はどこにも送信されません。</p>
      </div>
      {TOOLS.map((t) => (
        <article key={t.slug} className="card">
          <h2 className="card-title"><Link to={`/tools/${t.slug}`}>{t.name}</Link></h2>
          <p className="muted small">{t.summary}</p>
        </article>
      ))}
    </div>
  )
}

// 各道具（/tools/:slug）
export function ToolPage() {
  const { slug } = useParams()
  const tool = TOOLS.find((t) => t.slug === slug)
  const origin = window.location.origin
  usePageMeta({
    title: tool?.title ?? '道具箱',
    description: tool?.summary,
    noindex: !tool,
    jsonLd: tool && [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: tool.name,
        description: tool.summary,
        url: `${origin}/tools/${tool.slug}`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        inLanguage: 'ja',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
        isPartOf: { '@type': 'WebSite', name: 'OTOMO', url: `${origin}/` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '音楽の道具箱', item: `${origin}/tools` },
          { '@type': 'ListItem', position: 2, name: tool.name, item: `${origin}/tools/${tool.slug}` },
        ],
      },
    ],
  })
  if (!tool) return <p className="empty">ページが見つかりません</p>
  const Tool = tool.component
  const others = TOOLS.filter((t) => t.slug !== slug)
  return (
    <div className="stack">
      <div className="page-head">
        <nav className="crumbs small" aria-label="パンくずリスト">
          <Link to="/tools">音楽の道具箱</Link> › <span>{tool.name}</span>
        </nav>
        <h1>{tool.title.split(' — ')[0]}</h1>
        <p className="muted">{tool.intro}</p>
      </div>
      <section className="card tool">
        <Tool key={slug} />
      </section>
      <section className="card guide">
        <h2>使い方</h2>
        <ul>{tool.howTo.map((item) => <li key={item}>{item}</li>)}</ul>
        <h2>計算のしかた</h2>
        {tool.formula.map((line) => <p key={line}>{line}</p>)}
        <h2>あわせて使いたい</h2>
        <ul>
          {tool.related.map((r) => (
            <li key={r.label}>{r.to ? <Link to={r.to}>{r.label}</Link> : <a href={r.href} target="_blank" rel="noopener">{r.label}</a>}</li>
          ))}
        </ul>
        <h2>ほかの道具</h2>
        <ul>
          {others.map((t) => (
            <li key={t.slug}><Link to={`/tools/${t.slug}`}>{t.name}</Link></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
