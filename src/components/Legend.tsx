import { ROLE_COLOR_VARIABLES, type BoardView } from '../state/derived';
import { INTERVAL_ROLE_LABELS } from '../theory/intervals';
import type { Settings } from '../state/settings';

interface LegendProps {
  board: BoardView;
  settings: Settings;
  onHighlightInterval: (semitones: number | null) => void;
}

const MARKERS = [
  {
    label: 'Root',
    detail: 'Rounded square, brightest fill and a glow.',
    swatch: (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-[7px] border-2 text-[10px] font-extrabold"
        style={{
          background: 'var(--note-root)',
          borderColor: 'var(--note-root)',
          color: 'var(--on-note)',
        }}
      >
        R
      </span>
    ),
  },
  {
    label: 'Scale tone',
    detail: 'Circle filled with its interval colour.',
    swatch: (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold"
        style={{
          background: 'var(--note-fifth)',
          borderColor: 'var(--note-fifth)',
          color: 'var(--on-note)',
        }}
      >
        5
      </span>
    ),
  },
  {
    label: 'Dimmed',
    detail: 'Outside the scale, the selected shape or the selected chord.',
    swatch: (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold text-[var(--text-muted)]"
        style={{
          background: 'color-mix(in srgb, var(--note-chromatic) 16%, transparent)',
          borderColor: 'color-mix(in srgb, var(--note-chromatic) 55%, transparent)',
        }}
      >
        b7
      </span>
    ),
  },
  {
    label: 'Shape overlap',
    detail: 'Dashed outer ring: this note is shared with the neighbouring shape.',
    swatch: (
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span
          className="h-4 w-4 rounded-full"
          style={{ background: 'var(--note-third)' }}
        />
        <span
          className="absolute inset-0 rounded-full border border-dashed"
          style={{ borderColor: 'var(--accent)' }}
        />
      </span>
    ),
  },
  {
    label: 'Chord root',
    detail: 'Solid outer ring.',
    swatch: <ChordRingSwatch className="border-solid" />,
  },
  {
    label: 'Chord third',
    detail: 'Dotted outer ring.',
    swatch: <ChordRingSwatch className="border-dotted" />,
  },
  {
    label: 'Chord fifth',
    detail: 'Dashed outer ring.',
    swatch: <ChordRingSwatch className="border-dashed" />,
  },
  {
    label: 'Chord seventh',
    detail: 'Double outer ring, shown when seventh chords are on.',
    swatch: <ChordRingSwatch className="border-double" />,
  },
  {
    label: 'Voicing order',
    detail: 'Numbered badge 1-3 from the bass note up, in the inversion view.',
    swatch: (
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span className="h-4 w-4 rounded-full" style={{ background: 'var(--note-fifth)' }} />
        <span className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[8px] font-bold text-[var(--text)]">
          1
        </span>
      </span>
    ),
  },
];

function ChordRingSwatch({ className }: { className: string }) {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <span className="h-3.5 w-3.5 rounded-full" style={{ background: 'var(--note-second)' }} />
      <span
        className={`absolute inset-0 rounded-full border-2 ${className}`}
        style={{ borderColor: 'var(--text)', opacity: 0.8 }}
      />
    </span>
  );
}

export function Legend({ board, settings, onHighlightInterval }: LegendProps) {
  const { scale } = board;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Interval colours — select one to highlight it everywhere
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {scale.tones.map((tone) => {
            const selected = settings.highlightInterval === tone.semitones;
            return (
              <button
                key={tone.semitones}
                type="button"
                aria-pressed={selected}
                onClick={() => onHighlightInterval(selected ? null : tone.semitones)}
                className={`group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors duration-150 ${
                  selected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center text-[9px] font-bold ${
                    tone.semitones === 0 ? 'rounded-[6px] border-2' : 'rounded-full border'
                  }`}
                  style={{
                    background: ROLE_COLOR_VARIABLES[tone.interval.role],
                    borderColor: ROLE_COLOR_VARIABLES[tone.interval.role],
                    color: 'var(--on-note)',
                  }}
                >
                  {tone.degreeLabel}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[var(--text)]">
                    {tone.name}{' '}
                    <span className="font-normal text-[var(--text-dim)]">{tone.interval.short}</span>
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.08em] text-[var(--text-dim)]">
                    {INTERVAL_ROLE_LABELS[tone.interval.role]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {settings.highlightInterval !== null ? (
          <button
            type="button"
            onClick={() => onHighlightInterval(null)}
            className="mt-2 text-xs font-medium text-[var(--accent)] underline decoration-dotted underline-offset-2"
          >
            Clear interval highlight
          </button>
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Marker shapes and symbols
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {MARKERS.map((marker) => (
            <li key={marker.label} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0">{marker.swatch}</span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[var(--text)]">{marker.label}</span>
                <span className="block text-[11px] leading-snug text-[var(--text-dim)]">
                  {marker.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
