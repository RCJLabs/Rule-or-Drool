import type { GameState } from "../engine/types";
import { RUN_SAVE_VERSION } from "../version";

const RUN_KEY = "rod.run";
const HINT_KEY = "rod.hintSeen";

interface RunSave {
  v: number;
  state: GameState;
}

/** Run state is saved after every step. Meta progression gets its own key in phase 6. */
export function saveRun(state: GameState): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify({ v: RUN_SAVE_VERSION, state } satisfies RunSave));
  } catch {
    // Storage unavailable (private mode, quota). The run just is not resumable.
  }
}

export function loadRun(): GameState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RunSave>;
    if (parsed.v !== RUN_SAVE_VERSION || !parsed.state) return null;
    const s = parsed.state;
    if (typeof s.seed !== "number" || typeof s.cardCount !== "number" || !s.meters || !Array.isArray(s.flags)) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    // ignore
  }
}

export function hintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markHintSeen(): void {
  try {
    localStorage.setItem(HINT_KEY, "1");
  } catch {
    // ignore
  }
}
