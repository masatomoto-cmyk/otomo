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
