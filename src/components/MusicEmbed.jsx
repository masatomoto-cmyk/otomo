import { toEmbed } from '../lib/embed'

export function MusicEmbed({ url }) {
  if (!url) return null
  const embed = toEmbed(url)
  if (!embed) {
    return (
      <a className="music-link" href={url} target="_blank" rel="noopener noreferrer">
        🎵 {url}
      </a>
    )
  }
  return (
    <div className={`embed embed-${embed.kind}`}>
      <iframe
        src={embed.src}
        height={embed.height}
        title="音楽プレイヤー"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
