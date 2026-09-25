import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { appointmentDue, draw } from "../../src/engine/draw";
import { withNames } from "../../src/engine/endings";
import { getCard } from "../../src/engine/library";
import { preview } from "../../src/engine/preview";
import { applyChoice, resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { advisorPool, candidatesFor, newRun, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign } from "../../src/engine/types";
import { BOTS, appointee, makeContext, type BotName } from "../../src/sim";

/**
 * An era's first card after the first fills a seat at the table (BACKLOG-10 phase 61): the seat's
 * holder names the two other people its pool holds, and the player appoints one.
 */

const cfg = library.config;
const prefix = cfg.advisorFlagPrefix;

/** A run played to its end by a bot, with where each appointment fell and what it did. */
function play(bot: BotName, seed: number, eraCount?: number): { run: GameState; appointed: { at: number; role: string }[] } {
  const rng = makeRng(seed ^ 0x5bd1e995);
  const align: PlayerAlign = seed % 2 ? "left" : "right";
  let s = newRun(library, seed, { ...rollSetup(library, seed, align, []), ...(eraCount ? { eraCount } : {}) });
  const appointed: { at: number; role: string }[] = [];
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    if (card.appoints) {
      expect(s.currentFrom).toBe("appointment");
      appointed.push({ at: s.cardCount, role: card.appoints });
    }
    s = resolve(library, s, card.id, BOTS[bot](makeContext(library, s, card, rng, { danger: 25 })));
  }
  return { run: s, appointed };
}

/** The first card of era 2, dealt: an appointment. */
function atEraTwo(seed = 4): GameState {
  const s = newRun(library, seed, { align: "left" });
  return draw(library, { ...s, era: 2, cardCount: cfg.eraLength, nextElectionAt: cfg.eraLength + cfg.electionInterval });
}

describe("an appointment", () => {
  it("is the first card of every era after the first, a different seat each time", () => {
    let full = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { run, appointed } = play("mixed", seed);
      if (run.era < cfg.eraCount || !run.over!.endingId.startsWith(cfg.finalePrefix)) continue;
      full++;
      expect(appointed.map((a) => a.at)).toEqual(Array.from({ length: cfg.eraCount - 1 }, (_, i) => (i + 1) * cfg.eraLength));
      expect(new Set(appointed.map((a) => a.role)).size).toBe(appointed.length);
    }
    expect(full).toBeGreaterThan(20);
    // A long reign fills four seats; a first term, none.
    const long = play("informed", 3, cfg.longEraCount);
    if (long.run.over!.endingId.startsWith(cfg.longFinalePrefix)) expect(long.appointed).toHaveLength(cfg.longEraCount - 1);
    expect(play("mixed", 5, cfg.firstTermEras).appointed).toEqual([]);
  });

  it("offers the seat's two other people, and seats the one chosen with the flags that say so", () => {
    const s = atEraTwo();
    const card = getCard(library, s.current!);
    const role = card.appoints!;
    const holder = s.cabinet[role]!;
    const pair = candidatesFor(library, s, role)!;
    expect(pair.map((a) => a.id)).toEqual(advisorPool(library, role, s.align).map((a) => a.id).filter((id) => id !== holder).sort());
    for (const [side, chosen] of [["left", pair[0]], ["right", pair[1]]] as const) {
      const after = resolve(library, s, card.id, side);
      expect(after.cabinet[role]).toBe(chosen.id);
      expect(after.cabinetSince[role]).toBe(cfg.eraLength);
      expect(after.flags).toContain(`${prefix}${chosen.id}`);
      expect(after.flags).not.toContain(`${prefix}${holder}`);
      for (const t of chosen.traits) expect(after.flags).toContain(`${prefix}${t}`);
      // Nothing else moves: an appointment is a choice of who, not of what it costs. (The full
      // resolve also runs the era's standing pressure, which is the era's and not the card's.)
      const chose = applyChoice(library, s, card, side);
      expect([chose.meters, chose.drift]).toEqual([s.meters, s.drift]);
      expect(after.stats.advisorsFired).toBe(0);
    }
  });

  it("names them on the card and on each side, with what each of them is", () => {
    const s = atEraTwo(8);
    const card = getCard(library, s.current!);
    const [first, second] = candidatesFor(library, s, card.appoints!)!;
    const text = withNames(library, s, card.text, card.speaker);
    for (const a of [first, second]) {
      expect(text).toContain(a.name);
      expect(text).toContain(a.traits.join(" and "));
    }
    expect(text).not.toMatch(/[{}]/);
    expect(withNames(library, s, card.left.label, card.speaker)).toContain(first.name);
    expect(withNames(library, s, card.right.label, card.speaker)).toContain(second.name);
    // The preview is the seat changing hands, and nothing on the meters.
    expect(preview(library, s, card, "left").meters).toEqual(s.meters);
  });

  it("is not dealt out of office, or in the first era", () => {
    const s = atEraTwo();
    expect(appointmentDue(library, { ...s, current: null })).toBe(true);
    expect(appointmentDue(library, { ...s, current: null, opposition: { since: cfg.eraLength, returnAt: null } })).toBe(false);
    expect(appointmentDue(library, { ...s, current: null, era: 1, cardCount: 0 })).toBe(false);
  });
});

describe("the bots at an appointment", () => {
  it("take the better-reading candidate, and the greedy bot the worse", () => {
    const s = atEraTwo();
    const card = getCard(library, s.current!);
    const [first, second] = candidatesFor(library, s, card.appoints!)!;
    const ctx = makeContext(library, s, card, () => 0.5, { danger: 25 });
    const careful = appointee(ctx, 1);
    const greedy = appointee(ctx, -1);
    expect(careful).not.toBeNull();
    if (first.traits.join() !== second.traits.join()) expect(greedy).not.toBe(careful);
    expect(BOTS.informed(ctx)).toBe(careful);
    expect(BOTS.greedy(ctx)).toBe(greedy);
  });
});
