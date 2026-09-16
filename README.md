# Neon Fretboard

An offline guitar study tool for scales, modes, intervals, triads and movable fretboard patterns.
Everything — the fret geometry, the note spelling, the shapes and the diatonic harmony — is
calculated in the browser from pitch classes. There is no backend, no database, no account and no
network request after the page loads.

## What it does

**Fretboard**

- Horizontal six-string neck in standard tuning (E A D G B E), 24 frets.
- Frets are spaced by equal temperament, so they narrow toward the bridge, with a floor on cell
  width so note labels stay readable at the top of the neck.
- Position inlays at frets 3, 5, 7, 9, 12, 15, 17, 19, 21 and 24; frets 12 and 24 get double inlays,
  a brighter fret wire and a highlighted band.
- Horizontal scrolling on desktop and touch, with the string gutter pinned to the left edge.
- Every fret is a button: hover, tap or focus it to read the note name, interval, scale degree,
  string and fret. Arrow keys walk the neck, Home and End jump to the ends of the visible range.

**Controls**

- Root note (all 12 chromatic notes), scale or mode, sharp/flat spelling toggle.
- Fret range by number entry, sliders or presets, with graceful correction of impossible ranges.
- Left-handed neck, note labels (names / degrees / intervals / hidden), show all notes, root notes
  only, single-interval highlight.
- Optional note sound from a local Web Audio synth — two detuned oscillators through a decaying
  filter. No samples are fetched.

**Scales and modes**

Major (Ionian), Dorian, Phrygian, Lydian, Mixolydian, Natural Minor (Aeolian), Locrian, Major
Pentatonic, Minor Pentatonic, Blues, Harmonic Minor and Melodic Minor.

**Shapes**

- Pentatonic boxes 1–5 and the seven three-notes-per-string major-scale patterns, generated for any
  root rather than stored as fret tables.
- Select one shape or view the whole neck; notes outside the selected shape dim, and notes shared
  with the neighbouring shapes get a dashed ring.
- Previous/next controls, plus a panel that explains how the shape moves with the root.

**Harmony**

- Diatonic triads and seventh chords for every seven-note scale, including the augmented triad in
  harmonic minor. Pentatonic and blues scales borrow their harmony from their parent scale and the
  panel says so.
- Select degrees I–VII to light the triad up on the neck; root, third, fifth and seventh get
  different outer ring styles rather than relying on colour alone.
- Chord name, notes, chord-relative formula, scale degree and roman numeral.
- Triad inversion view: one close three-note voicing per string set, numbered from the bass note up.

**Study panel and focus mode**

The study panel lists the scale name, interval formula, step pattern, the notes in the selected key,
the characteristic notes of the mode, a description of its sound, the parent major scale, the
diatonic triads and a concrete practice instruction. Focus mode hides all of that and leaves the
fretboard, the selectors and the legend.

**Themes**

Blacklight Studio (default), Acid Stage, Ultraviolet and Studio Clean. Themes are CSS custom
properties on the `<html>` element, so no component knows about specific colours.

## Running it

Requires Node.js 20.19+ or 22.12+ (Vite 8).

```bash
npm install
npm run dev        # http://127.0.0.1:43127
```

### Other scripts

```bash
npm run build      # type-check, then build the static site into dist/
npm run preview    # serve the production build on http://127.0.0.1:43128
npm run test       # unit tests (vitest)
npm run test:watch # unit tests in watch mode
npm run lint       # oxlint
npm run typecheck  # tsc --build, no emit
npm run verify     # lint + test + build
```

`npm run build` produces a fully static `dist/` directory. Serve it from any static host or open it
behind a plain file server; there is nothing to configure and no runtime environment variables.

## How it is put together

```
src/
  theory/          pure music theory, no React
    notes.ts       pitch classes, letters and note spelling
    intervals.ts   degrees, interval names, functional roles
    scales.ts      scale definitions, spelling, study copy
    fretboard.ts   tuning, fret geometry, note calculation, range validation
    patterns.ts    pentatonic boxes and three-notes-per-string positions
    chords.ts      diatonic triads, sevenths, close triad voicings
  state/           settings, persistence, and the fretboard view model
  components/      rendering only
  audio/           Web Audio pluck synth
```

Two rules keep the theory honest:

1. **Pitch is separate from spelling.** Pitch is always an integer — a pitch class 0–11 or a MIDI
   number. Spelling is a `{ letter, alteration }` pair produced separately, which is why F# major is
   spelled `F# G# A# B C# D# E#` rather than falling back to generic sharp names, and why switching
   to flats changes the labels without touching a single calculation.
2. **Scales are defined by degrees, not semitone lists.** Each scale lists degrees such as
   `1 2 b3 4 5 6 b7`. The degree number picks the letter, and the pitch class then determines the
   accidental. That gives correct spelling for every root, including the augmented second of
   harmonic minor and the passing b5 of the blues scale.

Shapes are generated the way they are built on the instrument: walk the scale upward in pitch and
hand a fixed number of notes to each string in turn. Two notes per string gives the five pentatonic
boxes; three notes per string gives the seven major-scale patterns. Tests pin the generated frets
against the standard diagrams.

## Tests

```bash
npm run test
```

The suite covers the parts where a mistake would be invisible but wrong:

- mode interval formulas, and that every mode is a rotation of the major scale;
- note spelling, including one letter per degree for all 12 roots of every seven-note scale, and a
  guarantee that nothing needs more than a double accidental;
- fretboard note calculation, string numbering, octave numbers and fret-range validation;
- fret geometry — fret 12 at half the scale length, cells narrowing monotonically toward the bridge,
  and a minimum width so labels fit;
- generated shapes against the known A minor pentatonic boxes and the C major three-notes-per-string
  pattern, for every root;
- diatonic triads, seventh-chord naming, roman numerals and triad voicings;
- settings normalisation and the fretboard view model, including the dimming rules.

## Accessibility notes

- Semantic landmarks, one `h1`, a skip link to the fretboard, and real form controls throughout.
- Every marker carries an accessible description: note, interval, degree, string and fret.
- Colour is never the only signal. Roots are rounded squares, scale tones are circles, chord roles
  use solid/dotted/dashed/double outer rings, shape overlaps use a dashed ring, and voicing order is
  numbered. The legend documents all of it.
- `prefers-reduced-motion` disables transitions and smooth scrolling.

## Known limitations

- Standard tuning only. The tuning is a data structure (`Tuning` in `src/theory/fretboard.ts`) and
  the rest of the code reads from it, but there is no UI to change it yet.
- Fret spacing is deliberately not fully proportional. True equal-temperament spacing makes the
  frets above 19 too narrow to label, so the taper is blended toward uniform width with a minimum
  cell size.
- The inversion view shows one close voicing per string set and inversion, chosen as the lowest one
  at or above the first visible fret. It is not a full voicing library.
- Seventh chords are shown as names, formulas and highlighted chord tones. There are no seventh
  *voicings* on the neck.
- The synth is a single plucked voice, intended for checking what a note or shape sounds like rather
  than for playback quality.
