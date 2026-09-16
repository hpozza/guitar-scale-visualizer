/**
 * Scale and mode definitions plus the study copy shown in the theory panel.
 *
 * Each scale is defined by its degrees rather than a raw semitone list. The
 * degree numbers determine the letters used for spelling, so F# Ionian is
 * spelled F# G# A# B C# D# E# instead of falling back to sharp names.
 */

import {
  degreeSemitones,
  formatDegree,
  parseDegree,
  type Degree,
  type IntervalInfo,
  intervalInfo,
} from './intervals';
import {
  formatNote,
  letterIndex,
  LETTERS,
  mod12,
  pitchClassOf,
  spellPitchClass,
  spellWithLetter,
  type AccidentalPreference,
  type Letter,
  type PitchClass,
  type SpelledNote,
} from './notes';

export type ScaleFamily = 'diatonic-mode' | 'pentatonic' | 'blues' | 'minor-variant';

export interface ScaleDefinition {
  id: string;
  /** Primary display name. */
  name: string;
  /** Secondary name shown next to the primary one, if the scale has one. */
  altName?: string;
  family: ScaleFamily;
  /** Degrees in ascending order, written in compact notation. */
  degreeSpec: string[];
  /**
   * Scale used to derive diatonic harmony and spelling context when this scale
   * has fewer than seven tones.
   */
  harmonySourceId?: string;
  /** Degrees that give the scale its identity, in compact notation. */
  characteristicDegrees: string[];
  /** How the scale sounds, in plain language. */
  sound: string;
  /** Relationship to the major scale it comes from. */
  parentRelation: string;
  /** Concrete practice instruction. */
  practice: string;
}

export const SCALES: ScaleDefinition[] = [
  {
    id: 'ionian',
    name: 'Major',
    altName: 'Ionian',
    family: 'diatonic-mode',
    degreeSpec: ['1', '2', '3', '4', '5', '6', '7'],
    characteristicDegrees: ['3', '7'],
    sound: 'Bright, settled and resolved. The major third and major seventh pull strongly back to the root.',
    parentRelation: 'This is the parent major scale itself — the first mode.',
    practice:
      'Play the scale up and down between frets 5 and 12, stopping on the root each time so your ear memorises where home is.',
  },
  {
    id: 'dorian',
    name: 'Dorian',
    family: 'diatonic-mode',
    degreeSpec: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    characteristicDegrees: ['b3', '6'],
    sound: 'Minor but hopeful. The natural sixth lifts the minor third and keeps it from sounding sad.',
    parentRelation: 'Second mode of the major scale a whole step below the root.',
    practice:
      'Loop a minor vamp and land on the natural 6th. Compare it against the b6 of Aeolian to hear the difference.',
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    family: 'diatonic-mode',
    degreeSpec: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    characteristicDegrees: ['b2'],
    sound: 'Dark and Spanish-tinged. The flat second next to the root creates an immediate half-step tension.',
    parentRelation: 'Third mode of the major scale a major third below the root.',
    practice:
      'Play root, b2, root on the low strings, then run the scale up one string pair at a time to keep the b2 in your ear.',
  },
  {
    id: 'lydian',
    name: 'Lydian',
    family: 'diatonic-mode',
    degreeSpec: ['1', '2', '3', '#4', '5', '6', '7'],
    characteristicDegrees: ['#4'],
    sound: 'Floating and wide open. The raised fourth makes the major scale feel suspended rather than grounded.',
    parentRelation: 'Fourth mode of the major scale a perfect fourth below the root.',
    practice:
      'Hold the root on a low string and pick out the #4 above it on the same fret area so the interval stays obvious.',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    family: 'diatonic-mode',
    degreeSpec: ['1', '2', '3', '4', '5', '6', 'b7'],
    characteristicDegrees: ['3', 'b7'],
    sound: 'Major with a bluesy edge. The flat seventh removes the pull of a leading tone and sits well on dominant chords.',
    parentRelation: 'Fifth mode of the major scale a perfect fifth below the root.',
    practice:
      'Play over a dominant 7th chord and resolve phrases from the b7 down to the 5th to hear the mode settle.',
  },
  {
    id: 'aeolian',
    name: 'Natural Minor',
    altName: 'Aeolian',
    family: 'diatonic-mode',
    degreeSpec: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    characteristicDegrees: ['b3', 'b6'],
    sound: 'The standard minor sound. The flat sixth gives it weight and a touch of melancholy.',
    parentRelation: 'Sixth mode of the relative major scale a minor third above the root.',
    practice:
      'Practise the relative major connection: play the minor scale, then the same notes starting from the b3.',
  },
  {
    id: 'locrian',
    name: 'Locrian',
    family: 'diatonic-mode',
    degreeSpec: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
    characteristicDegrees: ['b2', 'b5'],
    sound: 'Unstable and tense. With a flat fifth the tonic chord is diminished, so the scale never truly rests.',
    parentRelation: 'Seventh mode of the major scale a semitone above the root.',
    practice:
      'Use it over a m7b5 chord for two bars, then resolve to the tonic minor a fourth below to feel its function.',
  },
  {
    id: 'major-pentatonic',
    name: 'Major Pentatonic',
    family: 'pentatonic',
    degreeSpec: ['1', '2', '3', '5', '6'],
    harmonySourceId: 'ionian',
    characteristicDegrees: ['3', '6'],
    sound: 'Open and consonant. Removing the 4th and 7th takes out every half step, so nothing clashes.',
    parentRelation: 'The major scale with the 4th and 7th removed.',
    practice: 'Play box 1 and box 2 back to back and find the shared notes where the two shapes overlap.',
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor Pentatonic',
    family: 'pentatonic',
    degreeSpec: ['1', 'b3', '4', '5', 'b7'],
    harmonySourceId: 'aeolian',
    characteristicDegrees: ['b3', 'b7'],
    sound: 'The core rock and blues vocabulary. Strong, vocal and forgiving in any minor context.',
    parentRelation: 'The natural minor scale with the 2nd and b6 removed.',
    practice: 'Work box 1 with bends on the 4th and b7, then shift to box 2 without looking at the fretboard.',
  },
  {
    id: 'blues',
    name: 'Blues Scale',
    family: 'blues',
    degreeSpec: ['1', 'b3', '4', 'b5', '5', 'b7'],
    harmonySourceId: 'aeolian',
    characteristicDegrees: ['b5'],
    sound: 'Minor pentatonic with a passing flat fifth. The added note is a colour tone, not a resting place.',
    parentRelation: 'Minor pentatonic plus the chromatic b5 between the 4th and 5th.',
    practice: 'Approach the b5 from the 4th and leave it immediately for the 5th so it stays a passing note.',
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    family: 'minor-variant',
    degreeSpec: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    characteristicDegrees: ['b6', '7'],
    sound: 'Minor with a dramatic leading tone. The augmented second between b6 and 7 is the signature sound.',
    parentRelation: 'Natural minor with a raised seventh, which creates a dominant chord on the fifth degree.',
    practice: 'Play the b6 to 7 jump slowly on one string so the augmented second is unmistakable.',
  },
  {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    family: 'minor-variant',
    degreeSpec: ['1', '2', 'b3', '4', '5', '6', '7'],
    characteristicDegrees: ['b3', '7'],
    sound: 'Minor third with a major upper half. Smooth ascending, and the basis of modern jazz minor harmony.',
    parentRelation: 'Natural minor with a raised sixth and seventh, ascending form.',
    practice:
      'Compare it directly with Dorian: only the seventh changes, so alternate the two over the same minor chord.',
  },
];

export const SCALES_BY_ID: Record<string, ScaleDefinition> = Object.fromEntries(
  SCALES.map((scale) => [scale.id, scale]),
);

export function getScale(id: string): ScaleDefinition | undefined {
  return SCALES_BY_ID[id];
}

export interface ScaleTone {
  degree: Degree;
  degreeLabel: string;
  semitones: number;
  pitchClass: PitchClass;
  spelled: SpelledNote;
  name: string;
  interval: IntervalInfo;
}

export interface Scale {
  definition: ScaleDefinition;
  rootPitchClass: PitchClass;
  rootSpelled: SpelledNote;
  rootName: string;
  tones: ScaleTone[];
  /** Pitch classes in the scale, ascending from the root. */
  pitchClasses: PitchClass[];
  /** Semitone offsets from the root, ascending. */
  semitones: number[];
  /** Interval formula in compact degree notation, e.g. "1 2 b3 4 5 6 b7". */
  formula: string;
  /** Step pattern in whole/half steps, e.g. "W H W W H W W". */
  stepPattern: string;
}

/**
 * Spell a degree relative to a root. The degree number selects the letter and
 * the pitch class then determines the accidental, which is what keeps
 * theoretical spellings correct.
 */
export function spellDegree(root: SpelledNote, degree: Degree): SpelledNote {
  const targetLetter: Letter = LETTERS[(letterIndex(root.letter) + degree.number - 1) % 7];
  const targetPitchClass = mod12(pitchClassOf(root) + degreeSemitones(degree));
  return spellWithLetter(targetPitchClass, targetLetter);
}

export interface BuildScaleOptions {
  rootPitchClass: PitchClass;
  scaleId: string;
  preference: AccidentalPreference;
  /** Override the root spelling, e.g. to keep a user-picked "Eb" as Eb. */
  rootSpelling?: SpelledNote;
}

export function buildScale(options: BuildScaleOptions): Scale {
  const definition = getScale(options.scaleId);
  if (!definition) throw new Error(`Unknown scale: ${options.scaleId}`);

  const rootPitchClass = mod12(options.rootPitchClass);
  const rootSpelled =
    options.rootSpelling ?? spellPitchClass(rootPitchClass, options.preference);

  const tones: ScaleTone[] = definition.degreeSpec.map((spec) => {
    const degree = parseDegree(spec);
    const semitones = degreeSemitones(degree);
    const pitchClass = mod12(rootPitchClass + semitones);
    const spelled = spellDegree(rootSpelled, degree);
    return {
      degree,
      degreeLabel: formatDegree(degree),
      semitones,
      pitchClass,
      spelled,
      name: formatNote(spelled),
      interval: intervalInfo(semitones),
    };
  });

  const semitones = tones.map((tone) => tone.semitones);

  return {
    definition,
    rootPitchClass,
    rootSpelled,
    rootName: formatNote(rootSpelled),
    tones,
    pitchClasses: tones.map((tone) => tone.pitchClass),
    semitones,
    formula: tones.map((tone) => tone.degreeLabel).join(' '),
    stepPattern: stepPattern(semitones),
  };
}

export function stepPattern(semitones: number[]): string {
  const steps: string[] = [];
  for (let index = 0; index < semitones.length; index += 1) {
    const current = semitones[index];
    const next = index === semitones.length - 1 ? 12 : semitones[index + 1];
    const distance = next - current;
    steps.push(distance === 1 ? 'H' : distance === 2 ? 'W' : distance === 3 ? 'W+H' : `${distance}`);
  }
  return steps.join(' ');
}

/** Scale used for diatonic harmony — itself, or its seven-note source. */
export function harmonySourceScaleId(definition: ScaleDefinition): string {
  return definition.degreeSpec.length === 7 ? definition.id : (definition.harmonySourceId ?? definition.id);
}

/** Pitch class of the parent major scale whose notes match this mode. */
export function parentMajorPitchClass(scale: Scale): PitchClass | null {
  if (scale.definition.family !== 'diatonic-mode') return null;
  const modeIndex = DIATONIC_MODE_ORDER.indexOf(scale.definition.id);
  if (modeIndex < 0) return null;
  return mod12(scale.rootPitchClass - MAJOR_DEGREE_OFFSETS[modeIndex]);
}

export const DIATONIC_MODE_ORDER = [
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
];

const MAJOR_DEGREE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
