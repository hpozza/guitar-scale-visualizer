import type { ButtonHTMLAttributes } from 'react';

type Variant = 'solid' | 'ghost' | 'outline';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  solid:
    'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border-strong)] hover:border-[var(--accent)]',
  outline:
    'bg-transparent text-[var(--text-muted)] border border-[var(--border-strong)] hover:text-[var(--text)] hover:border-[var(--accent)]',
  ghost: 'bg-transparent text-[var(--text-muted)] border border-transparent hover:text-[var(--text)]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-9 px-3 text-sm',
};

export function Button({
  variant = 'solid',
  size = 'md',
  active = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={active ? true : undefined}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${
        VARIANTS[variant]
      } ${SIZES[size]} ${
        active ? 'border-[var(--accent)] text-[var(--text)] shadow-[inset_0_0_0_1px_var(--accent)]' : ''
      } ${className}`}
      {...props}
    />
  );
}
