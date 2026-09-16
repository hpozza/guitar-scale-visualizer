import type { BoardView } from '../state/derived';
import type { Settings } from '../state/settings';
import { Button } from './ui/Button';
import { DataRow, Panel } from './ui/Panel';

interface ShapePanelProps {
  board: BoardView;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  onPlayShape: () => void;
  audioSupported: boolean;
}

export function ShapePanel({
  board,
  settings,
  update,
  onPlayShape,
  audioSupported,
}: ShapePanelProps) {
  const { shapeSet, activeShape } = board;
  const shapeCount = shapeSet.shapes.length;

  const step = (direction: -1 | 1) => {
    if (!shapeCount) return;
    const current = settings.shapeIndex ?? (direction === 1 ? -1 : 0);
    update({ shapeIndex: (current + direction + shapeCount) % shapeCount });
  };

  const overlapCount = activeShape
    ? board.rows.flat().filter((item) => item.isShapeOverlap).length
    : 0;

  return (
    <Panel
      title={shapeSet.label}
      action={
        shapeCount ? (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => step(-1)} aria-label="Previous shape">
              ‹
            </Button>
            <Button size="sm" variant="ghost" onClick={() => step(1)} aria-label="Next shape">
              ›
            </Button>
          </div>
        ) : null
      }
    >
      {shapeSet.derivedFromNote ? (
        <p className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-xs leading-relaxed text-[var(--text-muted)]">
          {shapeSet.derivedFromNote}
        </p>
      ) : null}
      {shapeCount === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-4 text-sm leading-relaxed text-[var(--text-muted)]">
          {shapeSet.unavailableReason}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              active={settings.shapeIndex === null}
              onClick={() => update({ shapeIndex: null })}
            >
              Whole neck
            </Button>
            {shapeSet.shapes.map((shape, index) => (
              <Button
                key={shape.id}
                size="sm"
                variant="outline"
                active={settings.shapeIndex === index}
                title={`${shape.name}: frets ${shape.lowestFret} to ${shape.highestFret}`}
                onClick={() => update({ shapeIndex: index })}
              >
                {shape.name}
              </Button>
            ))}
          </div>

          {activeShape ? (
            <>
              <dl>
                <DataRow label="Shape">
                  <span className="font-semibold">{activeShape.name}</span> of {shapeCount}
                </DataRow>
                <DataRow label="Fret span">
                  <span className="tabular-nums">
                    {activeShape.lowestFret}–{activeShape.highestFret}
                  </span>
                  <span className="ml-1 text-xs text-[var(--text-muted)]">
                    ({activeShape.notes.length} notes)
                  </span>
                </DataRow>
                <DataRow label="Lowest note">
                  Scale degree {activeShape.lowestDegreeLabel} on the low{' '}
                  {board.tuning.id === 'standard' ? 'E' : ''} string
                </DataRow>
                <DataRow label="Shared notes">
                  <span className="tabular-nums">{overlapCount}</span> notes overlap the
                  neighbouring shapes, ringed with a dashed outline
                </DataRow>
              </dl>

              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                {settings.shapeKind === 'three-notes-per-string'
                  ? 'Three notes on every string, seven positions. Each pattern starts on the next scale degree on the low E string and connects to the next one where they overlap.'
                  : `This box is movable. Its fingering never changes — it slides along the neck so that degree ${activeShape.lowestDegreeLabel} of ${board.scale.rootName} ${board.scale.definition.name} lands under your first finger.`}
              </p>

              {audioSupported && settings.soundEnabled ? (
                <Button size="sm" variant="outline" onClick={onPlayShape}>
                  Play this shape ascending
                </Button>
              ) : null}
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-4 text-sm leading-relaxed text-[var(--text-muted)]">
              The whole neck is showing. Pick a shape above, or use the previous and next buttons, to
              study one position at a time — everything outside it dims and the notes shared with the
              neighbouring shapes get a dashed ring.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
