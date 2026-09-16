import { type ReactNode } from 'react';
import { INTERVALS } from '../theory/intervals';
import { MAX_FRET, MIN_FRET } from '../theory/fretboard';
import { SCALES } from '../theory/scales';
import { INVERSION_LABELS, TRIAD_STRING_SETS } from '../theory/chords';
import { THEMES } from '../state/themes';
import type { BoardView } from '../state/derived';
import type { Settings } from '../state/settings';
import { ROOT_PITCH_CLASSES, rootOptionLabel } from './rootOptions';
import { SignatureSelect } from './SignatureSelect';
import { Button } from './ui/Button';
import { Field, Fieldset } from './ui/Field';
import { Segmented } from './ui/Segmented';
import { Select } from './ui/Select';
import { Toggle } from './ui/Toggle';

interface ControlsPanelProps {
  board: BoardView;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  onResetSettings: () => void;
  audioSupported: boolean;
  persisted: boolean;
}

const FRET_PRESETS: { label: string; from: number; to: number }[] = [
  { label: 'Full neck', from: 0, to: 24 },
  { label: 'Open', from: 0, to: 5 },
  { label: 'Middle', from: 5, to: 12 },
  { label: 'Upper', from: 12, to: 24 },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-[var(--border)] px-4 py-4 last:border-0">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function ControlsPanel({
  board,
  settings,
  update,
  onResetSettings,
  audioSupported,
  persisted,
}: ControlsPanelProps) {
  const { shapeSet } = board;
  const shapeCount = shapeSet.shapes.length;
  const hasShapes = shapeCount > 0;
  const chordSelected = settings.chordDegree !== null;

  const stepShape = (direction: -1 | 1) => {
    if (!hasShapes) return;
    const current = settings.shapeIndex ?? (direction === 1 ? -1 : 0);
    const next = (current + direction + shapeCount) % shapeCount;
    update({ shapeIndex: next });
  };

  return (
    <div>
      <Section title="Key and scale">
        <Field label="Root note">
          {({ id, name }) => (
            <Select
              id={id}
              name={name}
              value={String(settings.rootPitchClass)}
              onChange={(event) => update({ rootPitchClass: Number(event.target.value) })}
            >
              {ROOT_PITCH_CLASSES.map((pitchClass) => (
                <option key={pitchClass} value={pitchClass}>
                  {rootOptionLabel(pitchClass, settings.preference)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Scale or mode">
          {({ id, name }) => (
            <Select
              id={id}
              name={name}
              value={settings.scaleId}
              onChange={(event) =>
                update({ scaleId: event.target.value, signatureId: null, shapeIndex: null })
              }
            >
              {SCALES.map((scale) => (
                <option key={scale.id} value={scale.id}>
                  {scale.altName ? `${scale.name} / ${scale.altName}` : scale.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="Signatures"
          hint="Player vocabulary — still a real scale. The menu above keeps the theory name."
          labelClassName="text-[var(--accent-signature)]"
        >
          {({ id, name, describedBy }) => (
            <SignatureSelect
              settings={settings}
              update={update}
              id={id}
              name={name}
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <Fieldset
          legend="Note spelling"
          hint="Pitches never change — only how they are written."
        >
          <Segmented
            label="Note spelling"
            value={settings.preference}
            onChange={(preference) => update({ preference })}
            options={[
              { value: 'sharp', label: 'Sharps \u266f' },
              { value: 'flat', label: 'Flats \u266d' },
            ]}
          />
        </Fieldset>
      </Section>

      <Section title="Display">
        <Fieldset legend="Note labels">
          <Segmented
            label="Note labels"
            value={settings.labelMode}
            onChange={(labelMode) => update({ labelMode })}
            options={[
              { value: 'names', label: 'Names', title: 'Show note names' },
              { value: 'degrees', label: 'Degrees', title: 'Show scale degrees' },
              { value: 'intervals', label: 'Intervals', title: 'Show interval names' },
              { value: 'none', label: 'Hidden', title: 'Hide all note labels' },
            ]}
          />
        </Fieldset>

        <Toggle
          label="Show all notes"
          description="Include the chromatic notes outside the scale, dimmed."
          checked={settings.showAllNotes}
          onChange={(showAllNotes) => update({ showAllNotes })}
          disabled={settings.rootsOnly}
          disabledReason="Turn off root notes only to use this."
        />
        <Toggle
          label="Root notes only"
          description="Strip the neck back to the root so you can see the key centres."
          checked={settings.rootsOnly}
          onChange={(rootsOnly) => update({ rootsOnly })}
        />
        <Toggle
          label="Left-handed neck"
          description="Mirror the fretboard so the nut sits on the right."
          checked={settings.leftHanded}
          onChange={(leftHanded) => update({ leftHanded })}
        />

        <Field
          label="Highlight one interval"
          hint="Highlights every place that interval appears, including outside the scale."
        >
          {({ id, name, describedBy }) => (
            <Select
              id={id}
              name={name}
              aria-describedby={describedBy}
              value={settings.highlightInterval === null ? 'none' : String(settings.highlightInterval)}
              onChange={(event) =>
                update({
                  highlightInterval:
                    event.target.value === 'none' ? null : Number(event.target.value),
                })
              }
            >
              <option value="none">No highlight</option>
              {INTERVALS.map((interval) => (
                <option key={interval.semitones} value={interval.semitones}>
                  {interval.short} — {interval.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </Section>

      <Section title="Fret range">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First fret">
            {({ id, name }) => (
              <input
                id={id}
                name={name}
                type="number"
                inputMode="numeric"
                min={MIN_FRET}
                max={MAX_FRET}
                value={settings.fretFrom}
                onChange={(event) => update({ fretFrom: Number(event.target.value) })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-sunken)] px-3 py-2 text-sm tabular-nums text-[var(--text)]"
              />
            )}
          </Field>
          <Field label="Last fret">
            {({ id, name }) => (
              <input
                id={id}
                name={name}
                type="number"
                inputMode="numeric"
                min={MIN_FRET}
                max={MAX_FRET}
                value={settings.fretTo}
                onChange={(event) => update({ fretTo: Number(event.target.value) })}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-sunken)] px-3 py-2 text-sm tabular-nums text-[var(--text)]"
              />
            )}
          </Field>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="w-10 shrink-0">From</span>
            <input
              type="range"
              id="fret-from-slider"
              name="fret-from-slider"
              min={MIN_FRET}
              max={MAX_FRET}
              value={settings.fretFrom}
              aria-label="First fret slider"
              onChange={(event) => update({ fretFrom: Number(event.target.value) })}
              className="h-1.5 w-full accent-[var(--accent)]"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="w-10 shrink-0">To</span>
            <input
              type="range"
              id="fret-to-slider"
              name="fret-to-slider"
              min={MIN_FRET}
              max={MAX_FRET}
              value={settings.fretTo}
              aria-label="Last fret slider"
              onChange={(event) => update({ fretTo: Number(event.target.value) })}
              className="h-1.5 w-full accent-[var(--accent)]"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FRET_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              size="sm"
              variant="outline"
              active={settings.fretFrom === preset.from && settings.fretTo === preset.to}
              onClick={() => update({ fretFrom: preset.from, fretTo: preset.to })}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {board.rangeMessage ? (
          <p
            role="status"
            className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--text)]"
          >
            {board.rangeMessage} Showing frets {board.range.from}–{board.range.to}.
          </p>
        ) : null}
      </Section>

      <Section title="Shapes and patterns">
        <Fieldset
          legend="Shape family"
          hint="Pentatonic boxes put two notes on each string. 3NPS puts three notes on each string and walks seven connected positions up the neck. Click a family to light Pattern 1 / Box 1 immediately."
        >
          <Segmented
            label="Shape family"
            value={settings.shapeKind}
            onChange={(shapeKind) => update({ shapeKind, shapeIndex: 0 })}
            options={[
              { value: 'pentatonic-box', label: 'Pentatonic boxes' },
              { value: 'three-notes-per-string', label: '3 notes per string' },
            ]}
          />
        </Fieldset>

        {shapeSet.derivedFromNote ? (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-xs leading-relaxed text-[var(--text-muted)]">
            {shapeSet.derivedFromNote}
          </p>
        ) : null}

        {hasShapes ? (
          <>
            <Field label="Selected shape">
              {({ id, name }) => (
                <Select
                  id={id}
                  name={name}
                  value={settings.shapeIndex === null ? 'all' : String(settings.shapeIndex)}
                  onChange={(event) =>
                    update({
                      shapeIndex: event.target.value === 'all' ? null : Number(event.target.value),
                    })
                  }
                >
                  <option value="all">Whole fretboard</option>
                  {shapeSet.shapes.map((shape, index) => (
                    <option key={shape.id} value={index}>
                      {shape.name} — starts on degree {shape.lowestDegreeLabel}, frets{' '}
                      {shape.lowestFret}–{shape.highestFret}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => stepShape(-1)} className="flex-1">
                ‹ Previous
              </Button>
              <Button size="sm" variant="outline" onClick={() => stepShape(1)} className="flex-1">
                Next ›
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={settings.shapeIndex === null}
                onClick={() => update({ shapeIndex: null })}
              >
                Clear
              </Button>
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-xs leading-relaxed text-[var(--text-muted)]">
            {shapeSet.unavailableReason}
          </p>
        )}
      </Section>

      <Section title="Harmony">
        <Fieldset
          legend="Diatonic degree"
          hint="Select a degree to light up its triad on the neck."
        >
          <div className="grid grid-cols-4 gap-1.5">
            {board.harmony.chords.map((chord) => (
              <Button
                key={chord.degreeNumber}
                size="sm"
                variant="outline"
                active={settings.chordDegree === chord.degreeNumber}
                title={`${chord.name} — ${chord.quality}`}
                onClick={() =>
                  update({
                    chordDegree:
                      settings.chordDegree === chord.degreeNumber ? null : chord.degreeNumber,
                    highlightInterval: null,
                  })
                }
              >
                {chord.romanNumeral}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              disabled={!chordSelected}
              onClick={() => update({ chordDegree: null, inversionView: false })}
            >
              Clear
            </Button>
          </div>
        </Fieldset>

        {chordSelected ? (
          <>
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
            <Field label="String set">
              {({ id, name }) => (
                <Select
                  id={id}
                  name={name}
                  value={settings.stringSetId}
                  onChange={(event) => update({ stringSetId: event.target.value })}
                >
                  {TRIAD_STRING_SETS.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {settings.inversionView ? (
              <Fieldset legend="Inversion">
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
              </Fieldset>
            ) : null}
          </>
        ) : (
          <>
            <Toggle
              label="Seventh chords"
              description="Add the seventh to the highlighted chord tones."
              checked={settings.showSevenths}
              onChange={(showSevenths) => update({ showSevenths })}
              disabled
              disabledReason="Select a diatonic degree first."
            />
            <Toggle
              label="Triad inversion view"
              description="Show only the close three-note shapes for one inversion."
              checked={settings.inversionView}
              onChange={(inversionView) => update({ inversionView })}
              disabled
              disabledReason="Select a diatonic degree first."
            />
          </>
        )}
      </Section>

      <Section title="Theme">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {THEMES.map((theme) => {
            const selected = settings.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ themeId: theme.id })}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors duration-150 ${
                  selected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span aria-hidden="true" className="mt-0.5 flex shrink-0 gap-0.5">
                  {theme.swatch.map((color) => (
                    <span
                      key={color}
                      className="block h-4 w-2.5 rounded-sm border border-black/40"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[var(--text)]">{theme.name}</span>
                  <span className="block text-[11px] leading-snug text-[var(--text-dim)]">
                    {theme.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Sound and settings">
        <Toggle
          label="Note sound"
          description="Tapping a note plays it with a built-in Web Audio synth. Nothing is downloaded."
          checked={settings.soundEnabled}
          onChange={(soundEnabled) => update({ soundEnabled })}
          disabled={!audioSupported}
          disabledReason="This browser does not expose the Web Audio API, so sound is unavailable."
        />
        {!persisted ? (
          <p
            role="status"
            className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--text)]"
          >
            Settings cannot be saved in this browser, so they will reset when you reload. Everything
            else keeps working.
          </p>
        ) : (
          <p className="text-xs text-[var(--text-dim)]">
            Your selections are saved in this browser and restored next time.
          </p>
        )}
        <Button size="sm" variant="outline" onClick={onResetSettings}>
          Reset everything to defaults
        </Button>
      </Section>
    </div>
  );
}
