import { formatNote, spellPitchClass, type AccidentalPreference } from '../theory/notes';

export const ROOT_PITCH_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Root label under the current preference, with the enharmonic in brackets. */
export function rootOptionLabel(pitchClass: number, preference: AccidentalPreference): string {
  const primary = formatNote(spellPitchClass(pitchClass, preference));
  const other = formatNote(spellPitchClass(pitchClass, preference === 'sharp' ? 'flat' : 'sharp'));
  return primary === other ? primary : `${primary} (${other})`;
}
