import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { campaignDue, draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { LOST_OFFICE_FLAG } from "../../src/engine/opposition";
import { honestCount, resolve } from "../../src/engine/resolve";
import { fxDeltas, newRun } from "../../src/engine/state";
import type { Card, Choice, GameState, Side } from "../../src/engine/types";
import { BLOC_KEYS } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim";

/**
 * BACKLOG-10 phase 56: the cards before each vote in office are the campaign's, a choice of how
 * to win the count, honestly or the easy way.
 */

const cfg = library.config;
/** How far a side lifts the coalition, in bloc points before the band and the speaker scale it. */
const lift = (ch: Choice) => BLOC_KEYS.reduce((n, b) => n + (fxDeltas(ch.fx)[b] ?? 0), 0);
/** The honest side, then the easy one: the one that drifts toward Decay. */
const sides = (c: Card): [Side, Side] => ((c.left.drift ?? 0) >= (c.right.drift ?? 0) ? ["left", "right"] : ["right", "left"]);

/** A run in era 1 with `played` cards behind it and nothing on the table; its first vote falls on card 26. */
function before(played: number, patch: Partial<GameState> = {}): GameState {
  const s = newRun(library, 5, { align: "left" });
  return { ...s, cardCount: played, current: null, ...patch };
}

describe("the campaign in the deal", () => {
  it("is the cards before a vote in office, and then the vote", () => {
    let s = before(cfg.electionInterval - cfg.campaignLead);
    const dealt: string[] = [];
    for (let i = 0; i <= cfg.campaignLead; i++) {
      s = draw(library, s);
      const card = getCard(library, s.current!);
      dealt.push(`${s.currentFrom}:${card.type}${card.campaign ? ", campaign" : ""}`);
      s = resolve(library, s, card.id, sides(card)[0]);
    }
    expect(cfg.campaignLead).toBe(2);
    expect(dealt).toEqual(["campaign:event, campaign", "campaign:event, campaign", "election:election"]);
  });

  it("is not due earlier, out of office, or once elections are abolished", () => {
    expect(campaignDue(library, before(cfg.electionInterval - cfg.campaignLead - 1))).toBe(false);
    const due = before(cfg.electionInterval - 1);
    expect(campaignDue(library, due)).toBe(true);
    // Out of office the opposition's own cards are its campaign (phase 55).
    expect(campaignDue(library, { ...due, flags: [LOST_OFFICE_FLAG], opposition: { since: 1, returnAt: cfg.eraLength - 1 } })).toBe(false);
    expect(campaignDue(library, { ...due, flags: [cfg.electionsAbolishedFlag] })).toBe(false);
  });

  it("falls through to the ordinary deal when this side has no campaign card left", () => {
    const s = draw(library, before(cfg.electionInterval - 1, { seen: library.campaignCards.map((c) => c.id) }));
    expect(s.currentFrom).not.toBe("campaign");
    expect(getCard(library, s.current!).campaign).toBeFalsy();
  });

  it("never deals a campaign card from the ordinary deck", () => {
    const ordinary = [...library.eventPool.values()].flat();
    expect(ordinary.some((c) => c.campaign)).toBe(false);
  });
});

describe("a campaign card", () => {
  it("lifts the coalition either way, the easy way further, for drift and the rival's gain", () => {
    expect(library.campaignCards.length).toBe(40);
    for (const c of library.campaignCards) {
      const [clean, easy] = sides(c);
      expect(lift(c[clean]), c.id).toBeGreaterThan(0);
      expect(lift(c[easy]), c.id).toBeGreaterThanOrEqual(lift(c[clean]));
      expect(c[clean].drift, c.id).toBeGreaterThan(0);
      expect(c[easy].drift, c.id).toBeLessThan(0);
      // The rival campaigns on whatever you just did.
      expect(c[easy].rival, c.id).toBeGreaterThan(0);
      expect(c[clean].rival ?? 0, c.id).toBe(0);
    }
  });

  it("can make up a narrow loss the easy way, and nothing makes up a deep one", () => {
    const easyLift = (c: Card) => lift(c[sides(c)[1]]);
    const byLift = [...library.campaignCards].filter((c) => c.align !== "right").sort((a, b) => easyLift(a) - easyLift(b));
    const [weakest, strongest] = [byLift[0]!, byLift.at(-1)!];
    /** The count after campaigning the easy way on this card twice, from blocs `short` under the bar. */
    const after = (card: Card, short: number) => {
      const bloc = cfg.electionMoodThreshold - short;
      let s = before(cfg.electionInterval - cfg.campaignLead, { drift: 0, rivalStanding: cfg.rivalStart });
      s = { ...s, meters: { ...s.meters, base: bloc, backers: bloc, public: bloc } };
      expect(honestCount(library, s).wins).toBe(false);
      for (let i = 0; i < cfg.campaignLead; i++) s = resolve(library, { ...s, current: card.id, currentFrom: "campaign" }, card.id, sides(card)[1]);
      return honestCount(library, s);
    };
    expect(after(weakest, 2).wins).toBe(true);
    expect(after(strongest, 15).wins).toBe(false);
  });
});

describe("the informed voter on a campaign card", () => {
  const card = library.campaignCards.find((c) => c.align === "any")!;
  const [clean, easy] = sides(card);
  /** What it takes on the card with the coalition `short` under the bar (negative: over it). */
  const takes = (short: number): Side => {
    const bloc = cfg.electionMoodThreshold - short;
    const s0 = before(cfg.electionInterval - cfg.campaignLead, { current: card.id, currentFrom: "campaign", drift: 0, rivalStanding: cfg.rivalStart });
    const s = { ...s0, meters: { ...s0.meters, base: bloc, backers: bloc, public: bloc } };
    return BOTS.informed(makeContext(library, s, card, () => 0.5, { danger: 25 }));
  };

  it("campaigns honestly when that wins the count", () => {
    expect(takes(-10)).toBe(clean);
  });

  it("campaigns the easy way when the line says a narrow loss that honesty will not make up", () => {
    expect(takes(4)).toBe(easy);
  });

  it("campaigns honestly when the loss is too deep for any campaign", () => {
    expect(takes(12)).toBe(clean);
  });
});
