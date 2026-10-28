export function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="6" width="48" height="52" rx="6" fill="#F7F1E6" />
      <path d="M8 18h48" stroke="#231F20" strokeWidth="2" />
      <rect x="16" y="26" width="22" height="4" rx="1" fill="#C4841D" />
      <rect x="16" y="34" width="32" height="3" rx="1" fill="#231F20" opacity="0.8" />
      <rect x="16" y="41" width="26" height="3" rx="1" fill="#231F20" opacity="0.45" />
      <circle cx="46" cy="48" r="7" fill="#F4B728" />
    </svg>
  );
}
