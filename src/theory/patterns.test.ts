import { describe, expect, it } from 'vitest';
import { STANDARD_TUNING } from './fretboard';
import { buildScale } from './scales';
import {
  buildShapeSet,
  overlapKeys,
  pentatonicBoxes,
  shapeNoteKey,
  threeNotesPerStringShapes,
  type Shape,
} from './patterns';

/** Frets per string, low to high, the way a shape diagram is written out. */
function fretRows(shape: Shape): number[][] {
  const rows: number[][] = [[], [], [], [], [], []];
  for (const note of shape.notes) rows[note.stringIndex].push(note.fret);
  return rows;
}

const aMinorPentatonic = buildScale({
  rootPitchClass: 9,
  scaleId: 'minor-pentatonic',
  preference: 'sharp',
});

describe('pentatonic boxes', () => {
  const boxes = pentatonicBoxes(STANDARD_TUNING, aMinorPentatonic);

  it('produces five boxes with twelve notes each', () => {
    expect(boxes).toHaveLength(5);
    for (const box of boxes) expect(box.notes).toHaveLength(12);
  });

  it('matches the A minor pentatonic box 1 at the fifth fret', () => {
    expect(fretRows(boxes[0])).toEqual([
      [5, 8],
      [5, 7],
      [5, 7],
      [5, 7],
      [5, 8],
      [5, 8],
    ]);
  });

  it('matches the A minor pentatonic box 2 at the eighth fret', () => {
    expect(fretRows(boxes[1])).toEqual([
      [8, 10],
      [7, 10],
      [7, 10],
      [7, 9],
      [8, 10],
      [8, 10],
    ]);
  });

  it('matches the A minor pentatonic box 5 at the third fret', () => {
    expect(fretRows(boxes[4])).toEqual([
      [3, 5],
      [3, 5],
      [2, 5],
      [2, 5],
      [3, 5],
      [3, 5],
    ]);
  });

  it('labels each box with the scale degree it starts on', () => {
    expect(boxes.map((box) => box.lowestDegreeLabel)).toEqual([
      '1',
      '\u266d3',
      '4',
      '5',
      '\u266d7',
    ]);
  });

  it('only contains notes from the scale', () => {
    const allowed = new Set(aMinorPentatonic.pitchClasses);
    for (const box of boxes) {
      for (const note of box.notes) expect(allowed.has(note.midi % 12)).toBe(true);
    }
  });

  it('stays on the neck for all twelve roots', () => {
    for (let root = 0; root < 12; root += 1) {
      for (const scaleId of ['minor-pentatonic', 'major-pentatonic']) {
        const scale = buildScale({ rootPitchClass: root, scaleId, preference: 'sharp' });
        const shapes = pentatonicBoxes(STANDARD_TUNING, scale);
        expect(shapes).toHaveLength(5);
        for (const shape of shapes) {
          expect(shape.lowestFret).toBeGreaterThanOrEqual(0);
          expect(shape.highestFret).toBeLessThanOrEqual(24);
        }
      }
    }
  });

  it('moves with the root: the C minor pentatonic box 1 sits three frets higher', () => {
    const cMinor = buildScale({ rootPitchClass: 0, scaleId: 'minor-pentatonic', preference: 'flat' });
    const [box1] = pentatonicBoxes(STANDARD_TUNING, cMinor);
    expect(box1.lowestFret).toBe(8);
  });

  it('returns nothing for scales that are not pentatonic', () => {
    const cMajor = buildScale({ rootPitchClass: 0, scaleId: 'ionian', preference: 'sharp' });
    expect(pentatonicBoxes(STANDARD_TUNING, cMajor)).toEqual([]);
  });
});

describe('three notes per string', () => {
  const cMajor = buildScale({ rootPitchClass: 0, scaleId: 'ionian', preference: 'sharp' });
  const patterns = threeNotesPerStringShapes(STANDARD_TUNING, cMajor);

  it('produces seven patterns with eighteen notes each', () => {
    expect(patterns).toHaveLength(7);
    for (const pattern of patterns) expect(pattern.notes).toHaveLength(18);
  });

  it('matches the C major pattern rooted on the eighth fret', () => {
    expect(fretRows(patterns[0])).toEqual([
      [8, 10, 12],
      [8, 10, 12],
      [9, 10, 12],
      [9, 10, 12],
      [10, 12, 13],
      [10, 12, 13],
    ]);
  });

  it('starts each pattern on the next scale degree', () => {
    expect(patterns.map((pattern) => pattern.lowestDegreeLabel)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]);
  });

  it('puts exactly three notes on every string', () => {
    for (const pattern of patterns) {
      const rows = fretRows(pattern);
      for (const row of rows) expect(row).toHaveLength(3);
    }
  });

  it('works for every seven-note scale and root', () => {
    for (const scaleId of ['ionian', 'dorian', 'locrian', 'harmonic-minor', 'melodic-minor']) {
      for (let root = 0; root < 12; root += 1) {
        const scale = buildScale({ rootPitchClass: root, scaleId, preference: 'sharp' });
        const shapes = threeNotesPerStringShapes(STANDARD_TUNING, scale);
        expect(shapes).toHaveLength(7);
        for (const shape of shapes) {
          expect(shape.lowestFret).toBeGreaterThanOrEqual(0);
          expect(shape.highestFret).toBeLessThanOrEqual(24);
        }
      }
    }
  });

  it('returns nothing for a pentatonic scale', () => {
    expect(threeNotesPerStringShapes(STANDARD_TUNING, aMinorPentatonic)).toEqual([]);
  });
});

describe('shape sets', () => {
  it('explains why pentatonic boxes are unavailable', () => {
    const cMajor = buildScale({ rootPitchClass: 0, scaleId: 'ionian', preference: 'sharp' });
    const set = buildShapeSet(STANDARD_TUNING, cMajor, 'pentatonic-box');
    expect(set.shapes).toEqual([]);
    expect(set.unavailableReason).toContain('five-note');
  });

  it('explains why three-notes-per-string is unavailable', () => {
    const set = buildShapeSet(STANDARD_TUNING, aMinorPentatonic, 'three-notes-per-string');
    expect(set.shapes).toHaveLength(7);
    expect(set.derivedFromNote).toContain('Natural Minor');
    expect(set.unavailableReason).toBeNull();
  });

  it('finds the overlap between adjacent boxes', () => {
    const boxes = pentatonicBoxes(STANDARD_TUNING, aMinorPentatonic);
    const overlap = overlapKeys(boxes, 0);
    expect(overlap.size).toBeGreaterThan(0);
    expect(overlap.has(shapeNoteKey(0, 8))).toBe(true);
    for (const key of overlap) expect(boxes[0].keys.has(key)).toBe(true);
  });
});
