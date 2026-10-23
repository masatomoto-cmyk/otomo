import { SOCIALS } from '../lib/social'

// 各サービスのロゴを単色で描いたアイコン（色は currentColor）
const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z"
      />
    </svg>
  ),
}

export function SocialLinks({ profile }) {
  const links = SOCIALS.filter((s) => profile?.[s.key])
  if (links.length === 0) return null
  return (
    <div className="social-links">
      {links.map((s) => (
        <a
          key={s.key}
          href={profile[s.key]}
          target="_blank"
          rel="noopener noreferrer"
          className={`social social-${s.key}`}
          aria-label={`${profile.display_name} さんの ${s.label}`}
          title={s.label}
        >
          {ICONS[s.key]}
        </a>
      ))}
    </div>
  )
}
