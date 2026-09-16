import { SCALES } from '../theory/scales';
import { THEMES } from '../state/themes';
import type { Settings } from '../state/settings';
import { ROOT_PITCH_CLASSES, rootOptionLabel } from './rootOptions';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Segmented } from './ui/Segmented';

interface ToolbarProps {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  compact: boolean;
  audioSupported: boolean;
  /** Whether the side panel or drawer is currently showing. */
  controlsExpanded: boolean;
  onOpenControls: () => void;
}

export function Toolbar({
  settings,
  update,
  compact,
  audioSupported,
  controlsExpanded,
  onOpenControls,
}: ToolbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--surface-raised)]"
          >
            <span
              className="block h-3.5 w-3.5 rounded-[4px]"
              style={{
                background: 'var(--note-root)',
                boxShadow: '0 0 8px color-mix(in srgb, var(--note-root) 65%, transparent)',
              }}
            />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-bold tracking-tight text-[var(--text)]">Neon Fretboard</h1>
            <p className="hidden text-[10px] uppercase tracking-[0.14em] text-[var(--text-dim)] sm:block">
              Scales · Modes · Shapes · Harmony
            </p>
          </div>
        </div>

        {!compact ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                Root
              </span>
              <Select
                aria-label="Root note"
                className="w-[7.5rem]"
                value={String(settings.rootPitchClass)}
                onChange={(event) => update({ rootPitchClass: Number(event.target.value) })}
              >
                {ROOT_PITCH_CLASSES.map((pitchClass) => (
                  <option key={pitchClass} value={pitchClass}>
                    {rootOptionLabel(pitchClass, settings.preference)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                Scale
              </span>
              <Select
                aria-label="Scale or mode"
                className="w-[13rem]"
                value={settings.scaleId}
                onChange={(event) => update({ scaleId: event.target.value, shapeIndex: null })}
              >
                {SCALES.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.altName ? `${scale.name} / ${scale.altName}` : scale.name}
                  </option>
                ))}
              </Select>
            </label>

            <div className="w-[8.5rem]">
              <Segmented
                label="Accidental spelling"
                dense
                value={settings.preference}
                onChange={(preference) => update({ preference })}
                options={[
                  { value: 'sharp', label: '\u266f Sharps', title: 'Prefer sharp note names' },
                  { value: 'flat', label: '\u266d Flats', title: 'Prefer flat note names' },
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-2">
          {!compact ? (
            <label className="flex items-center gap-2">
              <span className="sr-only">Theme</span>
              <Select
                aria-label="Theme"
                className="w-[11rem]"
                value={settings.themeId}
                onChange={(event) => update({ themeId: event.target.value })}
              >
                {THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            active={settings.soundEnabled}
            disabled={!audioSupported}
            title={
              audioSupported
                ? 'Play a note when you tap it, using a local Web Audio synth'
                : 'This browser does not expose the Web Audio API'
            }
            onClick={() => update({ soundEnabled: !settings.soundEnabled })}
          >
            {settings.soundEnabled ? 'Sound on' : 'Sound off'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            active={settings.focusMode}
            title="Hide the written theory and leave the fretboard, selectors and legend"
            onClick={() => update({ focusMode: !settings.focusMode })}
          >
            Focus
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenControls}
            aria-expanded={controlsExpanded}
            title="Show or hide the control panel"
          >
            Controls
          </Button>
        </div>
      </div>
    </header>
  );
}
