import { degreeSemitones, parseDegree } from '../theory/intervals';
import { formatNote, spellPitchClass } from '../theory/notes';
import { parentMajorPitchClass } from '../theory/scales';
import { ROLE_COLOR_VARIABLES, type BoardView } from '../state/derived';
import type { Settings } from '../state/settings';
import { DataRow, Panel } from './ui/Panel';

interface TheoryPanelProps {
  board: BoardView;
  settings: Settings;
}

export function TheoryPanel({ board, settings }: TheoryPanelProps) {
  const { scale, harmony } = board;
  const definition = scale.definition;

  const characteristic = definition.characteristicDegrees.map((spec) => {
    const degree = parseDegree(spec);
    const semitones = degreeSemitones(degree);
    const tone = scale.tones.find((candidate) => candidate.semitones === semitones);
    return { spec, tone };
  });

  const parentPitchClass = parentMajorPitchClass(scale);
  const parentName =
    parentPitchClass === null
      ? null
      : `${formatNote(spellPitchClass(parentPitchClass, settings.preference))} major`;

  return (
    <Panel title="Study notes">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold leading-tight text-[var(--text)]">
            {scale.rootName} {definition.name}
            {definition.altName ? (
              <span className="ml-2 text-sm font-medium text-[var(--text-muted)]">
                ({scale.rootName} {definition.altName})
              </span>
            ) : null}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
            {definition.sound}
          </p>
        </div>

        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
            Notes in this key
          </h4>
          <ol className="flex flex-wrap gap-1.5">
            {scale.tones.map((tone) => (
              <li key={tone.semitones}>
                <span className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] py-1 pr-2.5 pl-1">
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 items-center justify-center text-[9px] font-bold ${
                      tone.semitones === 0 ? 'rounded-[6px]' : 'rounded-full'
                    }`}
                    style={{
                      background: ROLE_COLOR_VARIABLES[tone.interval.role],
                      color: 'var(--on-note)',
                    }}
                  >
                    {tone.degreeLabel}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text)]">{tone.name}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <dl>
          <DataRow label="Interval formula">
            <span className="font-mono text-[13px] tracking-wide">{scale.formula}</span>
          </DataRow>
          <DataRow label="Step pattern">
            <span className="font-mono text-[13px] tracking-wide">{scale.stepPattern}</span>
          </DataRow>
          <DataRow label="Characteristic notes">
            {characteristic.map(({ spec, tone }, index) => (
              <span key={spec}>
                {index > 0 ? ', ' : ''}
                <span className="font-semibold">{tone ? tone.name : spec}</span>
                {tone ? (
                  <span className="text-[var(--text-muted)]"> ({tone.degreeLabel})</span>
                ) : null}
              </span>
            ))}
          </DataRow>
          <DataRow label="Parent major scale">
            {parentName ? (
              <>
                <span className="font-semibold">{parentName}</span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {definition.parentRelation}
                </span>
              </>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">{definition.parentRelation}</span>
            )}
          </DataRow>
          <DataRow label="Diatonic triads">
            <span className="font-mono text-[13px]">
              {harmony.chords.map((chord) => chord.name).join(' · ')}
            </span>
          </DataRow>
        </dl>

        <div className="rounded-lg border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-3 py-2.5">
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Practice this
          </h4>
          <p className="text-sm leading-relaxed text-[var(--text)]">{definition.practice}</p>
        </div>
      </div>
    </Panel>
  );
}
