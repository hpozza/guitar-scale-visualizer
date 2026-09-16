import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from './settings';

describe('settings normalisation', () => {
  it('falls back to defaults for junk input', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid stored values', () => {
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      rootPitchClass: 3,
      scaleId: 'dorian',
      preference: 'flat',
      labelMode: 'intervals',
      themeId: 'ultraviolet',
    });
    expect(settings.rootPitchClass).toBe(3);
    expect(settings.scaleId).toBe('dorian');
    expect(settings.preference).toBe('flat');
    expect(settings.labelMode).toBe('intervals');
    expect(settings.themeId).toBe('ultraviolet');
  });

  it('rejects unknown scales, themes and label modes', () => {
    const settings = normalizeSettings({
      scaleId: 'bebop-super-locrian',
      themeId: 'hotdog',
      labelMode: 'emoji',
    });
    expect(settings.scaleId).toBe(DEFAULT_SETTINGS.scaleId);
    expect(settings.themeId).toBe(DEFAULT_SETTINGS.themeId);
    expect(settings.labelMode).toBe(DEFAULT_SETTINGS.labelMode);
  });

  it('repairs an impossible fret range', () => {
    const settings = normalizeSettings({ fretFrom: 19, fretTo: 4 });
    expect(settings.fretFrom).toBe(4);
    expect(settings.fretTo).toBe(19);
  });

  it('clamps out-of-range roots and frets to the defaults', () => {
    const settings = normalizeSettings({ rootPitchClass: 99, fretFrom: -3, fretTo: 99 });
    expect(settings.rootPitchClass).toBe(DEFAULT_SETTINGS.rootPitchClass);
    expect(settings.fretFrom).toBe(DEFAULT_SETTINGS.fretFrom);
    expect(settings.fretTo).toBe(DEFAULT_SETTINGS.fretTo);
  });

  it('accepts null for the optional selections', () => {
    const settings = normalizeSettings({ shapeIndex: null, chordDegree: null, highlightInterval: null });
    expect(settings.shapeIndex).toBeNull();
    expect(settings.chordDegree).toBeNull();
    expect(settings.highlightInterval).toBeNull();
  });

  it('clamps a stored chord degree into I-VII', () => {
    expect(normalizeSettings({ chordDegree: 4 }).chordDegree).toBe(4);
    expect(normalizeSettings({ chordDegree: 12 }).chordDegree).toBe(1);
  });

  it('upgrades the old 15-fret default to a full 24-fret neck once', () => {
    const upgraded = normalizeSettings({ fretFrom: 0, fretTo: 15 });
    expect(upgraded.fretFrom).toBe(0);
    expect(upgraded.fretTo).toBe(24);
  });

  it('keeps an explicit 15-fret window after the schema bump', () => {
    const settings = normalizeSettings({ schema: 2, fretFrom: 0, fretTo: 15 });
    expect(settings.fretFrom).toBe(0);
    expect(settings.fretTo).toBe(15);
  });
});
