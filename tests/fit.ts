import { withNames } from "../src/engine/endings";
import type { Library } from "../src/engine/library";
import { advisorPool } from "../src/engine/state";
import type { Advisor, Card, GameState, PlayerAlign } from "../src/engine/types";

/**
 * Which cards the small-phone fit check puts on the table (BACKLOG-8 phase 51). Every kind of
 * card draws something the others do not: a question a title line, an election a double
 * border, a card with a name the name. So each side's longest of every kind is placed, as
 * the table would show it, not only the longest events. A campaign card carries the count
 * under its text, as an election does (BACKLOG-10 phase 56).
 */
export type FitKind = "event" | "story" | "question" | "election" | "named" | "campaign";

/** How many of each side's longest events are placed: they are most of the deck. */
const EVENTS = 4;

export function arcOf(lib: Library, card: Card): { id: string; question: boolean } | undefined {
  const arc = lib.content.arcs.find((a) => a.cards.includes(card.id));
  return arc ? { id: arc.id, question: !!arc.question } : undefined;
}

/** The kind of card this is on the table; undefined for one the fit check does not know. */
export function kindOf(lib: Library, card: Card): FitKind | undefined {
  if (card.campaign) return "campaign";
  if (/\{\w+\}/.test(card.text)) return "named";
  const arc = arcOf(lib, card);
  if (arc) return arc.question ? "question" : "story";
  if (card.type === "election") return "election";
  if (card.type === "event") return "event";
  return undefined;
}

/**
 * Who can sit in a seat when this card is on the table: the side's pool for the role, narrowed
 * to the person a card is written for (`advisor_<id>`), and to the traits it asks of its speaker.
 */
function eligible(lib: Library, card: Card, role: string, party: PlayerAlign): Advisor[] {
  const pool = advisorPool(lib, role, party);
  const named = pool.filter((a) => card.cond?.flags?.includes(`${lib.config.advisorFlagPrefix}${a.id}`));
  const people = named.length ? named : pool;
  const traits = role === card.speaker ? (card.cond?.speakerTraits ?? []) : [];
  return people.filter((a) => traits.every((t) => a.traits.includes(t)));
}

const longestName = (people: readonly Advisor[]): Advisor | undefined => [...people].sort((a, b) => b.name.length - a.name.length)[0];

/**
 * The seats that decide how the card reads: its speaker's, and the rival's when it names them,
 * each held by the longest name that can hold it on this side.
 */
export function longestSeats(lib: Library, card: Card, party: PlayerAlign): Record<string, string> {
  const seats: Record<string, string> = {};
  const roles = card.text.includes("{rival}") ? [card.speaker, lib.config.rivalRole] : [card.speaker];
  for (const role of roles) {
    const who = longestName(eligible(lib, card, role, party));
    if (who) seats[role] = who.id;
  }
  return seats;
}

/** The card's text as the table shows it, with those seats filled. */
export function shownText(lib: Library, card: Card, party: PlayerAlign): string {
  const cabinet = longestSeats(lib, card, party);
  return withNames(lib, { cabinet } as unknown as GameState, card.text, card.speaker);
}

export interface Placement {
  kind: FitKind;
  card: Card;
  /** The arc it is a step of, for a story or a question card: it is dealt as that arc's next card. */
  arc?: string;
  /** Who sits where while it is on the table. */
  seats: Record<string, string>;
  text: string;
}

/** Each side's longest events, and its longest card of every other kind, as the table shows them. */
export function fitPlacements(lib: Library, party: PlayerAlign): Placement[] {
  const theirs = [...lib.cards.values()]
    .filter((c) => c.align === "any" || c.align === party)
    .map((card) => ({ card, kind: kindOf(lib, card), text: shownText(lib, card, party) }))
    .sort((a, b) => b.text.length - a.text.length || a.card.id.localeCompare(b.card.id));
  const out: Placement[] = [];
  for (const kind of ["event", "story", "question", "election", "named", "campaign"] as const) {
    for (const { card, text } of theirs.filter((c) => c.kind === kind).slice(0, kind === "event" ? EVENTS : 1)) {
      out.push({ kind, card, arc: arcOf(lib, card)?.id, seats: longestSeats(lib, card, party), text });
    }
  }
  return out;
}
