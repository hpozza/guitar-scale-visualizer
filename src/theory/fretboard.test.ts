import { describe, expect, it } from 'vitest';
import { formatNote } from './notes';
import { buildScale } from './scales';
import {
  buildFretGeometry,
  computeFretboardNotes,
  fretDistanceRatio,
  hasInlay,
  INLAY_FRETS,
  isOctaveFret,
  MAX_FRET,
  midiAt,
  STANDARD_TUNING,
  stringLabel,
  stringNumber,
  validateFretRange,
} from './fretboard';

describe('standard tuning', () => {
  it('uses E2 A2 D3 G3 B3 E4', () => {
    expect(STANDARD_TUNING.openMidi).toEqual([40, 45, 50, 55, 59, 64]);
  });

  it('names open strings low to high', () => {
    const labels = STANDARD_TUNING.openMidi.map((_, index) => stringLabel(STANDARD_TUNING, index));
    expect(labels).toEqual(['E', 'A', 'D', 'G', 'B', 'e']);
  });

  it('numbers the high E as string 1', () => {
    expect(stringNumber(STANDARD_TUNING, 5)).toBe(1);
    expect(stringNumber(STANDARD_TUNING, 0)).toBe(6);
  });

  it('adds one semitone per fret', () => {
    expect(midiAt(STANDARD_TUNING, 0, 0)).toBe(40);
    expect(midiAt(STANDARD_TUNING, 0, 12)).toBe(52);
    expect(midiAt(STANDARD_TUNING, 5, 24)).toBe(88);
  });
});

describe('fretboard note calculation', () => {
  const cMajor = buildScale({ rootPitchClass: 0, scaleId: 'ionian', preference: 'sharp' });

  it('computes the low E string notes of C major', () => {
    const [lowE] = computeFretboardNotes({
      tuning: STANDARD_TUNING,
      range: { from: 0, to: 12 },
      scale: cMajor,
      preference: 'sharp',
    });
    const inScale = lowE.filter((note) => note.inScale).map((note) => `${note.fret}:${formatNote(note.spelled, { ascii: true })}`);
    expect(inScale).toEqual(['0:E', '1:F', '3:G', '5:A', '7:B', '8:C', '10:D', '12:E']);
  });

  it('marks every root on the neck', () => {
    const strings = computeFretboardNotes({
      tuning: STANDARD_TUNING,
      range: { from: 0, to: MAX_FRET },
      scale: buildScale({ rootPitchClass: 9, scaleId: 'minor-pentatonic', preference: 'sharp' }),
      preference: 'sharp',
    });
    const roots = strings[0].filter((note) => note.isRoot).map((note) => note.fret);
    expect(roots).toEqual([5, 17]);
  });

  it('labels intervals relative to the root', () => {
    const strings = computeFretboardNotes({
      tuning: STANDARD_TUNING,
      range: { from: 0, to: 5 },
      scale: cMajor,
      preference: 'sharp',
    });
    const openLowE = strings[0][0];
    expect(openLowE.semitonesFromRoot).toBe(4);
    expect(openLowE.interval.short).toBe('M3');
    expect(openLowE.tone?.degreeLabel).toBe('3');
    expect(openLowE.octave).toBe(2);
  });

  it('spells out-of-scale notes with the accidental preference', () => {
    const strings = computeFretboardNotes({
      tuning: STANDARD_TUNING,
      range: { from: 0, to: 2 },
      scale: cMajor,
      preference: 'flat',
    });
    const fSharpOnLowE = strings[0][2];
    expect(fSharpOnLowE.inScale).toBe(false);
    expect(formatNote(fSharpOnLowE.spelled, { ascii: true })).toBe('Gb');
  });

  it('spells in-scale accidentals with the accidental preference', () => {
    const gMajor = buildScale({ rootPitchClass: 7, scaleId: 'ionian', preference: 'flat' });
    const strings = computeFretboardNotes({
      tuning: STANDARD_TUNING,
      range: { from: 0, to: 3 },
      scale: gMajor,
      preference: 'flat',
    });
    const fSharpOnLowE = strings[0][2];
    expect(fSharpOnLowE.inScale).toBe(true);
    expect(formatNote(fSharpOnLowE.spelled, { ascii: true })).toBe('Gb');
  });

  it('keeps theoretical sharps when the sharp preference is selected', () => {
    const cSharpMajor = buildScale({ rootPitchClass: 1, scaleId: 'ionian', preference: 'sharp' });
    const strings = computeFretboardNotes({
      tuning: STANDARD_TUNING,
      range: { from: 0, to: 1 },
      scale: cSharpMajor,
      preference: 'sharp',
    });
    const eSharp = strings[0][1];
    expect(eSharp.inScale).toBe(true);
    expect(formatNote(eSharp.spelled, { ascii: true })).toBe('E#');
  });

  it('returns one row per string and one note per fret in range', () => {
    const strings = computeFretboardNotes({
      tuning: STANDARD_TUNING,
      range: { from: 3, to: 9 },
      scale: cMajor,
      preference: 'sharp',
    });
    expect(strings).toHaveLength(6);
    for (const row of strings) {
      expect(row).toHaveLength(7);
      expect(row[0].fret).toBe(3);
      expect(row.at(-1)?.fret).toBe(9);
    }
  });
});

describe('fret range validation', () => {
  it('accepts a normal range unchanged', () => {
    const result = validateFretRange(0, 12);
    expect(result.range).toEqual({ from: 0, to: 12 });
    expect(result.message).toBeNull();
  });

  it('swaps a reversed range', () => {
    const result = validateFretRange(15, 4);
    expect(result.range).toEqual({ from: 4, to: 15 });
    expect(result.message).toMatch(/swapped/);
  });

  it('clamps out-of-neck values', () => {
    const result = validateFretRange(-5, 40);
    expect(result.range).toEqual({ from: 0, to: 24 });
    expect(result.message).toMatch(/nut/);
  });

  it('widens a range that is too narrow to read', () => {
    const result = validateFretRange(7, 7);
    expect(result.range).toEqual({ from: 7, to: 9 });
    expect(result.message).toMatch(/widened/);
  });

  it('keeps a too-narrow range at the top of the neck inside the neck', () => {
    const result = validateFretRange(24, 24);
    expect(result.range).toEqual({ from: 22, to: 24 });
  });

  it('falls back to the full neck for non-numeric input', () => {
    const result = validateFretRange(Number.NaN, Number.NaN);
    expect(result.range).toEqual({ from: 0, to: 24 });
    expect(result.message).toMatch(/not a number/);
  });
});

describe('fret geometry', () => {
  it('places fret 12 at half the scale length', () => {
    expect(fretDistanceRatio(12)).toBeCloseTo(0.5, 10);
    expect(fretDistanceRatio(0)).toBe(0);
    expect(fretDistanceRatio(24)).toBeCloseTo(0.75, 10);
  });

  it('narrows cells toward the bridge', () => {
    const geometry = buildFretGeometry({ range: { from: 0, to: 24 } });
    const played = geometry.cells.filter((cell) => cell.fret > 0);
    for (let index = 1; index < played.length; index += 1) {
      expect(played[index].width).toBeLessThanOrEqual(played[index - 1].width);
    }
    expect(played.at(-1)!.width).toBeLessThan(played[0].width);
  });

  it('keeps every cell wide enough for a note label', () => {
    const geometry = buildFretGeometry({ range: { from: 0, to: 24 } });
    for (const cell of geometry.cells) expect(cell.width).toBeGreaterThanOrEqual(34);
  });

  it('lays cells out contiguously and reports the total width', () => {
    const geometry = buildFretGeometry({ range: { from: 5, to: 12 } });
    expect(geometry.cells).toHaveLength(8);
    expect(geometry.nutX).toBeNull();
    let expectedX = 0;
    for (const cell of geometry.cells) {
      expect(cell.x).toBeCloseTo(expectedX, 6);
      expect(cell.center).toBeCloseTo(cell.x + cell.width / 2, 6);
      expectedX += cell.width;
    }
    expect(geometry.totalWidth).toBeCloseTo(expectedX, 6);
  });

  it('reserves a nut column when the range starts at fret 0', () => {
    const geometry = buildFretGeometry({ range: { from: 0, to: 5 }, openColumnWidth: 40 });
    expect(geometry.nutX).toBe(40);
    expect(geometry.cellByFret.get(0)?.width).toBe(40);
  });
});

describe('inlays', () => {
  it('marks the standard inlay frets', () => {
    expect(INLAY_FRETS).toEqual([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);
    expect(hasInlay(3)).toBe(true);
    expect(hasInlay(4)).toBe(false);
    expect(hasInlay(24)).toBe(true);
  });

  it('treats 12 and 24 as octave frets', () => {
    expect(isOctaveFret(12)).toBe(true);
    expect(isOctaveFret(24)).toBe(true);
    expect(isOctaveFret(7)).toBe(false);
  });
});
