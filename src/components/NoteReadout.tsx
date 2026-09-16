import { ROLE_COLOR_VARIABLES, type NoteView } from '../state/derived';
import { CHORD_ROLE_LABELS } from '../theory/chords';

interface NoteReadoutProps {
  note: NoteView | null;
  /** Shown when nothing is hovered, focused or tapped. */
  hint: string;
}

export function NoteReadout({ note, hint }: NoteReadoutProps) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[54px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2"
    >
      {note ? (
        <>
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 shrink-0 items-center justify-center text-xs font-extrabold ${
              note.note.isRoot ? 'rounded-[9px] border-2' : 'rounded-full border'
            }`}
            style={{
              background: ROLE_COLOR_VARIABLES[note.role],
              borderColor: ROLE_COLOR_VARIABLES[note.role],
              color: 'var(--on-note)',
            }}
          >
            {note.note.name}
          </span>
          <dl className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-dim)]">Note</dt>
              <dd className="font-semibold text-[var(--text)]">
                {note.note.name}
                <span className="ml-0.5 text-xs text-[var(--text-dim)]">{note.note.octave}</span>
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-dim)]">
                Interval
              </dt>
              <dd className="text-[var(--text)]">
                {note.note.interval.short}
                <span className="ml-1 text-xs text-[var(--text-muted)]">
                  {note.note.interval.name}
                </span>
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-dim)]">
                Degree
              </dt>
              <dd className="text-[var(--text)]">
                {note.degreeLabel}
                {note.note.inScale ? '' : ' (outside the scale)'}
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-dim)]">
                Position
              </dt>
              <dd className="tabular-nums text-[var(--text)]">
                String {note.stringNumber}
                {note.note.fret === 0 ? ', open' : `, fret ${note.note.fret}`}
              </dd>
            </div>
            {note.chordRole ? (
              <div className="flex items-baseline gap-1.5">
                <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-dim)]">
                  In chord
                </dt>
                <dd className="text-[var(--text)]">{CHORD_ROLE_LABELS[note.chordRole]}</dd>
              </div>
            ) : null}
          </dl>
        </>
      ) : (
        <p className="text-sm text-[var(--text-dim)]">{hint}</p>
      )}
    </div>
  );
}
