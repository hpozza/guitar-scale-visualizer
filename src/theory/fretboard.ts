/**
 * Fretboard geometry and note calculation.
 *
 * Strings are stored low to high (index 0 = low E in standard tuning) and the
 * renderer reverses them, matching how a fretboard diagram is normally read.
 */

import { intervalInfo, type IntervalInfo } from './intervals';
import {
  displaySpelling,
  formatNote,
  midiToOctave,
  mod12,
  spellPitchClass,
  type AccidentalPreference,
  type PitchClass,
  type SpelledNote,
} from './notes';
import type { Scale, ScaleTone } from './scales';

export interface Tuning {
  id: string;
  name: string;
  /** Open-string MIDI numbers, low to high. */
  openMidi: number[];
}

/** E2 A2 D3 G3 B3 E4 */
export const STANDARD_TUNING: Tuning = {
  id: 'standard',
  name: 'Standard (E A D G B E)',
  openMidi: [40, 45, 50, 55, 59, 64],
};

export const MAX_FRET = 24;
export const MIN_FRET = 0;

/** Frets carrying a position inlay. Frets 12 and 24 are the octave markers. */
export const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
export const OCTAVE_FRETS = [12, 24];

export function isOctaveFret(fret: number): boolean {
  return OCTAVE_FRETS.includes(fret);
}

export function hasInlay(fret: number): boolean {
  return INLAY_FRETS.includes(fret);
}

export function midiAt(tuning: Tuning, stringIndex: number, fret: number): number {
  return tuning.openMidi[stringIndex] + fret;
}

export interface FretRange {
  from: number;
  to: number;
}

export interface FretRangeValidation {
  range: FretRange;
  /** Null when the requested range was already usable. */
  message: string | null;
}

/**
 * Clamp a fret range into something renderable, reporting what was corrected so
 * the UI can explain itself instead of silently changing the user's input.
 */
export function validateFretRange(from: number, to: number): FretRangeValidation {
  const messages: string[] = [];
  let low = Number.isFinite(from) ? Math.round(from) : MIN_FRET;
  let high = Number.isFinite(to) ? Math.round(to) : MAX_FRET;

  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    messages.push('Fret range was not a number, so the full neck is shown.');
  }
  if (low > high) {
    [low, high] = [high, low];
    messages.push('The first fret was higher than the last, so the two were swapped.');
  }
  if (low < MIN_FRET) {
    low = MIN_FRET;
    messages.push(`Frets below ${MIN_FRET} do not exist, so the range starts at the nut.`);
  }
  if (high > MAX_FRET) {
    high = MAX_FRET;
    messages.push(`This neck stops at fret ${MAX_FRET}, so the range ends there.`);
  }
  if (high - low < 2) {
    high = Math.min(MAX_FRET, low + 2);
    if (high - low < 2) low = Math.max(MIN_FRET, high - 2);
    messages.push('A window narrower than three frets is not useful, so it was widened.');
  }

  return { range: { from: low, to: high }, message: messages.length ? messages.join(' ') : null };
}

/**
 * Distance from the nut to a fret as a fraction of the scale length, using
 * equal temperament (the "rule of 18").
 */
export function fretDistanceRatio(fret: number): number {
  return 1 - Math.pow(2, -fret / 12);
}

export interface FretGeometryOptions {
  range: FretRange;
  /** Width in pixels of an average fret cell. */
  baseCellWidth?: number;
  /**
   * How strongly real fret taper is applied, 0-1. Full taper makes the top
   * frets too small to label, so the default keeps note circles readable while
   * still narrowing clearly toward the bridge.
   */
  taper?: number;
  /** Width of the open-string column, 0 when the nut is not shown. */
  openColumnWidth?: number;
}

export interface FretCell {
  fret: number;
  /** Left edge in pixels, measured from the left end of the rendered neck. */
  x: number;
  width: number;
  /** Centre of the cell, where note markers sit. */
  center: number;
}

export interface FretGeometry {
  cells: FretCell[];
  totalWidth: number;
  /** X position of the nut, or null when the range starts above fret 0. */
  nutX: number | null;
  cellByFret: Map<number, FretCell>;
}

export function buildFretGeometry(options: FretGeometryOptions): FretGeometry {
  const { range } = options;
  const baseCellWidth = options.baseCellWidth ?? 58;
  const taper = options.taper ?? 0.8;
  const openColumnWidth = options.openColumnWidth ?? 46;

  const frets: number[] = [];
  for (let fret = range.from; fret <= range.to; fret += 1) frets.push(fret);

  const playedFrets = frets.filter((fret) => fret > 0);
  const rawWidths = playedFrets.map(
    (fret) => fretDistanceRatio(fret) - fretDistanceRatio(fret - 1),
  );
  const averageRaw = rawWidths.reduce((sum, value) => sum + value, 0) / (rawWidths.length || 1);

  const cells: FretCell[] = [];
  let x = 0;
  let nutX: number | null = null;

  for (const fret of frets) {
    let width: number;
    if (fret === 0) {
      width = openColumnWidth;
    } else {
      const normalized = rawWidths[playedFrets.indexOf(fret)] / averageRaw;
      const tapered = 1 - taper + taper * normalized;
      width = Math.max(34, baseCellWidth * tapered);
    }
    const cell: FretCell = { fret, x, width, center: x + width / 2 };
    cells.push(cell);
    if (fret === 0) nutX = x + width;
    x += width;
  }

  return {
    cells,
    totalWidth: x,
    nutX,
    cellByFret: new Map(cells.map((cell) => [cell.fret, cell])),
  };
}

export interface FretboardNote {
  stringIndex: number;
  fret: number;
  midi: number;
  pitchClass: PitchClass;
  octave: number;
  spelled: SpelledNote;
  name: string;
  /** Present when the pitch belongs to the current scale. */
  tone: ScaleTone | null;
  inScale: boolean;
  isRoot: boolean;
  semitonesFromRoot: number;
  interval: IntervalInfo;
}

export interface ComputeNotesOptions {
  tuning: Tuning;
  range: FretRange;
  scale: Scale;
  preference: AccidentalPreference;
}

/** Every note in the visible window, annotated with its role in the scale. */
export function computeFretboardNotes(options: ComputeNotesOptions): FretboardNote[][] {
  const { tuning, range, scale, preference } = options;
  const toneByPitchClass = new Map<PitchClass, ScaleTone>();
  for (const tone of scale.tones) {
    if (!toneByPitchClass.has(tone.pitchClass)) toneByPitchClass.set(tone.pitchClass, tone);
  }

  return tuning.openMidi.map((openMidi, stringIndex) => {
    const notes: FretboardNote[] = [];
    for (let fret = range.from; fret <= range.to; fret += 1) {
      const midi = openMidi + fret;
      const pitchClass = mod12(midi);
      const tone = toneByPitchClass.get(pitchClass) ?? null;
      const spelled = tone
        ? displaySpelling(tone.spelled, preference)
        : spellPitchClass(pitchClass, preference);
      const semitonesFromRoot = mod12(pitchClass - scale.rootPitchClass);
      notes.push({
        stringIndex,
        fret,
        midi,
        pitchClass,
        octave: midiToOctave(midi),
        spelled,
        name: formatNote(spelled),
        tone,
        inScale: tone !== null,
        isRoot: pitchClass === scale.rootPitchClass,
        semitonesFromRoot,
        interval: intervalInfo(semitonesFromRoot),
      });
    }
    return notes;
  });
}

export const STRING_LABELS_STANDARD = ['E', 'A', 'D', 'G', 'B', 'e'];

export function stringLabel(tuning: Tuning, stringIndex: number): string {
  if (tuning.id === 'standard') return STRING_LABELS_STANDARD[stringIndex];
  return formatNote(spellPitchClass(mod12(tuning.openMidi[stringIndex]), 'sharp'));
}

/** Human-readable string number: string 1 is the high E. */
export function stringNumber(tuning: Tuning, stringIndex: number): number {
  return tuning.openMidi.length - stringIndex;
}
