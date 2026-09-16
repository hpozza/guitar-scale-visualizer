import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildFretGeometry,
  hasInlay,
  isOctaveFret,
  stringLabel,
  type FretCell,
} from '../theory/fretboard';
import { ROLE_COLOR_VARIABLES, type BoardView, type NoteView } from '../state/derived';
import type { ChordToneRole } from '../theory/chords';
import type { Settings } from '../state/settings';
import { describeNote } from './describeNote';

export interface BoardCursor {
  stringIndex: number;
  fret: number;
}

interface FretboardProps {
  board: BoardView;
  settings: Settings;
  compact: boolean;
  onInspect: (note: NoteView | null) => void;
  onActivate: (note: NoteView) => void;
}

/** Ring treatment per chord tone, so the roles read without relying on colour. */
const CHORD_RING: Record<ChordToneRole, string> = {
  root: 'border-solid',
  third: 'border-dotted',
  fifth: 'border-dashed',
  seventh: 'border-double',
};

const CHORD_GLYPH: Record<ChordToneRole, string> = {
  root: 'R',
  third: '3',
  fifth: '5',
  seventh: '7',
};

export function Fretboard({ board, settings, compact, onInspect, onActivate }: FretboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rawCursor, setCursor] = useState<BoardCursor>({ stringIndex: 5, fret: board.range.from });

  // The keyboard cursor is clamped as it is read, so a fret-range change never
  // leaves it pointing at a position that is no longer drawn.
  const cursor: BoardCursor = {
    stringIndex: rawCursor.stringIndex,
    fret: Math.min(board.range.to, Math.max(board.range.from, rawCursor.fret)),
  };

  const stringSpacing = compact ? 36 : 40;
  const noteSize = compact ? 26 : 29;
  const gutter = compact ? 40 : 52;

  const geometry = useMemo(
    () =>
      buildFretGeometry({
        range: board.range,
        baseCellWidth: compact ? 52 : 60,
        openColumnWidth: compact ? 40 : 46,
      }),
    [board.range, compact],
  );

  // Breathing room above the top string and below the bottom one so the outer
  // rings on shape overlaps and chord tones are not clipped by the board edge.
  const boardPadding = 12;
  const boardHeight = stringSpacing * 6 + boardPadding * 2;
  const { totalWidth } = geometry;

  const mirrorX = useCallback(
    (cell: FretCell) => (settings.leftHanded ? totalWidth - cell.x - cell.width : cell.x),
    [settings.leftHanded, totalWidth],
  );

  const rowY = useCallback(
    (stringIndex: number) => boardPadding + stringSpacing / 2 + (5 - stringIndex) * stringSpacing,
    [boardPadding, stringSpacing],
  );

  // Bring a newly selected shape or voicing into view without hunting for it.
  const focusFret = board.voicing?.lowestFret ?? board.activeShape?.lowestFret ?? null;
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || focusFret === null) return;
    const cell = geometry.cellByFret.get(focusFret);
    if (!cell) return;
    const target = Math.max(0, mirrorX(cell) - container.clientWidth / 3);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [focusFret, geometry, mirrorX]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { from, to } = board.range;
    const step = settings.leftHanded ? -1 : 1;
    let next: BoardCursor | null = null;

    switch (event.key) {
      case 'ArrowRight':
        next = { ...cursor, fret: Math.min(to, Math.max(from, cursor.fret + step)) };
        break;
      case 'ArrowLeft':
        next = { ...cursor, fret: Math.min(to, Math.max(from, cursor.fret - step)) };
        break;
      case 'ArrowUp':
        next = { ...cursor, stringIndex: Math.min(5, cursor.stringIndex + 1) };
        break;
      case 'ArrowDown':
        next = { ...cursor, stringIndex: Math.max(0, cursor.stringIndex - 1) };
        break;
      case 'Home':
        next = { ...cursor, fret: from };
        break;
      case 'End':
        next = { ...cursor, fret: to };
        break;
      default:
        return;
    }

    event.preventDefault();
    setCursor(next);
    const element = scrollRef.current?.querySelector<HTMLButtonElement>(
      `[data-cell="${next.stringIndex}:${next.fret}"]`,
    );
    element?.focus();
  };

  const stringThickness = (stringIndex: number) => [3, 2.6, 2.2, 1.8, 1.4, 1.2][stringIndex];

  return (
    <div
      ref={scrollRef}
      className="nf-scroll overflow-x-auto overflow-y-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-2 sm:p-3"
      role="group"
      aria-label={`${board.scale.rootName} ${board.scale.definition.name} fretboard, frets ${board.range.from} to ${board.range.to}, ${settings.leftHanded ? 'left-handed' : 'right-handed'} layout`}
    >
      <div className="flex" style={{ width: gutter + totalWidth }}>
        <div
          className="sticky left-0 z-20 shrink-0 bg-[var(--surface)]"
          style={{ width: gutter }}
          aria-hidden="true"
        >
          <div style={{ height: 22 }} />
          <div className="relative" style={{ height: boardHeight }}>
            {[5, 4, 3, 2, 1, 0].map((stringIndex) => (
              <div
                key={stringIndex}
                className="absolute flex items-center gap-1 pr-2 text-[11px] font-semibold tabular-nums"
                style={{ top: rowY(stringIndex) - 8, right: 0, height: 16 }}
              >
                <span className="text-[var(--text-dim)]">{6 - stringIndex}</span>
                <span className="text-[var(--text-muted)]">
                  {stringLabel(board.tuning, stringIndex)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: 20 }} />
        </div>

        <div className="relative shrink-0" style={{ width: totalWidth }}>
          <div className="relative" style={{ height: 22 }} aria-hidden="true">
            {geometry.cells.map((cell) => (
              <span
                key={cell.fret}
                className={`absolute top-0 text-center text-[11px] tabular-nums ${
                  isOctaveFret(cell.fret)
                    ? 'font-bold text-[var(--accent)]'
                    : hasInlay(cell.fret)
                      ? 'font-semibold text-[var(--text-muted)]'
                      : 'text-[var(--text-dim)]'
                }`}
                style={{ left: mirrorX(cell), width: cell.width }}
              >
                {cell.fret}
              </span>
            ))}
          </div>

          <div
            className="nf-board-surface relative overflow-hidden rounded-md"
            style={{ height: boardHeight }}
            onKeyDown={handleKeyDown}
          >
            {geometry.cells.map((cell) =>
              isOctaveFret(cell.fret) ? (
                <div
                  key={`octave-${cell.fret}`}
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 bg-[var(--accent)]/[0.07]"
                  style={{ left: mirrorX(cell), width: cell.width }}
                />
              ) : null,
            )}

            {geometry.cells.map((cell) => {
              if (!hasInlay(cell.fret)) return null;
              const double = isOctaveFret(cell.fret);
              const centerX = mirrorX(cell) + cell.width / 2;
              return (
                <div key={`inlay-${cell.fret}`} aria-hidden="true">
                  {(double ? [-1, 1] : [0]).map((offset) => (
                    <span
                      key={offset}
                      className="absolute rounded-full"
                      style={{
                        width: 11,
                        height: 11,
                        left: centerX - 5.5,
                        top: boardPadding + stringSpacing * 3 - 5.5 + offset * stringSpacing,
                        background: double ? 'var(--inlay-octave)' : 'var(--inlay)',
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {geometry.cells.map((cell) => {
              if (cell.fret === 0) return null;
              const edge = settings.leftHanded ? mirrorX(cell) : mirrorX(cell) + cell.width;
              const octave = isOctaveFret(cell.fret);
              return (
                <span
                  key={`wire-${cell.fret}`}
                  aria-hidden="true"
                  className="absolute top-0 bottom-0"
                  style={{
                    left: edge - 1,
                    width: octave ? 2.5 : 1.5,
                    background: octave ? 'var(--fret-wire-octave)' : 'var(--fret-wire)',
                    boxShadow: octave ? '0 0 6px var(--fret-wire-octave)' : 'none',
                  }}
                />
              );
            })}

            {geometry.nutX !== null ? (
              <span
                aria-hidden="true"
                className="absolute top-0 bottom-0 rounded-sm"
                style={{
                  left: settings.leftHanded ? totalWidth - geometry.nutX - 5 : geometry.nutX - 1,
                  width: 5,
                  background: 'var(--nut)',
                }}
              />
            ) : null}

            {[0, 1, 2, 3, 4, 5].map((stringIndex) => (
              <span
                key={`string-${stringIndex}`}
                aria-hidden="true"
                className="absolute left-0 right-0"
                style={{
                  top: rowY(stringIndex) - stringThickness(stringIndex) / 2,
                  height: stringThickness(stringIndex),
                  background: 'var(--string)',
                  boxShadow: '0 1px 2px rgb(0 0 0 / 0.55)',
                  opacity: 0.85,
                }}
              />
            ))}

            {board.rows.map((row) =>
              row.map((item) => {
                const cell = geometry.cellByFret.get(item.note.fret);
                if (!cell) return null;
                const left = mirrorX(cell);
                const top = rowY(item.note.stringIndex) - stringSpacing / 2;
                const isCursor =
                  cursor.stringIndex === item.note.stringIndex && cursor.fret === item.note.fret;
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-cell={item.key}
                    tabIndex={isCursor ? 0 : -1}
                    aria-label={describeNote(item)}
                    // The board clips its corners, so the focus ring is drawn
                    // inside the cell to keep it visible at the neck edges.
                    className="absolute flex items-center justify-center rounded-sm focus-visible:[outline-offset:-2px]"
                    style={{ left, top, width: cell.width, height: stringSpacing }}
                    onMouseEnter={() => onInspect(item)}
                    onMouseLeave={() => onInspect(null)}
                    onFocus={() => {
                      setCursor({ stringIndex: item.note.stringIndex, fret: item.note.fret });
                      onInspect(item);
                    }}
                    onBlur={() => onInspect(null)}
                    onClick={() => onActivate(item)}
                  >
                    <NoteMarker item={item} size={noteSize} labelMode={settings.labelMode} />
                  </button>
                );
              }),
            )}
          </div>

          <div className="relative" style={{ height: 20 }} aria-hidden="true">
            {geometry.cells.map((cell) =>
              hasInlay(cell.fret) ? (
                <span
                  key={`bottom-${cell.fret}`}
                  className={`absolute top-1 text-center text-[10px] tabular-nums ${
                    isOctaveFret(cell.fret)
                      ? 'font-bold text-[var(--accent)]'
                      : 'text-[var(--text-dim)]'
                  }`}
                  style={{ left: mirrorX(cell), width: cell.width }}
                >
                  {cell.fret}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NoteMarkerProps {
  item: NoteView;
  size: number;
  labelMode: Settings['labelMode'];
}

function NoteMarker({ item, size, labelMode }: NoteMarkerProps) {
  if (!item.visible) return null;

  const color = ROLE_COLOR_VARIABLES[item.role];
  const muted = item.emphasis === 'muted';
  const primary = item.emphasis === 'primary';
  const label = item.label;

  return (
    <span
      className="pointer-events-none relative flex items-center justify-center transition-[opacity,transform] duration-150"
      style={{ width: size, height: size }}
    >
      <span
        className={`absolute inset-0 flex items-center justify-center border ${
          primary ? 'rounded-[8px]' : 'rounded-full'
        } ${muted ? '' : 'nf-note-glow'}`}
        style={
          {
            '--note-color': color,
            background: muted ? 'color-mix(in srgb, var(--note-color) 16%, transparent)' : color,
            borderColor: muted ? 'color-mix(in srgb, var(--note-color) 55%, transparent)' : color,
            borderWidth: primary ? 2 : 1,
            opacity: muted ? 0.5 : 1,
          } as React.CSSProperties
        }
      >
        <span
          className={`select-none leading-none ${
            label.length > 2 ? 'text-[10px]' : 'text-[11.5px]'
          } ${primary ? 'font-extrabold' : 'font-bold'}`}
          style={{
            color: muted ? 'var(--text-muted)' : 'var(--on-note)',
          }}
        >
          {labelMode === 'none' ? '' : label}
        </span>
      </span>

      {item.chordRole ? (
        <>
          <span
            aria-hidden="true"
            className={`absolute rounded-full border-2 ${CHORD_RING[item.chordRole]}`}
            style={{
              inset: -4,
              borderColor: 'var(--text)',
              opacity: muted ? 0.45 : 0.9,
            }}
          />
          <span
            aria-hidden="true"
            className="absolute -top-2 -left-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-sm border border-[var(--border-strong)] bg-[var(--surface-raised)] px-0.5 text-[8px] font-extrabold text-[var(--text)]"
          >
            {CHORD_GLYPH[item.chordRole]}
          </span>
        </>
      ) : null}

      {item.isShapeOverlap ? (
        <span
          aria-hidden="true"
          className="absolute rounded-full border border-dashed"
          style={{ inset: -7, borderColor: 'var(--accent)', opacity: 0.85 }}
        />
      ) : null}

      {item.voicingPosition !== null ? (
        <span
          aria-hidden="true"
          className="absolute -right-2 -bottom-2 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[9px] font-bold tabular-nums text-[var(--text)]"
        >
          {item.voicingPosition}
        </span>
      ) : null}
    </span>
  );
}