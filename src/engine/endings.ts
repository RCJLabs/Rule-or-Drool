import type { Library } from "./library";
import { exitBand } from "./state";
import type { Band, Epilogue, GameState, PlayerAlign } from "./types";

export function epilogueKey(e: Pick<Epilogue, "band" | "align" | "era">): string {
  return `${e.band}:${e.align}:${e.era}`;
}

/**
 * Pick the epilogue for a band/align/era, preferring an align-specific text, then an
 * "any" text, then the nearest earlier era of either. Returns null if nothing matches.
 */
export function findEpilogue(lib: Library, band: Band, align: PlayerAlign, era: number): Epilogue | null {
  let best: Epilogue | null = null;
  let bestScore = -1;
  for (const e of lib.epilogues) {
    if (e.band !== band) continue;
    if (e.align !== align && e.align !== "any") continue;
    if (e.era > era) continue;
    // Exact era beats earlier eras; specific align beats "any" within the same era.
    const score = (e.era === era ? 100 : e.era) * 2 + (e.align === align ? 1 : 0);
    if (score > bestScore) {
      best = e;
      bestScore = score;
    }
  }
  return best;
}

export function epilogueByKey(lib: Library, key: string): Epilogue | null {
  return lib.epilogues.find((e) => epilogueKey(e) === key) ?? null;
}

/** End the run with the given ending. The epilogue is chosen by band at time of exit (5.5). */
export function endRun(lib: Library, state: GameState, endingId: string): GameState {
  if (!lib.endings.has(endingId)) throw new Error(`unknown ending id: ${endingId}`);
  const band = exitBand(lib, state);
  const epi = findEpilogue(lib, band, state.align, state.era);
  const key = epi ? epilogueKey(epi) : epilogueKey({ band, align: state.align, era: state.era });
  return { ...state, over: { endingId, epilogueKey: key } };
}
