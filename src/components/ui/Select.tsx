import type { SelectHTMLAttributes } from 'react';

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath fill='%23888f9c' d='M1 1.5 6 6.5l5-5'/%3E%3C/svg%3E\")";

type SelectTone = 'default' | 'signature';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  tone?: SelectTone;
}

export function Select({ className = '', tone = 'default', ...props }: SelectProps) {
  const signature = tone === 'signature';
  const active = signature && props.value !== '' && props.value != null;
  const borderClass = signature
    ? active
      ? 'border-[var(--accent-signature)]'
      : 'border-[color-mix(in_srgb,var(--accent-signature)_45%,var(--border-strong))]'
    : 'border-[var(--border-strong)]';
  const hoverClass = signature
    ? 'hover:border-[var(--accent-signature)] focus-visible:border-[var(--accent-signature)]'
    : 'hover:border-[var(--accent)] focus-visible:border-[var(--accent)]';
  const fillClass = active
    ? 'bg-[color-mix(in_srgb,var(--accent-signature)_12%,var(--surface-sunken))]'
    : 'bg-[var(--surface-sunken)]';

  return (
    <select
      {...props}
      data-tone={tone}
      className={`w-full cursor-pointer appearance-none rounded-lg border py-2 pl-3 pr-9 text-sm font-medium text-[var(--text)] transition-colors duration-150 ${borderClass} ${fillClass} ${hoverClass} ${className}`}
      style={{
        backgroundImage: CHEVRON,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.7rem center',
        backgroundSize: '0.7rem',
      }}
    />
  );
}
