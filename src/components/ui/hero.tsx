/** A calm, dependency-free hero illustration for the landing page. */
export function HeroIllustration({ title }: { title: string }) {
  return (
    <div
      className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-wasl-50 via-white to-ink-100 sm:h-48"
      role="img"
      aria-label={title}
    >
      <svg viewBox="0 0 320 150" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="drop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e87878" />
            <stop offset="100%" stopColor="#a12424" />
          </linearGradient>
        </defs>
        {/* soft arcs suggesting coordination */}
        <circle cx="160" cy="150" r="118" fill="none" stroke="#f2a9a9" strokeWidth="1.5" opacity="0.55" />
        <circle cx="160" cy="150" r="92" fill="none" stroke="#f8cdcd" strokeWidth="1.5" opacity="0.7" />
        {/* droplet */}
        <path
          d="M160 34c14 20 24 32 24 44a24 24 0 0 1-48 0c0-12 10-24 24-44Z"
          fill="url(#drop)"
          opacity="0.95"
        />
        {/* orbiting dots = verified partners */}
        <circle cx="86" cy="96" r="4.5" fill="#c02f2f" opacity="0.7" />
        <circle cx="234" cy="96" r="4.5" fill="#c02f2f" opacity="0.7" />
        <circle cx="160" cy="22" r="3.5" fill="#d94b4b" opacity="0.6" />
        <path d="M96 108h128" stroke="#d9d9de" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
