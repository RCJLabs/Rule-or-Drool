import { useCallback, useEffect, useRef, useState } from "react";
import type { Library } from "../engine/library";
import type { GameState, PlayerAlign, Side } from "../engine/types";
import { clearMeta, dailySeedFor, emptyMeta, encodeRunCode, foldRun, loadMeta, runCodeOf, saveMeta, type MetaState, type RunFold } from "../meta";
import { closeRun, openRun, takeCard, type Measure, type RecordedRun, type RunKind } from "../playtest/record";
import { APP_VERSION } from "../version";
import { beginRun, beginRunFromCode, commitChoice, dailyCode, ensureCard } from "./flow";
import type { RunCode } from "../meta";
import { appendRecorded, clearRecorded, loadOpen, loadRecorded, MAX_RECORDED_RUNS, saveOpen, sendRecord } from "./playtest";
import { clearRun, loadRun, saveRun } from "./save";
import { applySettings, loadSettings, saveSettings, type Settings } from "./settings";
import { buzz, newlyDangerous, play } from "./sound";
import { DANGER_BELOW } from "./Meters";
import { clampDrift } from "../engine/state";
import { soundLevel, themeFor } from "./theme";

export type Screen = "setup" | "play" | "over" | "codex";

/**
 * What a choice sounds like. Ordered so the loudest thing a card did is the last thing you
 * hear: the card lands, then anything that went wrong, then anything that opened
 * (BACKLOG-2 phase 9).
 */
function cue(lib: Library, settings: Settings, before: GameState, after: GameState, side: Side, eraChanged: boolean): void {
  if (settings.haptics) buzz(after.over ? [40, 60, 90] : 12);
  if (!settings.sound) return;
  // The card landing follows the same drift the frame does, read after the choice, so the
  // swipe that tipped the run over is the one that sounds different (BACKLOG-3 phase 22).
  play("commit", side, soundLevel(themeFor(after.drift, lib.config)));
  for (const meter of newlyDangerous(before.meters, after.meters, DANGER_BELOW)) play("danger", meter);
  if (after.activeArcs.length > before.activeArcs.length) play("arc");
  if (after.stats.electionsHonest + after.stats.electionsCheated > before.stats.electionsHonest + before.stats.electionsCheated) {
    play("election");
  }
  if (eraChanged) play("era");
  if (after.over && !before.over) play(after.over.endingId.startsWith("finale_") ? "endWell" : "endBadly");
}

export function useGame(lib: Library) {
  const [saved, setSaved] = useState<GameState | null>(() => {
    const s = loadRun();
    return s && !s.over ? s : null;
  });
  const [state, setState] = useState<GameState | null>(null);
  const [transition, setTransition] = useState<number | null>(null);
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());
  const [lastFold, setLastFold] = useState<RunFold | null>(null);
  const [showCodex, setShowCodex] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCabinet, setShowCabinet] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());
  const stateRef = useRef(state);
  stateRef.current = state;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const metaRef = useRef(meta);
  metaRef.current = meta;
  /** Set while a daily-seed run is in progress, so the result is recorded as one. */
  const dailyRef = useRef<{ day: string; seed: number } | null>(null);
  /** How many runs the playtest record holds (BACKLOG-5 phase 31). */
  const [recorded, setRecorded] = useState(() => loadRecorded().length);
  /** The run being recorded, while the player has asked for a record and one is under way. */
  const openRef = useRef<RecordedRun | null | undefined>(undefined);
  if (openRef.current === undefined) openRef.current = loadOpen();
  /** The next card was left and came back, so the time it reports counts from its return. */
  const resumedRef = useRef(false);

  /** Put an unfinished recording with the finished ones, marked as left, if it got anywhere. */
  const shelveOpen = useCallback(() => {
    const open = openRef.current;
    openRef.current = null;
    saveOpen(null);
    if (open && open.cards.length > 0) setRecorded(appendRecorded(open));
  }, []);

  /** A run is starting: record it, if the player asked for a record and it has room. */
  const beginRecording = useCallback(
    (s: GameState, kind: RunKind) => {
      shelveOpen();
      resumedRef.current = false;
      if (!settingsRef.current.keepRecord || loadRecorded().length >= MAX_RECORDED_RUNS) return;
      openRef.current = openRun(s, { kind, run: metaRef.current.runs + 1, game: APP_VERSION });
      saveOpen(openRef.current);
    },
    [shelveOpen],
  );

  useEffect(() => {
    if (state) saveRun(state);
  }, [state]);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  /** Mark a lesson as given, so it never fires again on any run. */
  const markTaught = useCallback((id: string) => {
    setSettingsState((prev) => {
      if (prev.taught.includes(id)) return prev;
      const next = { ...prev, taught: [...prev.taught, id] };
      saveSettings(next);
      return next;
    });
  }, []);

  const setSettings = useCallback((next: Settings) => {
    // Off means off: a run being recorded stops being recorded, and is not kept.
    if (!next.keepRecord && openRef.current) {
      openRef.current = null;
      saveOpen(null);
    }
    setSettingsState(next);
    saveSettings(next);
  }, []);

  /**
   * Leave a run without ending it. The run is already saved on every choice, so this only
   * has to put it back where the menu looks for it (`saved`) and clear the live state.
   */
  const exitToMenu = useCallback(() => {
    const s = stateRef.current;
    setShowSettings(false);
    setShowCabinet(false);
    setShowCodex(false);
    setTransition(null);
    setLastFold(null);
    if (s && !s.over) {
      saveRun(s);
      setSaved(s);
    }
    setState(null);
  }, []);

  /** Wipes the codex, every unlock, the run in progress and the playtest record. Confirmed in the menu first. */
  const eraseProgress = useCallback(() => {
    clearRun();
    clearMeta();
    clearRecorded();
    openRef.current = null;
    setRecorded(0);
    const fresh = emptyMeta();
    metaRef.current = fresh;
    setMeta(fresh);
    setSaved(null);
    setState(null);
    setTransition(null);
    setLastFold(null);
    setShowSettings(false);
    setShowCodex(false);
    dailyRef.current = null;
  }, []);

  const start = useCallback(
    (seed: number, align: PlayerAlign, mandate: string | null = null, daily?: { day: string; seed: number }) => {
      setSaved(null);
      setTransition(null);
      setLastFold(null);
      dailyRef.current = daily ?? null;
      const s = beginRun(lib, seed, align, metaRef.current.unlocks, mandate);
      setState(s);
      beginRecording(s, "own");
    },
    [lib, beginRecording],
  );

  /** A run someone else played, from its code: their setup, not this profile's. */
  const startFromCode = useCallback(
    (code: RunCode, daily?: { day: string; seed: number }) => {
      setSaved(null);
      setTransition(null);
      setLastFold(null);
      dailyRef.current = daily ?? null;
      const s = beginRunFromCode(lib, code);
      setState(s);
      beginRecording(s, daily ? "daily" : "shared");
    },
    [lib, beginRecording],
  );

  /**
   * Today's shared run (5.10). It used to be today's seed read through this profile's
   * unlocks, which made it a different run for 98.3% of players who had unlocked different
   * things (BACKLOG-2 phase 11). It starts from a fixed setup now.
   */
  const startDaily = useCallback(
    (align: PlayerAlign, mandate: string | null = null) => {
      const d = dailySeedFor();
      startFromCode(dailyCode(lib, d.seed, align, mandate), d);
    },
    [lib, startFromCode],
  );

  const continueSaved = useCallback(() => {
    if (!saved) return;
    setSaved(null);
    setLastFold(null);
    setState(ensureCard(lib, saved));
    // The recording carries on only if it is this run's, card for card; a record that lost
    // a card, or belongs to another run, is kept as far as it got.
    const open = openRef.current;
    if (open && (open.code !== encodeRunCode(runCodeOf(saved)) || open.cards.length !== saved.cardCount)) shelveOpen();
    else if (open) resumedRef.current = true;
  }, [lib, saved, shelveOpen]);

  const choose = useCallback(
    (side: Side, measure: Measure) => {
      const s = stateRef.current;
      if (!s) return;
      const r = commitChoice(lib, s, side);
      setState(r.state);
      const open = openRef.current;
      if (open && s.current && r.state !== s) {
        const next = { ...open, cards: [...open.cards, takeCard(s, r.state, side, measure, resumedRef.current)] };
        resumedRef.current = false;
        if (r.state.over) {
          openRef.current = null;
          saveOpen(null);
          setRecorded(appendRecorded(closeRun(lib, next, r.state)));
        } else {
          openRef.current = next;
          saveOpen(next);
        }
      }
      cue(lib, settingsRef.current, s, r.state, side, r.eraChanged);
      if (r.eraChanged) setTransition(r.state.era);
      if (r.state.over && !s.over) {
        const fold = foldRun(lib, metaRef.current, r.state, dailyRef.current ?? undefined);
        metaRef.current = fold.meta;
        setMeta(fold.meta);
        setLastFold(fold);
        saveMeta(fold.meta);
        dailyRef.current = null;
      }
    },
    [lib],
  );

  const dismissTransition = useCallback(() => {
    setTransition(null);
    setState((s) => (s ? ensureCard(lib, s) : s));
  }, [lib]);

  /** Debug only: shift hidden drift so the frame theming can be checked without playing 30 cards. */
  const nudgeDrift = useCallback((delta: number) => {
    setState((s) => (s && !s.over ? { ...s, drift: clampDrift(s.drift + delta) } : s));
  }, []);

  /**
   * Put a profile brought from elsewhere in place of this one (BACKLOG-5 phase 33), after the
   * player has seen both and said so. A run in progress is left alone: it carries its own
   * unlocks and plays the same under either profile.
   */
  const replaceProgress = useCallback((next: MetaState, nextSettings: Settings) => {
    saveMeta(next);
    metaRef.current = next;
    setMeta(next);
    setLastFold(null);
    setSettings(nextSettings);
  }, [setSettings]);

  /** Hand the record to the share sheet; the player picks where it goes. */
  const sendPlaytest = useCallback(() => sendRecord(loadRecorded()), []);

  /** Delete the record, the run being recorded included. The setting stays as it is. */
  const deletePlaytest = useCallback(() => {
    clearRecorded();
    openRef.current = null;
    setRecorded(0);
  }, []);

  const reset = useCallback(() => {
    clearRun();
    setSaved(null);
    setTransition(null);
    setState(null);
    setLastFold(null);
    dailyRef.current = null;
  }, []);

  const screen: Screen = showCodex ? "codex" : !state ? "setup" : state.over ? "over" : "play";
  return {
    screen,
    state,
    transition,
    saved,
    meta,
    lastFold,
    start,
    startDaily,
    startFromCode,
    continueSaved,
    choose,
    dismissTransition,
    nudgeDrift,
    reset,
    openCodex: () => setShowCodex(true),
    closeCodex: () => setShowCodex(false),
    settings,
    setSettings,
    record: { runs: recorded, full: recorded >= MAX_RECORDED_RUNS },
    sendRecord: sendPlaytest,
    deleteRecord: deletePlaytest,
    showSettings,
    openSettings: () => setShowSettings(true),
    closeSettings: () => setShowSettings(false),
    showCabinet,
    openCabinet: () => setShowCabinet(true),
    closeCabinet: () => setShowCabinet(false),
    showHow,
    openHowItWorks: () => {
      setShowSettings(false);
      setShowHow(true);
    },
    closeHowItWorks: () => setShowHow(false),
    showMove,
    openMoveProgress: () => {
      setShowSettings(false);
      setShowMove(true);
    },
    closeMoveProgress: () => setShowMove(false),
    replaceProgress,
    exitToMenu,
    eraseProgress,
    markTaught,
  };
}
