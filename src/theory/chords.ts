/**
 * Diatonic harmony: triads, seventh chords and close triad voicings.
 */

import { formatDegree, intervalInfo, type Degree } from './intervals';
import {
  formatNote,
  mod12,
  type AccidentalPreference,
  type PitchClass,
  type SpelledNote,
} from './notes';
import { buildScale, harmonySourceScaleId, type Scale, type ScaleTone } from './scales';
import { MAX_FRET, type FretRange, type Tuning } from './fretboard';

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'other';

export type ChordToneRole = 'root' | 'third' | 'fifth' | 'seventh';

export interface ChordTone {
  role: ChordToneRole;
  pitchClass: PitchClass;
  spelled: SpelledNote;
  name: string;
  degree: Degree;
  degreeLabel: string;
  /** Semitones above the chord root. */
  semitonesFromChordRoot: number;
  intervalShort: string;
}

export interface DiatonicChord {
  /** 1-based scale degree the chord is built on. */
  degreeNumber: number;
  romanNumeral: string;
  quality: TriadQuality;
  /** Suffix appended to the root name, e.g. "m", "dim". */
  suffix: string;
  name: string;
  rootPitchClass: PitchClass;
  rootName: string;
  triad: ChordTone[];
  seventh: ChordTone | null;
  seventhName: string;
  seventhSuffix: string;
  /** Interval formula of the triad, e.g. "1 b3 5". */
  formula: string;
  seventhFormula: string;
  /** Scale-degree label of the chord root within the key, e.g. "b3". */
  scaleDegreeLabel: string;
}

const TRIAD_QUALITIES: Record<string, { quality: TriadQuality; suffix: string; numeral: 'upper' | 'lower'; numeralSuffix: string }> = {
  '4-7': { quality: 'major', suffix: '', numeral: 'upper', numeralSuffix: '' },
  '3-7': { quality: 'minor', suffix: 'm', numeral: 'lower', numeralSuffix: '' },
  '3-6': { quality: 'diminished', suffix: 'dim', numeral: 'lower', numeralSuffix: '\u00b0' },
  '4-8': { quality: 'augmented', suffix: 'aug', numeral: 'upper', numeralSuffix: '+' },
};

const SEVENTH_SUFFIXES: Record<string, string> = {
  '4-7-11': 'maj7',
  '4-7-10': '7',
  '3-7-10': 'm7',
  '3-7-11': 'mMaj7',
  '3-6-10': 'm7\u266d5',
  '3-6-9': 'dim7',
  '4-8-11': 'maj7\u266f5',
  '4-6-10': '7\u266d5',
  '4-8-10': '7\u266f5',
};

const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function toneAt(scale: Scale, index: number): ScaleTone {
  return scale.tones[index % scale.tones.length];
}

function chordTone(
  scale: Scale,
  index: number,
  role: ChordToneRole,
  chordRootPitchClass: PitchClass,
): ChordTone {
  const tone = toneAt(scale, index);
  const semitonesFromChordRoot = mod12(tone.pitchClass - chordRootPitchClass);
  return {
    role,
    pitchClass: tone.pitchClass,
    spelled: tone.spelled,
    name: tone.name,
    degree: tone.degree,
    degreeLabel: tone.degreeLabel,
    semitonesFromChordRoot,
    intervalShort: intervalInfo(semitonesFromChordRoot).short,
  };
}

/** Chord-relative formula, e.g. a minor triad is "1 b3 5". */
function chordFormula(tones: ChordTone[]): string {
  return tones
    .map((tone) => {
      switch (tone.role) {
        case 'root':
          return '1';
        case 'third':
          return tone.semitonesFromChordRoot === 4 ? '3' : tone.semitonesFromChordRoot === 3 ? '\u266d3' : '\u266d\u266d3';
        case 'fifth':
          return tone.semitonesFromChordRoot === 7
            ? '5'
            : tone.semitonesFromChordRoot === 6
              ? '\u266d5'
              : '\u266f5';
        case 'seventh':
          return tone.semitonesFromChordRoot === 11
            ? '7'
            : tone.semitonesFromChordRoot === 10
              ? '\u266d7'
              : '\u266d\u266d7';
      }
    })
    .join(' ');
}

/** The seven diatonic chords of a seven-note scale. */
export function diatonicChords(scale: Scale): DiatonicChord[] {
  if (scale.tones.length !== 7) return [];

  return scale.tones.map((rootTone, index) => {
    const rootPitchClass = rootTone.pitchClass;
    const root = chordTone(scale, index, 'root', rootPitchClass);
    const third = chordTone(scale, index + 2, 'third', rootPitchClass);
    const fifth = chordTone(scale, index + 4, 'fifth', rootPitchClass);
    const seventh = chordTone(scale, index + 6, 'seventh', rootPitchClass);

    const key = `${third.semitonesFromChordRoot}-${fifth.semitonesFromChordRoot}`;
    const descriptor =
      TRIAD_QUALITIES[key] ??
      ({ quality: 'other', suffix: 'alt', numeral: 'lower', numeralSuffix: '*' } as const);

    const numeralBase = ROMAN_UPPER[index];
    const romanNumeral =
      (descriptor.numeral === 'upper' ? numeralBase : numeralBase.toLowerCase()) +
      descriptor.numeralSuffix;

    const seventhKey = `${third.semitonesFromChordRoot}-${fifth.semitonesFromChordRoot}-${seventh.semitonesFromChordRoot}`;
    const seventhSuffix = SEVENTH_SUFFIXES[seventhKey] ?? `${descriptor.suffix}(add7)`;

    const rootName = formatNote(rootTone.spelled);
    const triad = [root, third, fifth];

    return {
      degreeNumber: index + 1,
      romanNumeral,
      quality: descriptor.quality,
      suffix: descriptor.suffix,
      name: `${rootName}${descriptor.suffix}`,
      rootPitchClass,
      rootName,
      triad,
      seventh,
      seventhName: `${rootName}${seventhSuffix}`,
      seventhSuffix,
      formula: chordFormula(triad),
      seventhFormula: chordFormula([...triad, seventh]),
      scaleDegreeLabel: formatDegree(rootTone.degree),
    };
  });
}

export interface HarmonyContext {
  chords: DiatonicChord[];
  /** Scale the chords were derived from. */
  sourceScale: Scale;
  /** Set when harmony came from a parent scale rather than the selected one. */
  derivedFromNote: string | null;
}

/**
 * Diatonic harmony for the selected scale. Pentatonic and blues scales do not
 * have seven degrees, so their harmony is taken from the parent scale and the
 * UI is told to say so.
 */
export function harmonyContext(
  scale: Scale,
  preference: AccidentalPreference = 'sharp',
): HarmonyContext {
  if (scale.tones.length === 7) {
    return { chords: diatonicChords(scale), sourceScale: scale, derivedFromNote: null };
  }
  const sourceId = harmonySourceScaleId(scale.definition);
  const sourceScale = buildScale({
    rootPitchClass: scale.rootPitchClass,
    scaleId: sourceId,
    preference,
    rootSpelling: scale.rootSpelled,
  });
  return {
    chords: diatonicChords(sourceScale),
    sourceScale,
    derivedFromNote: `${scale.definition.name} has only ${scale.tones.length} notes, so these chords come from its parent scale, ${sourceScale.rootName} ${sourceScale.definition.name}.`,
  };
}

export type Inversion = 0 | 1 | 2;

export const INVERSION_LABELS: Record<Inversion, string> = {
  0: 'Root position',
  1: '1st inversion',
  2: '2nd inversion',
};

export interface StringSet {
  id: string;
  label: string;
  /** String indices low to high. */
  indices: [number, number, number];
}

/** String sets named by guitar string numbers, where string 1 is the high E. */
export const TRIAD_STRING_SETS: StringSet[] = [
  { id: '123', label: 'Strings 1-2-3', indices: [3, 4, 5] },
  { id: '234', label: 'Strings 2-3-4', indices: [2, 3, 4] },
  { id: '345', label: 'Strings 3-4-5', indices: [1, 2, 3] },
  { id: '456', label: 'Strings 4-5-6', indices: [0, 1, 2] },
];

export interface VoicingNote {
  stringIndex: number;
  fret: number;
  midi: number;
  role: ChordToneRole;
  name: string;
}

export interface TriadVoicing {
  inversion: Inversion;
  stringSet: StringSet;
  notes: VoicingNote[];
  bassRole: ChordToneRole;
  lowestFret: number;
  highestFret: number;
}

function lowestFretFor(tuning: Tuning, stringIndex: number, pitchClass: PitchClass, minFret: number): number {
  const offset = mod12(pitchClass - mod12(tuning.openMidi[stringIndex]));
  let fret = offset;
  while (fret < minFret) fret += 12;
  return fret;
}

/**
 * Closest three-note voicing of a triad on one string set, with the requested
 * chord tone in the bass.
 */
export function triadVoicing(
  tuning: Tuning,
  chord: DiatonicChord,
  inversion: Inversion,
  stringSet: StringSet,
  minFret = 0,
): TriadVoicing | null {
  const ordered = [0, 1, 2].map((offset) => chord.triad[(inversion + offset) % 3]);
  const notes: VoicingNote[] = [];
  let previousMidi = -Infinity;

  for (let position = 0; position < 3; position += 1) {
    const stringIndex = stringSet.indices[position];
    const tone = ordered[position];
    let fret = lowestFretFor(tuning, stringIndex, tone.pitchClass, minFret);
    while (tuning.openMidi[stringIndex] + fret <= previousMidi) fret += 12;
    if (fret > MAX_FRET) return null;
    const midi = tuning.openMidi[stringIndex] + fret;
    previousMidi = midi;
    notes.push({ stringIndex, fret, midi, role: tone.role, name: tone.name });
  }

  const frets = notes.map((note) => note.fret);
  return {
    inversion,
    stringSet,
    notes,
    bassRole: ordered[0].role,
    lowestFret: Math.min(...frets),
    highestFret: Math.max(...frets),
  };
}

/**
 * Every close-position voicing of a triad on one string set that still sits on
 * the visible neck. Repeats each inversion up the octave so the shapes actually
 * show up instead of hiding behind a single lowest-fret hit.
 */
export function collectTriadVoicings(
  tuning: Tuning,
  chord: DiatonicChord,
  stringSet: StringSet,
  range: FretRange,
  inversion: Inversion | 'all' = 'all',
): TriadVoicing[] {
  const inversions: Inversion[] = inversion === 'all' ? [0, 1, 2] : [inversion];
  const found: TriadVoicing[] = [];

  for (const current of inversions) {
    let minFret = range.from;
    const seen = new Set<string>();
    while (minFret <= range.to) {
      const voicing = triadVoicing(tuning, chord, current, stringSet, minFret);
      if (!voicing) break;
      const signature = voicing.notes.map((note) => `${note.stringIndex}:${note.fret}`).join(',');
      if (seen.has(signature)) break;
      seen.add(signature);
      const inWindow = voicing.notes.every(
        (note) => note.fret >= range.from && note.fret <= range.to,
      );
      if (inWindow) found.push(voicing);
      const nextMin = voicing.lowestFret + 1;
      if (nextMin <= minFret) break;
      minFret = nextMin;
    }
  }

  return found;
}

export const CHORD_ROLE_LABELS: Record<ChordToneRole, string> = {
  root: 'Root',
  third: 'Third',
  fifth: 'Fifth',
  seventh: 'Seventh',
};
