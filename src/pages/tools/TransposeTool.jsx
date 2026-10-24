import { useState } from 'react'
import { KEY_COUNT, transposeText } from '../../lib/music'

const SAMPLE = 'Aメロ | C G/B | Am Em | F C/E | Dm7 G7 |'

function TransposeTool() {
  const [source, setSource] = useState(SAMPLE)
  const [semitones, setSemitones] = useState(0)
  const [useFlats, setUseFlats] = useState(false)

  const result = transposeText(source, semitones, useFlats)
  // -5〜+6 で表示する（「7上げ」は短い「5下げ」と同じなのでそちらで見せる）
  const shown = ((semitones % KEY_COUNT) + KEY_COUNT + 5) % KEY_COUNT - 5

  return (
    <div>
      <label className="tool-field block">
        <span>元のコード進行</span>
        <textarea rows={4} value={source} onChange={(event) => setSource(event.target.value)} />
      </label>

      <div className="tool-actions">
        <button type="button" className="btn" onClick={() => setSemitones((value) => value - 1)}>半音下げる</button>
        <span className="tool-result tool-result--inline" aria-live="polite">
          {shown === 0 ? '原曲キー' : `${shown > 0 ? '+' : ''}${shown}`}
        </span>
        <button type="button" className="btn" onClick={() => setSemitones((value) => value + 1)}>半音上げる</button>
        <button type="button" className="btn ghost" onClick={() => setSemitones(0)}>元に戻す</button>
      </div>

      <fieldset className="tool-choice">
        <legend>黒鍵の音の表し方</legend>
        <label><input type="radio" checked={!useFlats} onChange={() => setUseFlats(false)} /> ♯（シャープ）</label>
        <label><input type="radio" checked={useFlats} onChange={() => setUseFlats(true)} /> ♭（フラット）</label>
      </fieldset>

      <p className="tool-label">移調したコード進行</p>
      <pre className="tool-output">{result}</pre>
    </div>
  )
}

export default TransposeTool
