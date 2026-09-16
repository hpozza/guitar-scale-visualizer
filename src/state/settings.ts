/**
 * User settings, their defaults, and the localStorage bridge.
 *
 * Everything is validated on the way in: a stale or hand-edited payload should
 * degrade to the defaults rather than render a broken fretboard.
 */

import { MAX_FRET, MIN_FRET, validateFretRange } from '../theory/fretboard';
import { SCALES_BY_ID } from '../theory/scales';
import { DEFAULT_THEME_ID, isThemeId } from './themes';

export type LabelMode = 'names' | 'degrees' | 'intervals' | 'none';
export type ShapeKindSetting = 'pentatonic-box' | 'three-notes-per-string';

export interface Settings {
  rootPitchClass: number;
  scaleId: string;
  preference: 'sharp' | 'flat';
  fretFrom: number;
  fretTo: number;
  leftHanded: boolean;
  labelMode: LabelMode;
  showAllNotes: boolean;
  rootsOnly: boolean;
  soundEnabled: boolean;
  themeId: string;
  shapeKind: ShapeKindSetting;
  /** Index into the current shape set, or null for the whole neck. */
  shapeIndex: number | null;
  /** Diatonic degree 1-7, or null when no chord is selected. */
  chordDegree: number | null;
  showSevenths: boolean;
  inversionView: boolean;
  inversion: 0 | 1 | 2;
  stringSetId: string;
  focusMode: boolean;
  /** Semitone interval to highlight everywhere, or null. */
  highlightInterval: number | null;
  controlsOpen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  rootPitchClass: 9,
  scaleId: 'minor-pentatonic',
  preference: 'sharp',
  fretFrom: 0,
  fretTo: MAX_FRET,
  leftHanded: false,
  labelMode: 'names',
  showAllNotes: false,
  rootsOnly: false,
  soundEnabled: false,
  themeId: DEFAULT_THEME_ID,
  shapeKind: 'pentatonic-box',
  shapeIndex: null,
  chordDegree: null,
  showSevenths: false,
  inversionView: false,
  inversion: 0,
  stringSetId: '123',
  focusMode: false,
  highlightInterval: null,
  controlsOpen: true,
};

export const STORAGE_KEY = 'neon-fretboard.settings.v1';

/** Written into localStorage so old 15-fret defaults can be upgraded once. */
const SETTINGS_SCHEMA = 2;

const LABEL_MODES: LabelMode[] = ['names', 'degrees', 'intervals', 'none'];
const SHAPE_KINDS: ShapeKindSetting[] = ['pentatonic-box', 'three-notes-per-string'];
const STRING_SET_IDS = ['123', '234', '345', '456'];

function pickEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === 'string' && (allowed as string[]).includes(value) ? (value as T) : fallback;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function pickInteger(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return fallback;
  return rounded;
}

/** Coerce anything into a usable settings object. */
export function normalizeSettings(input: unknown): Settings {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;

  const scaleId =
    typeof raw.scaleId === 'string' && SCALES_BY_ID[raw.scaleId]
      ? raw.scaleId
      : DEFAULT_SETTINGS.scaleId;

  const schema =
    typeof raw.schema === 'number' && Number.isFinite(raw.schema) ? Math.round(raw.schema) : 1;

  let from = pickInteger(raw.fretFrom, MIN_FRET, MAX_FRET, DEFAULT_SETTINGS.fretFrom);
  let to = pickInteger(raw.fretTo, MIN_FRET, MAX_FRET, DEFAULT_SETTINGS.fretTo);
  // v1 defaulted to frets 0–15. Open the full neck once; later 0–15 choices stay.
  if (schema < 2 && from === 0 && to === 15) {
    from = MIN_FRET;
    to = MAX_FRET;
  }

  const { range } = validateFretRange(from, to);

  const shapeIndex =
    raw.shapeIndex === null || raw.shapeIndex === undefined
      ? null
      : pickInteger(raw.shapeIndex, 0, 6, 0);

  const chordDegree =
    raw.chordDegree === null || raw.chordDegree === undefined
      ? null
      : pickInteger(raw.chordDegree, 1, 7, 1);

  const highlightInterval =
    raw.highlightInterval === null || raw.highlightInterval === undefined
      ? null
      : pickInteger(raw.highlightInterval, 0, 11, 0);

  return {
    rootPitchClass: pickInteger(raw.rootPitchClass, 0, 11, DEFAULT_SETTINGS.rootPitchClass),
    scaleId,
    preference: pickEnum(raw.preference, ['sharp', 'flat'], DEFAULT_SETTINGS.preference),
    fretFrom: range.from,
    fretTo: range.to,
    leftHanded: pickBoolean(raw.leftHanded, DEFAULT_SETTINGS.leftHanded),
    labelMode: pickEnum(raw.labelMode, LABEL_MODES, DEFAULT_SETTINGS.labelMode),
    showAllNotes: pickBoolean(raw.showAllNotes, DEFAULT_SETTINGS.showAllNotes),
    rootsOnly: pickBoolean(raw.rootsOnly, DEFAULT_SETTINGS.rootsOnly),
    soundEnabled: pickBoolean(raw.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    themeId: isThemeId(raw.themeId) ? raw.themeId : DEFAULT_THEME_ID,
    shapeKind: pickEnum(raw.shapeKind, SHAPE_KINDS, DEFAULT_SETTINGS.shapeKind),
    shapeIndex,
    chordDegree,
    showSevenths: pickBoolean(raw.showSevenths, DEFAULT_SETTINGS.showSevenths),
    inversionView: pickBoolean(raw.inversionView, DEFAULT_SETTINGS.inversionView),
    inversion: pickInteger(raw.inversion, 0, 2, DEFAULT_SETTINGS.inversion) as 0 | 1 | 2,
    stringSetId: pickEnum(raw.stringSetId, STRING_SET_IDS, DEFAULT_SETTINGS.stringSetId),
    focusMode: pickBoolean(raw.focusMode, DEFAULT_SETTINGS.focusMode),
    highlightInterval,
    controlsOpen: pickBoolean(raw.controlsOpen, DEFAULT_SETTINGS.controlsOpen),
  };
}

export function readStoredSettings(): Settings {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  return normalizeSettings(JSON.parse(stored) as unknown);
}

export function writeStoredSettings(settings: Settings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: SETTINGS_SCHEMA, ...settings }));
}

export function clearStoredSettings(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
