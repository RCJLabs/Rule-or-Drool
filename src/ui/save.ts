import { DEFAULT_CONFIG } from "../engine/config";
import { DECK_PATTERN } from "../engine/deck";
import type { Library } from "../engine/library";
import { stageOf } from "../engine/look";
import { decodeRunResult, encodeRunResult, type RunResult } from "../meta/challenge";
import type { GameState, Meters } from "../engine/types";
import { BLOC_KEYS, EMPTY_STATS } from "../engine/types";
import { RUN_SAVE_VERSION } from "../version";

const RUN_KEY = "rod.run";
const HINT_KEY = "rod.hintSeen";

/** Which day's daily a run is, when it is one. */
export interface DailyMark {
  day: string;
  seed: number;
}

interface RunSave {
  v: number;
  state: GameState;
  /**
   * Set while the run is a daily (BACKLOG-5 phase 38). It lived only in memory, so a daily
   * left for later and reopened in a new tab finished as an ordinary run: the day went
   * unrecorded and the menu offered it again. It sits beside the state rather than in it
   * because it is about the profile, not the run, which plays the same either way; an older
   * save without it resumes as an ordinary run, as it always did.
   */
  daily?: DailyMark | null;
  /**
   * How the run went for whoever sent it, when it came in a link that said (BACKLOG-5 phase
   * 37), so the end still compares the two after a reload. Kept in the link's own words.
   */
  vs?: string | null;
  /** The deck their run was dealt from, when the link said (BACKLOG-8 phase 49). */
  vsDeck?: string | null;
}

/** Run state is saved after every step. Meta progression gets its own key in phase 6. */
export function saveRun(state: GameState, daily: DailyMark | null = null, vs: RunResult | null = null): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify({ v: RUN_SAVE_VERSION, state, daily, vs: vs ? encodeRunResult(vs) : null, vsDeck: vs?.deck ?? null } satisfies RunSave));
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
  // v7 -> v8: the run records why the card on the table is there (BACKLOG-3 phase 19). A
  // save taken before this cannot know, and guessing would put a mark on the wrong card, so
  // the one card in progress is unmarked and everything after it is recorded properly.
  if (v < 8) s = { ...s, currentFrom: null };
  // v8 -> v9: the run dates its flags, for the timeline at the end. A run already under way
  // cannot know when it set the ones it has, and dating them all to card 0 would be a lie
  // the timeline then tells, so they stay undated and only what happens next is recorded.
  if (v < 9) s = { ...s, flagSince: {} };
  // v9 -> v10: the run keeps its choices, so a card of it can be put back on the table
  // (BACKLOG-5 phase 34). A run under way cannot know the ones it already made, so it has no
  // record and cannot be gone back into; it is not a second road either. A second road's save
  // holds its first road inside it, which a later migration will have to bring forward too.
  if (v < 10) s = { ...s, choices: null, road: null };
  // v10 -> v11: a run has its own number of eras, five for a long reign (BACKLOG-5 phase 39).
  // Every run saved before is an ordinary one, and so is the first road a second road holds.
  if (v < 11) {
    const ordinary = <T extends GameState>(x: T): T => ({ ...x, eraCount: DEFAULT_CONFIG.eraCount });
    s = ordinary(s);
    if (s.road) s = { ...s, road: { ...s.road, first: ordinary(s.road.first) } };
  }
  // v11 -> v12: the run keeps the look it is showing, which now depends on where drift has
  // been and not only where it is (BACKLOG-7 phase 45). A run saved before has only its drift,
  // so it resumes in the look that drift implies, which is the look it was showing when saved.
  // The first road a second road holds is brought forward the same way.
  if (v < 12) {
    const looked = <T extends GameState>(x: T): T => ({ ...x, look: stageOf(x.drift, DEFAULT_CONFIG) });
    s = looked(s);
    if (s.road) s = { ...s, road: { ...s.road, first: looked(s.road.first) } };
  }
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

/** How the saved run went for whoever sent it, if it came in a link that said. */
export function loadRunChallenge(lib: Library): RunResult | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const { vs, vsDeck } = JSON.parse(raw) as Partial<RunSave>;
    const result = typeof vs === "string" ? decodeRunResult(lib, vs) : null;
    return result && typeof vsDeck === "string" && DECK_PATTERN.test(vsDeck) ? { ...result, deck: vsDeck } : result;
  } catch {
    return null;
  }
}

/** The saved run's daily, if it is one and still the run saved beside it. */
export function loadRunDaily(): DailyMark | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const { state, daily } = JSON.parse(raw) as Partial<RunSave>;
    if (!daily || typeof daily.day !== "string" || typeof daily.seed !== "number") return null;
    return state?.seed === daily.seed ? { day: daily.day, seed: daily.seed } : null;
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
