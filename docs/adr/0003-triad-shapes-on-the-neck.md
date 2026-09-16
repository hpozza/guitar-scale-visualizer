# 3. Close-position triad shapes on the selected string set

- Status: Accepted
- Date: 2026-09-16

## Context

Harmony already knew the seven diatonic triads, including parent-scale harmony for pentatonic and blues. Lighting a triad on the neck required picking a roman numeral *and* turning on inversion view. Inversion view then drew a single lowest voicing. Chord-role rings used dotted/dashed strokes that `overflow: hidden` and muted opacity made easy to miss. Guitarists looking for “triads” expect the repeating three-note shapes on a string set, not one voicing buried behind a toggle.

## Options

1. Leave the model as-is and only restyle the rings.
2. Auto-enable inversion view when a degree is selected, still showing one voicing.
3. When a degree is selected, draw every in-range close-position voicing on the current string set. Inversion view then filters to one inversion, still repeating up the neck.

## Decision

Option 3.

- `collectTriadVoicings` in `src/theory/chords.ts` walks `triadVoicing` up the neck and keeps only shapes whose three notes all sit in the visible fret window.
- No inversion filter: all three inversions on the selected string set. Inversion view: that inversion only, every octave that fits.
- Chord tones carry R / 3 / 5 / 7 badges and inner rings that stay visible even when muted.
- Roman numerals sit above the fretboard so a triad can be chosen without opening Harmony.
- The string-set control is available as soon as a degree is selected.
- Selecting a triad clears interval highlight so the two filters do not hide each other.

## Consequences

- Clicking I–VII immediately shows triad clusters (numbered 1–3 from the bass) plus every matching chord tone on the rest of the neck.
- Inversion view dims everything that is not that inversion’s shapes. Play-chord uses the first collected voicing.
- Still not a voicing library: one string set at a time, close position only, no seventh voicings, no skip-string shapes.
- Pentatonic and blues still borrow I–VII from the parent seven-note scale; that path was already in place.
