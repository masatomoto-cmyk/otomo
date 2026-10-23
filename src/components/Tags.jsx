export function Tags({ items, tone }) {
  if (!items?.length) return null
  return (
    <div className="tags">
      {items.map((t) => (
        <span key={t} className={`tag ${tone ?? ''}`}>
          {t}
        </span>
      ))}
    </div>
  )
}

// 複数選択のトグルボタン群
export function TagPicker({ options, value, onChange }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  return (
    <div className="tags">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          className={`tag selectable ${value.includes(opt) ? 'on' : ''}`}
          aria-pressed={value.includes(opt)}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
