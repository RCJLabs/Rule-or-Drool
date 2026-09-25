import { DECK_PATTERN } from "../engine/deck";
import { META_SAVE_VERSION } from "../version";
import { dayIndex } from "./daily";
import { emptyMeta } from "./state";
import { holdKey, releaseKey, removeKey, writeKey } from "./storage";
import { TIERS } from "./contracts";
import type { ContractWeek, DailyEntry, MetaState } from "./types";

const META_KEY = "rod.meta";
/** Profiles this version could not read, kept instead of written over (BACKLOG-8 phase 50). */
const ASIDE_KEY = "rod.meta.aside";

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
    contracts: contractsOf(data.contracts),
  };
}

/**
 * v6 -> v7: the weekly contracts kept (BACKLOG-10 phase 60). A profile from before kept none.
 * One from a link is read as carefully as its dailies: whole weeks from the first on, each once,
 * and no more contracts in a week than a week deals.
 */
function contractsOf(raw: unknown): ContractWeek[] {
  const byWeek = new Map<number, string[]>();
  for (const w of Array.isArray(raw) ? raw : []) {
    if (!w || typeof w !== "object") continue;
    const { week, kept } = w as Record<string, unknown>;
    if (typeof week !== "number" || !Number.isInteger(week) || week < 1 || byWeek.has(week) || !Array.isArray(kept)) continue;
    const ids = [...new Set(kept.filter((id): id is string => typeof id === "string"))].slice(0, TIERS.length);
    if (ids.length) byWeek.set(week, ids);
  }
  return [...byWeek].sort((a, b) => a[0] - b[0]).map(([week, ids]) => ({ week, kept: ids }));
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

/** A stored profile this version could not read, kept as it was (BACKLOG-8 phase 50). */
export interface SetAside {
  /** When it was set aside, in milliseconds. It names the profile too. */
  at: number;
  /** `newer`: saved by a later version of the game than this one. `unreadable`: not a profile. */
  reason: "newer" | "unreadable";
  /** The profile exactly as it was stored. */
  raw: string;
  /** The player has been told it was set aside. */
  told?: boolean;
  /** The player has been told this version can read it. */
  offered?: boolean;
}

export interface ProfileLoad {
  meta: MetaState;
  /** The stored profile, set aside because this version could not read it. */
  aside: SetAside | null;
}

const isNewer = (data: unknown): boolean => {
  const v = data && typeof data === "object" ? (data as { v?: unknown }).v : undefined;
  return typeof v === "number" && v > META_SAVE_VERSION;
};

/**
 * The stored profile. One this version cannot read, because it is not JSON, not a profile, or
 * from a newer version of the game, used to load as an empty profile, and the next finished
 * run saved that over it. Now it is set aside first, under a key of its own, and the game
 * starts afresh. Move my progress can hand it on, and a later version that can read it offers
 * it back. The stored copy is left in place until a save replaces it, so loading twice sets
 * it aside once.
 */
export function loadProfile(now: number = Date.now()): ProfileLoad {
  releaseKey(META_KEY);
  let raw: string | null;
  try {
    raw = localStorage.getItem(META_KEY);
  } catch {
    return { meta: emptyMeta(), aside: null };
  }
  if (!raw) return { meta: emptyMeta(), aside: null };
  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch {
    // Not JSON: set aside below, as unreadable.
  }
  const meta = migrateMeta(data);
  if (meta) {
    // Set aside by an older version and never saved over, so it is back already.
    const same = readAsides()?.find((a) => a.raw === raw);
    if (same) dropAside(same.at);
    return { meta, aside: null };
  }
  const aside = setAside(raw, isNewer(data) ? "newer" : "unreadable", now);
  // Neither read nor set aside: nothing is written over it, and every save says it failed.
  if (!aside) holdKey(META_KEY);
  return { meta: emptyMeta(), aside };
}

export function loadMeta(): MetaState {
  return loadProfile().meta;
}

/** Keep a profile aside, once. Null when it could not be kept, so nothing may replace it. */
function setAside(raw: string, reason: SetAside["reason"], at: number): SetAside | null {
  const kept = readAsides();
  // A list that is there but cannot be read is not written over either.
  if (!kept) return null;
  const known = kept.find((a) => a.raw === raw);
  if (known) return known;
  const aside: SetAside = { at, reason, raw };
  return writeKey(ASIDE_KEY, JSON.stringify([...kept, aside])) ? aside : null;
}

/** The profiles set aside, oldest first; null when the list is there but cannot be read. */
function readAsides(): SetAside[] | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(ASIDE_KEY);
  } catch {
    return null;
  }
  if (!raw) return [];
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return null;
    return list.filter(
      (a): a is SetAside =>
        !!a && typeof a === "object" && typeof a.at === "number" && (a.reason === "newer" || a.reason === "unreadable") && typeof a.raw === "string",
    );
  } catch {
    return null;
  }
}

export function asides(): SetAside[] {
  return readAsides() ?? [];
}

/** Whether this version can read a profile set aside, as a later version may. */
export function canComeBack(aside: SetAside): boolean {
  try {
    return migrateMeta(JSON.parse(aside.raw)) !== null;
  } catch {
    return false;
  }
}

/** Note that the player has been told about a profile set aside, so they are told once. */
export function markAside(at: number, field: "told" | "offered"): boolean {
  const kept = readAsides();
  if (!kept?.some((a) => a.at === at)) return false;
  return writeKey(ASIDE_KEY, JSON.stringify(kept.map((a) => (a.at === at ? { ...a, [field]: true } : a))));
}

/** Let a profile set aside go: it has come back, or the player erased everything. */
export function dropAside(at: number): boolean {
  const kept = readAsides();
  if (!kept) return false;
  const rest = kept.filter((a) => a.at !== at);
  return rest.length ? writeKey(ASIDE_KEY, JSON.stringify(rest)) : removeKey(ASIDE_KEY);
}

export function clearAsides(): boolean {
  return removeKey(ASIDE_KEY);
}

/** False when the profile was not kept, which the storage has already reported. */
export function saveMeta(meta: MetaState): boolean {
  return writeKey(META_KEY, JSON.stringify(meta));
}

export function clearMeta(): boolean {
  // Erasing is asked for, so a profile that could not be set aside goes too.
  releaseKey(META_KEY);
  return removeKey(META_KEY);
}
