import { META_SAVE_VERSION } from "../version";
import { emptyMeta } from "./state";
import type { MetaState } from "./types";

const META_KEY = "rod.meta";

/**
 * Meta state is stored under its own key and its own version, separate from run state
 * (section 12). Add a case here whenever META_SAVE_VERSION goes up.
 */
export function migrateMeta(raw: unknown): MetaState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<MetaState> & { v?: number };
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
    })),
    nearMissed: Array.isArray(data.nearMissed) ? [...data.nearMissed] : [],
    unlocks: Array.isArray(data.unlocks) ? [...data.unlocks] : [],
    alignsPlayed: Array.isArray(data.alignsPlayed) ? [...data.alignsPlayed] : [],
    daily: data.daily ?? null,
  };
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
