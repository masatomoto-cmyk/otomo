import { useState } from 'react'
import { KEY_COUNT, MAX_CAPO, capoOptions, noteIndex, noteLabel, soundingKey } from '../../lib/music'

const KEYS = Array.from({ length: KEY_COUNT }, (_, index) => index)
const SHAPES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const FRETS = Array.from({ length: 12 }, (_, index) => index)

function CapoTool() {
  const [keyIndex, setKeyIndex] = useState(10)
  const [mode, setMode] = useState('major')
  const [shape, setShape] = useState('G')
  const [capo, setCapo] = useState(3)

  const options = capoOptions(keyIndex, mode)
  const suffix = mode === 'minor' ? 'm' : ''

  return (
    <div>
      <h2 className="tool-heading">原曲キーを押さえやすいフォームで弾く</h2>
      <div className="tool-row">
        <label className="tool-field">
          <span>原曲のキー</span>
          <select value={keyIndex} onChange={(event) => setKeyIndex(Number(event.target.value))}>
            {KEYS.map((index) => <option key={index} value={index}>{noteLabel(index)}</option>)}
          </select>
        </label>
        <label className="tool-field">
          <span>長調・短調</span>
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="major">メジャー（長調）</option>
            <option value="minor">マイナー（短調）</option>
          </select>
        </label>
      </div>

      {options.length > 0 ? (
        <ul className="tool-capo-list">
          {options.map((option) => (
            <li key={option.shape}>
              <strong>{option.shape}</strong> のフォームで
              {option.capo === 0 ? ' カポなし' : ` カポ ${option.capo} フレット`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">カポ{MAX_CAPO}フレットまでで合うフォームがありません。</p>
      )}
      <p className="muted small">原曲キー：{noteLabel(keyIndex)}{suffix}</p>

      <h2 className="tool-heading">フォームとカポから実際のキーを調べる</h2>
      <div className="tool-row">
        <label className="tool-field">
          <span>弾いているフォーム</span>
          <select value={shape} onChange={(event) => setShape(event.target.value)}>
            {SHAPES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="tool-field">
          <span>カポの位置</span>
          <select value={capo} onChange={(event) => setCapo(Number(event.target.value))}>
            {FRETS.map((fret) => <option key={fret} value={fret}>{fret === 0 ? 'なし' : `${fret} フレット`}</option>)}
          </select>
        </label>
      </div>
      <p className="tool-result" aria-live="polite">
        実際に鳴るキー：<strong>{noteLabel(soundingKey(noteIndex(shape), capo))}</strong>
      </p>
    </div>
  )
}

export default CapoTool
