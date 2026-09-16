import { SCALES } from '../theory/scales';
import type { Settings } from '../state/settings';
import { ROOT_PITCH_CLASSES, rootOptionLabel } from './rootOptions';
import { Select } from './ui/Select';
import { Segmented } from './ui/Segmented';

interface MobileControlBarProps {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  onOpenControls: () => void;
}

export function MobileControlBar({ settings, update, onOpenControls }: MobileControlBarProps) {
  return (
    <div className="sticky bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg)]/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
            Root
          </span>
          <Select
            className="h-11"
            aria-label="Root note"
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

        <label className="min-w-0 flex-[1.6]">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
            Scale
          </span>
          <Select
            className="h-11"
            aria-label="Scale or mode"
            value={settings.scaleId}
            onChange={(event) => update({ scaleId: event.target.value, shapeIndex: null })}
          >
            {SCALES.map((scale) => (
              <option key={scale.id} value={scale.id}>
                {scale.name}
              </option>
            ))}
          </Select>
        </label>

        <div className="w-[7.5rem] shrink-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
            Accidentals
          </span>
          <Segmented
            label="Accidental spelling"
            dense
            value={settings.preference}
            onChange={(preference) => update({ preference })}
            options={[
              { value: 'sharp', label: '\u266f' },
              { value: 'flat', label: '\u266d' },
            ]}
          />
        </div>

        <button
          type="button"
          onClick={onOpenControls}
          className="h-11 shrink-0 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 text-sm font-semibold text-[var(--text)]"
        >
          Controls
        </button>
      </div>
    </div>
  );
}
