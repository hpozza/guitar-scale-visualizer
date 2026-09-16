/**
 * Intervals and scale degrees.
 *
 * A `Degree` is the theory-level description of a scale tone: a diatonic number
 * (1-7) plus an alteration. It drives both the degree label ("b3") and the
 * letter used when spelling the note, which keeps spelling independent of the
 * raw semitone count.
 */

import { mod12 } from './notes';

export interface Degree {
  /** Diatonic degree number, 1-7. */
  number: number;
  /** Alteration in semitones relative to the major scale degree. */
  alteration: number;
}

/** Semitones above the tonic for each unaltered major-scale degree. */
export const MAJOR_DEGREE_SEMITONES: Record<number, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
};

export function degreeSemitones(degree: Degree): number {
  return mod12(MAJOR_DEGREE_SEMITONES[degree.number] + degree.alteration);
}

export function formatDegree(degree: Degree): string {
  const prefix =
    degree.alteration === 0
      ? ''
      : degree.alteration > 0
        ? '\u266f'.repeat(degree.alteration)
        : '\u266d'.repeat(-degree.alteration);
  return `${prefix}${degree.number}`;
}

/** Parse compact degree notation such as "1", "b3", "#4". */
export function parseDegree(text: string): Degree {
  const match = /^([#b]*)([1-7])$/.exec(text);
  if (!match) throw new Error(`Invalid degree: ${text}`);
  const accidentals = match[1];
  const alteration = accidentals.startsWith('b') ? -accidentals.length : accidentals.length;
  return { number: Number(match[2]), alteration };
}

/** Functional grouping used for colour, symbol and legend treatment. */
export type IntervalRole =
  | 'root'
  | 'second'
  | 'third'
  | 'fourth'
  | 'tritone'
  | 'fifth'
  | 'sixth'
  | 'seventh'
  | 'chromatic';

export interface IntervalInfo {
  semitones: number;
  /** Short label, e.g. "R", "m3", "P5". */
  short: string;
  /** Full name, e.g. "minor third". */
  name: string;
  role: IntervalRole;
  /** Non-colour glyph so the fretboard stays readable without colour. */
  symbol: string;
}

export const INTERVALS: IntervalInfo[] = [
  { semitones: 0, short: 'R', name: 'root', role: 'root', symbol: '\u25c6' },
  { semitones: 1, short: 'm2', name: 'minor second', role: 'second', symbol: '\u2022' },
  { semitones: 2, short: 'M2', name: 'major second', role: 'second', symbol: '\u2022' },
  { semitones: 3, short: 'm3', name: 'minor third', role: 'third', symbol: '\u25b2' },
  { semitones: 4, short: 'M3', name: 'major third', role: 'third', symbol: '\u25b2' },
  { semitones: 5, short: 'P4', name: 'perfect fourth', role: 'fourth', symbol: '\u25a0' },
  { semitones: 6, short: 'TT', name: 'tritone', role: 'tritone', symbol: '\u2715' },
  { semitones: 7, short: 'P5', name: 'perfect fifth', role: 'fifth', symbol: '\u25bc' },
  { semitones: 8, short: 'm6', name: 'minor sixth', role: 'sixth', symbol: '\u25cf' },
  { semitones: 9, short: 'M6', name: 'major sixth', role: 'sixth', symbol: '\u25cf' },
  { semitones: 10, short: 'm7', name: 'minor seventh', role: 'seventh', symbol: '\u25c7' },
  { semitones: 11, short: 'M7', name: 'major seventh', role: 'seventh', symbol: '\u25c7' },
];

export function intervalInfo(semitones: number): IntervalInfo {
  return INTERVALS[mod12(semitones)];
}

/**
 * Degree label for any semitone distance, used for notes that fall outside the
 * selected scale so the degree view never shows a blank marker.
 */
export const CHROMATIC_DEGREE_LABELS = [
  '1',
  '\u266d2',
  '2',
  '\u266d3',
  '3',
  '4',
  '\u266d5',
  '5',
  '\u266d6',
  '6',
  '\u266d7',
  '7',
];

export function chromaticDegreeLabel(semitones: number): string {
  return CHROMATIC_DEGREE_LABELS[mod12(semitones)];
}

export const INTERVAL_ROLE_LABELS: Record<IntervalRole, string> = {
  root: 'Root',
  second: 'Second / ninth',
  third: 'Third',
  fourth: 'Fourth / eleventh',
  tritone: 'Tritone',
  fifth: 'Fifth',
  sixth: 'Sixth / thirteenth',
  seventh: 'Seventh',
  chromatic: 'Outside the scale',
};
