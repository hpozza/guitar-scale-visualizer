/**
 * Turns settings plus theory data into the exact view model the fretboard
 * renders. Keeping this pure means the visual rules live in one place instead
 * of being spread across component branches.
 */

import { chromaticDegreeLabel, type IntervalRole } from '../theory/intervals';
import {
  computeFretboardNotes,
  STANDARD_TUNING,
  stringNumber,
  validateFretRange,
  type FretboardNote,
  type FretRange,
  type Tuning,
} from '../theory/fretboard';
import { buildScale, type Scale } from '../theory/scales';
import { buildShapeSet, overlapKeys, shapeNoteKey, type Shape, type ShapeSet } from '../theory/patterns';
import {
  collectTriadVoicings,
  harmonyContext,
  TRIAD_STRING_SETS,
  type ChordToneRole,
  type DiatonicChord,
  type HarmonyContext,
  type TriadVoicing,
} from '../theory/chords';
import type { LabelMode, Settings } from './settings';

export type Emphasis = 'primary' | 'secondary' | 'muted';

export interface NoteView {
  note: FretboardNote;
  key: string;
  visible: boolean;
  emphasis: Emphasis;
  inShape: boolean;
  isShapeOverlap: boolean;
  chordRole: ChordToneRole | null;
  /** 1-3 when this note is part of the displayed triad voicing. */
  voicingPosition: number | null;
  label: string;
  role: IntervalRole;
  degreeLabel: string;
  /** Number of the string as a player counts them, 1 = high E. */
  stringNumber: number;
}

export interface BoardView {
  scale: Scale;
  tuning: Tuning;
  range: FretRange;
  rangeMessage: string | null;
  rows: NoteView[][];
  shapeSet: ShapeSet;
  activeShape: Shape | null;
  harmony: HarmonyContext;
  activeChord: DiatonicChord | null;
  voicing: TriadVoicing | null;
  /** Every close-position triad shape drawn on the current string set. */
  voicings: TriadVoicing[];
  voicingUnavailable: string | null;
  /** True when no marker at all would be drawn in the window. */
  isEmpty: boolean;
  /**
   * True when markers are drawn but every one of them is dimmed, which happens
   * when a filter excludes everything in view. The board explains this instead
   * of looking broken.
   */
  nothingHighlighted: boolean;
}

export function noteLabel(note: FretboardNote, mode: LabelMode): string {
  switch (mode) {
    case 'names':
      return note.name;
    case 'degrees':
      return note.tone ? note.tone.degreeLabel : chromaticDegreeLabel(note.semitonesFromRoot);
    case 'intervals':
      return note.interval.short;
    case 'none':
      return '';
  }
}

export function buildBoardView(settings: Settings): BoardView {
  const tuning = STANDARD_TUNING;
  const { range, message } = validateFretRange(settings.fretFrom, settings.fretTo);

  const scale = buildScale({
    rootPitchClass: settings.rootPitchClass,
    scaleId: settings.scaleId,
    preference: settings.preference,
  });

  const notes = computeFretboardNotes({ tuning, range, scale, preference: settings.preference });

  const shapeSet = buildShapeSet(tuning, scale, settings.shapeKind, settings.preference);
  const shapeIndex =
    settings.shapeIndex !== null && settings.shapeIndex < shapeSet.shapes.length
      ? settings.shapeIndex
      : null;
  const activeShape = shapeIndex === null ? null : shapeSet.shapes[shapeIndex];
  const shapeOverlap = shapeIndex === null ? new Set<string>() : overlapKeys(shapeSet.shapes, shapeIndex);

  const harmony = harmonyContext(scale, settings.preference);
  const activeChord =
    settings.chordDegree === null ? null : (harmony.chords[settings.chordDegree - 1] ?? null);

  const stringSet =
    TRIAD_STRING_SETS.find((candidate) => candidate.id === settings.stringSetId) ?? TRIAD_STRING_SETS[0];

  const voicings =
    activeChord === null
      ? []
      : collectTriadVoicings(
          tuning,
          activeChord,
          stringSet,
          range,
          settings.inversionView ? settings.inversion : 'all',
        );
  const voicing = voicings[0] ?? null;
  const voicingUnavailable =
    activeChord !== null && settings.inversionView && voicings.length === 0
      ? `There is no ${activeChord.name} voicing for ${stringSet.label.toLowerCase()} above fret ${range.from}. Lower the fret range or pick another string set.`
      : null;

  const chordRoleByPitchClass = new Map<number, ChordToneRole>();
  if (activeChord) {
    for (const tone of activeChord.triad) chordRoleByPitchClass.set(tone.pitchClass, tone.role);
    if (settings.showSevenths && activeChord.seventh) {
      chordRoleByPitchClass.set(activeChord.seventh.pitchClass, activeChord.seventh.role);
    }
  }

  const voicingByKey = new Map<string, number>();
  for (const shape of voicings) {
    shape.notes.forEach((note, index) => {
      voicingByKey.set(shapeNoteKey(note.stringIndex, note.fret), index + 1);
    });
  }

  let visibleCount = 0;
  let activeCount = 0;

  const rows = notes.map((row) =>
    row.map((note) => {
      const key = shapeNoteKey(note.stringIndex, note.fret);
      const inShape = activeShape ? activeShape.keys.has(key) : false;
      const chordRole = chordRoleByPitchClass.get(note.pitchClass) ?? null;
      const voicingPosition = voicingByKey.get(key) ?? null;

      let visible = settings.rootsOnly
        ? note.isRoot
        : settings.showAllNotes
          ? true
          : note.inScale;
      if (voicingPosition !== null) visible = true;
      if (inShape) visible = true;
      if (chordRole !== null && !note.inScale && settings.chordDegree !== null) visible = true;

      let active = true;
      if (settings.inversionView && voicings.length > 0) active = voicingPosition !== null;
      else if (activeChord) active = chordRole !== null;
      else if (settings.highlightInterval !== null)
        active = note.semitonesFromRoot === settings.highlightInterval;
      else if (activeShape) active = inShape;

      // A chord tone borrowed from the parent scale still belongs to the chord,
      // so it is drawn with its interval colour rather than as a stray note.
      const belongsToSelection =
        note.inScale || chordRole !== null || voicingPosition !== null || inShape;

      const emphasis: Emphasis = !active
        ? 'muted'
        : note.isRoot
          ? 'primary'
          : belongsToSelection
            ? 'secondary'
            : 'muted';

      if (visible) {
        visibleCount += 1;
        if (emphasis !== 'muted') activeCount += 1;
      }

      return {
        note,
        key,
        visible,
        emphasis,
        inShape,
        isShapeOverlap: inShape && shapeOverlap.has(key),
        chordRole,
        voicingPosition,
        label: noteLabel(note, settings.labelMode),
        role: belongsToSelection || note.isRoot ? note.interval.role : 'chromatic',
        degreeLabel: note.tone ? note.tone.degreeLabel : chromaticDegreeLabel(note.semitonesFromRoot),
        stringNumber: stringNumber(tuning, note.stringIndex),
      } satisfies NoteView;
    }),
  );

  return {
    scale,
    tuning,
    range,
    rangeMessage: message,
    rows,
    shapeSet,
    activeShape,
    harmony,
    activeChord,
    voicing,
    voicings,
    voicingUnavailable,
    isEmpty: visibleCount === 0,
    nothingHighlighted: visibleCount > 0 && activeCount === 0,
  };
}

export const ROLE_COLOR_VARIABLES: Record<IntervalRole, string> = {
  root: 'var(--note-root)',
  second: 'var(--note-second)',
  third: 'var(--note-third)',
  fourth: 'var(--note-fourth)',
  tritone: 'var(--note-tritone)',
  fifth: 'var(--note-fifth)',
  sixth: 'var(--note-sixth)',
  seventh: 'var(--note-seventh)',
  chromatic: 'var(--note-chromatic)',
};
