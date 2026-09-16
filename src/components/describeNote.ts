import type { NoteView } from '../state/derived';

/**
 * Accessible description of a marker: name, interval, degree, string and fret.
 * Accidentals are spelled out because screen readers skip the music symbols.
 */
export function describeNote(item: NoteView): string {
  const { note } = item;
  const degree = item.degreeLabel.replace('\u266d', 'flat ').replace('\u266f', 'sharp ');
  const parts = [
    `${note.name}${note.octave}`,
    note.interval.name,
    `degree ${degree}`,
    `string ${item.stringNumber}`,
    note.fret === 0 ? 'open string' : `fret ${note.fret}`,
  ];
  if (!note.inScale) parts.push('outside the scale');
  if (item.chordRole) parts.push(`chord ${item.chordRole}`);
  return parts.join(', ');
}
