import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  /** Right-hand slot for controls that belong to the panel header. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: 'section' | 'aside' | 'div';
  ariaLabel?: string;
}

export function Panel({
  title,
  action,
  children,
  className = '',
  as: Tag = 'section',
  ariaLabel,
}: PanelProps) {
  return (
    <Tag
      aria-label={ariaLabel ?? title}
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-[2px] ${className}`}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </Tag>
  );
}

interface DataRowProps {
  label: string;
  children: ReactNode;
}

export function DataRow({ label, children }: DataRowProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--border)]/60 py-2 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-dim)]">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm text-[var(--text)]">{children}</dd>
    </div>
  );
}
