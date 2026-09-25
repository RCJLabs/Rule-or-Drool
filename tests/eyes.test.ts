import { describe, expect, it } from "vitest";
import { library } from "../src/content";
import { getCard } from "../src/engine/library";
import { LOST_OFFICE_FLAG } from "../src/engine/opposition";
import { fxDeltas, newRun } from "../src/engine/state";
import type { Card, GameState, Side } from "../src/engine/types";
import { BLOC_KEYS, METER_KEYS } from "../src/engine/types";
import { BOT_NAMES, BOTS, evaluateTargets, makeContext, readAs, simulate, summarize, type BotName, type BotSummary } from "../src/sim";
import { DANGER_BELOW } from "../src/ui/signals";
import { stepOf } from "../src/ui/speech";

/**
 * The bot with a person's eyes (BACKLOG-10 phase 57): it decides from what the table shows, the
 * preview's dots rather than the numbers, the danger the screen draws, and the count line.
 */

const cfg = library.config;
const honestOf = (c: Card): Side => ((c.left.drift ?? 0) >= (c.right.drift ?? 0) ? "left" : "right");
const other = (s: Side): Side => (s === "left" ? "right" : "left");

/** A left-side run in era 1, a few cards from its first vote, every meter at `level`, with this card on the table. */
function table(card: Card, level = 50, patch: Partial<GameState> = {}): GameState {
  const s = newRun(library, 21, { align: "left" });
  const meters = Object.fromEntries(METER_KEYS.map((k) => [k, level])) as GameState["meters"];
  return { ...s, cardCount: 10, current: card.id, currentFrom: "deck", drift: 0, rivalStanding: cfg.rivalStart, meters, ...patch };
}
const eyes = (s: GameState, card: Card): Side => BOTS.eyes(makeContext(library, s, card, () => 0.5, { danger: 25 }));

/** An era-1 event on the left's table whose honest side costs the Movement and whose easy side buys it back, no ending either way. */
const costsTheBase = [...library.eventPool.values()]
  .flat()
  .find((c) => {
    const h = honestOf(c);
    return c.eras.includes(1) && c.align !== "right" && !c.cond && !c.left.ending && !c.right.ending && (fxDeltas(c[h].fx).base ?? 0) <= -2 && (fxDeltas(c[other(h)].fx).base ?? 0) >= 2;
  })!;

describe("what the eyes bot reads off the table", () => {
  it("reads how far a meter goes only from the preview's dot, and which way from the card", () => {
    const s = table(costsTheBase);
    const ctx = makeContext(library, s, costsTheBase, () => 0.5, { danger: 25 });
    for (const side of ["left", "right"] as const) {
      const read = readAs(ctx, side);
      for (const k of METER_KEYS) {
        const delta = ctx[side].meters[k] - s.meters[k];
        const expected = !ctx[side].affected.includes(k) || delta === 0 ? s.meters[k] : s.meters[k] + Math.sign(delta) * [0, 2, 4, 8][stepOf(delta)]!;
        expect(read[k], `${side} ${k}`).toBe(expected);
      }
    }
  });

  it("stays honest until the screen draws a meter in danger, and not at the harness's own line", () => {
    const h = honestOf(costsTheBase);
    // Low enough for the mixed bot to turn careful, not low enough for the screen to say so.
    expect(eyes(table(costsTheBase, 50, { meters: { ...table(costsTheBase).meters, base: DANGER_BELOW + 5 } }), costsTheBase)).toBe(h);
    // Drawn in danger: it spares the Movement.
    expect(eyes(table(costsTheBase, 50, { meters: { ...table(costsTheBase).meters, base: DANGER_BELOW - 5 } }), costsTheBase)).toBe(other(h));
  });

  it("never takes a side the card says ends the reign while the other does not", () => {
    const ends = library.content.cards.filter((c) => c.type !== "election" && !!c.left.ending !== !!c.right.ending);
    expect(ends.length).toBeGreaterThan(20);
    for (const card of ends) expect(eyes(table(card), card), card.id).toBe(card.left.ending ? "right" : "left");
  });
});

describe("the eyes bot at a vote and before one", () => {
  const vote = getCard(library, "e_rig");
  const honest: Side = vote.left.honest ? "left" : "right";
  const at = (short: number, patch: Partial<GameState> = {}) => {
    const s = table(vote, 50, { current: vote.id, currentFrom: "election", ...patch });
    const bloc = cfg.electionMoodThreshold - short;
    return { ...s, meters: { ...s.meters, ...Object.fromEntries(BLOC_KEYS.map((b) => [b, bloc])) } };
  };

  it("stands honestly when the line says a win, and the first time it says a loss", () => {
    expect(eyes(at(-10), vote)).toBe(honest);
    expect(eyes(at(6), vote)).toBe(honest);
  });

  it("cheats a lost count that would end the run: a second one, or the return vote", () => {
    expect(eyes(at(6, { flags: [LOST_OFFICE_FLAG] }), vote)).toBe(other(honest));
    const ret = library.returnVotes.find((c) => c.align === "any")!;
    const back: Side = ret.left.honest ? "left" : "right";
    const out = at(12, { current: ret.id, flags: [LOST_OFFICE_FLAG], opposition: { since: 26, returnAt: cfg.eraLength - 1 } });
    expect(eyes(out, ret)).toBe(other(back));
  });

  it("campaigns the easy way on a narrow loss, and honestly on a win or a deep loss", () => {
    const card = library.campaignCards.find((c) => c.align === "any")!;
    const clean = honestOf(card);
    const on = (short: number) => eyes({ ...at(short), current: card.id, currentFrom: "campaign" }, card);
    expect(on(-10)).toBe(clean);
    expect(on(3)).toBe(other(clean));
    expect(on(12)).toBe(clean);
  });
});

describe("the eyes bot in the harness", () => {
  it("plays every run the others do, and sits beside the informed voter as information", () => {
    expect(BOT_NAMES).toContain("eyes");
    const results = simulate(library, { runs: 60, seed: 3, bots: ["informed", "eyes"], align: "alternate", danger: 25, maxCards: 1000 });
    const s = new Map<BotName, BotSummary>([...results].map(([b, r]) => [b, summarize(b, r)]));
    const rows = evaluateTargets(s).filter((t) => t.bot === "eyes");
    expect(rows.map((r) => r.name)).toEqual(["reaches Ascent (exit band)", "sees the finale"]);
    for (const r of rows) expect([r.info, r.pass, r.actual.includes("informed")]).toEqual([true, true, true]);
  });
});
