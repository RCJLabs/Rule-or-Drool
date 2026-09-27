import { settledByInheritance } from "./inherit";
import type { Library } from "./library";
import type { Card, GameState, Inheritance, PlayerAlign, Side } from "./types";

/**
 * Endings you can go looking for (BACKLOG-13 phase 83). The codex gives a clue to an ending not
 * found yet, and a careful player met three to five of the 77 in forty runs. Each of the 58 that
 * a choice in a story takes came in a sixth of the runs of a player who knew the clue and followed
 * it (15.7% for the eyes bot), so a clue could wait a dozen runs for its story.
 *
 * A run can go looking for one. Of the stories, or the questions, that could start, the one that
 * ends this way comes first in the seed's order, and it starts sooner once it can: at a chance of
 * `PURSUIT_START` a card rather than the ordinary game's. On the same seeds, a player following
 * the clue was offered the ending in 93-95% of pursued runs; 89-93 of the 98 endings and sides
 * came in three runs in four or more. The rest wait on the country: a story written for high
 * order or a corrupt minister still waits for them.
 *
 * Only a pursued run is dealt differently. Every other run deals as it did, so the deck keeps its
 * stamp, and the daily, the week's scenario and a run from a link never take one.
 */

/** How likely the pursued story or question is to start, on a card it can: the ordinary game's are 0.075 and 0.12. */
export const PURSUIT_START = 0.25;

/** The card a side leads to, for this party: its own way on, or the story's. */
const nextOf = (card: Card, side: Side, align: PlayerAlign): string | undefined => card[side].nextByAlign?.[align] ?? card[side].next;

const TOWARD = new WeakMap<Library, Map<string, ReadonlySet<string>>>();

/**
 * The cards of the stories that can end a run this way, for this party, from which it can still
 * get there: a card with a side that takes the ending, or one with a side leading to such a card.
 */
function toward(lib: Library, ending: string, align: PlayerAlign): ReadonlySet<string> {
  let known = TOWARD.get(lib);
  if (!known) TOWARD.set(lib, (known = new Map()));
  const key = `${ending}:${align}`;
  const cached = known.get(key);
  if (cached) return cached;
  const cards: Card[] = [];
  for (const arc of lib.arcs.values()) {
    if (arc.align !== "any" && arc.align !== align) continue;
    for (const id of arc.cards) {
      const card = lib.cards.get(id);
      if (card) cards.push(card);
    }
  }
  const good = new Set<string>();
  for (let grew = true; grew; ) {
    grew = false;
    for (const card of cards) {
      if (good.has(card.id)) continue;
      const leads = (["left", "right"] as const).some((s) => card[s].ending === ending || good.has(nextOf(card, s, align) ?? ""));
      if (leads) {
        good.add(card.id);
        grew = true;
      }
    }
  }
  known.set(key, good);
  return good;
}

/** The stories and questions that can end a run this way for this party, from their first card. */
export function carriersOf(lib: Library, ending: string, align: PlayerAlign): readonly string[] {
  const good = toward(lib, ending, align);
  return [...lib.arcs.values()].filter((arc) => (arc.align === "any" || arc.align === align) && good.has(arc.cards[0] ?? "")).map((arc) => arc.id);
}

/**
 * The side of a card that takes a run pursuing this ending on toward it: the side that ends it,
 * or the one that leads on to a card that can. Null on a card that is not on the way.
 */
export function sideToward(lib: Library, card: Card, ending: string, align: PlayerAlign): Side | null {
  if (!toward(lib, ending, align).has(card.id)) return null;
  const ends = (["left", "right"] as const).find((s) => card[s].ending === ending);
  if (ends) return ends;
  return (["left", "right"] as const).find((s) => toward(lib, ending, align).has(nextOf(card, s, align) ?? "")) ?? null;
}

/** Whether an ending can be gone looking for at all: one a choice in a story takes, on either side. */
export function pursuable(lib: Library, ending: string): boolean {
  return lib.endings.has(ending) && (carriersOf(lib, ending, "left").length > 0 || carriersOf(lib, ending, "right").length > 0);
}

/** What decides whether a run can go looking for an ending: the side, the eras, the unlocks, and what it took over. */
export interface PursuitSetup {
  align: PlayerAlign;
  eraCount: number;
  unlocked: readonly string[];
  inheritance?: Inheritance | null;
}

/**
 * Why a run on this setup cannot go looking for the ending, or null when it can:
 * - `side`: no story on this side ends a run this way;
 * - `short`: none of its stories can start in so few eras;
 * - `locked`: its stories wait on an unlock the run does not have;
 * - `settled`: the country the run takes over has already settled it.
 */
export type PursuitProblem = "unknown" | "side" | "short" | "locked" | "settled";

export function pursuitProblem(lib: Library, setup: PursuitSetup, ending: string): PursuitProblem | null {
  if (!pursuable(lib, ending)) return "unknown";
  const arcs = carriersOf(lib, ending, setup.align).map((id) => lib.arcs.get(id)!);
  if (arcs.length === 0) return "side";
  const inTime = arcs.filter((arc) => arc.entry.eras.some((e) => e <= setup.eraCount));
  if (inTime.length === 0) return "short";
  const open = inTime.filter((arc) => !arc.requires || setup.unlocked.includes(arc.requires));
  if (open.length === 0) return "locked";
  const inherited = { inherited: setup.inheritance ?? null };
  if (open.every((arc) => settledByInheritance(lib, inherited, arc.id))) return "settled";
  return null;
}

const PURSUED = new WeakMap<Library, Map<string, ReadonlySet<string>>>();

/** The stories and questions a run is dealt first, as a set: none for a run that is not looking for anything. */
export function pursuedArcs(lib: Library, state: Pick<GameState, "pursuit" | "align">): ReadonlySet<string> {
  if (!state.pursuit) return NONE;
  let known = PURSUED.get(lib);
  if (!known) PURSUED.set(lib, (known = new Map()));
  const key = `${state.pursuit}:${state.align}`;
  let arcs = known.get(key);
  if (!arcs) known.set(key, (arcs = new Set(carriersOf(lib, state.pursuit, state.align))));
  return arcs;
}

const NONE: ReadonlySet<string> = new Set();
