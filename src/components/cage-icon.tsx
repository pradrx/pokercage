export function CageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Ring at top */}
      <circle cx="12" cy="1.5" r="1" />

      {/* Cage bars — curve over dome then straight down to base */}
      <path d="M12 2.5 C6 4.5 4.5 8 4.5 12 V20.5" />
      <path d="M12 2.5 C9.5 5 8 8.5 8 12 V20.5" />
      <line x1="12" y1="2.5" x2="12" y2="20.5" />
      <path d="M12 2.5 C14.5 5 16 8.5 16 12 V20.5" />
      <path d="M12 2.5 C18 4.5 19.5 8 19.5 12 V20.5" />

      {/* Horizontal cross bars */}
      <line x1="4.5" y1="14.5" x2="19.5" y2="14.5" />
      <line x1="4.5" y1="17.5" x2="19.5" y2="17.5" />

      {/* Solid base tray */}
      <rect x="3" y="20.5" width="18" height="2.5" rx="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
