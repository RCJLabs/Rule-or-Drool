/**
 * Phrases the deck leans on, and how many cards may carry each (BACKLOG-7 phase 47).
 *
 * The cards were drafted in batches, and each batch reached for the same few constructions. At
 * v0.57.0 "would like" was in 142 cards, "nobody" in 145 and "your century" in 60, and 63 of
 * the long reign's comebacks opened "Two centuries on". A reader notices the tenth "would like"
 * long before a card they have seen before.
 *
 * `npm run voice` lists the cards carrying each phrase. `validate:mvp` warns when one goes over
 * its ceiling, and under --strict a warning fails the build, as every content rule's does.
 * Raise a ceiling on purpose, not by accident.
 */
export interface VoicePhrase {
  /** As the report prints it. */
  phrase: string;
  match: RegExp;
  /** The most cards that may carry it. */
  ceiling: number;
}

export const VOICE: readonly VoicePhrase[] = [
  { phrase: "would like", match: /\bwould like\b/i, ceiling: 40 },
  { phrase: "nobody", match: /\bnobody\b/i, ceiling: 60 },
  { phrase: "your century", match: /\byour century\b/i, ceiling: 20 },
  { phrase: "Two centuries on, opening a card", match: /^Two centuries on\b/, ceiling: 15 },
];

/** The cards whose text carries a phrase. */
export const carrying = <T extends { text: string }>(cards: readonly T[], p: Pick<VoicePhrase, "match">): T[] => cards.filter((c) => p.match.test(c.text));
