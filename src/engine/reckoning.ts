import type { Library } from "./library";
import type { Card, GameState } from "./types";

/**
 * The legacy a run's reckoning answers for (BACKLOG-13 phase 92): the highest in history's order
 * of the legacies this reign left, not the ones it took over, that a reckoning is written for.
 * Given a reckoning, the highest of those it is written for, which is the one it was dealt for
 * and what its text opens on. Null when it left none of them. Nothing here imports the rest of
 * the engine, so the deal and the words on the card can both read it.
 */
export function reckonedLegacy(lib: Library, state: Pick<GameState, "flags" | "inherited">, card?: Card): string | null {
  const inherited = state.inherited?.legacies ?? [];
  const written = (f: string) => (card ? !!card.reckons?.includes(f) : lib.reckonings.some((c) => c.reckons!.includes(f)));
  return lib.legacyOrder.find((f) => written(f) && state.flags.includes(f) && !inherited.includes(f)) ?? null;
}
