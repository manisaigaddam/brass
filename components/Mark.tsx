export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#231F20" />
      <rect x="7" y="14" width="18" height="4" rx="1" fill="#F4B728" />
    </svg>
  );
}
