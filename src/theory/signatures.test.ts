import { describe, expect, it } from 'vitest';
import { SCALES_BY_ID } from './scales';
import {
  SIGNATURE_GROUPS,
  SIGNATURES,
  SIGNATURES_BY_ID,
  getSignature,
  signatureAlsoNames,
  signaturesInGroup,
} from './signatures';

describe('signature catalog', () => {
  it('has unique ids', () => {
    const ids = SIGNATURES.map((signature) => signature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points every preset at a real scale', () => {
    for (const signature of SIGNATURES) {
      expect(SCALES_BY_ID[signature.scaleId], signature.id).toBeDefined();
      expect(signature.also).not.toContain(signature.scaleId);
      for (const scaleId of signature.also) {
        expect(SCALES_BY_ID[scaleId], `${signature.id} also ${scaleId}`).toBeDefined();
      }
    }
  });

  it('covers every listed group and no unknown groups', () => {
    const groupIds = new Set(SIGNATURE_GROUPS.map((group) => group.id));
    for (const signature of SIGNATURES) {
      expect(groupIds.has(signature.group)).toBe(true);
    }
    for (const group of SIGNATURE_GROUPS) {
      expect(signaturesInGroup(group.id).length).toBeGreaterThan(0);
    }
  });

  it('looks up by id and ignores empty values', () => {
    expect(getSignature('santana')?.scaleId).toBe('dorian');
    expect(getSignature(null)).toBeUndefined();
    expect(getSignature('nope')).toBeUndefined();
  });

  it('indexes the same records as the list', () => {
    expect(SIGNATURES_BY_ID.srv).toBe(SIGNATURES.find((signature) => signature.id === 'srv'));
  });

  it('resolves cousin scale names from the theory catalog', () => {
    const johnson = getSignature('johnson');
    expect(johnson).toBeDefined();
    expect(signatureAlsoNames(johnson!)).toEqual(['Lydian', 'Major Pentatonic']);
  });
});
