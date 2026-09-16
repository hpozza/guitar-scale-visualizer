# 5. Player signatures are presets, not extra scales

- Status: Accepted
- Date: 2026-09-16

## Context

The scale list is theory: modes, pentatonics, blues, harmonic and melodic minor. A second request was a filter of “signature scales” named after guitarists (Stevie Ray Vaughan, Santana, B.B. King, and so on). Most of those sounds are already in `SCALES` — Santana is Dorian, Vaughan is the blues scale. Adding `santana-dorian` as a fake `ScaleDefinition` would duplicate formulas, harmony, shapes and study copy, and would hide the real name.

Two always-visible selects that both write `scaleId` would also lie: the player menu saying Santana while the scale menu still says Mixolydian, or the reverse.

## Options

1. Extra rows in `SCALES` named after players. Discoverable, but they are not scales.
2. One `<select>` with an optgroup of player names whose values are scale ids. Cheap, but the closed control cannot show both “Dorian” and “Santana”, and picking Dorian later has no player to clear.
3. A separate Signatures catalog. Each row points at an existing `scaleId`. Choosing a player writes `signatureId` + `scaleId`. Choosing from Scale clears `signatureId`. Scale always shows the theory name.

## Decision

Option 3.

- Catalog lives in `src/theory/signatures.ts`. No new pitch collections.
- `Settings.signatureId` is `string | null`. Stored payloads keep it only when the signature still matches `scaleId`.
- The Signatures control sits next to Scale in the always-visible chrome: desktop toolbar, compact bottom bar, and the Controls panel. `--accent-signature` keeps it from looking like the theory menu.
- The study panel adds a player blurb when a signature is active. Interval formula, parent major and practice stay on the real scale.

## Consequences

- Santana lights Dorian. Changing Scale to Mixolydian drops the Santana overlay. Choosing None on Signatures keeps the current scale.
- Cousin scales (`also`) are copy only; they do not change the neck.
- New guitarists are catalog rows, not engine work, as long as the primary scale already exists.
