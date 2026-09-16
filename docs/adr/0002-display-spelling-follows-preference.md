# 2. Fretboard names follow the accidental preference

- Status: Accepted
- Date: 2026-09-16

## Context

The Sharps / Flats control is documented as changing only how pitches are written. Pitch math already ignored spelling. Two bugs made the control look dead:

1. The segmented control used visually hidden radio inputs. `sr-only` positioning swallowed clicks, so the selected option often did not change.
2. In-scale fretboard labels used theoretical degree spelling (`tone.spelled`). G major in flat mode still wrote F♯, because degree 7 of G is F♯. On keys with no accidentals (A minor pentatonic) the toggle also changed nothing on the neck.

Scale construction still needs letter-per-degree spelling (F♯ major keeps E♯; G♭ major keeps C♭). That must not be thrown away.

## Options

1. Keep theoretical names on the neck. Only chromatics and black-key roots follow preference. Honest theory, dead-looking toggle on common keys.
2. Spell every label from the chromatic sharp/flat table. F♯ major in sharp mode writes F instead of E♯.
3. Prefer theoretical spelling when it already matches the toggle; otherwise respell from the chromatic table.

## Decision

Option 3, plus real buttons for the control.

- `displaySpelling` in `src/theory/notes.ts` keeps a natural, keeps a sharp when preference is `sharp`, keeps a flat when preference is `flat`, and otherwise calls `spellPitchClass`.
- `computeFretboardNotes` uses that for every marker name. Scale tones, the study panel and roman-numeral construction still use `spellDegree`.
- `Segmented` is a `role="radio"` button group. No clipped native radios.

## Consequences

- G major + Flats writes G♭ on the neck. G major + Sharps keeps F♯. C♯ major + Sharps still writes E♯.
- A minor pentatonic still has no accidentals, so the neck names do not move. The root picker and chromatic notes do.
- Theory copy (formulas, degree labels, one-letter-per-degree tests) is unchanged.
- Accessibility of the accidental control is better: the visible control is the actual button.
