import { useState } from 'react'
import { NOTE_LENGTHS, noteMilliseconds } from '../../lib/music'

const MIN_BPM = 20
const MAX_BPM = 400

function initialBpm() {
  const fromUrl = Number(new URLSearchParams(window.location.search).get('bpm'))
  return fromUrl >= MIN_BPM && fromUrl <= MAX_BPM ? String(fromUrl) : '120'
}

function formatMs(ms) {
  return `${ms.toFixed(1)} ms`
}

function DelayTimeTool() {
  const [bpmText, setBpmText] = useState(initialBpm)
  const bpm = Number(bpmText)
  const valid = bpm >= MIN_BPM && bpm <= MAX_BPM

  return (
    <div>
      <label className="tool-field">
        <span>BPM</span>
        <input
          type="number"
          inputMode="decimal"
          min={MIN_BPM}
          max={MAX_BPM}
          step="0.1"
          value={bpmText}
          onChange={(event) => setBpmText(event.target.value)}
        />
      </label>

      {valid ? (
        <div className="tool-table-wrap">
          <table className="tool-table">
            <thead>
              <tr><th scope="col">音符</th><th scope="col">通常</th><th scope="col">付点</th><th scope="col">3連</th><th scope="col">通常（Hz）</th></tr>
            </thead>
            <tbody>
              {NOTE_LENGTHS.map((note) => {
                const ms = noteMilliseconds(bpm, note.beats)
                return (
                  <tr key={note.fraction}>
                    <th scope="row">{note.label}<span className="muted small">（{note.fraction}）</span></th>
                    <td>{formatMs(ms.straight)}</td>
                    <td>{formatMs(ms.dotted)}</td>
                    <td>{formatMs(ms.triplet)}</td>
                    <td>{(1000 / ms.straight).toFixed(2)} Hz</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="error">BPMは{MIN_BPM}〜{MAX_BPM}の数字で入力してください。</p>
      )}
    </div>
  )
}

export default DelayTimeTool
