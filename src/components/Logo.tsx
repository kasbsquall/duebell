interface BellMarkProps {
  size?: number;
  className?: string;
}

// Duebell isotype: a bell whose body holds three of four "day" bars, with a stamp-red clapper.
export function BellMark({ size = 28, className }: BellMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 96 104"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="44" y="0" width="8" height="9" fill="var(--ink)" />
      <path
        d="M48 8 C24 8 14 28 14 52 L14 70 L6 82 L90 82 L82 70 L82 52 C82 28 72 8 48 8 Z"
        fill="var(--ink)"
      />
      <rect x="30" y="34" width="5" height="34" fill="var(--paper-raised)" />
      <rect x="40" y="34" width="5" height="34" fill="var(--paper-raised)" />
      <rect x="50" y="34" width="5" height="34" fill="var(--paper-raised)" />
      <rect x="60" y="34" width="5" height="34" fill="var(--paper-raised)" opacity="0.35" />
      <circle cx="48" cy="93" r="7" fill="var(--stamp)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark__lockup">
      <BellMark size={30} />
      <span className="wordmark__text">duebell</span>
    </span>
  );
}
