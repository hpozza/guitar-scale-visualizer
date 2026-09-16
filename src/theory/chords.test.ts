import { describe, expect, it } from 'vitest';
import { STANDARD_TUNING } from './fretboard';
import { buildScale } from './scales';
import {
  collectTriadVoicings,
  diatonicChords,
  harmonyContext,
  triadVoicing,
  TRIAD_STRING_SETS,
} from './chords';

const cMajor = buildScale({ rootPitchClass: 0, scaleId: 'ionian', preference: 'sharp' });

describe('diatonic triads', () => {
  const chords = diatonicChords(cMajor);

  it('builds the seven triads of C major', () => {
    expect(chords.map((chord) => chord.name)).toEqual([
      'C',
      'Dm',
      'Em',
      'F',
      'G',
      'Am',
      'Bdim',
    ]);
  });

  it('assigns the standard roman numerals', () => {
    expect(chords.map((chord) => chord.romanNumeral)).toEqual([
      'I',
      'ii',
      'iii',
      'IV',
      'V',
      'vi',
      'vii\u00b0',
    ]);
  });

  it('names the root, third and fifth of each triad', () => {
    expect(chords[1].triad.map((tone) => `${tone.role}:${tone.name}`)).toEqual([
      'root:D',
      'third:F',
      'fifth:A',
    ]);
  });

  it('writes chord formulas relative to the chord root', () => {
    expect(chords[0].formula).toBe('1 3 5');
    expect(chords[1].formula).toBe('1 \u266d3 5');
    expect(chords[6].formula).toBe('1 \u266d3 \u266d5');
  });

  it('names the seventh chords of C major', () => {
    expect(chords.map((chord) => chord.seventhName)).toEqual([
      'Cmaj7',
      'Dm7',
      'Em7',
      'Fmaj7',
      'G7',
      'Am7',
      'Bm7\u266d5',
    ]);
  });

  it('finds the augmented triad in harmonic minor', () => {
    const aHarmonicMinor = buildScale({
      rootPitchClass: 9,
      scaleId: 'harmonic-minor',
      preference: 'sharp',
    });
    const harmonicChords = diatonicChords(aHarmonicMinor);
    expect(harmonicChords.map((chord) => chord.name)).toEqual([
      'Am',
      'Bdim',
      'Caug',
      'Dm',
      'E',
      'F',
      'G\u266fdim',
    ]);
    expect(harmonicChords[2].quality).toBe('augmented');
    expect(harmonicChords[2].romanNumeral).toBe('III+');
    expect(harmonicChords[6].seventhName).toBe('G\u266fdim7');
  });

  it('labels the scale degree each chord is built on', () => {
    const aAeolian = buildScale({ rootPitchClass: 9, scaleId: 'aeolian', preference: 'sharp' });
    expect(diatonicChords(aAeolian).map((chord) => chord.scaleDegreeLabel)).toEqual([
      '1',
      '2',
      '\u266d3',
      '4',
      '5',
      '\u266d6',
      '\u266d7',
    ]);
  });

  it('produces nothing directly for scales without seven degrees', () => {
    const pentatonic = buildScale({
      rootPitchClass: 0,
      scaleId: 'minor-pentatonic',
      preference: 'sharp',
    });
    expect(diatonicChords(pentatonic)).toEqual([]);
  });
});

describe('harmony context', () => {
  it('uses the scale itself when it has seven notes', () => {
    const context = harmonyContext(cMajor);
    expect(context.derivedFromNote).toBeNull();
    expect(context.chords).toHaveLength(7);
  });

  it('falls back to the parent scale for pentatonic and blues scales', () => {
    const aBlues = buildScale({ rootPitchClass: 9, scaleId: 'blues', preference: 'sharp' });
    const context = harmonyContext(aBlues);
    expect(context.chords).toHaveLength(7);
    expect(context.sourceScale.definition.id).toBe('aeolian');
    expect(context.derivedFromNote).toContain('Natural Minor');
    expect(context.chords[0].name).toBe('Am');
  });

  it('keeps the chosen root spelling when deriving harmony', () => {
    const ebPentatonic = buildScale({
      rootPitchClass: 3,
      scaleId: 'minor-pentatonic',
      preference: 'flat',
    });
    expect(harmonyContext(ebPentatonic).chords[0].name).toBe('E\u266dm');
  });
});

describe('triad voicings', () => {
  const chords = diatonicChords(cMajor);
  const topSet = TRIAD_STRING_SETS[0];

  it('voices a root-position C triad on the top three strings', () => {
    const voicing = triadVoicing(STANDARD_TUNING, chords[0], 0, topSet, 0);
    expect(voicing).not.toBeNull();
    expect(voicing!.notes.map((note) => [note.stringIndex, note.fret])).toEqual([
      [3, 5],
      [4, 5],
      [5, 3],
    ]);
    expect(voicing!.notes.map((note) => note.role)).toEqual(['root', 'third', 'fifth']);
  });

  it('puts the requested chord tone in the bass of each inversion', () => {
    for (const inversion of [0, 1, 2] as const) {
      const voicing = triadVoicing(STANDARD_TUNING, chords[0], inversion, topSet, 0);
      expect(voicing!.bassRole).toBe((['root', 'third', 'fifth'] as const)[inversion]);
      expect(voicing!.notes[0].role).toBe((['root', 'third', 'fifth'] as const)[inversion]);
    }
  });

  it('keeps the voices ascending in pitch', () => {
    for (const stringSet of TRIAD_STRING_SETS) {
      for (const chord of chords) {
        for (const inversion of [0, 1, 2] as const) {
          const voicing = triadVoicing(STANDARD_TUNING, chord, inversion, stringSet, 0);
          expect(voicing).not.toBeNull();
          const midis = voicing!.notes.map((note) => note.midi);
          expect(midis[1]).toBeGreaterThan(midis[0]);
          expect(midis[2]).toBeGreaterThan(midis[1]);
        }
      }
    }
  });

  it('respects a minimum fret so voicings can be moved up the neck', () => {
    const voicing = triadVoicing(STANDARD_TUNING, chords[0], 0, topSet, 8);
    expect(voicing!.lowestFret).toBeGreaterThanOrEqual(8);
    expect(voicing!.highestFret).toBeLessThanOrEqual(24);
  });

  it('only voices notes that belong to the chord', () => {
    const allowed = new Set(chords[4].triad.map((tone) => tone.pitchClass));
    const voicing = triadVoicing(STANDARD_TUNING, chords[4], 1, TRIAD_STRING_SETS[2], 0);
    for (const note of voicing!.notes) expect(allowed.has(note.midi % 12)).toBe(true);
  });

  it('collects repeating close-position shapes up the neck', () => {
    const voicings = collectTriadVoicings(
      STANDARD_TUNING,
      chords[0],
      TRIAD_STRING_SETS[0],
      { from: 0, to: 24 },
      0,
    );
    expect(voicings.length).toBeGreaterThan(1);
    for (const voicing of voicings) {
      expect(voicing.notes).toHaveLength(3);
      expect(voicing.inversion).toBe(0);
    }
  });
});
