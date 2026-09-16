# 1. Full 24-fret neck as the default window

- Status: Accepted
- Date: 2026-09-16

## Context

The renderer already supported `MAX_FRET = 24`, with inlays, octave markers and geometry tests for the full neck. The stored default window was frets 0–15. People opening the app for the first time — and anyone whose saved settings were still the old default — never saw the upper octave.

Changing only `DEFAULT_SETTINGS.fretTo` would not help existing browsers: `localStorage` still held `fretFrom: 0, fretTo: 15`. Blindly mapping every 0–15 window to 0–24 would also trap anyone who later chose 0–15 on purpose.

## Options

1. Change the default only. New sessions see 24 frets; saved 0–15 stays 0–15.
2. Bump the storage key and reset every setting. Full neck, but wipe theme, scale and spelling too.
3. Version the payload. Upgrade the old 0–15 default once; keep a later explicit 0–15.

## Decision

Option 3.

- `DEFAULT_SETTINGS.fretTo` is `MAX_FRET` (24).
- Written payloads carry `schema: 2` (`SETTINGS_SCHEMA` in `src/state/settings.ts`).
- On read, a payload with no schema (treated as 1) and the exact window 0–15 becomes 0–24.
- A payload already at schema 2 with 0–15 is left alone.

The presets (Full neck / Open / Middle / Upper) stay as the way to pick a window by hand.

## Consequences

- First load and one-time upgrade of the old default show frets 0–24. Horizontal scroll covers the upper octave.
- An explicit 0–15 choice survives reloads after the schema bump.
- `STORAGE_KEY` stays `neon-fretboard.settings.v1` (legacy id from the old product name); schema lives inside the JSON so we do not throw away other saved fields.
