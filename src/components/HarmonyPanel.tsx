import { CHORD_ROLE_LABELS, INVERSION_LABELS, TRIAD_STRING_SETS } from '../theory/chords';
import type { BoardView } from '../state/derived';
import type { Settings } from '../state/settings';
import { Button } from './ui/Button';
import { DataRow, Panel } from './ui/Panel';
import { Segmented } from './ui/Segmented';
import { Select } from './ui/Select';
import { Toggle } from './ui/Toggle';

interface HarmonyPanelProps {
  board: BoardView;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  onPlayChord: () => void;
  audioSupported: boolean;
}

export function HarmonyPanel({
  board,
  settings,
  update,
  onPlayChord,
  audioSupported,
}: HarmonyPanelProps) {
  const { harmony, activeChord, voicing, voicingUnavailable } = board;

  return (
    <Panel
      title="Harmony"
      action={
        activeChord ? (
          <Button size="sm" variant="ghost" onClick={() => update({ chordDegree: null })}>
            Clear selection
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        {harmony.derivedFromNote ? (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-xs leading-relaxed text-[var(--text-muted)]">
            {harmony.derivedFromNote}
          </p>
        ) : null}

        <div className="overflow-x-auto nf-scroll">
          <table className="w-full min-w-[26rem] border-collapse text-sm">
            <caption className="sr-only">
              Diatonic chords of {board.scale.rootName} {board.scale.definition.name}
            </caption>
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-[var(--text-dim)]">
                <th scope="col" className="py-1.5 pr-2 font-semibold">
                  Degree
                </th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">
                  Chord
                </th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">
                  Quality
                </th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">
                  Notes
                </th>
                <th scope="col" className="py-1.5 font-semibold">
                  Seventh
                </th>
              </tr>
            </thead>
            <tbody>
              {harmony.chords.map((chord) => {
                const selected = settings.chordDegree === chord.degreeNumber;
                return (
                  <tr
                    key={chord.degreeNumber}
                    className={`border-t border-[var(--border)]/70 ${
                      selected ? 'bg-[var(--accent-soft)]' : ''
                    }`}
                  >
                    <th scope="row" className="py-1.5 pr-2 text-left">
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          update({
                            chordDegree: selected ? null : chord.degreeNumber,
                            highlightInterval: null,
                          })
                        }
                        className={`font-mono text-sm font-bold underline-offset-4 hover:underline ${
                          selected ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                        }`}
                      >
                        {chord.romanNumeral}
                      </button>
                    </th>
                    <td className="py-1.5 pr-2 font-semibold text-[var(--text)]">{chord.name}</td>
                    <td className="py-1.5 pr-2 text-xs text-[var(--text-muted)]">{chord.quality}</td>
                    <td className="py-1.5 pr-2 font-mono text-xs text-[var(--text-muted)]">
                      {chord.triad.map((tone) => tone.name).join(' ')}
                    </td>
                    <td className="py-1.5 text-xs text-[var(--text-muted)]">{chord.seventhName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {activeChord ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] p-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-[var(--text)]">
                {settings.showSevenths ? activeChord.seventhName : activeChord.name}
                <span className="ml-2 font-mono text-sm font-medium text-[var(--accent)]">
                  {activeChord.romanNumeral}
                </span>
              </h3>
              {audioSupported && settings.soundEnabled ? (
                <Button size="sm" variant="outline" onClick={onPlayChord}>
                  Play chord
                </Button>
              ) : null}
            </div>

            <ul className="mb-3 flex flex-wrap gap-1.5">
              {[...activeChord.triad, ...(settings.showSevenths && activeChord.seventh ? [activeChord.seventh] : [])].map(
                (tone) => (
                  <li
                    key={tone.role}
                    className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1"
                  >
                    <span className="block text-[10px] uppercase tracking-[0.1em] text-[var(--text-dim)]">
                      {CHORD_ROLE_LABELS[tone.role]}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text)]">{tone.name}</span>
                    <span className="ml-1.5 font-mono text-[11px] text-[var(--text-muted)]">
                      {tone.intervalShort}
                    </span>
                  </li>
                ),
              )}
            </ul>

            <dl>
              <DataRow label="Formula">
                <span className="font-mono text-[13px]">
                  {settings.showSevenths ? activeChord.seventhFormula : activeChord.formula}
                </span>
              </DataRow>
              <DataRow label="Scale degree">
                Built on degree {activeChord.scaleDegreeLabel} of {board.scale.rootName}{' '}
                {board.scale.definition.name}
              </DataRow>
              {settings.inversionView ? (
                <DataRow label="Voicing">
                  {voicing ? (
                    <>
                      <span className="font-semibold">{INVERSION_LABELS[voicing.inversion]}</span>
                      <span className="block text-xs text-[var(--text-muted)]">
                        {voicing.stringSet.label}, frets {voicing.lowestFret}–{voicing.highestFret},
                        bass note is the {CHORD_ROLE_LABELS[voicing.bassRole].toLowerCase()}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">{voicingUnavailable}</span>
                  )}
                </DataRow>
              ) : (
                <DataRow label="Triad shapes">
                  {board.voicings.length > 0 ? (
                    <span className="text-xs text-[var(--text-muted)]">
                      {board.voicings.length} close-position shapes on{' '}
                      {board.voicings[0].stringSet.label.toLowerCase()}, numbered 1–3 from the bass.
                      Notes carry R / 3 / 5 badges.
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">
                      No close-position shape fits this string set in the current fret window.
                    </span>
                  )}
                </DataRow>
              )}
            </dl>

            <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
              <Toggle
                label="Seventh chords"
                description="Add the seventh to the highlighted chord tones."
                checked={settings.showSevenths}
                onChange={(showSevenths) => update({ showSevenths })}
              />
              <Toggle
                label="Triad inversion view"
                description="Show only the close three-note shapes for one inversion."
                checked={settings.inversionView}
                onChange={(inversionView) => update({ inversionView })}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {settings.inversionView ? (
                  <Segmented
                    label="Inversion"
                    value={String(settings.inversion) as '0' | '1' | '2'}
                    onChange={(value) => update({ inversion: Number(value) as 0 | 1 | 2 })}
                    options={[
                      { value: '0', label: 'Root', title: INVERSION_LABELS[0] },
                      { value: '1', label: '1st', title: INVERSION_LABELS[1] },
                      { value: '2', label: '2nd', title: INVERSION_LABELS[2] },
                    ]}
                  />
                ) : null}
                <Select
                  aria-label="String set for the voicing"
                  value={settings.stringSetId}
                  onChange={(event) => update({ stringSetId: event.target.value })}
                >
                  {TRIAD_STRING_SETS.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-4 text-center text-sm text-[var(--text-muted)]">
            Select a roman numeral above to light up that triad on the neck, with the root, third and
            fifth marked by different outer rings.
          </p>
        )}
      </div>
    </Panel>
  );
}
