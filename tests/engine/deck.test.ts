import { describe, expect, it } from "vitest";
import { content, library } from "../../src/content";
import deckFile from "../../src/content/deck.json";
import { dealtBy, deckStamp, stampOf, WORDING_PATHS } from "../../src/engine/deck";
import { buildLibrary } from "../../src/engine/library";
import { newRun } from "../../src/engine/state";
import type { Content } from "../../src/engine/types";
import { dealOf } from "../../src/sim/deal";

/**
 * The deck stamp (BACKLOG-8 phase 49). src/content/deck.json is the deck as it stands and what
 * it deals, written by `npm run deck`. When the content changes, both move and the last test
 * fails until the file is written again: the change deals different runs from every code,
 * daily and challenge made before it, and the file's diff says so. When the engine's own code
 * deals differently and the stamp stays, bump DEAL_VERSION in src/version.ts first.
 */

/** Every key path in the content that holds a string, as `cards[].left.label`. */
function stringPaths(c: Content): Set<string> {
  const out = new Set<string>();
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) v.forEach((x) => walk(x, `${path}[]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    else if (typeof v === "string") out.add(path);
  };
  for (const [k, v] of Object.entries(c)) walk(v, k);
  return out;
}

/** The strings that decide what is dealt or how a choice lands. */
const MECHANICS = [
  "advisors[].align", "advisors[].id", "advisors[].role", "advisors[].traits[]",
  "arcs[].align", "arcs[].cards[]", "arcs[].entry.bands[]", "arcs[].entry.flags[]", "arcs[].entry.notFlags[]",
  "arcs[].entry.speakerTraits[]", "arcs[].id", "arcs[].question", "arcs[].requires",
  "cards[].align", "cards[].arc", "cards[].bands[]", "cards[].cond.flags[]", "cards[].cond.notFlags[]",
  "cards[].cond.speakerTraits[]", "cards[].id", "cards[].speaker", "cards[].type",
  ...["left", "right"].flatMap((s) =>
    ["clearFlags[]", "ending", "enqueue[].id", "next", "nextByAlign.left", "nextByAlign.right", "setFlags[]"].map((f) => `cards[].${s}.${f}`),
  ),
  "endings[].id", "epilogues[].align", "epilogues[].band",
  "modifiers[].align", "modifiers[].flags[]", "modifiers[].id", "modifiers[].kind", "modifiers[].requires",
];

describe("the deck stamp", () => {
  it("knows which of the content's strings are wording and which decide something", () => {
    for (const path of stringPaths(content)) {
      const known = WORDING_PATHS.includes(path) || MECHANICS.includes(path);
      expect(known, `${path}: wording (WORDING_PATHS in src/engine/deck.ts) or mechanics (MECHANICS here)?`).toBe(true);
    }
  });

  it("hashes no wording", () => {
    const dealt = JSON.stringify(dealtBy(library));
    const card = content.cards.find((c) => c.text.length > 60)!;
    for (const words of [card.text, card.left.label, card.right.label, content.endings[0]!.title, content.endings[0]!.text, content.advisors[0]!.name]) {
      expect(dealt.includes(JSON.stringify(words))).toBe(false);
    }
  });

  it("keeps its stamp when only the wording changes", () => {
    const reworded: Content = {
      ...content,
      cards: content.cards.map((c) => ({ ...c, text: `${c.text} Again.`, left: { ...c.left, label: "Yes" }, right: { ...c.right, label: "No" } })),
      endings: content.endings.map((e) => ({ ...e, title: "An ending", text: "It ended." })),
      epilogues: content.epilogues.map((e) => ({ ...e, text: "After." })),
      advisors: content.advisors.map((a) => ({ ...a, name: "Someone" })),
    };
    const base = stampOf(dealtBy(library));
    expect(deckStamp(buildLibrary(reworded))).toBe(base);
    // The look is drawn from drift and never deals a card.
    expect(deckStamp(buildLibrary(content, { lookMargin: 5 }))).toBe(base);
  });

  it("moves when anything dealt or scored changes", () => {
    const base = stampOf(dealtBy(library));
    const first = content.cards[0]!;
    const changed: Content[] = [
      { ...content, cards: [{ ...first, left: { ...first.left, drift: (first.left.drift ?? 0) + 1 } }, ...content.cards.slice(1)] },
      { ...content, cards: [{ ...first, weight: (first.weight ?? 1) + 1 }, ...content.cards.slice(1)] },
      { ...content, cards: content.cards.slice(1) },
      { ...content, endings: content.endings.map((e, i) => (i === 0 ? { ...e, id: `${e.id}_x` } : e)) },
    ];
    for (const c of changed) expect(deckStamp(buildLibrary(c))).not.toBe(base);
    expect(deckStamp(buildLibrary(content, { eraMeterPull: 0.3 }))).not.toBe(base);
  });

  it("is carried by every run from its first card, as the game's library has it", () => {
    expect(newRun(library, 1, { align: "left" }).deck).toBe(deckFile.stamp);
    expect(deckStamp(library)).toBe(deckFile.stamp);
  });

  it("is written down for the deck as it stands, and moves whenever the deal does", () => {
    const now = { stamp: stampOf(dealtBy(library)), deal: dealOf(library) };
    if (now.stamp === deckFile.stamp && now.deal !== deckFile.deal) {
      throw new Error(`The deal moved and the deck stamp did not: bump DEAL_VERSION in src/version.ts, then run npm run deck.`);
    }
    expect(now, "The deck changed: run npm run deck, and commit src/content/deck.json with it.").toEqual(deckFile);
  }, 60000);
});
