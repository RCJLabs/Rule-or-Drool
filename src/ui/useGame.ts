import { useCallback, useEffect, useRef, useState } from "react";
import type { Library } from "../engine/library";
import type { GameState, PlayerAlign, Side } from "../engine/types";
import { beginRun, commitChoice, ensureCard } from "./flow";
import { clearRun, loadRun, saveRun } from "./save";
import { clampDrift } from "../engine/state";

export type Screen = "setup" | "play" | "over";

export function useGame(lib: Library) {
  const [saved, setSaved] = useState<GameState | null>(() => {
    const s = loadRun();
    return s && !s.over ? s : null;
  });
  const [state, setState] = useState<GameState | null>(null);
  const [transition, setTransition] = useState<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (state) saveRun(state);
  }, [state]);

  const start = useCallback(
    (seed: number, align: PlayerAlign) => {
      setSaved(null);
      setTransition(null);
      setState(beginRun(lib, seed, align));
    },
    [lib],
  );

  const continueSaved = useCallback(() => {
    if (!saved) return;
    setSaved(null);
    setState(ensureCard(lib, saved));
  }, [lib, saved]);

  const choose = useCallback(
    (side: Side) => {
      const s = stateRef.current;
      if (!s) return;
      const r = commitChoice(lib, s, side);
      setState(r.state);
      if (r.eraChanged) setTransition(r.state.era);
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
  }, []);

  const screen: Screen = !state ? "setup" : state.over ? "over" : "play";
  return { screen, state, transition, saved, start, continueSaved, choose, dismissTransition, nudgeDrift, reset };
}
