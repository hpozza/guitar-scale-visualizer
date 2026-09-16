import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildBoardView, type NoteView } from './state/derived';
import { useMediaQuery } from './state/useMediaQuery';
import { useSettings } from './state/useSettings';
import { isAudioSupported, playNote, playSequence, suspendAudio } from './audio/synth';
import { ControlsPanel } from './components/ControlsPanel';
import { Fretboard } from './components/Fretboard';
import { HarmonyPanel } from './components/HarmonyPanel';
import { Legend } from './components/Legend';
import { MobileControlBar } from './components/MobileControlBar';
import { NoteReadout } from './components/NoteReadout';
import { ShapePanel } from './components/ShapePanel';
import { TheoryPanel } from './components/TheoryPanel';
import { Toolbar } from './components/Toolbar';
import { Button } from './components/ui/Button';
import { Panel } from './components/ui/Panel';

export default function App() {
  const { settings, status, error, update, reset, dismissError, persisted } = useSettings();
  const compact = useMediaQuery('(max-width: 1023px)');
  // Markers are tracked by their string:fret key rather than by object, so the
  // readout always reflects the current key, scale and labels.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const audioSupported = useMemo(() => isAudioSupported(), []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.themeId;
  }, [settings.themeId]);

  useEffect(() => {
    if (!settings.soundEnabled) suspendAudio();
  }, [settings.soundEnabled]);

  const board = useMemo(() => buildBoardView(settings), [settings]);

  const handleInspect = useCallback((item: NoteView | null) => {
    setHoveredKey(item?.key ?? null);
  }, []);

  const handleActivate = useCallback(
    (item: NoteView) => {
      setPinnedKey(item.key);
      if (settings.soundEnabled) playNote(item.note.midi);
    },
    [settings.soundEnabled],
  );

  const handlePlayChord = useCallback(() => {
    const chord = board.activeChord;
    if (!chord) return;
    const midis = board.voicing
      ? board.voicing.notes.map((note) => note.midi)
      : [chord.triad[0], chord.triad[1], chord.triad[2], ...(settings.showSevenths && chord.seventh ? [chord.seventh] : [])].map(
          (tone) => 48 + chord.rootPitchClass + tone.semitonesFromChordRoot,
        );
    playSequence(midis, 0.14);
  }, [board.activeChord, board.voicing, settings.showSevenths]);

  const handlePlayShape = useCallback(() => {
    if (!board.activeShape) return;
    const midis = board.activeShape.notes.map((note) => note.midi).sort((a, b) => a - b);
    playSequence(midis, 0.13);
  }, [board.activeShape]);

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'error') {
    return (
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6">
          <h1 className="text-lg font-bold text-[var(--text)]">Saved settings could not be read</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            {error} Neon Fretboard can start from its defaults instead — A minor pentatonic, frets 0
            to 24.
          </p>
          <div className="mt-4">
            <Button onClick={dismissError}>Start with defaults</Button>
          </div>
        </div>
      </div>
    );
  }

  const activeKey = hoveredKey ?? pinnedKey;
  const activeNote =
    activeKey === null
      ? null
      : (board.rows.flat().find((item) => item.key === activeKey) ?? null);
  const showTheory = !settings.focusMode;
  const sidePanelVisible = settings.controlsOpen && !compact;

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <a
        href="#fretboard"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:border focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to the fretboard
      </a>

      <Toolbar
        settings={settings}
        update={update}
        compact={compact}
        audioSupported={audioSupported}
        controlsExpanded={compact ? drawerOpen : settings.controlsOpen}
        onOpenControls={() =>
          compact ? setDrawerOpen((open) => !open) : update({ controlsOpen: !settings.controlsOpen })
        }
      />

      <main
        className={`mx-auto grid w-full max-w-[1800px] flex-1 gap-4 px-3 py-4 sm:px-5 ${
          sidePanelVisible ? 'lg:grid-cols-[minmax(0,1fr)_21rem]' : 'grid-cols-1'
        }`}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <section id="fretboard" aria-label="Fretboard" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                {board.scale.rootName} {board.scale.definition.name}
                <span className="ml-2 font-mono text-xs font-normal text-[var(--text-muted)]">
                  {board.scale.formula}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-dim)]">
                Frets {board.range.from}–{board.range.to} ·{' '}
                {settings.leftHanded ? 'left-handed' : 'right-handed'} ·{' '}
                {board.activeShape ? board.activeShape.name : 'whole neck'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                Triad
              </span>
              {board.harmony.chords.map((chord) => {
                const selected = settings.chordDegree === chord.degreeNumber;
                return (
                  <Button
                    key={chord.degreeNumber}
                    size="sm"
                    variant="outline"
                    active={selected}
                    title={`${chord.name} — ${chord.quality}. Click to show this triad on the neck.`}
                    onClick={() =>
                      update({
                        chordDegree: selected ? null : chord.degreeNumber,
                        highlightInterval: null,
                      })
                    }
                  >
                    {chord.romanNumeral}
                  </Button>
                );
              })}
              <Button
                size="sm"
                variant="ghost"
                disabled={settings.chordDegree === null}
                onClick={() => update({ chordDegree: null, inversionView: false })}
              >
                Clear
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                {settings.shapeKind === 'three-notes-per-string' ? '3NPS' : 'Box'}
              </span>
              {board.shapeSet.shapes.length > 0 ? (
                <>
                  {board.shapeSet.shapes.map((shape, index) => (
                    <Button
                      key={shape.id}
                      size="sm"
                      variant="outline"
                      active={settings.shapeIndex === index}
                      title={`${shape.name}: frets ${shape.lowestFret} to ${shape.highestFret}, starts on degree ${shape.lowestDegreeLabel}`}
                      onClick={() =>
                        update({
                          shapeIndex: settings.shapeIndex === index ? null : index,
                        })
                      }
                    >
                      {shape.name}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={settings.shapeIndex === null}
                    onClick={() => update({ shapeIndex: null })}
                  >
                    Whole neck
                  </Button>
                </>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">{board.shapeSet.unavailableReason}</p>
              )}
            </div>
            {board.shapeSet.derivedFromNote ? (
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                {board.shapeSet.derivedFromNote}
              </p>
            ) : null}

            {board.rangeMessage ? (
              <p
                role="status"
                className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--text)]"
              >
                {board.rangeMessage} Showing frets {board.range.from}–{board.range.to}.
              </p>
            ) : null}

            <Fretboard
              board={board}
              settings={settings}
              compact={compact}
              onInspect={handleInspect}
              onActivate={handleActivate}
            />

            {board.isEmpty ? (
              <EmptyBoardNotice
                title="Nothing is drawn in this window"
                body="The current filters hide every note between these frets."
                onReset={() => update({ rootsOnly: false, showAllNotes: false })}
              />
            ) : null}

            {!board.isEmpty && board.nothingHighlighted ? (
              <EmptyBoardNotice
                title="Every note in view is dimmed"
                body="The interval, shape or chord filter excludes everything between these frets, so nothing is emphasised."
                onReset={() =>
                  update({ highlightInterval: null, shapeIndex: null, chordDegree: null })
                }
              />
            ) : null}

            {board.voicingUnavailable ? (
              <p
                role="status"
                className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--text)]"
              >
                {board.voicingUnavailable}
              </p>
            ) : null}

            <NoteReadout
              note={activeNote}
              hint={
                compact
                  ? 'Tap any fret to see its note name, interval, scale degree, string and fret.'
                  : 'Hover, tap or focus any fret to see its note name, interval, scale degree, string and fret. Use the arrow keys to walk the neck.'
              }
            />
          </section>

          <Panel title="Legend">
            <Legend
              board={board}
              settings={settings}
              onHighlightInterval={(highlightInterval) => update({ highlightInterval })}
            />
          </Panel>

          {showTheory ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <TheoryPanel board={board} settings={settings} />
              <div className="flex flex-col gap-4">
                <ShapePanel
                  board={board}
                  settings={settings}
                  update={update}
                  onPlayShape={handlePlayShape}
                  audioSupported={audioSupported}
                />
                <HarmonyPanel
                  board={board}
                  settings={settings}
                  update={update}
                  onPlayChord={handlePlayChord}
                  audioSupported={audioSupported}
                />
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--text-muted)]">
              Focus mode is on: the written theory is hidden and only the fretboard, the selectors and
              the legend remain. Turn it off in the toolbar to bring the study notes back.
            </p>
          )}
        </div>

        {sidePanelVisible ? (
          <aside
            aria-label="Controls"
            className="h-fit rounded-xl border border-[var(--border)] bg-[var(--surface)]/85 lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto nf-scroll"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Controls
              </h2>
              <Button size="sm" variant="ghost" onClick={() => update({ controlsOpen: false })}>
                Hide
              </Button>
            </div>
            <ControlsPanel
              board={board}
              settings={settings}
              update={update}
              onResetSettings={reset}
              audioSupported={audioSupported}
              persisted={persisted}
            />
          </aside>
        ) : null}
      </main>

      <footer className="mx-auto w-full max-w-[1800px] px-3 pb-3 sm:px-5">
        <p className="text-[11px] leading-relaxed text-[var(--text-dim)]">
          Neon Fretboard runs entirely in your browser. Every scale, shape and chord is calculated
          locally from pitch classes, and your settings stay in this browser only.
        </p>
      </footer>

      {compact ? (
        <MobileControlBar
          settings={settings}
          update={update}
          onOpenControls={() => setDrawerOpen(true)}
        />
      ) : null}

      {compact && drawerOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close controls"
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Controls"
            className="nf-scroll relative ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Controls</h2>
              <Button size="sm" variant="outline" onClick={() => setDrawerOpen(false)}>
                Done
              </Button>
            </div>
            <ControlsPanel
              board={board}
              settings={settings}
              update={update}
              onResetSettings={reset}
              audioSupported={audioSupported}
              persisted={persisted}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[1800px] px-5 py-6" aria-busy="true">
      <p className="sr-only" role="status">
        Loading your saved fretboard settings
      </p>
      <div className="h-8 w-44 animate-pulse rounded-lg bg-[var(--surface-raised)]" />
      <div className="mt-4 h-56 animate-pulse rounded-2xl bg-[var(--surface)]" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-[var(--surface)]" />
        <div className="h-40 animate-pulse rounded-xl bg-[var(--surface)]" />
      </div>
    </div>
  );
}

interface EmptyBoardNoticeProps {
  title: string;
  body: string;
  onReset: () => void;
}

function EmptyBoardNotice({ title, body, onReset }: EmptyBoardNoticeProps) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-sunken)] px-4 py-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onReset}>
        Clear the filters
      </Button>
    </div>
  );
}
