# 4. Three-notes-per-string patterns from the parent seven-note scale

- Status: Accepted
- Date: 2026-09-16

## Context

Three-notes-per-string (3NPS) positions are seven connected shapes: three scale notes on each string, each pattern starting on the next degree on the low E string. `threeNotesPerStringShapes` only runs on a seven-note scale. The default key is A minor pentatonic, so choosing “3 notes per string” built an empty set and left the neck unchanged. The “shapes unavailable” copy lived in the side panel. Switching family also forced `shapeIndex: null` (whole neck), so even on Ionian the toggle did not light a pattern.

Harmony already solves the same gap: pentatonic and blues borrow diatonic chords from `harmonySourceId` (Aeolian or Ionian) and tell the UI.

## Options

1. Disable 3NPS until the user picks a seven-note scale. Honest, but the control looks broken on the default key.
2. Switch the scale itself to the parent when 3NPS is chosen. The neck changes, but so does the selected scale.
3. Keep the selected scale, generate 3NPS from the parent, and select Pattern 1 on family change.

## Decision

Option 3.

- `buildShapeSet` for `three-notes-per-string` uses the current scale when it has seven tones, otherwise `harmonySourceScaleId` + `buildScale` with the same root spelling. `derivedFromNote` explains the borrow, same idea as the harmony panel.
- Notes that belong to the active shape are visible even when they are outside the selected pentatonic/blues set, so the 2 and b6 of A natural minor show inside an A minor pentatonic 3NPS pattern.
- Choosing a shape family sets `shapeIndex: 0`, so Pattern 1 / Box 1 lights immediately.
- Pattern and box buttons sit above the fretboard next to the triad row.

Low-level `threeNotesPerStringShapes` still returns `[]` for a five-note scale. The parent-scale step lives only in `buildShapeSet`.

## Consequences

- On A minor pentatonic, 3NPS shows A natural minor patterns and says so. Blues does the same.
- Switching to Ionian/Dorian/etc. builds 3NPS from the scale itself; `derivedFromNote` is null.
- Pentatonic boxes stay five-note-only. A seven-note scale still has no boxes.
- Whole-neck view remains available after Pattern 1 is selected; it is no longer the first thing the family toggle does.
