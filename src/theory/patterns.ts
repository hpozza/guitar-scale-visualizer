/**
 * Movable fretboard shapes: pentatonic boxes and three-notes-per-string
 * positions.
 *
 * Shapes are generated rather than stored as fret tables. A position is built
 * by walking the scale upward in pitch and handing a fixed number of notes to
 * each string in turn, which is exactly how these shapes are constructed on the
 * instrument — so every shape stays correct for any root and any scale.
 */

import { mod12, type AccidentalPreference } from './notes';
import { buildScale, harmonySourceScaleId, type Scale } from './scales';
import { MAX_FRET, type Tuning } from './fretboard';

export interface ShapeNote {
  stringIndex: number;
  fret: number;
  midi: number;
}

export interface Shape {
  id: string;
  /** Short label, e.g. "Box 1" or "Pattern 3". */
  name: string;
  /** Degree label of the lowest note of the shape, e.g. "b3". */
  lowestDegreeLabel: string;
  notes: ShapeNote[];
  lowestFret: number;
  highestFret: number;
  /** Notes keyed as `${stringIndex}:${fret}` for quick membership checks. */
  keys: Set<string>;
}

export type ShapeKind = 'pentatonic-box' | 'three-notes-per-string';

export function shapeNoteKey(stringIndex: number, fret: number): string {
  return `${stringIndex}:${fret}`;
}

/** Lowest fret at or above `minFret` on a string that sounds the pitch class. */
function lowestFretForPitchClass(
  tuning: Tuning,
  stringIndex: number,
  pitchClass: number,
  minFret: number,
): number {
  const open = mod12(tuning.openMidi[stringIndex]);
  const offset = mod12(pitchClass - open);
  let fret = offset;
  while (fret < minFret) fret += 12;
  return fret;
}

function nextScaleMidi(midi: number, pitchClasses: Set<number>): number {
  let candidate = midi + 1;
  while (!pitchClasses.has(mod12(candidate))) candidate += 1;
  return candidate;
}

interface PositionOptions {
  tuning: Tuning;
  scale: Scale;
  notesPerString: number;
  /** Index into the scale's tones that starts the shape on the lowest string. */
  startToneIndex: number;
  maxFret?: number;
}

/**
 * Build one position by assigning consecutive ascending scale pitches to the
 * strings, `notesPerString` at a time.
 */
function buildPosition(options: PositionOptions): ShapeNote[] | null {
  const { tuning, scale, notesPerString, startToneIndex } = options;
  const maxFret = options.maxFret ?? MAX_FRET;
  const pitchClasses = new Set(scale.pitchClasses.map(mod12));
  const startPitchClass = scale.pitchClasses[startToneIndex];

  const baseFret = lowestFretForPitchClass(tuning, 0, startPitchClass, 0);
  // Prefer the lowest playable voicing, but shift up an octave if the shape
  // would otherwise sit partly behind the nut on the higher strings.
  for (const octaveShift of [0, 12, -12]) {
    const startFret = baseFret + octaveShift;
    if (startFret < 0) continue;
    const notes: ShapeNote[] = [];
    let midi = tuning.openMidi[0] + startFret;
    let valid = true;

    for (let stringIndex = 0; stringIndex < tuning.openMidi.length; stringIndex += 1) {
      for (let n = 0; n < notesPerString; n += 1) {
        const isFirstNote = stringIndex === 0 && n === 0;
        if (!isFirstNote) midi = nextScaleMidi(midi, pitchClasses);
        const fret = midi - tuning.openMidi[stringIndex];
        if (fret < 0 || fret > maxFret) {
          valid = false;
          break;
        }
        notes.push({ stringIndex, fret, midi });
      }
      if (!valid) break;
    }

    if (valid) return notes;
  }
  return null;
}

function toShape(
  id: string,
  name: string,
  lowestDegreeLabel: string,
  notes: ShapeNote[],
): Shape {
  const frets = notes.map((note) => note.fret);
  return {
    id,
    name,
    lowestDegreeLabel,
    notes,
    lowestFret: Math.min(...frets),
    highestFret: Math.max(...frets),
    keys: new Set(notes.map((note) => shapeNoteKey(note.stringIndex, note.fret))),
  };
}

/** The five movable pentatonic boxes, ordered from the box rooted on degree 1. */
export function pentatonicBoxes(tuning: Tuning, scale: Scale): Shape[] {
  if (scale.pitchClasses.length !== 5) return [];
  const shapes: Shape[] = [];
  for (let index = 0; index < 5; index += 1) {
    const notes = buildPosition({ tuning, scale, notesPerString: 2, startToneIndex: index });
    if (!notes) continue;
    shapes.push(
      toShape(
        `box-${index + 1}`,
        `Box ${index + 1}`,
        scale.tones[index].degreeLabel,
        notes,
      ),
    );
  }
  return shapes;
}

/** Seven three-notes-per-string positions for a seven-note scale. */
export function threeNotesPerStringShapes(tuning: Tuning, scale: Scale): Shape[] {
  if (scale.pitchClasses.length !== 7) return [];
  const shapes: Shape[] = [];
  for (let index = 0; index < 7; index += 1) {
    const notes = buildPosition({ tuning, scale, notesPerString: 3, startToneIndex: index });
    if (!notes) continue;
    shapes.push(
      toShape(
        `pattern-${index + 1}`,
        `Pattern ${index + 1}`,
        scale.tones[index].degreeLabel,
        notes,
      ),
    );
  }
  return shapes;
}

export interface ShapeSet {
  kind: ShapeKind | null;
  label: string;
  shapes: Shape[];
  /** Why no shapes are available, when the list is empty. */
  unavailableReason: string | null;
  /** Set when the patterns were built from a parent seven-note scale. */
  derivedFromNote: string | null;
}

export function buildShapeSet(
  tuning: Tuning,
  scale: Scale,
  kind: ShapeKind,
  preference: AccidentalPreference = 'sharp',
): ShapeSet {
  if (kind === 'pentatonic-box') {
    const shapes = pentatonicBoxes(tuning, scale);
    return {
      kind,
      label: 'Pentatonic boxes',
      shapes,
      derivedFromNote: null,
      unavailableReason: shapes.length
        ? null
        : `Pentatonic boxes are five-note shapes, and ${scale.definition.name} has ${scale.pitchClasses.length} notes. Switch to a pentatonic scale to study the boxes.`,
    };
  }

  const sourceId = harmonySourceScaleId(scale.definition);
  const sourceScale =
    scale.pitchClasses.length === 7
      ? scale
      : buildScale({
          rootPitchClass: scale.rootPitchClass,
          scaleId: sourceId,
          preference,
          rootSpelling: scale.rootSpelled,
        });
  const shapes = threeNotesPerStringShapes(tuning, sourceScale);
  const derivedFromNote =
    sourceScale.definition.id === scale.definition.id
      ? null
      : `${scale.definition.name} has ${scale.pitchClasses.length} notes, so these patterns come from its parent scale, ${sourceScale.rootName} ${sourceScale.definition.name}.`;

  return {
    kind,
    label: 'Three notes per string',
    shapes,
    derivedFromNote,
    unavailableReason: shapes.length
      ? null
      : `Three-notes-per-string patterns need a seven-note scale, and ${scale.definition.name} has ${scale.pitchClasses.length}. Switch to a mode or a minor variant for these patterns.`,
  };
}

/**
 * Notes shared with the neighbouring shapes. Overlaps are where positions
 * connect, so they are marked explicitly on the fretboard.
 */
export function overlapKeys(shapes: Shape[], index: number): Set<string> {
  const current = shapes[index];
  if (!current) return new Set();
  const overlap = new Set<string>();
  const neighbours = [shapes[(index - 1 + shapes.length) % shapes.length], shapes[(index + 1) % shapes.length]];
  for (const neighbour of neighbours) {
    if (!neighbour || neighbour === current) continue;
    for (const key of current.keys) {
      if (neighbour.keys.has(key)) overlap.add(key);
    }
  }
  return overlap;
}
