import { useCallback, useEffect, useRef, useState } from "react";
import type { Library } from "../engine/library";
import type { GameState, PlayerAlign, Side } from "../engine/types";
import { clearMeta, dailySeedFor, emptyMeta, foldRun, loadMeta, saveMeta, type MetaState, type RunFold } from "../meta";
import { beginRun, commitChoice, ensureCard } from "./flow";
import { clearRun, loadRun, saveRun } from "./save";
import { applySettings, loadSettings, saveSettings, type Settings } from "./settings";
import { clampDrift } from "../engine/state";

export type Screen = "setup" | "play" | "over" | "codex";

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
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());
  const stateRef = useRef(state);
  stateRef.current = state;
  const metaRef = useRef(meta);
  metaRef.current = meta;
  /** Set while a daily-seed run is in progress, so the result is recorded as one. */
  const dailyRef = useRef<{ day: string; seed: number } | null>(null);

  useEffect(() => {
    if (state) saveRun(state);
  }, [state]);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const setSettings = useCallback((next: Settings) => {
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
    setShowCodex(false);
    setTransition(null);
    setLastFold(null);
    if (s && !s.over) {
      saveRun(s);
      setSaved(s);
    }
    setState(null);
  }, []);

  /** Wipes the codex, every unlock and the run in progress. Confirmed in the menu first. */
  const eraseProgress = useCallback(() => {
    clearRun();
    clearMeta();
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
    (seed: number, align: PlayerAlign, daily?: { day: string; seed: number }) => {
      setSaved(null);
      setTransition(null);
      setLastFold(null);
      dailyRef.current = daily ?? null;
      setState(beginRun(lib, seed, align, metaRef.current.unlocks));
    },
    [lib],
  );

  /** Today's shared seed (5.10). Same run for everyone on the same UTC day. */
  const startDaily = useCallback(
    (align: PlayerAlign) => {
      const d = dailySeedFor();
      start(d.seed, align, d);
    },
    [start],
  );

  const continueSaved = useCallback(() => {
    if (!saved) return;
    setSaved(null);
    setLastFold(null);
    setState(ensureCard(lib, saved));
  }, [lib, saved]);

  const choose = useCallback(
    (side: Side) => {
      const s = stateRef.current;
      if (!s) return;
      const r = commitChoice(lib, s, side);
      setState(r.state);
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
    continueSaved,
    choose,
    dismissTransition,
    nudgeDrift,
    reset,
    openCodex: () => setShowCodex(true),
    closeCodex: () => setShowCodex(false),
    settings,
    setSettings,
    showSettings,
    openSettings: () => setShowSettings(true),
    closeSettings: () => setShowSettings(false),
    exitToMenu,
    eraseProgress,
  };
}
