export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" fill="#1A1917" />
      <rect x="6" y="14" width="20" height="4" fill="#E8B923" />
    </svg>
  );
}
