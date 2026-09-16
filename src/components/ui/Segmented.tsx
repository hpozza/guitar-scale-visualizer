import { useId } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Longer description used for the accessible name and native tooltip. */
  title?: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  /** Renders a tighter control for the mobile bar. */
  dense?: boolean;
}

/**
 * Button-based radio group. Hidden native radios were getting clipped by
 * `sr-only` and swallowing clicks, so the accidental toggle looked dead.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  dense = false,
}: SegmentedProps<T>) {
  const groupId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-labelledby={groupId}
      className="flex w-full gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] p-1"
    >
      <span id={groupId} className="sr-only">
        {label}
      </span>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.title ?? option.label}
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-md text-center font-medium transition-colors duration-150 ${
              dense ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-[13px]'
            } ${
              selected
                ? 'bg-[var(--surface-raised)] text-[var(--text)] shadow-[inset_0_0_0_1px_var(--border-strong)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
