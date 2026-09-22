import { DEFAULT_CONFIG } from "../engine/config";
import type { GameState, Meters } from "../engine/types";
import { BLOC_KEYS, EMPTY_STATS } from "../engine/types";
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

/**
 * Bring an older run save forward. Section 12: RUN_SAVE_VERSION only moves with a
 * migration, and run state is versioned separately from meta state.
 *
 * v1 -> v2: phase 6 added `stats` and `unlocked` to GameState. An old save has neither, so
 * it resumes with empty counters and no unlocks, which only affects objectives for that run.
 *
 * v2 -> v3: BACKLOG item 5 replaced the single Mood meter with three coalition blocs. A run
 * saved before that has `mood` and no blocs, so the blocs all start where Mood left off,
 * which is exactly the state a run is in before any card pulls them apart.
 */
export function migrateRun(v: number, state: GameState): GameState | null {
  if (v > RUN_SAVE_VERSION || v < 1) return null;
  let s = state;
  if (v < 2) s = { ...s, stats: { ...EMPTY_STATS }, unlocked: [] };
  if (v < 3) {
    const legacy = s.meters as Meters & { mood?: number };
    const mood = typeof legacy.mood === "number" ? legacy.mood : 50;
    const meters = { ...legacy } as Meters & { mood?: number };
    delete meters.mood;
    for (const b of BLOC_KEYS) meters[b] = mood;
    s = { ...s, meters: meters as Meters };
  }
  // v3 -> v4: the rival became a person with standing (BACKLOG item 7). A saved run has
  // none, so it resumes with them where a run starts rather than dropping the save.
  if (v < 4) s = { ...s, rivalStanding: DEFAULT_CONFIG.rivalStart };
  // v4 -> v5: the run records who it fired and which branches it took (BACKLOG item 10).
  // A run in progress has no record of what it already did, so it starts one from here.
  if (v < 5) s = { ...s, stats: { ...s.stats, firedAdvisors: [], arcOutcomes: [] } };
  // v5 -> v6: the cabinet screen needs to know how long people have served. A run in
  // progress has no record, so everyone is credited from where the run is now.
  if (v < 6) {
    const since: Record<string, number> = {};
    for (const role of Object.keys(s.cabinet ?? {})) since[role] = 0;
    s = { ...s, cabinetSince: since };
  }
  // v6 -> v7: a run can be taken on a promise (BACKLOG-2 phase 16). A run already under
  // way was taken on none, so it resumes promising nothing rather than being dropped.
  if (v < 7) s = { ...s, mandate: null, mandateBrokenAt: null };
  return s;
}

export function loadRun(): GameState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RunSave>;
    if (typeof parsed.v !== "number" || !parsed.state) return null;
    const s = parsed.state;
    if (typeof s.seed !== "number" || typeof s.cardCount !== "number" || !s.meters || !Array.isArray(s.flags)) return null;
    return migrateRun(parsed.v, s);
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
