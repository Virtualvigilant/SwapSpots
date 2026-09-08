/**
 * The organic orange shape sitting behind the hero figure.
 *
 * Drawn as an SVG rather than with border-radius so the silhouette stays
 * identical at every breakpoint — a percentage-based border-radius blob
 * distorts badly once the container aspect changes.
 */
export function HeroBlob({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 620"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="blob-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7a45" />
          <stop offset="55%" stopColor="#fb5a2a" />
          <stop offset="100%" stopColor="#e8410f" />
        </linearGradient>
        <radialGradient id="blob-sheen" cx="30%" cy="18%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* main lounge-chair silhouette */}
      <path
        fill="url(#blob-fill)"
        d="M742 92c86 26 137 122 141 224 4 101-38 197-118 244-80 46-198 43-321 40-124-3-253-6-341-63C15 480-27 372 19 281 65 190 199 116 330 82c130-34 256-16 412 10Z"
      />
      {/* soft highlight so the shape reads as a rounded object, not a flat cut-out */}
      <path
        fill="url(#blob-sheen)"
        d="M742 92c86 26 137 122 141 224 4 101-38 197-118 244-80 46-198 43-321 40-124-3-253-6-341-63C15 480-27 372 19 281 65 190 199 116 330 82c130-34 256-16 412 10Z"
      />
    </svg>
  );
}
