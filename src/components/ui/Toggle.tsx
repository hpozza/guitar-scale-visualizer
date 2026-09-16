import { useId } from 'react';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Explains why the toggle is disabled. */
  disabledReason?: string;
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  disabledReason,
}: ToggleProps) {
  const id = useId();
  return (
    <label
      title={disabled ? disabledReason : undefined}
      className={`flex items-start justify-between gap-3 rounded-lg px-1 py-1.5 ${
        disabled ? 'opacity-55' : 'cursor-pointer'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--text)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--text-dim)]">
            {disabled && disabledReason ? disabledReason : description}
          </span>
        ) : null}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          role="switch"
          id={id}
          name={id}
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          aria-hidden="true"
          className={`block h-5 w-9 rounded-full border transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)] ${
            checked
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
              : 'border-[var(--border-strong)] bg-[var(--surface-sunken)]'
          }`}
        >
          <span
            className={`mt-[2px] block h-3.5 w-3.5 rounded-full transition-[margin] duration-150 ${
              checked
                ? 'ml-[18px] bg-[var(--accent)]'
                : 'ml-[3px] bg-[var(--text-dim)]'
            }`}
          />
        </span>
      </span>
    </label>
  );
}
