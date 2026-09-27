import { STRINGS } from "../content/strings";
import { withNames } from "../engine/endings";
import type { Library } from "../engine/library";
import type { GameState } from "../engine/types";
import type { ShapePoint } from "./shape";

/**
 * The bill's receipt (BACKLOG-13 phase 80). 295 card sides send a card later, 98% of them
 * self-serving: the game's bill for the easy choice, arriving 14 cards later on average. 40 of the
 * 97 cards sent that way are sent by more than one card, so the card alone cannot say which choice
 * it is the bill for, and nothing did. Now it arrives saying so, and the end screen lists what came
 * back.
 */

/** The choice that sent a card: the card's number in the run, and the side's label as its button said it. */
export interface Receipt {
  n: number;
  label: string;
}

/** The choice at a card of the run, by its number; null where the run did not keep its choices. */
function choiceAt(lib: Library, state: GameState, n: number): Receipt | null {
  const made = state.choices?.[n - 1];
  const card = made ? lib.cards.get(made[0]) : undefined;
  return made && card ? { n, label: card[made[1]].label } : null;
}

/**
 * The receipt for the card on the table: the choice that sent it, when it came back from the
 * queue. Null for any other card, and for one sent before the queue kept its senders.
 */
export function receiptOf(lib: Library, state: GameState): Receipt | null {
  if (state.currentFrom !== "queue" || state.sentBy === undefined) return null;
  return choiceAt(lib, state, state.sentBy);
}

const fill = (template: string, r: Receipt) => template.replace("{n}", String(r.n)).replace("{label}", r.label);

/** The receipt under the speaker: "Sent by card 23: “Trust the software”". */
export const receiptLine = (r: Receipt): string => fill(STRINGS.receipt.line, r);

/** The receipt aloud, in place of saying only that the card came back. */
export const receiptSpoken = (r: Receipt): string => fill(STRINGS.receipt.spoken, r);

/** A card that came back, for the end screen: where it came, what sent it, and how it began. */
export interface Bill {
  /** The card it came back on. */
  at: number;
  sent: Receipt;
  /** Its first sentence. */
  text: string;
}

/** A card's first sentence, which is what a list of them has room for. */
export function firstSentence(text: string): string {
  return text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
}

/**
 * Every card of a finished run that came back, in order: read off the run dealt again from its
 * record (`shapeOf`), which is the only place a finished run still knows why each card came.
 */
export function billsOf(lib: Library, state: GameState, points: readonly ShapePoint[]): Bill[] {
  const bills: Bill[] = [];
  for (const p of points) {
    if (p.sentBy === undefined) continue;
    const id = state.choices?.[p.card - 1]?.[0];
    const card = id ? lib.cards.get(id) : undefined;
    const sent = choiceAt(lib, state, p.sentBy);
    if (card && sent) bills.push({ at: p.card, sent, text: firstSentence(withNames(lib, state, card.text, card.speaker)) });
  }
  return bills;
}
