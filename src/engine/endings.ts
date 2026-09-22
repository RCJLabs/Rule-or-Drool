import type { Library } from "./library";
import { exitBand } from "./state";
import type { Band, Epilogue, GameState, PlayerAlign } from "./types";
import { PLAYER_ALIGNS } from "./types";

export function epilogueKey(e: Pick<Epilogue, "band" | "align" | "era">): string {
  return `${e.band}:${e.align}:${e.era}`;
}

/**
 * Pick the epilogue for a band/align/era, preferring an align-specific text, then an
 * "any" text, then the nearest earlier era of either. Returns null if nothing matches.
 */
export function findEpilogue(lib: Pick<Library, "epilogues">, band: Band, align: PlayerAlign, era: number): Epilogue | null {
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

/**
 * Fill the name tokens a card or ending may carry. `{rival}` is the person who ran against
 * you (BACKLOG item 7); `{advisor}` is whoever is speaking, so a card can be written about
 * the person in the room rather than the role (phase 15).
 */
export function withNames(lib: Library, state: GameState, text: string, speaker?: string): string {
  let out = text;
  if (out.includes("{rival}")) {
    const name = lib.advisorsById.get(state.cabinet[lib.config.rivalRole] ?? "")?.name;
    out = out.replaceAll("{rival}", name ?? "your rival");
  }
  if (out.includes("{advisor}")) {
    const name = speaker ? lib.advisorsById.get(state.cabinet[speaker] ?? "")?.name : undefined;
    out = out.replaceAll("{advisor}", name ?? "your adviser");
  }
  return out;
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

/** One way a story can end: the choice that leaves the arc, and the words on it. */
export interface ArcOutcome {
  /** `${cardId}:${side}`, matching what a run records in `stats.arcOutcomes`. */
  key: string;
  label: string;
}

/**
 * Every ending an arc has, derived from its cards: a side leaves the arc when it carries no
 * pointer onward for at least one alignment. These are the codex's story collectibles
 * (BACKLOG item 10) — unlike endings, collecting them means playing a story out.
 */
export function arcOutcomes(lib: Library, arcId: string): ArcOutcome[] {
  const arc = lib.arcs.get(arcId);
  if (!arc) return [];
  const out: ArcOutcome[] = [];
  for (const cardId of arc.cards) {
    const card = lib.cards.get(cardId);
    if (!card) continue;
    for (const side of ["left", "right"] as const) {
      const choice = card[side];
      const byAlign = choice.nextByAlign ?? {};
      const exitsSomewhere = PLAYER_ALIGNS.some((a) => !byAlign[a] && !choice.next);
      if (exitsSomewhere) out.push({ key: `${cardId}:${side}`, label: choice.label });
    }
  }
  return out;
}
