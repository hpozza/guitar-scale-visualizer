import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import { buildBoardView, noteLabel } from './derived';
import { computeFretboardNotes, STANDARD_TUNING } from '../theory/fretboard';
import { buildScale } from '../theory/scales';

function view(overrides: Partial<Settings> = {}) {
  return buildBoardView({ ...DEFAULT_SETTINGS, ...overrides });
}

function flat(rows: ReturnType<typeof view>['rows']) {
  return rows.flat();
}

describe('board view visibility', () => {
  it('shows only scale notes by default', () => {
    const board = view();
    const visible = flat(board.rows).filter((item) => item.visible);
    expect(visible.length).toBeGreaterThan(0);
    for (const item of visible) expect(item.note.inScale).toBe(true);
  });

  it('shows every chromatic note when asked', () => {
    const board = view({ showAllNotes: true });
    expect(flat(board.rows).every((item) => item.visible)).toBe(true);
  });

  it('shows only roots in roots-only mode', () => {
    const board = view({ rootsOnly: true });
    const visible = flat(board.rows).filter((item) => item.visible);
    expect(visible.length).toBeGreaterThan(0);
    for (const item of visible) expect(item.note.isRoot).toBe(true);
  });

  it('gives roots the strongest emphasis', () => {
    const board = view();
    for (const item of flat(board.rows)) {
      if (item.note.isRoot) expect(item.emphasis).toBe('primary');
    }
  });
});

describe('shape focus', () => {
  it('dims notes outside the selected shape', () => {
    const board = view({ shapeIndex: 0, shapeKind: 'pentatonic-box' });
    expect(board.activeShape?.name).toBe('Box 1');
    const inside = flat(board.rows).filter((item) => item.inShape);
    const outside = flat(board.rows).filter((item) => item.visible && !item.inShape);
    expect(inside.length).toBeGreaterThan(0);
    for (const item of outside) expect(item.emphasis).toBe('muted');
  });

  it('marks the notes shared with the neighbouring shapes', () => {
    const board = view({ shapeIndex: 0 });
    const overlaps = flat(board.rows).filter((item) => item.isShapeOverlap);
    expect(overlaps.length).toBeGreaterThan(0);
    for (const item of overlaps) expect(item.inShape).toBe(true);
  });

  it('ignores a stale shape index when the shape set is smaller', () => {
    const board = view({ scaleId: 'ionian', shapeKind: 'pentatonic-box', shapeIndex: 4 });
    expect(board.shapeSet.shapes).toEqual([]);
    expect(board.activeShape).toBeNull();
    expect(board.shapeSet.unavailableReason).not.toBeNull();
  });

  it('builds three-notes-per-string patterns from the parent scale of a pentatonic', () => {
    const board = view({
      scaleId: 'minor-pentatonic',
      shapeKind: 'three-notes-per-string',
      shapeIndex: 0,
    });
    expect(board.activeShape?.name).toBe('Pattern 1');
    expect(board.activeShape?.notes).toHaveLength(18);
    expect(board.shapeSet.derivedFromNote).toContain('Natural Minor');
    const inside = flat(board.rows).filter((item) => item.inShape && item.visible);
    expect(inside).toHaveLength(18);
  });
});

describe('chord focus', () => {
  it('tags root, third and fifth of the selected chord', () => {
    const board = view({ scaleId: 'ionian', rootPitchClass: 0, chordDegree: 2 });
    expect(board.activeChord?.name).toBe('Dm');
    const roles = new Set(
      flat(board.rows)
        .filter((item) => item.chordRole)
        .map((item) => `${item.chordRole}:${item.note.name}`),
    );
    expect(roles).toContain('root:D');
    expect(roles).toContain('third:F');
    expect(roles).toContain('fifth:A');
  });

  it('adds the seventh only when seventh chords are shown', () => {
    const withoutSevenths = view({ scaleId: 'ionian', rootPitchClass: 0, chordDegree: 1 });
    expect(flat(withoutSevenths.rows).some((item) => item.chordRole === 'seventh')).toBe(false);
    const withSevenths = view({
      scaleId: 'ionian',
      rootPitchClass: 0,
      chordDegree: 1,
      showSevenths: true,
    });
    expect(flat(withSevenths.rows).some((item) => item.chordRole === 'seventh')).toBe(true);
  });

  it('shows a chord tone borrowed from the parent scale with its interval colour', () => {
    // VI in A minor is F major, and F is not one of the five pentatonic notes.
    const board = view({ scaleId: 'minor-pentatonic', rootPitchClass: 9, chordDegree: 6 });
    expect(board.activeChord?.name).toBe('F');
    const borrowed = flat(board.rows).filter((item) => item.note.name === 'F');
    expect(borrowed.length).toBeGreaterThan(0);
    for (const item of borrowed) {
      expect(item.visible).toBe(true);
      expect(item.emphasis).toBe('secondary');
      expect(item.role).not.toBe('chromatic');
    }
  });

  it('dims scale notes that are not in the chord', () => {
    const board = view({ scaleId: 'ionian', rootPitchClass: 0, chordDegree: 4 });
    const nonChord = flat(board.rows).filter((item) => item.visible && !item.chordRole);
    expect(nonChord.length).toBeGreaterThan(0);
    for (const item of nonChord) expect(item.emphasis).toBe('muted');
  });

  it('shows triad voicings and dims everything else in inversion view', () => {
    const board = view({
      scaleId: 'ionian',
      rootPitchClass: 0,
      chordDegree: 1,
      inversionView: true,
      inversion: 1,
      stringSetId: '123',
      fretFrom: 0,
      fretTo: 15,
    });
    expect(board.voicing?.bassRole).toBe('third');
    expect(board.voicings.length).toBeGreaterThan(0);
    const voiced = flat(board.rows).filter((item) => item.voicingPosition !== null);
    expect(voiced.length).toBe(board.voicings.length * 3);
    for (const item of voiced) expect(item.emphasis).not.toBe('muted');
    const others = flat(board.rows).filter((item) => item.visible && item.voicingPosition === null);
    for (const item of others) expect(item.emphasis).toBe('muted');
    expect(board.voicingUnavailable).toBeNull();
  });

  it('marks close-position triad shapes when a chord is selected', () => {
    const board = view({ scaleId: 'ionian', rootPitchClass: 0, chordDegree: 1 });
    expect(board.voicings.length).toBeGreaterThan(0);
    const voiced = flat(board.rows).filter((item) => item.voicingPosition !== null);
    expect(voiced.length).toBeGreaterThanOrEqual(3);
    for (const item of voiced) expect(item.chordRole).not.toBeNull();
  });

  it('respells fretboard names when the accidental preference changes', () => {
    const sharp = view({ scaleId: 'ionian', rootPitchClass: 7, preference: 'sharp' });
    const flats = view({ scaleId: 'ionian', rootPitchClass: 7, preference: 'flat' });
    expect(flat(sharp.rows).some((item) => item.note.name === 'F\u266f')).toBe(true);
    expect(flat(flats.rows).some((item) => item.note.name === 'G\u266d')).toBe(true);
  });

  it('opens the full 24-fret neck by default', () => {
    expect(view().range).toEqual({ from: 0, to: 24 });
  });
});

describe('interval highlighting', () => {
  it('keeps only the matching interval active', () => {
    const board = view({ showAllNotes: true, highlightInterval: 7 });
    for (const item of flat(board.rows)) {
      if (item.note.semitonesFromRoot === 7) expect(item.emphasis).not.toBe('muted');
      else expect(item.emphasis).toBe('muted');
    }
  });
});

describe('labels', () => {
  const scale = buildScale({ rootPitchClass: 0, scaleId: 'ionian', preference: 'sharp' });
  const [lowE] = computeFretboardNotes({
    tuning: STANDARD_TUNING,
    range: { from: 0, to: 3 },
    scale,
    preference: 'sharp',
  });

  it('renders each label mode', () => {
    expect(noteLabel(lowE[0], 'names')).toBe('E');
    expect(noteLabel(lowE[0], 'degrees')).toBe('3');
    expect(noteLabel(lowE[0], 'intervals')).toBe('M3');
    expect(noteLabel(lowE[0], 'none')).toBe('');
  });

  it('labels out-of-scale notes with a chromatic degree', () => {
    expect(noteLabel(lowE[2], 'degrees')).toBe('\u266d5');
  });
});

describe('range handling', () => {
  it('reports a corrected fret range', () => {
    const board = view({ fretFrom: 20, fretTo: 3 });
    expect(board.range).toEqual({ from: 3, to: 20 });
    expect(board.rangeMessage).toMatch(/swapped/);
  });

  it('flags a filter that dims everything in view', () => {
    const board = view({ scaleId: 'major-pentatonic', highlightInterval: 1 });
    expect(board.isEmpty).toBe(false);
    expect(board.nothingHighlighted).toBe(true);
  });

  it('is neither empty nor fully dimmed in the default configuration', () => {
    const board = view();
    expect(board.isEmpty).toBe(false);
    expect(board.nothingHighlighted).toBe(false);
  });
});
