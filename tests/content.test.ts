import { describe, expect, it } from "vitest";
import { content, library } from "../src/content";
import { buildLibrary } from "../src/engine/library";
import { BANDS } from "../src/engine/types";
import { validateContent } from "../src/validate";
import { makeFixture } from "./fixtures/content";

/**
 * Guards on the shipped content that go beyond the validator's rules (card counts, cell
 * coverage, the house convention that drift signs differ), plus one validator run.
 */
describe("content", () => {
  const events = content.cards.filter((c) => c.type === "event" && (c.weight ?? 1) > 0);
  const elections = content.cards.filter((c) => c.type === "election");

  it("ships at least 30 drawable event cards and an election card", () => {
    expect(events.length).toBeGreaterThanOrEqual(30);
    expect(elections.length).toBeGreaterThanOrEqual(1);
  });

  it("covers era 1 across all three bands for both alignments", () => {
    for (const band of BANDS) {
      for (const align of ["left", "right", "any"] as const) {
        const cell = library.eventPool.get(`1:${band}:${align}`) ?? [];
        expect(cell.length, `era 1 / ${band} / ${align}`).toBeGreaterThan(0);
      }
    }
  });

  it("rejects duplicate ids", () => {
    const fx = makeFixture();
    expect(() => buildLibrary({ ...fx, cards: [...fx.cards, fx.cards[0]!] })).toThrow(/duplicate card id/);
  });

  it("passes the validator (which owns the reference, flag, ending, election, speaker and length checks)", () => {
    const errors = validateContent(content).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
  });

  it("offers a real tradeoff on every event card (sign of drift differs between sides)", () => {
    for (const c of events) {
      const l = c.left.drift ?? 0;
      const r = c.right.drift ?? 0;
      expect(Math.sign(l) !== Math.sign(r) || (l === 0 && r === 0), c.id).toBe(true);
    }
  });
});

/**
 * Elections are the loudest recurring beat in a run, and until BACKLOG item 1 they were
 * identical for both sides. These lock in the distinction and the rule the rebalance taught.
 */
describe("elections", () => {
  const elections = content.cards.filter((c) => c.type === "election");

  it("writes elections per side, weighted so a player mostly sees their own", () => {
    for (const align of ["left", "right"] as const) {
      const own = elections.filter((c) => c.align === align);
      expect(own.length, `${align} elections`).toBeGreaterThanOrEqual(4);
      // At least one must be unconditional, or the side deck may never come up.
      expect(own.some((c) => !c.cond), `${align} has an unconditional election`).toBe(true);
    }
    const weight = (a: string) => elections.filter((c) => c.align === a && !c.cond).reduce((n, c) => n + (c.weight ?? 1), 0);
    expect(weight("left")).toBeGreaterThan(weight("any"));
    expect(weight("right")).toBeGreaterThan(weight("any"));
  });

  it("keeps shared cards for the moves that belong to neither side", () => {
    const shared = elections.filter((c) => c.align === "any").map((c) => c.id);
    expect(shared).toContain("e_rig");
    expect(shared).toContain("e_abolish");
  });

  it("charges the honest side in treasure or order, never mainly in votes", () => {
    // Honesty that also costs Mood compounds into losing the next election, turning a
    // costly choice into a death spiral. The cheat side must stay the cheap-looking one.
    for (const c of elections) {
      const honest = [c.left, c.right].find((s) => s.honest);
      expect(honest, `${c.id} has an honest side`).toBeTruthy();
      expect(honest!.fx?.mood ?? 0, `${c.id} honest mood cost`).toBeGreaterThan(-3);
      const cost = (honest!.fx?.money ?? 0) + (honest!.fx?.order ?? 0);
      expect(cost, `${c.id} honest side should cost money or order`).toBeLessThan(0);
    }
  });

  it("gives every election exactly one honest side", () => {
    for (const c of elections) {
      expect([c.left, c.right].filter((s) => s.honest).length, c.id).toBe(1);
    }
  });

  // The two paths only feel different if a decent share of what a run shows belongs to
  // one side. Arcs are the strongest lever because they run for three cards (BACKLOG 2).
  it("locks at least a third of arcs to one side, both sides represented", () => {
    const locked = content.arcs.filter((a) => a.align !== "any");
    expect(locked.length / content.arcs.length).toBeGreaterThanOrEqual(1 / 3);
    expect(locked.filter((a) => a.align === "left").length).toBeGreaterThanOrEqual(3);
    expect(locked.filter((a) => a.align === "right").length).toBeGreaterThanOrEqual(3);
  });

  it("gives a side-locked arc more entry weight than the average shared arc", () => {
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const locked = content.arcs.filter((a) => a.align !== "any").map((a) => a.weight);
    const shared = content.arcs.filter((a) => a.align === "any").map((a) => a.weight);
    expect(mean(locked)).toBeGreaterThan(mean(shared));
  });

  it("keeps every flaw an even trade", () => {
    // A flaw is meant to cost exactly what it gives. They were authored that way and item
    // 5 quietly broke two of them, because `mood` in a starting position counts three
    // times. Net zero is the property worth pinning.
    const flaws = content.modifiers.filter((m) => m.kind === "flaw");
    expect(flaws.length).toBeGreaterThanOrEqual(4);
    for (const f of flaws) {
      const net = Object.values(f.meterStart ?? {}).reduce((a, b) => a + b, 0);
      expect(net, `${f.id} meterStart`).toBe(0);
    }
  });

  it("does not make an unlocked archetype worse than a starting one", () => {
    // Earning a trait must not hand the player a weaker opening than the ones they began
    // with, which is what the tripled mood term was doing (BACKLOG item 9).
    const traits = content.modifiers.filter((m) => m.kind === "trait");
    const net = (m: (typeof traits)[number]) => Object.values(m.meterStart ?? {}).reduce((a, b) => a + b, 0);
    for (const t of traits) expect(net(t), `${t.id} meterStart`).toBeGreaterThan(0);
  });

  it("closes every run with its own side's future", () => {
    // The epilogue is the payoff for a twenty-minute run, so it reads differently for the
    // Commons and the Ledger. findEpilogue prefers a side match, so a leftover "any" text
    // would be unreachable content padding the codex (BACKLOG item 3).
    expect(content.epilogues.some((e) => e.align === "any")).toBe(false);
    for (const band of BANDS) {
      for (const align of ["left", "right"] as const) {
        for (const era of [1, 2, 3]) {
          const found = content.epilogues.find((e) => e.band === band && e.align === align && e.era === era);
          expect(found, `${band} / ${align} / era ${era}`).toBeTruthy();
        }
      }
    }
  });

  it("gives the two sides different words for the same band and era", () => {
    for (const band of BANDS) {
      for (const era of [1, 2, 3]) {
        const texts = content.epilogues.filter((e) => e.band === band && e.era === era).map((e) => e.text);
        expect(new Set(texts).size, `${band} / era ${era}`).toBe(texts.length);
      }
    }
  });

  it("tells at least one shared arc differently on each side", () => {
    const branching = content.cards.filter((c) => c.left.nextByAlign || c.right.nextByAlign);
    expect(branching.length).toBeGreaterThan(0);
    for (const c of branching) {
      const arc = content.arcs.find((a) => a.id === c.arc);
      expect(arc, `${c.id} belongs to an arc`).toBeTruthy();
      expect(arc!.align, `${c.id} branches by side, so its arc must be shared`).toBe("any");
      for (const side of [c.left, c.right]) {
        const by = side.nextByAlign;
        if (!by) continue;
        expect(Object.keys(by).sort(), `${c.id} covers both sides`).toEqual(["left", "right"]);
        expect(by.left).not.toBe(by.right);
      }
    }
  });
});
