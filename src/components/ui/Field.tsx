import { useId, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  labelClassName?: string;
  children: (props: { id: string; name: string; describedBy: string | undefined }) => ReactNode;
}

export function Field({ label, hint, labelClassName, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${
          labelClassName ?? 'text-[var(--text-muted)]'
        }`}
      >
        {label}
      </label>
      {children({ id, name: id, describedBy: hintId })}
      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-[var(--text-dim)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface FieldsetProps {
  legend: string;
  hint?: string;
  children: ReactNode;
}

export function Fieldset({ legend, hint, children }: FieldsetProps) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {legend}
      </legend>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-[var(--text-dim)]">{hint}</p> : null}
    </fieldset>
  );
}
