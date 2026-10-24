import { useState } from 'react'
import { formatDuration, songSeconds } from '../../lib/music'

let nextId = 1

function newSong(title = '', minutes = '', seconds = '') {
  nextId += 1
  return { id: nextId, title, minutes, seconds }
}

function songLength(song) {
  return (Number(song.minutes) || 0) * 60 + (Number(song.seconds) || 0)
}

function SetlistTimeTool() {
  const [slotMinutes, setSlotMinutes] = useState('30')
  const [mcMinutes, setMcMinutes] = useState('5')
  const [songs, setSongs] = useState(() => [newSong('1曲目', '4', '00'), newSong('2曲目', '3', '30')])
  const [bpm, setBpm] = useState('120')
  const [bars, setBars] = useState('80')
  const [beatsPerBar, setBeatsPerBar] = useState('4')

  const totalSeconds = songs.reduce((total, song) => total + songLength(song), 0) + (Number(mcMinutes) || 0) * 60
  const slotSeconds = (Number(slotMinutes) || 0) * 60
  const over = totalSeconds > slotSeconds

  const calcValid = Number(bpm) > 0 && Number(bars) > 0 && Number(beatsPerBar) > 0
  const calculated = calcValid ? songSeconds(Number(bpm), Number(bars), Number(beatsPerBar)) : 0

  function updateSong(id, field, value) {
    setSongs((current) => current.map((song) => (song.id === id ? { ...song, [field]: value } : song)))
  }

  function addCalculated() {
    const rounded = Math.round(calculated)
    setSongs((current) => [...current, newSong(`BPM${bpm}・${bars}小節の曲`, String(Math.floor(rounded / 60)), String(rounded % 60).padStart(2, '0'))])
  }

  return (
    <div>
      <div className="tool-row">
        <label className="tool-field">
          <span>持ち時間（分）</span>
          <input type="number" inputMode="numeric" min="0" value={slotMinutes} onChange={(event) => setSlotMinutes(event.target.value)} />
        </label>
        <label className="tool-field">
          <span>MC・転換の合計（分）</span>
          <input type="number" inputMode="numeric" min="0" value={mcMinutes} onChange={(event) => setMcMinutes(event.target.value)} />
        </label>
      </div>

      <ol className="tool-setlist">
        {songs.map((song) => (
          <li key={song.id}>
            <input aria-label="曲名" placeholder="曲名" value={song.title} onChange={(event) => updateSong(song.id, 'title', event.target.value)} />
            <input aria-label="分" type="number" inputMode="numeric" min="0" value={song.minutes} onChange={(event) => updateSong(song.id, 'minutes', event.target.value)} />
            <span>分</span>
            <input aria-label="秒" type="number" inputMode="numeric" min="0" max="59" value={song.seconds} onChange={(event) => updateSong(song.id, 'seconds', event.target.value)} />
            <span>秒</span>
            <button type="button" className="btn ghost" onClick={() => setSongs((current) => current.filter((item) => item.id !== song.id))}>削除</button>
          </li>
        ))}
      </ol>
      <button type="button" className="btn ghost" onClick={() => setSongs((current) => [...current, newSong()])}>曲を追加</button>

      <p className={`tool-result${over ? ' tool-result--over' : ''}`} aria-live="polite">
        合計 <strong>{formatDuration(totalSeconds)}</strong> ／ 持ち時間 {formatDuration(slotSeconds)}
        {over ? `（${formatDuration(totalSeconds - slotSeconds)} オーバー）` : `（残り ${formatDuration(slotSeconds - totalSeconds)}）`}
      </p>

      <h2 className="tool-heading">BPMと小節数から曲の長さを出す</h2>
      <div className="tool-row">
        <label className="tool-field"><span>BPM</span><input type="number" inputMode="decimal" min="1" value={bpm} onChange={(event) => setBpm(event.target.value)} /></label>
        <label className="tool-field"><span>小節数</span><input type="number" inputMode="numeric" min="1" value={bars} onChange={(event) => setBars(event.target.value)} /></label>
        <label className="tool-field"><span>1小節の拍数</span><input type="number" inputMode="numeric" min="1" value={beatsPerBar} onChange={(event) => setBeatsPerBar(event.target.value)} /></label>
      </div>
      {calcValid && (
        <div className="tool-actions">
          <span className="tool-result tool-result--inline">{formatDuration(calculated)}</span>
          <button type="button" className="btn" onClick={addCalculated}>セトリに追加</button>
        </div>
      )}
    </div>
  )
}

export default SetlistTimeTool
