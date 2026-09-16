import { describe, expect, it } from 'vitest';
import { formatNote } from './notes';
import {
  buildScale,
  parentMajorPitchClass,
  SCALES,
  stepPattern,
  type Scale,
} from './scales';

function asciiNames(scale: Scale): string[] {
  return scale.tones.map((tone) => formatNote(tone.spelled, { ascii: true }));
}

function semitoneSet(scaleId: string): number[] {
  return buildScale({ rootPitchClass: 0, scaleId, preference: 'sharp' }).semitones;
}

describe('mode intervals', () => {
  it('matches the standard semitone formulas', () => {
    expect(semitoneSet('ionian')).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(semitoneSet('dorian')).toEqual([0, 2, 3, 5, 7, 9, 10]);
    expect(semitoneSet('phrygian')).toEqual([0, 1, 3, 5, 7, 8, 10]);
    expect(semitoneSet('lydian')).toEqual([0, 2, 4, 6, 7, 9, 11]);
    expect(semitoneSet('mixolydian')).toEqual([0, 2, 4, 5, 7, 9, 10]);
    expect(semitoneSet('aeolian')).toEqual([0, 2, 3, 5, 7, 8, 10]);
    expect(semitoneSet('locrian')).toEqual([0, 1, 3, 5, 6, 8, 10]);
    expect(semitoneSet('major-pentatonic')).toEqual([0, 2, 4, 7, 9]);
    expect(semitoneSet('minor-pentatonic')).toEqual([0, 3, 5, 7, 10]);
    expect(semitoneSet('blues')).toEqual([0, 3, 5, 6, 7, 10]);
    expect(semitoneSet('harmonic-minor')).toEqual([0, 2, 3, 5, 7, 8, 11]);
    expect(semitoneSet('melodic-minor')).toEqual([0, 2, 3, 5, 7, 9, 11]);
  });

  it('rotates the major scale to produce each mode', () => {
    const major = semitoneSet('ionian');
    const modes = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
    modes.forEach((modeId, index) => {
      const rotated = major
        .map((_, offset) => (major[(index + offset) % 7] - major[index] + 12) % 12)
        .toSorted((a, b) => a - b);
      expect(semitoneSet(modeId)).toEqual(rotated);
    });
  });

  it('keeps every scale ascending and inside one octave', () => {
    for (const definition of SCALES) {
      const semitones = semitoneSet(definition.id);
      expect(semitones[0]).toBe(0);
      for (let index = 1; index < semitones.length; index += 1) {
        expect(semitones[index]).toBeGreaterThan(semitones[index - 1]);
      }
      expect(semitones.at(-1)).toBeLessThan(12);
    }
  });
});

describe('scale spelling', () => {
  it('spells C major with no accidentals', () => {
    const scale = buildScale({ rootPitchClass: 0, scaleId: 'ionian', preference: 'sharp' });
    expect(asciiNames(scale)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('spells F# major with an E sharp', () => {
    const scale = buildScale({ rootPitchClass: 6, scaleId: 'ionian', preference: 'sharp' });
    expect(asciiNames(scale)).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
  });

  it('spells Gb major with a C flat', () => {
    const scale = buildScale({ rootPitchClass: 6, scaleId: 'ionian', preference: 'flat' });
    expect(asciiNames(scale)).toEqual(['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F']);
  });

  it('uses one letter per degree, never repeating a letter in a seven-note scale', () => {
    for (const definition of SCALES) {
      if (definition.degreeSpec.length !== 7) continue;
      for (let root = 0; root < 12; root += 1) {
        for (const preference of ['sharp', 'flat'] as const) {
          const scale = buildScale({ rootPitchClass: root, scaleId: definition.id, preference });
          const letters = scale.tones.map((tone) => tone.spelled.letter);
          expect(new Set(letters).size).toBe(7);
        }
      }
    }
  });

  it('spells the augmented second of harmonic minor correctly', () => {
    const scale = buildScale({ rootPitchClass: 9, scaleId: 'harmonic-minor', preference: 'sharp' });
    expect(asciiNames(scale)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
  });

  it('spells the blues b5 with the fifth letter', () => {
    const scale = buildScale({ rootPitchClass: 0, scaleId: 'blues', preference: 'sharp' });
    expect(asciiNames(scale)).toEqual(['C', 'Eb', 'F', 'Gb', 'G', 'Bb']);
  });

  it('spells Eb minor pentatonic from the flat root', () => {
    const scale = buildScale({ rootPitchClass: 3, scaleId: 'minor-pentatonic', preference: 'flat' });
    expect(asciiNames(scale)).toEqual(['Eb', 'Gb', 'Ab', 'Bb', 'Db']);
  });

  it('never needs more than a double accidental', () => {
    for (const definition of SCALES) {
      for (let root = 0; root < 12; root += 1) {
        for (const preference of ['sharp', 'flat'] as const) {
          const scale = buildScale({ rootPitchClass: root, scaleId: definition.id, preference });
          for (const tone of scale.tones) {
            expect(Math.abs(tone.spelled.alteration)).toBeLessThanOrEqual(2);
          }
        }
      }
    }
  });

  it('derives pitch classes from the root regardless of spelling', () => {
    const sharp = buildScale({ rootPitchClass: 6, scaleId: 'ionian', preference: 'sharp' });
    const flat = buildScale({ rootPitchClass: 6, scaleId: 'ionian', preference: 'flat' });
    expect(sharp.pitchClasses).toEqual(flat.pitchClasses);
  });
});

describe('scale metadata', () => {
  it('formats the interval formula from degrees', () => {
    const scale = buildScale({ rootPitchClass: 2, scaleId: 'dorian', preference: 'sharp' });
    expect(scale.formula).toBe('1 2 \u266d3 4 5 6 \u266d7');
  });

  it('describes the major scale step pattern', () => {
    expect(stepPattern([0, 2, 4, 5, 7, 9, 11])).toBe('W W H W W W H');
  });

  it('describes the minor pentatonic step pattern', () => {
    expect(stepPattern([0, 3, 5, 7, 10])).toBe('W+H W W W+H W');
  });

  it('finds the parent major scale of each mode', () => {
    const dMinor = buildScale({ rootPitchClass: 2, scaleId: 'dorian', preference: 'flat' });
    expect(parentMajorPitchClass(dMinor)).toBe(0);
    const eAeolian = buildScale({ rootPitchClass: 4, scaleId: 'aeolian', preference: 'sharp' });
    expect(parentMajorPitchClass(eAeolian)).toBe(7);
    const pentatonic = buildScale({ rootPitchClass: 0, scaleId: 'minor-pentatonic', preference: 'sharp' });
    expect(parentMajorPitchClass(pentatonic)).toBeNull();
  });

  it('rejects unknown scale ids', () => {
    expect(() => buildScale({ rootPitchClass: 0, scaleId: 'nope', preference: 'sharp' })).toThrow();
  });
});
