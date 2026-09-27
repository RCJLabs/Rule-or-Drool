import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { buildLibrary, getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { diceAt, makeRng, rankOf } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign, Side } from "../../src/engine/types";
import { BOTS, makeContext, noisy, type Bot } from "../../src/sim";
import { ev, makeFixture } from "../fixtures/content";
import { lib, play, start } from "../helpers";

/**
 * One deal per seed (BACKLOG-13 phase 81): each seed fixes the order its cards are dealt in, and
 * every die the deal rolls reads the seed, the card number and what it is for. Two runs on a seed
 * meet the same cards except where their own choices decide otherwise, and come back to the same
 * cards after.
 */

/** A run on a seed played by a bot, and the cards it met in order: its own sides, a prefix of given ones, or one turned. */
function cardsOf(seed: number, align: PlayerAlign, bot: Bot, botSeed: number, flipAt = -1, prefix: readonly Side[] = []): { cards: string[]; sides: Side[] } {
  const rng = makeRng(botSeed);
  let s: GameState = newRun(library, seed, rollSetup(library, seed, align, []));
  const cards: string[] = [];
  const sides: Side[] = [];
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    const own = bot(makeContext(library, s, card, rng, { danger: 25 }));
    let side = cards.length < prefix.length ? prefix[cards.length]! : own;
    if (cards.length === flipAt) side = side === "left" ? "right" : "left";
    cards.push(card.id);
    sides.push(side);
    s = resolve(library, s, card.id, side);
  }
  return { cards, sides };
}

/** The share of one run's cards the other met too. */
const shared = (a: readonly string[], b: readonly string[]) => {
  const other = new Set(b);
  return a.filter((id) => other.has(id)).length / a.length;
};

describe("the deal's dice", () => {
  it("read only the seed, the card number and what they are for", () => {
    expect(diceAt(7, 30, "story starts")).toBe(diceAt(7, 30, "story starts"));
    expect(diceAt(7, 30, "story starts")).not.toBe(diceAt(7, 31, "story starts"));
    expect(diceAt(7, 30, "story starts")).not.toBe(diceAt(8, 30, "story starts"));
    expect(diceAt(7, 30, "story starts")).not.toBe(diceAt(7, 30, "coup"));
  });

  it("fall evenly, and a card's place in a seed's order follows its weight", () => {
    const bins = Array.from({ length: 10 }, () => 0);
    for (let at = 0; at < 20_000; at++) bins[Math.floor(diceAt(3, at, "x") * 10)]!++;
    for (const b of bins) expect(Math.abs(b - 2000)).toBeLessThan(200);
    // Weighted three to one, the heavier comes first in about three seeds of four.
    let first = 0;
    for (let seed = 0; seed < 4000; seed++) if (rankOf(seed, "heavy", 3) > rankOf(seed, "light", 1)) first++;
    expect(first / 4000).toBeGreaterThan(0.72);
    expect(first / 4000).toBeLessThan(0.78);
  });

  it("leave the run's own stream where the setup left it", () => {
    const l = lib();
    const s = start(l);
    expect(play(l, s, 30).state.rngState).toBe(s.rngState);
  });
});

describe("one deal per seed", () => {
  // Six plain cards and nothing else to deal: no stories, no elections, no era to end.
  const six = ["c1", "c2", "c3", "c4", "c5", "c6"];
  const thin = buildLibrary(
    { ...makeFixture(), arcs: [], cards: six.map((id) => ev(id, { eras: [1] })) },
    { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0, cooldownSize: 2 },
  );
  const dealt = (seed: number, side: Side | ((id: string) => Side), n: number) => play(thin, start(thin, {}, "left", seed), n, side).ids;

  it("deals every card it can once before it deals any again", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ids = dealt(seed, "left", 18);
      expect(new Set(ids.slice(0, 6)), `seed ${seed}`).toEqual(new Set(six));
      // After that a card comes round again by the seed's dice, never one just dealt.
      for (let i = 6; i < ids.length; i++) expect(ids.slice(i - 2, i), `seed ${seed}, card ${i + 1}`).not.toContain(ids[i]);
    }
  });

  it("deals the same order on a seed however its cards are decided, less what a choice puts in reach, and another on another seed", () => {
    // c1's left side opens a card the right side never does; the other six keep their order.
    const cards = [...six.map((id) => ev(id, { eras: [1] })), ev("opened", { eras: [1], cond: { flags: ["open"] } })];
    cards[0] = { ...cards[0]!, left: { label: "L", setFlags: ["open"] } };
    const opens = buildLibrary({ ...makeFixture(), arcs: [], cards }, { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0, cooldownSize: 2 });
    const orders = new Set<string>();
    let met = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const closed = play(opens, start(opens, {}, "left", seed), 6, "right").ids;
      const open = play(opens, start(opens, {}, "left", seed), 7, "left").ids;
      expect(new Set(closed), `seed ${seed}`).toEqual(new Set(six));
      // Dealt among the six rather than after them, which is where one stream of dice would have gone its own way.
      if (open.indexOf("opened") < six.length) met++;
      expect(
        open.filter((id) => id !== "opened"),
        `seed ${seed}`,
      ).toEqual(closed);
      orders.add(closed.join(" "));
    }
    expect(met).toBeGreaterThan(5);
    expect(orders.size).toBeGreaterThan(15);
  });

  it("deals two players on one seed mostly the same cards, however they choose", () => {
    const at: number[] = [];
    for (let k = 0; k < 30; k++) {
      const seed = 810_000 + k;
      const a = cardsOf(seed, k % 2 ? "left" : "right", noisy(BOTS.eyes, 0.2), 11 + k);
      const b = cardsOf(seed, k % 2 ? "left" : "right", noisy(BOTS.eyes, 0.2), 99_991 + k);
      at.push(shared(a.cards, b.cards));
    }
    at.sort((x, y) => x - y);
    // Measured on 300 seeds: 76% at the median; before this phase, 29%.
    expect(at[15]!).toBeGreaterThan(0.6);
  });

  it("leaves most of the rest of a run's cards as they were when one choice goes the other way", () => {
    let after = 0;
    let n = 0;
    for (let k = 0; k < 20; k++) {
      const seed = 820_000 + k;
      const base = cardsOf(seed, "left", BOTS.informed, seed);
      const at = 10 + (k % 5) * 12;
      if (at >= base.cards.length - 5) continue;
      const alt = cardsOf(seed, "left", BOTS.informed, seed, at, base.sides.slice(0, at + 1));
      after += shared(base.cards.slice(at + 1), alt.cards.slice(at + 1));
      n++;
    }
    expect(n).toBeGreaterThan(10);
    // Measured on 900 flips: 83% of the cards after a flip met either way; before, 43%.
    expect(after / n).toBeGreaterThan(0.65);
  });
});
