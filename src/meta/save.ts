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
  // v1 is the first shape; future versions patch forward from here.
  const base = emptyMeta();
  return {
    ...base,
    ...data,
    v: META_SAVE_VERSION,
    endings: { ...(data.endings ?? {}) },
    epilogues: Array.isArray(data.epilogues) ? [...data.epilogues] : [],
    objectives: { ...(data.objectives ?? {}) },
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
