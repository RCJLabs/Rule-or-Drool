import { describe, expect, it } from "vitest";
import { content, library } from "../src/content";
import { STRINGS } from "../src/content/strings";
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

});

/**
 * Guards on the shape of the game itself: how much of it is written for one side, one
 * band or one era, and whether the mechanics each item added are actually carried by the
 * content. These were landing under `elections` and reading as election tests.
 */
describe("content: the shape of a run", () => {
  const events = content.cards.filter((c) => c.type === "event" && (c.weight ?? 1) > 0);

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

  it("writes enough for Decay and Ascent that the bands look different", () => {
    // 74% of the pool drew in any band, so the band you were in barely changed what you saw
    // (BACKLOG item 8).
    const banded = events.filter((c) => c.bands.length < BANDS.length);
    for (const band of ["decay", "ascent"] as const) {
      const n = banded.filter((c) => c.bands.includes(band)).length;
      expect(n, `cards written for ${band}`).toBeGreaterThanOrEqual(40);
    }
    expect(banded.length / events.length).toBeGreaterThan(0.2);
  });

  it("gives every era past the first a rule of its own, and says so", () => {
    const rules = library.config.eraRules;
    expect(rules.length).toBe(library.config.eraCount);
    expect(rules[0]).toEqual({});
    for (let era = 2; era <= library.config.eraCount; era++) {
      const rule = rules[era - 1]!;
      const changesSomething = !!rule.passive || rule.volatility !== undefined || rule.queueScale !== undefined;
      expect(changesSomething, `era ${era} changes a rule`).toBe(true);
      // A rule the player is never told about is just an unexplained difficulty spike.
      expect(STRINGS.eraRules[era - 1], `era ${era} is announced`).toBeTruthy();
    }
    // A passive with no beat would never fire.
    for (const rule of rules) if (rule.passive) expect(rule.passiveEvery ?? 0).toBeGreaterThan(0);
  });

  it("writes traits and flaws that only make sense on one side", () => {
    // All 15 modifiers were shared, so both sides opened the same way (BACKLOG item 4).
    for (const align of ["left", "right"] as const) {
      for (const kind of ["trait", "flaw"] as const) {
        const own = content.modifiers.filter((m) => m.kind === kind && m.align === align);
        expect(own.length, `${align} ${kind}s`).toBeGreaterThanOrEqual(2);
      }
    }
    // A crisis is inherited, so it belongs to nobody's politics.
    for (const m of content.modifiers) {
      if (m.kind === "crisis") expect(m.align, `${m.id} is nobody's`).toBeUndefined();
    }
  });

  it("makes every flaw bite during the run, not only at the start", () => {
    // A flaw that only shifts the opening meters is thirty seconds of difference.
    const read = new Set(content.cards.flatMap((c) => c.cond?.flags ?? []));
    for (const m of content.modifiers) {
      for (const f of m.flags ?? []) expect(read.has(f), `${m.id} sets ${f}, which nothing reads`).toBe(true);
    }
  });

  it("gives each side a rival, and only the other side's", () => {
    // You never run against yourself (BACKLOG item 7).
    const rivals = content.advisors.filter((a) => a.role === library.config.rivalRole);
    expect(rivals.length).toBeGreaterThanOrEqual(4);
    for (const r of rivals) expect(r.align, `${r.id} takes a side`).toBeTruthy();
    for (const side of ["left", "right"] as const) {
      expect(rivals.filter((r) => r.align === side).length, `rivals for ${side}`).toBeGreaterThanOrEqual(2);
    }
    // Everybody else serves whoever is in office.
    for (const a of content.advisors) {
      if (a.role === library.config.rivalRole) continue;
      expect(a.align, `${a.id} is nobody's partisan`).toBeUndefined();
    }
  });

  it("mirrors the player: a reformer while you rot, a demagogue while you ascend", () => {
    const rivalArcs = content.arcs.filter((a) => a.id.startsWith("arc_rival_"));
    expect(rivalArcs.length).toBe(2);
    const reformer = rivalArcs.find((a) => a.id.endsWith("reformer"))!;
    const demagogue = rivalArcs.find((a) => a.id.endsWith("demagogue"))!;
    // band only moves at an era boundary, so these have to read drift itself.
    expect(reformer.entry.meters?.drift?.lt).toBeDefined();
    expect(demagogue.entry.meters?.drift?.gt).toBeDefined();
    expect(reformer.entry.meters!.drift!.lt!).toBeLessThanOrEqual(demagogue.entry.meters!.drift!.gt! + 1);
    // And both wait until the rival is worth a story.
    for (const a of rivalArcs) expect(a.entry.meters?.rival?.gt, `${a.id} waits for them`).toBeGreaterThan(0);
  });

  it("lets the player lose to the rival by choice, not only by accident", () => {
    // The election and coup paths are rare; a run has to be able to end this way on purpose.
    const byChoice = content.cards.filter((c) => [c.left, c.right].some((s) => s.ending === library.config.rivalEnding));
    expect(byChoice.length).toBeGreaterThanOrEqual(2);
  });

  it("lets a consequence have its own consequence", () => {
    // The premise is that the easy choice compounds. Chains used to be exactly one step
    // deep, so mechanically it did not (BACKLOG item 6).
    const enqueued = new Map<string, string[]>();
    for (const c of content.cards) {
      const targets = [...(c.left.enqueue ?? []), ...(c.right.enqueue ?? [])].map((e) => e.id);
      if (targets.length) enqueued.set(c.id, targets);
    }
    const seen = new Map<string, number>();
    const depth = (id: string): number => {
      const known = seen.get(id);
      if (known !== undefined) return known;
      seen.set(id, 0); // guards against a loop; the validator rejects those outright
      const targets = enqueued.get(id) ?? [];
      const value = targets.length === 0 ? 0 : 1 + Math.max(...targets.map(depth));
      seen.set(id, value);
      return value;
    };
    const deepest = Math.max(...[...enqueued.keys()].map(depth));
    expect(deepest).toBeGreaterThanOrEqual(3);
    expect([...enqueued.keys()].filter((id) => depth(id) >= 2).length).toBeGreaterThanOrEqual(10);
  });

  it("keeps delayed cards out of the random pool", () => {
    // A consequence should arrive because of something the player did, never by shuffle.
    const targets = new Set(
      content.cards.flatMap((c) => [...(c.left.enqueue ?? []), ...(c.right.enqueue ?? [])].map((e) => e.id)),
    );
    expect(targets.size).toBeGreaterThan(20);
    for (const id of targets) {
      const card = content.cards.find((c) => c.id === id)!;
      expect(card.weight ?? 1, `${id} weight`).toBe(0);
    }
  });

  it("gives every promise both an ending it was kept and one it was broken", () => {
    const promises = content.cards.filter((c) => /^p_[a-z]+$/.test(c.id));
    expect(promises.length).toBeGreaterThanOrEqual(4);
    for (const p of promises) {
      const queued = (p.left.enqueue ?? []).map((e) => e.id);
      expect(queued, `${p.id} queues its own reckoning`).toEqual(
        expect.arrayContaining([`${p.id}_tempt`, `${p.id}_broke`, `${p.id}_kept`]),
      );
      const broke = content.cards.find((c) => c.id === `${p.id}_broke`)!;
      const kept = content.cards.find((c) => c.id === `${p.id}_kept`)!;
      const flag = `broke_${p.id.slice(2)}`;
      expect(broke.cond?.flags, `${broke.id}`).toContain(flag);
      expect(kept.cond?.notFlags, `${kept.id}`).toContain(flag);
      // The broken ending must come first, so it is examined before the kept one.
      const order = queued.indexOf(`${p.id}_broke`) < queued.indexOf(`${p.id}_kept`);
      expect(order, `${p.id} queues broke before kept`).toBe(true);
    }
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
