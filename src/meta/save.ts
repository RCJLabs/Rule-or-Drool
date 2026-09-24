import { DECK_PATTERN } from "../engine/deck";
import { META_SAVE_VERSION } from "../version";
import { dayIndex } from "./daily";
import { emptyMeta } from "./state";
import type { DailyEntry, MetaState } from "./types";

const META_KEY = "rod.meta";

/**
 * Meta state is stored under its own key and its own version, separate from run state
 * (section 12). Add a case here whenever META_SAVE_VERSION goes up.
 */
export function migrateMeta(raw: unknown): MetaState | null {
  if (!raw || typeof raw !== "object") return null;
  // `daily` is the one daily a v5 profile kept; it becomes the first day of the log below.
  const { daily: kept, ...data } = raw as Partial<MetaState> & { v?: number; daily?: unknown };
  if (typeof data.v !== "number" || data.v > META_SAVE_VERSION) return null;
  // v1 -> v2: epilogues became side-specific, so every `band:any:era` key a v1 save
  // collected names a text that no longer exists. Dropping them keeps the codex count
  // honest; the player re-collects the side's own future on their next run.
  const collected = Array.isArray(data.epilogues) ? data.epilogues : [];
  const epilogues = data.v < 2 ? collected.filter((k) => !k.includes(":any:")) : collected;
  const base = emptyMeta();
  return {
    ...base,
    ...data,
    v: META_SAVE_VERSION,
    endings: { ...(data.endings ?? {}) },
    epilogues: [...epilogues],
    objectives: { ...(data.objectives ?? {}) },
    // v2 -> v3: the codex became a history as well as a death list (BACKLOG item 10).
    // Past runs left no record of themselves, so these start empty and fill from here.
    arcOutcomes: Array.isArray(data.arcOutcomes) ? [...data.arcOutcomes] : [],
    legacies: { ...(data.legacies ?? {}) },
    // v4 -> v5: every run is named by history now. Runs finished before were never named,
    // and naming them after the fact from the codex record would guess at a band and side
    // the record does not keep, so the collection starts empty and fills from here.
    histories: { ...(data.histories ?? {}) },
    advisorsKept: { ...(data.advisorsKept ?? {}) },
    advisorsFired: { ...(data.advisorsFired ?? {}) },
    // v3 -> v4: runs can be taken on a promise (BACKLOG-2 phase 16). Nothing before this
    // made one, so the tallies start empty; history lines from before carry no mandate,
    // which is true of them rather than missing from them.
    mandatesKept: { ...(data.mandatesKept ?? {}) },
    mandatesBroken: { ...(data.mandatesBroken ?? {}) },
    history: (Array.isArray(data.history) ? data.history : []).map((r) => ({
      ...r,
      mandate: r.mandate ?? null,
      mandateKept: r.mandateKept ?? false,
      history: r.history ?? null,
    })),
    nearMissed: Array.isArray(data.nearMissed) ? [...data.nearMissed] : [],
    unlocks: Array.isArray(data.unlocks) ? [...data.unlocks] : [],
    alignsPlayed: Array.isArray(data.alignsPlayed) ? [...data.alignsPlayed] : [],
    dailies: dailiesOf(data.dailies, kept),
  };
}

/**
 * v5 -> v6: a log of dailies in place of the latest one (BACKLOG-5 phase 38). The one a v5
 * profile kept is the log's first day; it never recorded what history called the run, so
 * that day is named by its ending. A profile can arrive in a link anyone can send (phase
 * 33), so anything that is not a day the log could have written is left out, and a day
 * written twice keeps its first.
 */
function dailiesOf(log: unknown, kept: unknown): DailyEntry[] {
  const found: unknown[] = Array.isArray(log) ? log : [];
  const old = kept && typeof kept === "object" ? (kept as Record<string, unknown>) : null;
  const entries = old ? [{ day: old.day, history: null, ending: old.endingId, cards: old.cards }, ...found] : found;
  const byDay = new Map<string, DailyEntry>();
  for (const e of entries) {
    if (!e || typeof e !== "object") continue;
    const { day, history, ending, cards, deck } = e as Record<string, unknown>;
    if (typeof day !== "string" || !Number.isFinite(dayIndex(day)) || byDay.has(day)) continue;
    if (typeof ending !== "string" || typeof cards !== "number" || !Number.isFinite(cards)) continue;
    const entry: DailyEntry = { day, history: typeof history === "string" ? history : null, ending, cards };
    if (typeof deck === "string" && DECK_PATTERN.test(deck)) entry.deck = deck;
    byDay.set(day, entry);
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return emptyMeta();
    return migrateMeta(JSON.parse(raw)) ?? emptyMeta();
  } catch {
    return emptyMeta();
  }
}

export function saveMeta(meta: MetaState): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Storage unavailable: progression simply is not kept.
  }
}

export function clearMeta(): void {
  try {
    localStorage.removeItem(META_KEY);
  } catch {
    // ignore
  }
}
