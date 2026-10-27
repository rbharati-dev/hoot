export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="var(--accent)" />
      <circle cx="22" cy="30" r="11" fill="#FAF8F4" />
      <circle cx="42" cy="30" r="11" fill="#FAF8F4" />
      <circle cx="23" cy="31" r="4.5" fill="#1C1B1A" />
      <circle cx="41" cy="31" r="4.5" fill="#1C1B1A" />
      <path d="M28 42 L32 49 L36 42 Z" fill="#F2C14E" />
    </svg>
  );
}
