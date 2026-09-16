import type { SelectHTMLAttributes } from 'react';

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath fill='%23888f9c' d='M1 1.5 6 6.5l5-5'/%3E%3C/svg%3E\")";

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full cursor-pointer appearance-none rounded-lg border border-[var(--border-strong)] bg-[var(--surface-sunken)] py-2 pl-3 pr-9 text-sm font-medium text-[var(--text)] transition-colors duration-150 hover:border-[var(--accent)] focus-visible:border-[var(--accent)] ${className}`}
      style={{
        backgroundImage: CHEVRON,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.7rem center',
        backgroundSize: '0.7rem',
      }}
    />
  );
}
