import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AREA_SLUGS, AREAS, PART_SLUGS } from '../lib/constants'
import { usePageMeta } from '../lib/meta'

const TEMPLATE = `【募集パート】ベース
【活動地域】東京（下北沢・新宿のスタジオが中心）
【ジャンル・参考アーティスト】オルタナ、ギターロック（〇〇、△△ あたり）
【活動頻度】月2〜3回のスタジオ練習（週末の夜）
【目標】オリジナル曲で半年後にライブハウス出演
【メンバー】ギターボーカル（20代）、ドラム（30代）
【費用】スタジオ代は割り勘（1回あたり1人1,000円前後）
【参考音源】https://（デモ音源・演奏動画のURL）
【ひとこと】まずは一度スタジオで音を合わせてみたいです。気軽に応募コメントください！`

const PUBLISHED = '2026-10-24'

export default function GuideBandMember() {
  usePageMeta({
    title: 'バンドメンバー募集の始め方 — 募集文の書き方とテンプレート',
    description:
      'バンドメンバー募集で応募が集まる募集文の書き方を、そのまま使えるテンプレート付きで解説。入れるべき項目、応募が増えるコツ、メンバー探しの流れ、トラブルを避けるための注意点まで。',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'バンドメンバー募集の始め方 — 募集文の書き方とテンプレート',
      datePublished: PUBLISHED,
      dateModified: PUBLISHED,
      author: { '@type': 'Organization', name: 'OTOMO' },
      publisher: { '@type': 'Organization', name: 'OTOMO' },
      image: `${window.location.origin}/og.png`,
      mainEntityOfPage: window.location.href,
    },
  })
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(TEMPLATE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('このテンプレートをコピーしてください', TEMPLATE)
    }
  }

  return (
    <article className="card guide">
      <nav className="crumbs small" aria-label="パンくずリスト">
        <Link to="/recruits">バンドメンバー募集</Link> › <span>募集の始め方</span>
      </nav>
      <h1>バンドメンバー募集の始め方 — 募集文の書き方とテンプレート</h1>
      <p className="muted small">更新日: {PUBLISHED}</p>
      <p>
        バンドを組みたい、メンバーが抜けて新しい人を探したい。そんなときに一番大事なのは、
        <strong>「どんなバンドで、どんな人と、どれくらいのペースでやりたいか」が一目で伝わる募集文</strong>
        です。このページでは、応募が集まりやすい募集文の書き方と、そのまま使えるテンプレートを紹介します。
      </p>

      <h2>メンバー探しの流れ</h2>
      <ol>
        <li><strong>やりたいことを決める</strong> — ジャンル、オリジナルかコピーか、目標（ライブ出演・音源制作・趣味で楽しむ）。</li>
        <li><strong>募集を出す</strong> — 下のテンプレートを埋めて、募集パートと地域を選んで掲載します。</li>
        <li><strong>応募にやり取りで答える</strong> — 応募コメントには早めに返信。音源を聴き合うと相性が分かります。</li>
        <li><strong>スタジオで一度合わせる</strong> — 1〜2曲決めて音を出してみるのが一番確実です。</li>
        <li><strong>正式に加入・募集を締め切る</strong> — 決まったら募集を「締め切る」にして、応募してくれた人にも一言お礼を。</li>
      </ol>

      <h2>募集文に必ず入れたい7つの項目</h2>
      <ul>
        <li><strong>募集パート</strong> — 複数ならすべて。「できれば」「必須」の区別があると親切です。</li>
        <li><strong>活動地域</strong> — 練習するスタジオのエリアまで書くと、通えるかどうか判断できます。</li>
        <li><strong>ジャンルと参考アーティスト</strong> — ジャンル名だけより、具体的なアーティスト名のほうが伝わります。</li>
        <li><strong>活動頻度と曜日・時間帯</strong> — 「月2回・週末の夜」など。ここが合わないと続きません。</li>
        <li><strong>目標</strong> — ライブ出演、音源リリース、趣味のセッションなど。温度感のずれを防ぎます。</li>
        <li><strong>今のメンバー構成</strong> — 担当パートと年代くらい。雰囲気が想像できると応募しやすくなります。</li>
        <li><strong>参考音源</strong> — デモや演奏動画のリンクが1つあるだけで、応募の質がぐっと上がります。</li>
      </ul>

      <h2>そのまま使える募集文テンプレート</h2>
      <pre className="template">{TEMPLATE}</pre>
      <div className="row">
        <button type="button" className="btn ghost small" onClick={copy}>{copied ? '✓ コピーしました' : 'テンプレートをコピー'}</button>
        <Link to="/recruits" className="btn small">募集を出す</Link>
      </div>

      <h2>応募が集まりやすくなるコツ</h2>
      <ul>
        <li><strong>タイトルにパートと地域を入れる</strong> — 例:「下北沢で週末活動できるベース募集」。一覧で目に留まりやすくなります。</li>
        <li><strong>「できないこと」より「やりたいこと」を書く</strong> — 条件を並べすぎると応募のハードルが上がります。</li>
        <li><strong>費用の目安を書いておく</strong> — スタジオ代やノルマの扱いが分かると安心して応募できます。</li>
        <li><strong>募集を出したらSNSでも共有する</strong> — 募集ページの「𝕏 ポスト」から、#バンドメンバー募集 付きで投稿できます。</li>
        <li><strong>自分の作品を載せておく</strong> — プロフィールや作品ページに音源があると、どんな音を出す人か伝わります。</li>
      </ul>

      <h2>応募する側のコツ</h2>
      <ul>
        <li>担当パート・経験年数・好きなアーティスト・参加できる頻度を最初のコメントに書く。</li>
        <li>弾いてみた動画やデモなど、演奏が分かるリンクを1つ添える。</li>
        <li>条件で気になる点は、加入前に質問しておく（費用・練習場所・目標など）。</li>
      </ul>

      <h2>トラブルを避けるために</h2>
      <ul>
        <li>はじめて会うときは、スタジオやお店など人目のある場所にしましょう。</li>
        <li>住所や電話番号などの個人情報は、信頼できると分かるまで教えないでください。</li>
        <li>加入前の高額な費用負担や、機材の購入を求められたら注意してください。</li>
        <li>OTOMOでは、気になる投稿やユーザーを<strong>通報</strong>したり、<strong>ブロック</strong>したりできます。</li>
      </ul>

      <h2>地域・パートから募集を探す</h2>
      <div className="tags">
        {AREAS.map((a) => (
          <Link key={a} className="tag" to={`/recruits/area/${AREA_SLUGS[a]}`}>{a}</Link>
        ))}
      </div>
      <div className="tags">
        {['ボーカル', 'ギター', 'ベース', 'ドラム', 'キーボード', 'DTM・トラックメイク'].map((p) => (
          <Link key={p} className="tag" to={`/recruits/part/${PART_SLUGS[p]}`}>{p}募集</Link>
        ))}
      </div>
    </article>
  )
}
