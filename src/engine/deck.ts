import { DEAL_VERSION } from "../version";
import type { Library } from "./library";
import { MANDATES, MANDATES_BY_ID } from "./mandates";
import type { GameState } from "./types";

/**
 * Which deck a run was dealt from (BACKLOG-8 phase 49).
 *
 * A run code names a run by its setup, and the setup deals the same run only on the same deck.
 * Measured on 2,000 seeds with the mixed bot, the 22 stories of v0.59.0 left 0.3% of runs as
 * they were, and most parted by the 13th card. Nothing said so: the offer of a shared run
 * promised the same deck, and a run continued across an update played on under the new one.
 *
 * The stamp is a hash of everything that decides what is dealt and how a choice lands: the
 * cards, stories, questions, advisors, crises, endings, epilogues and promises, the engine's
 * config, and DEAL_VERSION for the engine's own code. The wording is left out, so a pass over
 * the text keeps every code: the voice pass of v0.58.0 left all 2,000 runs as they were.
 */

/** Where the content holds wording and nothing else. Every other string decides something. */
export const WORDING_PATHS: readonly string[] = [
  "cards[].text",
  "cards[].left.label",
  "cards[].right.label",
  "endings[].title",
  "endings[].text",
  "epilogues[].text",
  "advisors[].name",
];

/** Config the frame reads and the deal does not: the look only ever follows drift. */
const LOOK_ONLY = new Set(["lookAt", "lookMargin"]);

/** The content and config, without the wording: what the stamp is a hash of. */
export function dealtBy(lib: Library): unknown {
  const c = lib.content;
  return {
    deal: DEAL_VERSION,
    config: Object.fromEntries(Object.entries(lib.config).filter(([k]) => !LOOK_ONLY.has(k))),
    cards: c.cards.map(({ text: _text, left: { label: _l, ...left }, right: { label: _r, ...right }, ...card }) => ({ ...card, left, right })),
    arcs: c.arcs,
    advisors: c.advisors.map(({ name: _name, ...advisor }) => advisor),
    modifiers: c.modifiers,
    endings: c.endings.map(({ title: _title, text: _text, ...ending }) => ending),
    epilogues: c.epilogues.map(({ text: _text, ...epilogue }) => epilogue),
    // A promise's rule is code, which DEAL_VERSION covers; its data is here.
    mandates: MANDATES.map(({ id, startFlags, meterStart, brokeCard }) => ({ id, startFlags, meterStart, brokeCard })),
  };
}

const stamps = new WeakMap<Library, string>();

/** The deck's stamp: eight letters and digits, the same wherever the same deck is loaded. */
export function deckStamp(lib: Library): string {
  let s = stamps.get(lib);
  if (s === undefined) {
    s = stampOf(dealtBy(lib));
    stamps.set(lib, s);
  }
  return s;
}

/** The stamp of what `dealtBy` returns: the tree hashed as it is walked, keys in order. */
export function stampOf(dealt: unknown): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const ch = (c: number) => {
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  };
  const str = (s: string) => {
    ch(s.length);
    for (let i = 0; i < s.length; i++) ch(s.charCodeAt(i));
  };
  const feed = (v: unknown): void => {
    if (v === null || v === undefined) ch(0);
    else if (typeof v === "string") (ch(1), str(v));
    else if (typeof v === "number") (ch(2), str(String(v)));
    else if (typeof v === "boolean") ch(v ? 3 : 4);
    else if (Array.isArray(v)) {
      ch(5);
      ch(v.length);
      for (const x of v) feed(x);
    } else {
      const o = v as Record<string, unknown>;
      const keys = Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort();
      ch(6);
      ch(keys.length);
      for (const k of keys) (str(k), feed(o[k]));
    }
  };
  feed(dealt);
  return (finish(h1, h2) % 36 ** 8).toString(36).padStart(8, "0");
}

/**
 * The stamp worked out ahead, for the game's own library (src/content/deck.json, written by
 * `npm run deck`), so a slow phone does not spend 50-90 ms working it out at startup.
 * tests/engine/deck.test.ts fails when the file is not the stamp this module works out.
 */
export function rememberStamp(lib: Library, stamp: string): void {
  stamps.set(lib, stamp);
}

/** A stamp as links and records carry it. */
export const DECK_PATTERN = /^[0-9a-z]{8}$/;

/**
 * What a saved run names that this build does not have: the card on the table, the cards and
 * stories in hand, the cabinet, the crises and the promise, and the card a second road
 * branched at. Such a run cannot go on here. Drawing it would throw, and until now nothing
 * caught that: the page went blank on every Continue (BACKLOG-8 phase 49).
 */
export function missingContent(lib: Library, state: GameState): string[] {
  const missing: string[] = [];
  const card = (id: string | null | undefined) => {
    if (id && !lib.cards.has(id)) missing.push(id);
  };
  card(state.current);
  for (const q of state.queue) card(q.id);
  for (const a of state.activeArcs) {
    if (!lib.arcs.has(a.id)) missing.push(a.id);
    card(a.nextCard);
  }
  for (const id of Object.values(state.cabinet)) if (!lib.advisorsById.has(id)) missing.push(id);
  for (const id of state.modifiers) if (!lib.modifiers.has(id)) missing.push(id);
  if (state.mandate && !MANDATES_BY_ID.has(state.mandate)) missing.push(state.mandate);
  if (state.road) card(state.choices?.[state.road.at]?.[0]);
  return missing;
}

/** cyrb53: a fast 53-bit string hash. Not for secrets; for telling decks apart. */
export function hash53(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  return finish(h1, h2);
}

function finish(a: number, b: number): number {
  const h1 = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
  const h2 = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
