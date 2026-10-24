// 道具箱（/tools）で使う音楽の計算。画面の処理は持たない（例：BPM120の4分音符＝500ms、B♭のキーはGのフォームでカポ3）

const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']
const NATURAL_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

export const KEY_COUNT = 12

// "B♭" "Bb" "C#" → 0〜11。音名でなければ undefined
export function noteIndex(name) {
  const match = /^([A-G])([#♯b♭]?)$/.exec(name)
  if (!match) return undefined
  const shift = { '#': 1, '♯': 1, b: -1, '♭': -1 }[match[2]] || 0
  return (NATURAL_INDEX[match[1]] + shift + KEY_COUNT) % KEY_COUNT
}

export function noteName(index, useFlats) {
  const normalized = ((index % KEY_COUNT) + KEY_COUNT) % KEY_COUNT
  return (useFlats ? FLAT_NAMES : SHARP_NAMES)[normalized]
}

// 黒鍵は "C♯/D♭"、白鍵は "C" のように表示する
export function noteLabel(index) {
  const sharp = noteName(index, false)
  const flat = noteName(index, true)
  return sharp === flat ? sharp : `${sharp}/${flat}`
}

// 根音＋コードの種類の文字だけをコードとみなす。「Aメロ」「Bass」などはそのまま残る
const CHORD = /^([A-G][#♯b♭]?)((?:maj|min|dim|aug|sus|add|omit|alt|M|m|°|ø|Δ|\+|-|\d|[#♯b♭]|\(|\))*)(?:\/([A-G][#♯b♭]?))?$/

export function transposeChord(chord, semitones, useFlats) {
  const match = CHORD.exec(chord)
  if (!match) return chord
  const [, root, quality, bass] = match
  const shifted = (note) => noteName(noteIndex(note) + semitones, useFlats)
  return `${shifted(root)}${quality}${bass ? `/${shifted(bass)}` : ''}`
}

// コード譜の中のコードをすべて移調する。空白や区切り記号はそのまま
export function transposeText(text, semitones, useFlats) {
  return text.replace(/[^\s|,→]+/g, (token) => transposeChord(token, semitones, useFlats))
}

// 音符の長さ（4分音符＝1拍）。長い順
export const NOTE_LENGTHS = [
  { label: '全音符', fraction: '1/1', beats: 4 },
  { label: '2分音符', fraction: '1/2', beats: 2 },
  { label: '4分音符', fraction: '1/4', beats: 1 },
  { label: '8分音符', fraction: '1/8', beats: 0.5 },
  { label: '16分音符', fraction: '1/16', beats: 0.25 },
  { label: '32分音符', fraction: '1/32', beats: 0.125 },
]

export function noteMilliseconds(bpm, beats) {
  const base = (60000 / bpm) * beats
  return { straight: base, dotted: base * 1.5, triplet: (base * 2) / 3 }
}

export function bpmFromIntervals(intervals) {
  if (intervals.length === 0) return undefined
  const average = intervals.reduce((total, interval) => total + interval, 0) / intervals.length
  return 60000 / average
}

export function songSeconds(bpm, bars, beatsPerBar) {
  return (bars * beatsPerBar * 60) / bpm
}

export function formatDuration(totalSeconds) {
  const rounded = Math.round(totalSeconds)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// ギターで押さえやすいローコードの形。カポ位置の提案に使う
export const EASY_SHAPES = {
  major: ['C', 'G', 'D', 'A', 'E'],
  minor: ['Am', 'Em', 'Dm'],
}

export const MAX_CAPO = 7

// 鳴らしたいキーに対して、どの形を何フレットのカポで弾けばよいか
export function capoOptions(keyIndex, mode) {
  return EASY_SHAPES[mode]
    .map((shape) => {
      const capo = (keyIndex - noteIndex(shape.replace('m', '')) + KEY_COUNT) % KEY_COUNT
      return { shape, capo }
    })
    .filter((option) => option.capo <= MAX_CAPO)
    .sort((a, b) => a.capo - b.capo)
}

export function soundingKey(shapeIndex, capo) {
  return (shapeIndex + capo) % KEY_COUNT
}
