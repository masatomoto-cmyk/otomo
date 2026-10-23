export const PARTS = ['ボーカル', 'ギター', 'ベース', 'ドラム', 'キーボード', 'DTM・トラックメイク', 'DJ', 'ラップ', '管楽器', '弦楽器', 'エンジニア', 'その他']
export const GENRES = ['ロック', 'ポップス', 'ジャズ', 'ヒップホップ', 'R&B', 'エレクトロ', 'メタル', 'パンク', 'アニソン・ボカロ', 'クラシック', 'アコースティック', 'その他']
export const AREAS = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州・沖縄', 'オンライン']

// いいねの代わりのリアクション。数は公開せず、投稿者本人にだけ届く
export const REACTIONS = {
  listened: { emoji: '🎧', label: '聴いたよ' },
  moved: { emoji: '✨', label: '刺さった' },
  collab: { emoji: '🤝', label: '一緒にやりたい' },
  relate: { emoji: '🙌', label: 'わかる' },
  interested: { emoji: '👀', label: '気になる' },
}

export const REACTIONS_BY_TYPE = {
  post: ['relate', 'listened'],
  track: ['listened', 'moved', 'collab'],
  recruitment: ['interested'],
}

export const REPORT_REASONS = {
  spam: 'スパム・宣伝目的',
  harassment: '嫌がらせ・誹謗中傷',
  inappropriate: '不適切な内容',
  impersonation: 'なりすまし',
  other: 'その他',
}

// 検索から来てもらうための地域別・パート別ページの URL（/recruits/area/kanto など）
export const AREA_SLUGS = {
  北海道: 'hokkaido', 東北: 'tohoku', 関東: 'kanto', 中部: 'chubu', 近畿: 'kinki',
  中国: 'chugoku', 四国: 'shikoku', '九州・沖縄': 'kyushu-okinawa', オンライン: 'online',
}
export const PART_SLUGS = {
  ボーカル: 'vocal', ギター: 'guitar', ベース: 'bass', ドラム: 'drums', キーボード: 'keyboard',
  'DTM・トラックメイク': 'dtm', DJ: 'dj', ラップ: 'rap', 管楽器: 'horns', 弦楽器: 'strings', エンジニア: 'engineer', その他: 'other',
}
// 地域ページの説明に入れる主な都府県（検索でよく使われる地名）
export const AREA_PLACES = {
  北海道: '札幌・旭川・函館', 東北: '仙台・盛岡・郡山', 関東: '東京・神奈川・埼玉・千葉・茨城・栃木・群馬',
  中部: '名古屋・静岡・新潟・金沢・長野', 近畿: '大阪・京都・神戸・奈良', 中国: '広島・岡山・山口・松江',
  四国: '高松・松山・高知・徳島', '九州・沖縄': '福岡・熊本・鹿児島・那覇', オンライン: '宅録・リモートセッション・ネット上のコラボ',
}
export const fromSlug = (map, slug) => Object.keys(map).find((k) => map[k] === slug) ?? ''
