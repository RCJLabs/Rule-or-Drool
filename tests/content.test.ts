import { describe, expect, it } from "vitest";
import { content, library } from "../src/content";
import { STRINGS } from "../src/content/strings";
import { HISTORIES, LEGACIES } from "../src/meta";
import { buildLibrary, poolKey } from "../src/engine/library";
import { BROKE_MANDATE_FLAG, MANDATES, MANDATE_FLAG_PREFIX } from "../src/engine/mandates";
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
    // Only a question carries no drift (BACKLOG-6 phase 40), and a question is never an event.
    for (const c of events) {
      const l = c.left.drift ?? 0;
      const r = c.right.drift ?? 0;
      expect(Math.sign(l) !== Math.sign(r), c.id).toBe(true);
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
  // The stories, not the questions: a question is asked of both sides by design, and drawn
  // from a budget of its own, so its weight only competes with other questions' (phase 40).
  const stories = content.arcs.filter((a) => a.question === undefined);

  it("locks at least a third of arcs to one side, both sides represented", () => {
    const locked = stories.filter((a) => a.align !== "any");
    expect(locked.length / stories.length).toBeGreaterThanOrEqual(1 / 3);
    expect(locked.filter((a) => a.align === "left").length).toBeGreaterThanOrEqual(3);
    expect(locked.filter((a) => a.align === "right").length).toBeGreaterThanOrEqual(3);
  });

  it("gives a side-locked arc more entry weight than the average shared arc", () => {
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const locked = stories.filter((a) => a.align !== "any").map((a) => a.weight);
    const shared = stories.filter((a) => a.align === "any").map((a) => a.weight);
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
    // Every era a run can reach, a long reign's two included (BACKLOG-5 phase 39).
    expect(rules.length).toBe(library.config.longEraCount);
    expect(rules[0]).toEqual({});
    for (let era = 2; era <= library.config.longEraCount; era++) {
      const rule = rules[era - 1]!;
      const changesSomething = !!rule.passive || rule.volatility !== undefined || rule.queueScale !== undefined || !!rule.bandVolatility;
      expect(changesSomething, `era ${era} changes a rule`).toBe(true);
      // A rule the player is never told about is just an unexplained difficulty spike.
      expect(STRINGS.eraRules[era - 1], `era ${era} is announced`).toBeTruthy();
    }
    // A passive with no beat would never fire.
    for (const rule of rules) if (rule.passive) expect(rule.passiveEvery ?? 0).toBeGreaterThan(0);
  });

  it("has a card at every edge that says what is coming", () => {
    // A run regularly came within five points of an ending it was never told about
    // (BACKLOG-2 phase 13). Each reachable extreme now has a card that fires there.
    const cfg = library.config;
    for (const meter of ["base", "backers", "public", "money", "order", "inst"] as const) {
      for (const end of ["low", "high"] as const) {
        if (!cfg.meterEndings[meter][end]) continue;
        const atEdge = content.cards.filter((c) => {
          const m = c.cond?.meters?.[meter];
          if (!m || (c.weight ?? 1) === 0) return false;
          return end === "low" ? (m.lt ?? 0) > 0 && m.lt! <= 20 : (m.gt ?? 100) >= 80;
        });
        expect(atEdge.length, `${meter} ${end}`).toBeGreaterThan(0);
      }
    }
  });

  it("lets Order be spent on purpose, not only lost by accident", () => {
    // Order was the one meter with no clean way to give it up: 32 choices against
    // Institutions' 271, which is why anarchy could not be reached even when aimed at.
    const spendable = content.cards
      .flatMap((c) => [c.left, c.right])
      .filter((ch) => {
        const fx = ch.fx ?? {};
        const order = fx.order ?? 0;
        if (order >= 0) return false;
        const rest = Object.entries(fx).reduce((n, [k, v]) => (k !== "order" && v < 0 ? n + v : n), 0);
        return rest >= -2;
      });
    expect(spendable.length).toBeGreaterThanOrEqual(35);
  });

  it("gives every cabinet advisor something they want from the job", () => {
    // Two advisors per role, drawn at random, with no story: the rival became a person in
    // item 7 and the eight people you work with did not (BACKLOG-2 phase 15).
    const cabinet = content.advisors.filter((a) => a.role !== library.config.rivalRole);
    for (const a of cabinet) {
      const want = content.cards.find((c) => c.cond?.flags?.includes(`${library.config.advisorFlagPrefix}${a.id}`));
      expect(want, `${a.name} wants something`).toBeTruthy();
      expect(want!.speaker, `${a.name} asks for it herself`).toBe(a.role);
      expect(want!.oneShot, `${a.name} asks once`).toBe(true);
      // And it is addressed to the person, not the office.
      expect(want!.text).toContain("{advisor}");
    }
  });

  it("answers what they wanted, both ways, once they have served", () => {
    for (const role of library.roles) {
      if (role === library.config.rivalRole) continue;
      for (const outcome of ["owed", "snubbed"] as const) {
        const payoff = content.cards.find((c) => c.cond?.flags?.includes(`${outcome}_${role}`));
        expect(payoff, `${role}: ${outcome}`).toBeTruthy();
        // It waits: a debt or a grudge needs time in post to mean anything.
        expect(payoff!.cond?.meters?.tenure?.gt, `${role}: ${outcome} waits`).toBeGreaterThan(0);
      }
    }
  });

  it("lets a long-serving loyalist earn something and a kept crook cost something", () => {
    // Read off the speaker, not the room: a kept crook is the one speaking (BACKLOG-5 phase 35).
    const tenured = content.cards.filter((c) => c.cond?.meters?.tenure?.gt !== undefined);
    const byTrait = (t: string) => tenured.filter((c) => c.cond?.speakerTraits?.includes(t));
    expect(byTrait("loyal").length).toBeGreaterThanOrEqual(2);
    expect(byTrait("corrupt").length).toBeGreaterThanOrEqual(2);
  });

  it("makes an ordinary card choose between the blocs, not move them as one", () => {
    // 66% of choices used the `mood` shorthand, so within a side the three blocs were one
    // object: the Unions and the Movement were the same meter with different names
    // (BACKLOG-2 phase 8).
    const choices = events.flatMap((c) => [c.left, c.right]);
    const shorthand = choices.filter((ch) => "mood" in (ch.fx ?? {}));
    expect(shorthand.length / choices.length).toBeLessThan(0.05);

    const spread = (ch: (typeof choices)[number]) => {
      const v = (["base", "backers", "public"] as const).map((b) => ch.fx?.[b] ?? 0);
      return Math.max(...v) - Math.min(...v);
    };
    const differentiating = choices.filter((ch) => spread(ch) > 0);
    expect(differentiating.length / choices.length).toBeGreaterThan(0.6);
  });

  it("warns in each bloc's own voice, for each side", () => {
    // A bloc should be able to walk out on you, but not without saying so first.
    for (const bloc of ["base", "backers", "public"] as const) {
      for (const align of ["left", "right"] as const) {
        const warning = content.cards.find(
          (c) => c.align === align && c.cond?.meters?.[bloc]?.lt !== undefined && (c.weight ?? 1) > 0,
        );
        expect(warning, `${align} warning for ${bloc}`).toBeTruthy();
      }
    }
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

  it("keeps every legacy collectable, and every durable flag named", () => {
    // A legacy nothing can set is a codex row nobody can ever fill (BACKLOG item 9's lesson).
    const settable = new Set(content.cards.flatMap((c) => [...(c.left.setFlags ?? []), ...(c.right.setFlags ?? [])]));
    // The engine sets this one itself, when the promise a run was taken on goes (phase 16).
    for (const flag of Object.keys(LEGACIES)) {
      if (flag === BROKE_MANDATE_FLAG) continue;
      expect(settable.has(flag), `${flag} is named a legacy but no card sets it`).toBe(true);
    }
    // And the reverse: a flag that outlives the arc that set it should be named, or the
    // history quietly drops something the country is still carrying.
    const cleared = new Set(content.cards.flatMap((c) => [...(c.left.clearFlags ?? []), ...(c.right.clearFlags ?? [])]));
    // `promised_` and the cabinet's `owed_`/`snubbed_` are durable but are not legacies of
    // state: they are about a person, and the cabinet screen is where they are shown.
    const personal = (f: string) => f.startsWith("promised_") || f.startsWith("owed_") || f.startsWith("snubbed_");
    // A `mark_` counts how often a kind of choice was made so a habit card can ask for a
    // pattern rather than an instance. What was done has a name of its own (`habit_`);
    // the tally beneath it is not history (BACKLOG-2 phase 14).
    const tally = (f: string) => f.startsWith("mark_");
    const durable = [...settable].filter((f) => !cleared.has(f) && !personal(f) && !tally(f));
    const unnamed = durable.filter((f) => !(f in LEGACIES));
    expect(unnamed, "durable flags missing a legacy name").toEqual([]);
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
        for (const era of [1, 2, 3, 4, 5]) {
          const found = content.epilogues.find((e) => e.band === band && e.align === align && e.era === era);
          expect(found, `${band} / ${align} / era ${era}`).toBeTruthy();
        }
      }
    }
  });

  it("gives the two sides different words for the same band and era", () => {
    for (const band of BANDS) {
      for (const era of [1, 2, 3, 4, 5]) {
        const texts = content.epilogues.filter((e) => e.band === band && e.era === era).map((e) => e.text);
        expect(new Set(texts).size, `${band} / era ${era}`).toBe(texts.length);
      }
    }
  });

  // An ordinary card that only moves six numbers is a number puzzle. The arcs and the
  // set-pieces were already carrying every consequence in the game; the deck you actually
  // draw from was not (BACKLOG-2 phase 14).
  it("attaches a consequence to a third of the ordinary deck, not only to set-pieces", () => {
    const rich = (c: (typeof events)[number]) =>
      [c.left, c.right].filter(
        (s) => s.enqueue || s.setFlags || s.clearFlags || s.next || s.nextByAlign || s.ending || s.fireSpeaker || s.rival !== undefined,
      ).length;
    const choices = events.length * 2;
    const withConsequence = events.reduce((n, c) => n + rich(c), 0);
    expect(withConsequence / choices, `${withConsequence}/${choices} ordinary choices`).toBeGreaterThanOrEqual(1 / 3);
  });

  it("sends every bill, and sends the three kinds from different cards", () => {
    const bills = content.cards.filter((c) => c.id.startsWith("b_"));
    expect(bills.length, "bills exist").toBeGreaterThanOrEqual(12);
    const senders = new Map<string, Set<string>>();
    for (const c of content.cards) {
      for (const side of [c.left, c.right]) {
        for (const q of side.enqueue ?? []) {
          if (q.id.startsWith("b_")) senders.set(q.id, (senders.get(q.id) ?? new Set()).add(c.id));
        }
      }
    }
    for (const b of bills) {
      // A bill nothing sends is a card written for a run that cannot happen.
      expect(senders.get(b.id)?.size ?? 0, `${b.id} is sent by more than one card`).toBeGreaterThanOrEqual(2);
      expect(b.weight, `${b.id} is only ever delivered, never drawn`).toBe(0);
    }
  });

  // A habit is a pattern. Gating on one instance would have the game announce a method
  // the first time you did anything, which is the opposite of noticing.
  it("asks for a pattern before it names a habit, and names it in the codex", () => {
    const habits = content.cards.filter((c) => c.id.startsWith("h_"));
    expect(habits.length).toBeGreaterThanOrEqual(6);
    const marks = new Map<string, Set<string>>();
    for (const c of content.cards) {
      for (const side of [c.left, c.right]) {
        for (const f of side.setFlags ?? []) {
          if (f.startsWith("mark_")) marks.set(f, (marks.get(f) ?? new Set()).add(c.id));
        }
      }
    }
    for (const h of habits) {
      const gate = h.cond?.flags ?? [];
      expect(gate.length, `${h.id} asks for more than one`).toBeGreaterThanOrEqual(2);
      for (const f of gate) {
        expect(f.startsWith("mark_"), `${h.id} gates on a counting mark`).toBe(true);
        // Each rung has to come from a different card or the "pattern" is one choice.
        expect(marks.get(f)?.size ?? 0, `${f} is set by several cards`).toBeGreaterThanOrEqual(5);
      }
      expect(h.oneShot, `${h.id} is said once`).toBe(true);
    }
    // The tally is bookkeeping; what was done has a name the country remembers.
    for (const kind of ["habit_skim", "habit_bend", "habit_clamp"]) {
      expect(kind in LEGACIES, `${kind} is a named legacy`).toBe(true);
    }
  });

  it("marks a habit wherever it sends a bill, so the two stay in step", () => {
    const pairs = content.cards.flatMap((c) => [c.left, c.right]);
    for (const side of pairs) {
      const bill = (side.enqueue ?? []).some((q) => q.id.startsWith("b_"));
      if (!bill) continue;
      const flags = side.setFlags ?? [];
      expect(flags.some((f) => f.startsWith("mark_")), "a choice that sends a bill also counts").toBe(true);
      expect(flags.some((f) => f.startsWith("habit_")), "and names what kind it was").toBe(true);
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

/**
 * More crises, more faces (BACKLOG-5 phase 35). A player had met all four crises by their
 * seventh run and all sixteen advisors by their fifth.
 */
describe("content: what a run inherits, and who it inherits", () => {
  const crises = content.modifiers.filter((m) => m.kind === "crisis");
  const cabinet = content.advisors.filter((a) => a.role !== library.config.rivalRole);
  const TRAIT_FLAGS = ["competent", "loyal", "zealot", "corrupt"].map((t) => `${library.config.advisorFlagPrefix}${t}`);

  it("has ten crises, each with a rule of its own and a card only it brings", () => {
    expect(crises.length).toBeGreaterThanOrEqual(10);
    const rules = new Set<string>();
    for (const m of crises) {
      // Where it starts you, which story it favours and which era it bends: no two alike.
      const rule = JSON.stringify([m.meterStart ?? null, m.arcWeights ?? null, m.bends ?? null]);
      expect(rule, `${m.id} has a rule`).not.toBe("[null,null,null]");
      expect(rules.has(rule), `${m.id}'s rule is its own`).toBe(false);
      rules.add(rule);
      // A card nothing else brings, in the term it is inherited in.
      const own = content.cards.filter((c) => (m.flags ?? []).some((f) => c.cond?.flags?.includes(f)));
      expect(own.some((c) => c.eras.includes(1)), `${m.id} brings a card of its own`).toBe(true);
      expect(STRINGS.modifiers[m.id]?.name, `${m.id} is named at setup`).toBeTruthy();
    }
  });

  it("says at the jump what a crisis does to the era it bends", () => {
    for (const m of content.modifiers) {
      // Era one has no jump to say it at; a crisis that bends your own term says so in its blurb.
      for (const b of m.bends ?? []) if (b.era > 1) expect(STRINGS.bends[`${m.id}:${b.era}`], `${m.id} bends era ${b.era}`).toBeTruthy();
    }
    for (const key of Object.keys(STRINGS.bends)) {
      const [id, era] = key.split(":");
      expect(library.modifiers.get(id!)?.bends?.some((b) => b.era === Number(era)), `${key} is a real bend`).toBe(true);
    }
  });

  it("seats three people in every cabinet role, no two of them alike", () => {
    for (const role of library.roles) {
      if (role === library.config.rivalRole) continue;
      const combos = cabinet.filter((a) => a.role === role).map((a) => [...a.traits].sort().join("+"));
      expect(combos.length, role).toBeGreaterThanOrEqual(3);
      expect(new Set(combos).size, `${role}: ${combos.join(", ")}`).toBe(combos.length);
    }
  });

  it("writes a card about a kind of advisor for that kind of advisor", () => {
    // `advisor_corrupt` is set when anyone in the room is corrupt. A card that names whoever
    // speaks and waits on it accused an honest treasurer whenever the crook sat elsewhere.
    for (const c of content.cards) {
      if (!c.text.includes("{advisor}")) continue;
      expect((c.cond?.flags ?? []).filter((f) => TRAIT_FLAGS.includes(f)), `${c.id} reads the room for its speaker`).toEqual([]);
    }
    const plot = content.arcs.find((a) => a.id === "arc_cabinet_plot")!;
    expect(plot.entry.speakerTraits).toEqual(["corrupt"]);
    expect(plot.entry.flags ?? []).not.toContain(`${library.config.advisorFlagPrefix}corrupt`);
  });

  it("assumes nothing about who holds a role", () => {
    // Three people can hold each role, and they are not all he or all she. A card that names
    // whoever holds it does so without a pronoun for them; a card for one person may use theirs.
    const gendered = /\b(he|him|his|himself|she|her|hers|herself)\b/i;
    for (const c of content.cards) {
      const forOne = (c.cond?.flags ?? []).some((f) => f.startsWith(`${library.config.advisorFlagPrefix}adv_`));
      if (forOne || !c.text.includes("{advisor}")) continue;
      expect(`${c.text} | ${c.left.label} | ${c.right.label}`, c.id).not.toMatch(gendered);
    }
  });

  it("gives every face a card or two in their own voice", () => {
    for (const a of cabinet) {
      const own = content.cards.filter((c) => c.cond?.flags?.includes(`${library.config.advisorFlagPrefix}${a.id}`));
      expect(own.length, a.id).toBeGreaterThanOrEqual(1);
      for (const c of own) expect(c.speaker, `${c.id} is spoken by ${a.name}`).toBe(a.role);
    }
  });
});

describe("content: every card can be drawn", () => {
  // Twenty-seven shipped cards were written for era 1 in a band era 1 can never be in. The
  // validator rejects that shape now; this pins the shipped deck against it and against the
  // two other ways a card can be stranded (BACKLOG-3 phase 20).
  it("leaves no card in a cell the draw can never visit", () => {
    const stranded = content.cards.filter(
      (c) => c.type === "event" && (c.weight ?? 1) > 0 && c.eras.every((e) => e === 1) && !c.bands.includes(library.config.startBand),
    );
    expect(stranded.map((c) => c.id)).toEqual([]);
  });

  it("gives a card that has to wait for a promise a promise it can wait for", () => {
    // These are only eligible under a mandate, which is correct, so "never drawn in an
    // ordinary sweep" is not the same as unreachable. Every gate has to name a real one.
    const ids = new Set(MANDATES.map((m) => m.id));
    for (const c of content.cards) {
      for (const f of c.cond?.flags ?? []) {
        if (!f.startsWith(MANDATE_FLAG_PREFIX)) continue;
        expect(ids.has(f.slice(MANDATE_FLAG_PREFIX.length)), `${c.id} waits on ${f}`).toBe(true);
      }
    }
  });

  it("keeps the cooldown well under the smallest cell it has to draw from", () => {
    // A cooldown longer than a cell forces the relax ladder, which is the draw quietly
    // widening the game rather than the deck being deep enough.
    // Every era a run can reach, a long reign's two included (BACKLOG-5 phase 39).
    const eras = Array.from({ length: library.config.longEraCount }, (_, i) => i + 1);
    const smallest = Math.min(
      ...eras.flatMap((era) =>
        BANDS.flatMap((band) =>
          (["left", "right"] as const).map(
            (align) =>
              new Set([
                ...(library.eventPool.get(poolKey(era, band, align)) ?? []).map((c) => c.id),
                ...(library.eventPool.get(poolKey(era, band, "any")) ?? []).map((c) => c.id),
              ]).size,
          ),
        ),
      ),
    );
    expect(smallest).toBeGreaterThan(library.config.cooldownSize * 2);
  });
});

/**
 * The questions (BACKLOG-6 phase 40): policies asked plainly, of both sides, without the game
 * taking one. The answer decides who is pleased and who pays; only how it is carried out
 * moves drift, and each side's arc fails on its own base's policy.
 */
describe("content: the questions", () => {
  const questions = content.arcs.filter((a) => a.question !== undefined);
  const ids = [...new Set(questions.map((a) => a.question!))];
  const card = (id: string) => library.cards.get(id)!;
  const arcFor = (q: string, align: "left" | "right") => questions.find((a) => a.question === q && (a.align === align || a.align === "any"))!;

  it("asks sixteen questions, each of both sides in that side's own words", () => {
    expect(ids.length).toBeGreaterThanOrEqual(16);
    for (const q of ids) {
      const l = arcFor(q, "left");
      const r = arcFor(q, "right");
      expect(l && r, q).toBeTruthy();
      expect(card(l.cards[0]!).text, q).not.toBe(card(r.cards[0]!).text);
    }
  });

  it("scores no answer, and every way of carrying one out", () => {
    for (const arc of questions) {
      const [asking, ...after] = arc.cards.map(card);
      expect([asking!.left.drift ?? 0, asking!.right.drift ?? 0], asking!.id).toEqual([0, 0]);
      for (const c of after) {
        const l = c.left.drift ?? 0;
        const r = c.right.drift ?? 0;
        expect(l !== 0 && r !== 0 && Math.sign(l) !== Math.sign(r), c.id).toBe(true);
      }
    }
  });

  it("leaves a legacy history can name for every answer, the same two on both sides", () => {
    for (const q of ids) {
      const answers = (["left", "right"] as const).map((align): [string[], string[]] => {
        const asking = card(arcFor(q, align).cards[0]!);
        return [asking.left.setFlags ?? [], asking.right.setFlags ?? []];
      });
      for (const [a, b] of answers) {
        expect(a.length, q).toBe(1);
        expect(b.length, q).toBe(1);
        for (const f of [...a, ...b]) {
          expect(f in LEGACIES, f).toBe(true);
          expect(HISTORIES[f], f).toBeDefined();
        }
        expect(a[0]).not.toBe(b[0]);
      }
      expect(answers[0]).toEqual(answers[1]);
    }
  });

  it("titles every question, so the card can say it is one", () => {
    for (const q of ids) expect(STRINGS.questions.titles[q], q).toBeTruthy();
  });

  it("can end the run at one turning point per side, and fails each side on its own base's policy", () => {
    /** Every card reachable from a card by its next pointers, itself included. */
    const reach = (id: string): string[] => {
      const c = card(id);
      return [id, ...[c.left.next, c.right.next].filter((n): n is string => !!n).flatMap(reach)];
    };
    let failures = 0;
    for (const q of ids) {
      const failsOn: string[] = [];
      for (const align of ["left", "right"] as const) {
        const arc = arcFor(q, align);
        const asking = card(arc.cards[0]!);
        const ending = arc.cards.map(card).filter((c) => c.left.ending || c.right.ending);
        // One card that can end it, and never the question itself or the step straight after:
        // there is always a way to carry an answer out before there is a way to leave.
        expect(ending, `${q} ${align}`).toHaveLength(1);
        const turning = ending[0]!;
        expect(turning.step!, turning.id).toBeGreaterThanOrEqual(3);
        // Which answer leads there, and whether the ending is the fast way out or the honest one.
        const via = [asking.left, asking.right].find((ans) => reach(ans.next!).includes(turning.id))!;
        const fast = (turning.left.ending ? turning.left : turning.right).drift! < 0;
        if (fast) failsOn.push(via.setFlags![0]!);
        // An honest way out that ends the run leaves no honest way to go on, so it only comes
        // after a step where going on honestly was still possible.
        if (!fast) expect(turning.step, turning.id).toBe(4);
      }
      // A failure that only one answer can reach would be that answer's policy scored after all,
      // unless each side reaches it from its own side of the argument.
      if (failsOn.length === 2) {
        failures++;
        expect(failsOn[0], q).not.toBe(failsOn[1]);
      }
    }
    // Not vacuous: eleven questions can fail both sides, each on its own coalition's policy
    // (the court on papers, the lenders, the strike, the condemned block, the blackout, the
    // pensioners' march, the cartel, the breakout, the emergency, the court, the run).
    expect(failures).toBeGreaterThanOrEqual(11);
  });
});

// BACKLOG-6 phase 42: what comes of each answer, in the eras after it. The cards read the
// answer's legacy, so a run meets only what its own answers left behind.
describe("content: the answers come back", () => {
  const answers = [...new Set(content.arcs.filter((a) => a.question !== undefined).flatMap((a) => {
    const asking = library.cards.get(a.cards[0]!)!;
    return [...(asking.left.setFlags ?? []), ...(asking.right.setFlags ?? [])];
  }))];
  const reading = (flag: string) => content.cards.filter((c) => c.type === "event" && (c.weight ?? 1) > 0 && c.cond?.flags?.includes(flag));

  it("has, for every answer, a card that reads it in era 2, in era 3, and two centuries on in every band", () => {
    expect(answers.length).toBeGreaterThanOrEqual(32);
    for (const flag of answers) {
      const cards = reading(flag);
      expect(cards.some((c) => c.eras.includes(2)), `${flag} in era 2`).toBe(true);
      expect(cards.some((c) => c.eras.includes(3)), `${flag} in era 3`).toBe(true);
      // A long reign's band is locked after its third era, so its last two are lived in one
      // direction, and each direction needs its own card.
      for (const band of BANDS) {
        expect(cards.some((c) => c.eras.some((e) => e >= 4) && c.bands.includes(band)), `${flag} two centuries on, ${band}`).toBe(true);
      }
    }
  });

  it("comes back once a run, for either side, with nobody's coalition named", () => {
    for (const flag of answers) {
      for (const c of reading(flag)) {
        expect(c.oneShot, c.id).toBe(true);
        expect(c.align, c.id).toBe("any");
        for (const name of ["Movement", "Unions", "Cities", "Faithful", "Donors", "Country"]) expect(c.text, c.id).not.toContain(name);
      }
    }
  });
});

// BACKLOG-6 phase 43: an ending a player can choose is one they will take, to see it. Every
// story can end the run at its turning point, and many of those endings are a way to leave in
// good order, on the honest side of the card, rather than a failure.
describe("content: endings you choose", () => {
  const stories = content.arcs.filter((a) => a.question === undefined);
  const endingChoices = stories.flatMap((a) =>
    a.cards.flatMap((id) => {
      const c = library.cards.get(id)!;
      return (["left", "right"] as const).filter((s) => c[s].ending).map((s) => ({ arc: a.id, c, s, other: s === "left" ? ("right" as const) : ("left" as const) }));
    }),
  );

  it("lets every story end the run at a turning point", () => {
    for (const a of stories) expect(endingChoices.some((e) => e.arc === a.id), a.id).toBe(true);
  });

  it("has at least a third of the stories' endings on the honest side of their card", () => {
    const honest = endingChoices.filter((e) => (e.c[e.s].drift ?? 0) > (e.c[e.other].drift ?? 0));
    expect(honest.length / endingChoices.length).toBeGreaterThanOrEqual(1 / 3);
  });
});
