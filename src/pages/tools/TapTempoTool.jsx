import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { bpmFromIntervals } from '../../lib/music'

const MAX_INTERVALS = 8
const RESET_AFTER_MS = 2000

function TapTempoTool() {
  const lastTapRef = useRef(undefined)
  const [taps, setTaps] = useState({ count: 0, intervals: [] })

  const bpm = bpmFromIntervals(taps.intervals)

  function tap() {
    const now = performance.now()
    const last = lastTapRef.current
    lastTapRef.current = now
    if (last === undefined || now - last > RESET_AFTER_MS) {
      setTaps({ count: 1, intervals: [] })
      return
    }
    setTaps((current) => ({
      count: current.count + 1,
      intervals: [...current.intervals, now - last].slice(-MAX_INTERVALS),
    }))
  }

  function reset() {
    lastTapRef.current = undefined
    setTaps({ count: 0, intervals: [] })
  }

  return (
    <div className="tool-tap">
      <button
        type="button"
        className="tool-tap__button"
        onPointerDown={tap}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault()
            if (!event.repeat) tap()
          }
        }}
      >
        タップ
      </button>

      <p className="tool-result" aria-live="polite">
        {bpm ? <><strong>{bpm.toFixed(1)}</strong> BPM</> : 'リズムに合わせてタップしてください'}
      </p>
      <p className="muted small">タップ回数：{taps.count}</p>

      <div className="tool-actions">
        <button type="button" className="btn ghost" onClick={reset}>リセット</button>
        {bpm >= 20 && bpm <= 400 && (
          <Link className="btn" to={`/tools/delay-time?bpm=${Math.round(bpm)}`}>
            このBPMでディレイタイムを計算
          </Link>
        )}
      </div>
    </div>
  )
}

export default TapTempoTool
