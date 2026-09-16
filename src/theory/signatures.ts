/**
 * Player vocabulary presets. These are not extra scales — each row points at
 * an existing `SCALES` id and optional cousins the player also lives in.
 */

import { SCALES_BY_ID } from './scales';

export type SignatureGroupId = 'blues' | 'modal-rock' | 'fusion' | 'latin' | 'dark';

export interface SignatureGroup {
  id: SignatureGroupId;
  label: string;
}

export interface SignatureDefinition {
  id: string;
  name: string;
  group: SignatureGroupId;
  /** Existing scale this preset applies. */
  scaleId: string;
  /** Other scales in this player's usual vocabulary, not applied automatically. */
  also: string[];
  /** Why this player is associated with the primary scale. */
  blurb: string;
}

export const SIGNATURE_GROUPS: SignatureGroup[] = [
  { id: 'blues', label: 'Blues vocabulary' },
  { id: 'modal-rock', label: 'Modal rock and funk' },
  { id: 'fusion', label: 'Fusion and wide major' },
  { id: 'latin', label: 'Latin and Spanish' },
  { id: 'dark', label: 'Dark, metal, neoclassical' },
];

export const SIGNATURES: SignatureDefinition[] = [
  {
    id: 'bb-king',
    name: 'B.B. King',
    group: 'blues',
    scaleId: 'major-pentatonic',
    also: ['mixolydian'],
    blurb:
      'The “B.B. box” lives in major pentatonic, sweeter than minor-blues boxes. Mixolydian colour sits on the dominant 7 chords.',
  },
  {
    id: 'srv',
    name: 'Stevie Ray Vaughan',
    group: 'blues',
    scaleId: 'blues',
    also: ['minor-pentatonic', 'mixolydian'],
    blurb:
      'Texas blues: minor pentatonic plus the passing flat 5, with Mixolydian over dominant 7ths.',
  },
  {
    id: 'hendrix',
    name: 'Jimi Hendrix',
    group: 'blues',
    scaleId: 'mixolydian',
    also: ['minor-pentatonic', 'major-pentatonic'],
    blurb:
      'Mixolydian with major and minor thirds mixed (the 7#9 sound). Pentatonic for the vocal lines.',
  },
  {
    id: 'frusciante',
    name: 'John Frusciante',
    group: 'modal-rock',
    scaleId: 'mixolydian',
    also: ['dorian', 'minor-pentatonic'],
    blurb: 'Mixolydian and Dorian vamps, pentatonic hooks. Funk-rock modal playing over static grooves.',
  },
  {
    id: 'mayer',
    name: 'John Mayer',
    group: 'modal-rock',
    scaleId: 'mixolydian',
    also: ['major-pentatonic', 'blues'],
    blurb: 'Mixolydian and major pentatonic, with blues colour. A modern Hendrix / Vaughan vocabulary.',
  },
  {
    id: 'page',
    name: 'Jimmy Page',
    group: 'modal-rock',
    scaleId: 'mixolydian',
    also: ['dorian', 'aeolian'],
    blurb: 'Mixolydian riffs, then Dorian or Aeolian when the Zeppelin tune turns darker.',
  },
  {
    id: 'gilmour',
    name: 'David Gilmour',
    group: 'modal-rock',
    scaleId: 'minor-pentatonic',
    also: ['mixolydian'],
    blurb: 'Minor pentatonic with Mixolydian colour, lots of space and vocal bends.',
  },
  {
    id: 'van-halen',
    name: 'Eddie Van Halen',
    group: 'modal-rock',
    scaleId: 'mixolydian',
    also: ['minor-pentatonic'],
    blurb: 'Mixolydian rock lines over major and dominant grooves; minor pentatonic for the bluesier bits.',
  },
  {
    id: 'slash',
    name: 'Slash',
    group: 'modal-rock',
    scaleId: 'minor-pentatonic',
    also: ['blues', 'aeolian'],
    blurb: 'Minor pentatonic and blues boxes; Aeolian for the slower, darker tunes.',
  },
  {
    id: 'johnson',
    name: 'Eric Johnson',
    group: 'fusion',
    scaleId: 'mixolydian',
    also: ['lydian', 'major-pentatonic'],
    blurb: 'Mixolydian and major pentatonic, with Lydian #4 for the wide fusion lines.',
  },
  {
    id: 'satriani',
    name: 'Joe Satriani',
    group: 'fusion',
    scaleId: 'lydian',
    also: ['mixolydian'],
    blurb: 'Lydian is the calling card — the raised 4th over major. Mixolydian for the groovier tunes.',
  },
  {
    id: 'santana',
    name: 'Carlos Santana',
    group: 'latin',
    scaleId: 'dorian',
    also: ['aeolian', 'minor-pentatonic'],
    blurb: 'Dorian is the Santana sound: minor with a raised 6th, usually over a static vamp.',
  },
  {
    id: 'paco',
    name: 'Paco de Lucía',
    group: 'latin',
    scaleId: 'phrygian',
    also: ['aeolian', 'harmonic-minor'],
    blurb: 'Phrygian (flat 2) for the Spanish colour. Harmonic minor shows up in the cadences.',
  },
  {
    id: 'iommi',
    name: 'Tony Iommi',
    group: 'dark',
    scaleId: 'aeolian',
    also: ['phrygian', 'locrian'],
    blurb: 'Aeolian and Phrygian riffs, with Locrian colour around the tritone.',
  },
  {
    id: 'rhoads',
    name: 'Randy Rhoads',
    group: 'dark',
    scaleId: 'harmonic-minor',
    also: ['aeolian'],
    blurb: 'Harmonic minor and natural minor — classical phrasing over metal riffs.',
  },
  {
    id: 'yngwie',
    name: 'Yngwie Malmsteen',
    group: 'dark',
    scaleId: 'harmonic-minor',
    also: ['phrygian'],
    blurb: 'Harmonic minor is the neoclassical home. The b6-to-7 jump is the signature sound.',
  },
];

export const SIGNATURES_BY_ID: Record<string, SignatureDefinition> = Object.fromEntries(
  SIGNATURES.map((signature) => [signature.id, signature]),
);

export function getSignature(id: string | null | undefined): SignatureDefinition | undefined {
  if (!id) return undefined;
  return SIGNATURES_BY_ID[id];
}

export function signaturesInGroup(groupId: SignatureGroupId): SignatureDefinition[] {
  return SIGNATURES.filter((signature) => signature.group === groupId);
}

/** Display names for the cousin scales listed on a preset. */
export function signatureAlsoNames(signature: SignatureDefinition): string[] {
  return signature.also.flatMap((scaleId) => {
    const scale = SCALES_BY_ID[scaleId];
    return scale ? [scale.name] : [];
  });
}
