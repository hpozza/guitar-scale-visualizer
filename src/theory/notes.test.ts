import { describe, expect, it } from 'vitest';
import {
  enharmonicLabel,
  formatNote,
  displaySpelling,
  midiToFrequency,
  midiToOctave,
  mod12,
  pitchClassOf,
  spellPitchClass,
  spellWithLetter,
} from './notes';

describe('mod12', () => {
  it('wraps positive and negative values into 0-11', () => {
    expect(mod12(0)).toBe(0);
    expect(mod12(12)).toBe(0);
    expect(mod12(13)).toBe(1);
    expect(mod12(-1)).toBe(11);
    expect(mod12(-13)).toBe(11);
  });
});

describe('spelling', () => {
  it('spells pitch classes with sharps by preference', () => {
    const names = Array.from({ length: 12 }, (_, pc) =>
      formatNote(spellPitchClass(pc, 'sharp'), { ascii: true }),
    );
    expect(names).toEqual(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
  });

  it('spells pitch classes with flats by preference', () => {
    const names = Array.from({ length: 12 }, (_, pc) =>
      formatNote(spellPitchClass(pc, 'flat'), { ascii: true }),
    );
    expect(names).toEqual(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
  });

  it('keeps pitch calculation independent of spelling', () => {
    expect(pitchClassOf(spellPitchClass(6, 'sharp'))).toBe(6);
    expect(pitchClassOf(spellPitchClass(6, 'flat'))).toBe(6);
  });

  it('spells a pitch class against a requested letter', () => {
    expect(formatNote(spellWithLetter(5, 'E'), { ascii: true })).toBe('E#');
    expect(formatNote(spellWithLetter(11, 'C'), { ascii: true })).toBe('Cb');
    expect(formatNote(spellWithLetter(0, 'B'), { ascii: true })).toBe('B#');
    expect(formatNote(spellWithLetter(10, 'C'), { ascii: true })).toBe('Cbb');
  });

  it('renders musical symbols by default', () => {
    expect(formatNote({ letter: 'F', alteration: 1 })).toBe('F\u266f');
    expect(formatNote({ letter: 'B', alteration: -1 })).toBe('B\u266d');
    expect(formatNote({ letter: 'G', alteration: 0 })).toBe('G');
  });

  it('labels enharmonic roots with both spellings', () => {
    expect(enharmonicLabel(0)).toBe('C');
    expect(enharmonicLabel(1)).toBe('C\u266f/D\u266d');
  });

  it('respells a theoretical sharp as a flat when asked', () => {
    expect(formatNote(displaySpelling({ letter: 'F', alteration: 1 }, 'flat'), { ascii: true })).toBe(
      'Gb',
    );
    expect(formatNote(displaySpelling({ letter: 'E', alteration: 1 }, 'sharp'), { ascii: true })).toBe(
      'E#',
    );
    expect(formatNote(displaySpelling({ letter: 'G', alteration: 0 }, 'flat'), { ascii: true })).toBe(
      'G',
    );
  });
});

describe('midi helpers', () => {
  it('maps midi numbers to scientific octaves', () => {
    expect(midiToOctave(60)).toBe(4);
    expect(midiToOctave(40)).toBe(2);
    expect(midiToOctave(64)).toBe(4);
  });

  it('computes equal-tempered frequencies', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 6);
    expect(midiToFrequency(57)).toBeCloseTo(220, 6);
    expect(midiToFrequency(81)).toBeCloseTo(880, 6);
  });
});
