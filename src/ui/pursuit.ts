import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { pursuedArcs, type PursuitProblem } from "../engine/pursuit";
import type { GameState, PlayerAlign } from "../engine/types";
import { CLUES } from "../meta/clues";

/**
 * What the screens say of going looking for an ending (BACKLOG-13 phase 83). The ending is named by
 * the codex's rumour of it, never its title, which the player has not found.
 */

/** The rumour, in quotation marks: the words the codex gave. */
export const rumourOf = (id: string): string => `“${CLUES[id] ?? id}”`;

/** Why the run about to start looks for nothing: the side it needs, a term too short, a lock, a settled country. */
export function cannotLine(problem: PursuitProblem, align: PlayerAlign): string {
  const c = STRINGS.pursuit.cannot;
  // Only one party's stories end a run this way, and it is not the one chosen.
  if (problem === "side") return c.side.replace("{party}", STRINGS.parties[align === "left" ? "right" : "left"]);
  return c[problem];
}

/** How the looking went, for the end of a run that looked: found, its story came and went another way, or it did not come. */
export type Looked = "found" | "turned" | "missed";

export function lookedOf(lib: Library, state: GameState): Looked | null {
  if (!state.pursuit || !state.over) return null;
  if (state.over.endingId === state.pursuit) return "found";
  const arcs = pursuedArcs(lib, state);
  const came = (state.choices ?? []).some(([id]) => arcs.has(lib.cards.get(id)?.arc ?? ""));
  return came ? "turned" : "missed";
}
