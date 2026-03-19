type BrandWordmarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'sidebar';
  className?: string;
};

const SIZE_STYLES = {
  sm: {
    container: 'gap-0',
    mark: 'h-10 w-10 shrink-0 -mr-[10px]',
    words: 'text-lg',
  },
  md: {
    container: 'gap-0',
    mark: 'h-12 w-12 shrink-0 -mr-[12px]',
    words: 'text-xl',
  },
  lg: {
    container: 'gap-0',
    mark: 'h-16 w-16 shrink-0 -mr-[14px]',
    words: 'text-3xl',
  },
  sidebar: {
    container: 'gap-0',
    mark: 'h-14 w-14 shrink-0 -mr-[12px] md:h-16 md:w-16 md:-mr-[14px]',
    words: 'text-[1.45rem] md:text-[1.7rem]',
  },
} as const;

export function BrandWordmark({ size = 'md', className = '' }: BrandWordmarkProps) {
  const styles = SIZE_STYLES[size];

  return (
    <div
      aria-label="StreetSmarts"
      className={`inline-flex items-center ${styles.container} ${className}`.trim()}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className={`${styles.mark} shrink-0`}
        fill="none"
      >
        <rect x="4" y="4" width="56" height="56" rx="18" fill="#050505" />
        <rect x="5" y="5" width="54" height="54" rx="17" stroke="#1e293b" strokeOpacity="0.9" />
        <rect x="18" y="13" width="28" height="10" rx="5" fill="#f8fafc" />
        <rect x="18" y="18" width="10" height="15" rx="5" fill="#f8fafc" />
        <rect x="18" y="27" width="28" height="10" rx="5" fill="#22d3ee" />
        <rect x="36" y="32" width="10" height="15" rx="5" fill="#22d3ee" />
        <rect x="18" y="41" width="28" height="10" rx="5" fill="#22d3ee" />
      </svg>
      <span className={`flex flex-col font-black leading-[0.82] tracking-tight ${styles.words}`}>
        <span className="text-white">reets</span>
        <span className="text-cyan-400">marts</span>
      </span>
    </div>
  );
}
