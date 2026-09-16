/**
 * Pitch-class arithmetic and note spelling.
 *
 * Pitch is always an integer: a pitch class 0-11 (C = 0) or a MIDI number.
 * Spelling is a separate concern handled by `SpelledNote`, so the UI can render
 * the same pitch as C#, Db or B## without affecting any calculation.
 */

export type PitchClass = number;

export type AccidentalPreference = 'sharp' | 'flat';

/** Natural letters in diatonic order with their pitch classes. */
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];

const LETTER_PITCH_CLASSES: Record<Letter, PitchClass> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** A letter plus an alteration in semitones (-2 = double flat, +2 = double sharp). */
export interface SpelledNote {
  letter: Letter;
  alteration: number;
}

export function mod12(value: number): PitchClass {
  return ((value % 12) + 12) % 12;
}

export function letterPitchClass(letter: Letter): PitchClass {
  return LETTER_PITCH_CLASSES[letter];
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter);
}

export function pitchClassOf(note: SpelledNote): PitchClass {
  return mod12(letterPitchClass(note.letter) + note.alteration);
}

/**
 * Spell a pitch class using the given letter. The alteration is chosen as the
 * smallest signed distance so that E/F boundaries do not produce absurd
 * accidentals (e.g. spelling pitch class 5 as "E#" rather than "E+11").
 */
export function spellWithLetter(pitchClass: PitchClass, letter: Letter): SpelledNote {
  const natural = letterPitchClass(letter);
  const alteration = ((mod12(pitchClass) - natural + 18) % 12) - 6;
  return { letter, alteration };
}

const SHARP_SPELLINGS: SpelledNote[] = [
  { letter: 'C', alteration: 0 },
  { letter: 'C', alteration: 1 },
  { letter: 'D', alteration: 0 },
  { letter: 'D', alteration: 1 },
  { letter: 'E', alteration: 0 },
  { letter: 'F', alteration: 0 },
  { letter: 'F', alteration: 1 },
  { letter: 'G', alteration: 0 },
  { letter: 'G', alteration: 1 },
  { letter: 'A', alteration: 0 },
  { letter: 'A', alteration: 1 },
  { letter: 'B', alteration: 0 },
];

const FLAT_SPELLINGS: SpelledNote[] = [
  { letter: 'C', alteration: 0 },
  { letter: 'D', alteration: -1 },
  { letter: 'D', alteration: 0 },
  { letter: 'E', alteration: -1 },
  { letter: 'E', alteration: 0 },
  { letter: 'F', alteration: 0 },
  { letter: 'G', alteration: -1 },
  { letter: 'G', alteration: 0 },
  { letter: 'A', alteration: -1 },
  { letter: 'A', alteration: 0 },
  { letter: 'B', alteration: -1 },
  { letter: 'B', alteration: 0 },
];

/** Default spelling of a pitch class under a sharp or flat preference. */
export function spellPitchClass(
  pitchClass: PitchClass,
  preference: AccidentalPreference,
): SpelledNote {
  const table = preference === 'flat' ? FLAT_SPELLINGS : SHARP_SPELLINGS;
  return table[mod12(pitchClass)];
}

/**
 * Keep theoretical spelling when it already matches the accidental preference
 * (E♯ stays E♯ in sharp mode). Otherwise respell with the chromatic table so
 * Sharps / Flats actually changes names like F♯ / G♭.
 */
export function displaySpelling(
  theoretical: SpelledNote,
  preference: AccidentalPreference,
): SpelledNote {
  if (theoretical.alteration === 0) return theoretical;
  if (preference === 'sharp' && theoretical.alteration > 0) return theoretical;
  if (preference === 'flat' && theoretical.alteration < 0) return theoretical;
  return spellPitchClass(pitchClassOf(theoretical), preference);
}

const SHARP_SYMBOL = '\u266f';
const FLAT_SYMBOL = '\u266d';
const DOUBLE_SHARP_SYMBOL = '\u266f\u266f';
const DOUBLE_FLAT_SYMBOL = '\u266d\u266d';

export interface FormatOptions {
  /** Use ASCII "#"/"b" instead of the musical symbols. */
  ascii?: boolean;
}

export function formatNote(note: SpelledNote, options: FormatOptions = {}): string {
  const { alteration, letter } = note;
  if (options.ascii) {
    const suffix = alteration >= 0 ? '#'.repeat(alteration) : 'b'.repeat(-alteration);
    return letter + suffix;
  }
  if (alteration === 0) return letter;
  if (alteration === 1) return letter + SHARP_SYMBOL;
  if (alteration === -1) return letter + FLAT_SYMBOL;
  if (alteration === 2) return letter + DOUBLE_SHARP_SYMBOL;
  if (alteration === -2) return letter + DOUBLE_FLAT_SYMBOL;
  const symbol = alteration > 0 ? SHARP_SYMBOL : FLAT_SYMBOL;
  return letter + symbol.repeat(Math.abs(alteration));
}

/** Both enharmonic spellings of a pitch class, for root pickers. */
export function enharmonicLabel(pitchClass: PitchClass): string {
  const sharp = spellPitchClass(pitchClass, 'sharp');
  const flat = spellPitchClass(pitchClass, 'flat');
  const sharpText = formatNote(sharp);
  const flatText = formatNote(flat);
  return sharpText === flatText ? sharpText : `${sharpText}/${flatText}`;
}

export const OCTAVE = 12;

/** MIDI note 60 is middle C; octave numbering follows scientific pitch notation. */
export function midiToOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export function midiToPitchClass(midi: number): PitchClass {
  return mod12(midi);
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
