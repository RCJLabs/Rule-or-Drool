import { describe, expect, it } from "vitest";
import { content } from "../../src/content";
import { buildLibrary } from "../../src/engine/library";
import {
  BROKE_MANDATE_FLAG,
  INCOMPATIBLE,
  MANDATES,
  MANDATES_BY_ID,
  MANDATE_BLOC_FLOOR,
  MANDATE_FLAG_PREFIX,
  PLATFORMS,
  brokenFlag,
  compatible,
  heldFloors,
  holds,
  inCatalogOrder,
  wordKept,
} from "../../src/engine/mandates";
import { EASY_CAMPAIGN_FLAG, easySide } from "../../src/engine/campaign";
import { checkMandate, resolve } from "../../src/engine/resolve";
import { newRun, rollSetup } from "../../src/engine/state";
import { allUnlockTokens } from "../../src/meta/objectives";
import { BLOC_KEYS } from "../../src/engine/types";
import { lib, start, table } from "../helpers";

/**
 * A promise made at setup (BACKLOG-2 phase 16). The engine's half is small on purpose:
 * it latches, it says so once, and it never lets go.
 */
describe("mandates: the promise a run is taken on", () => {
  it("starts a run under the promise, with what it cost and what the deck can read", () => {
    const l = lib();
    const plain = newRun(l, 1, { align: "left" });
    const decree = newRun(l, 1, { align: "left", mandates: ["m_decree"] });
    expect(plain.mandates).toEqual([]);
    expect(decree.mandates).toEqual(["m_decree"]);
    expect(decree.flags).toContain(`${MANDATE_FLAG_PREFIX}m_decree`);
    expect(decree.flags).toContain(l.config.electionsAbolishedFlag);
    // Suspending the vote on the first morning is not free.
    expect(decree.meters.inst).toBeLessThan(plain.meters.inst);
    expect(decree.mandatesBroken).toEqual({});
    // A setup from before a run could take two says its one promise the old way, and means it.
    expect(newRun(l, 1, { align: "left", mandate: "m_decree" })).toEqual(decree);
  });

  it("refuses a mandate it does not have, rather than quietly running without one", () => {
    expect(() => newRun(lib(), 1, { align: "left", mandates: ["m_nonsense"] })).toThrow(/unknown mandate/);
    expect(() => newRun(lib(), 1, { align: "left", mandate: "m_nonsense" })).toThrow(/unknown mandate/);
  });

  it("latches at the card that broke it and never unlatches", () => {
    const l = lib();
    const s = start(l, { mandates: ["m_broad"], cardCount: 12 });
    const low = { ...s, meters: { ...s.meters, public: MANDATE_BLOC_FLOOR - 1 } };
    const broken = checkMandate(l, low);
    expect(broken.mandatesBroken).toEqual({ m_broad: 12 });
    expect(broken.flags).toContain(BROKE_MANDATE_FLAG);
    expect(broken.flags).toContain(brokenFlag("m_broad"));
    // Back above the floor, and the promise stays broken: that is what a promise is.
    const recovered = checkMandate(l, { ...broken, meters: { ...broken.meters, public: 70 }, cardCount: 40 });
    expect(recovered.mandatesBroken).toEqual({ m_broad: 12 });
  });

  it("sends the card that says so, once, a couple of draws later", () => {
    const l = lib();
    const s = checkMandate(l, { ...start(l, { mandates: ["m_loyal"], cardCount: 5 }), stats: { ...start(l).stats, advisorsFired: 1 } });
    const queued = s.queue.filter((q) => q.id === MANDATES_BY_ID.get("m_loyal")!.brokeCard);
    expect(queued).toHaveLength(1);
    expect(queued[0]!.dueAt).toBe(7);
    // Checking again does not queue it twice.
    expect(checkMandate(l, s).queue).toEqual(s.queue);
  });

  it("leaves a run that promised nothing completely alone", () => {
    const l = lib();
    const s = start(l, { mandates: [] });
    const low = { ...s, meters: { ...s.meters, public: 1 }, stats: { ...s.stats, advisorsFired: 4, electionsCheated: 3 } };
    expect(checkMandate(l, low)).toEqual(low);
  });

  it("checks the promise on the card that breaks it, even when that card ends the run", () => {
    const l = lib({ eraLength: 1000 });
    // `ev_big` right takes the whole coalition to the floor, which breaks the promise and
    // ends the run on the same card. The promise still has to register.
    const after = resolve(l, table(start(l, { mandates: ["m_broad"] }), "ev_big"), "ev_big", "right");
    expect(BLOC_KEYS.every((b) => after.meters[b] < MANDATE_BLOC_FLOOR)).toBe(true);
    expect(after.over).not.toBeNull();
    expect(after.mandatesBroken).toEqual({ m_broad: 1 });
  });
});

/** Two promises, a platform (BACKLOG-10 phase 62): each kept or broken on its own. */
describe("mandates: a platform of two", () => {
  it("takes two, in the catalog's order whatever order they were picked in, with what each costs", () => {
    const l = lib();
    const plain = newRun(l, 1, { align: "left" });
    const two = newRun(l, 1, { align: "left", mandates: ["m_decree", "m_loyal"] });
    expect(two.mandates).toEqual(["m_loyal", "m_decree"]);
    expect(newRun(l, 1, { align: "left", mandates: ["m_loyal", "m_decree"] })).toEqual(two);
    for (const id of two.mandates) expect(two.flags).toContain(`${MANDATE_FLAG_PREFIX}${id}`);
    expect(two.flags).toContain(l.config.electionsAbolishedFlag);
    expect(two.meters.inst).toBeLessThan(plain.meters.inst);
    expect(inCatalogOrder(["m_loyal", "m_clean"])).toEqual(["m_clean", "m_loyal"]);
  });

  it("refuses more than two, one twice, or two that cannot stand together", () => {
    const l = lib();
    const [a, b, c] = MANDATES.filter((m) => !m.startFlags).map((m) => m.id);
    expect(() => newRun(l, 1, { align: "left", mandates: [a!, b!, c!] })).toThrow(/at most 2/);
    expect(() => newRun(l, 1, { align: "left", mandates: [a!, a!] })).toThrow(/once/);
    for (const [x, y] of INCOMPATIBLE) {
      expect(compatible(x, y)).toBe(false);
      expect(() => newRun(l, 1, { align: "left", mandates: [x, y] })).toThrow(/cannot be promised together/);
    }
    // Every pair offered is one that can be taken, and every pair that can be taken is offered.
    const pairs = MANDATES.flatMap((x, i) => MANDATES.slice(i + 1).map((y) => [x.id, y.id] as const));
    expect(PLATFORMS).toEqual(pairs.filter(([x, y]) => compatible(x, y)));
    for (const p of PLATFORMS) expect(() => newRun(l, 1, { align: "left", mandates: [...p] })).not.toThrow();
  });

  it("breaks one of two on its own, leaving the other standing and tempting", () => {
    const l = lib();
    const s = start(l, { mandates: ["m_broad", "m_loyal"], cardCount: 9 });
    const one = checkMandate(l, { ...s, meters: { ...s.meters, public: MANDATE_BLOC_FLOOR - 1 } });
    expect(one.mandatesBroken).toEqual({ m_broad: 9 });
    expect(holds(one, "m_loyal")).toBe(true);
    expect(holds(one, "m_broad")).toBe(false);
    expect(wordKept(one)).toBe(false);
    expect(one.flags).toContain(BROKE_MANDATE_FLAG);
    expect(one.flags).toContain(brokenFlag("m_broad"));
    // The other's own flag is not set, so the card tempting a run to break it keeps coming.
    expect(one.flags).not.toContain(brokenFlag("m_loyal"));
    expect(one.queue.map((q) => q.id)).toEqual([MANDATES_BY_ID.get("m_broad")!.brokeCard]);
    // The second goes later, at its own card, and says so with its own card.
    const both = checkMandate(l, { ...one, cardCount: 20, stats: { ...one.stats, advisorsFired: 1 } });
    expect(both.mandatesBroken).toEqual({ m_broad: 9, m_loyal: 20 });
    expect(both.flags.filter((f) => f === BROKE_MANDATE_FLAG)).toHaveLength(1);
    expect(both.queue.map((q) => q.id)).toEqual(["m_broad", "m_loyal"].map((id) => MANDATES_BY_ID.get(id)!.brokeCard));
  });

  it("breaks both on one card and tells both, one after the other", () => {
    const l = lib();
    const s = start(l, { mandates: ["m_broad", "m_loyal"], cardCount: 4 });
    const both = checkMandate(l, { ...s, meters: { ...s.meters, public: 1 }, stats: { ...s.stats, advisorsFired: 1 } });
    expect(both.mandatesBroken).toEqual({ m_broad: 4, m_loyal: 4 });
    expect(both.queue.map((q) => [q.id, q.dueAt])).toEqual([
      [MANDATES_BY_ID.get("m_broad")!.brokeCard, 6],
      [MANDATES_BY_ID.get("m_loyal")!.brokeCard, 6],
    ]);
  });

  it("keeps its word only by keeping every promise it made", () => {
    const none = { mandates: [], mandatesBroken: {} };
    expect(wordKept(none)).toBe(false);
    expect(wordKept({ mandates: ["m_broad"], mandatesBroken: {} })).toBe(true);
    expect(wordKept({ mandates: ["m_broad", "m_loyal"], mandatesBroken: {} })).toBe(true);
    expect(wordKept({ mandates: ["m_broad", "m_loyal"], mandatesBroken: { m_loyal: 30 } })).toBe(false);
  });
});

describe("mandates: what the shipped set asks of a player", () => {
  const l = buildLibrary(content);

  it("breaks no promise, and no platform, before the first card, whatever the setup (phase 62)", () => {
    // A floor is where a run under it starts from at least: dealt setups put a bloc under forty
    // in 2-5% of runs, which broke that promise on card one before any choice was made.
    const setups = [...MANDATES.map((m) => [m.id]), ...PLATFORMS.map((p) => [...p])];
    for (let seed = 1; seed <= 120; seed++) {
      for (const align of ["left", "right"] as const) {
        const rolled = rollSetup(l, seed, align, seed % 2 ? allUnlockTokens() : []);
        for (const ids of setups) {
          const s = newRun(l, seed, { ...rolled, mandates: ids });
          for (const id of ids) expect(MANDATES_BY_ID.get(id)!.isBroken(s), `${ids.join("+")} on seed ${seed}, ${align}`).toBe(false);
        }
      }
    }
  });

  it("raises only a floor's own meters, and only to its line", () => {
    const plain = newRun(l, 3, { align: "left" });
    const low = { ...plain.meters, money: 12 };
    // The setup's own meters are what the floor lifts from; nothing else moves.
    for (const [id, k] of [["m_reserve", "money"]] as const) {
      const floor = MANDATES_BY_ID.get(id)!.floor!;
      const s = newRun(l, 3, { align: "left", mandates: [id] });
      expect(s.meters[k]).toBe(Math.max(plain.meters[k], floor.at));
      for (const other of Object.keys(low) as (keyof typeof low)[]) if (!floor.meters.includes(other)) expect(s.meters[other]).toBe(plain.meters[other]);
    }
  });

  it("draws a held floor's line, and stops once it is broken", () => {
    const held = { mandates: ["m_broad", "m_reserve"], mandatesBroken: {} };
    expect(heldFloors(held)).toEqual({ base: 40, backers: 40, public: 40, money: 30 });
    expect(heldFloors({ ...held, mandatesBroken: { m_broad: 7 } })).toEqual({ money: 30 });
    expect(heldFloors({ mandates: ["m_press"], mandatesBroken: {} })).toEqual({});
  });

  it("gives every promise a card that can break it, and a side of that card that keeps it", () => {
    for (const m of MANDATES) {
      const tempts = content.cards.filter((c) => c.cond?.flags?.includes(`${MANDATE_FLAG_PREFIX}${m.id}`) && (c.weight ?? 1) > 0);
      expect(tempts.length, m.id).toBeGreaterThanOrEqual(1);
      const results = tempts.flatMap((card) =>
        (["left", "right"] as const).map((side) => {
          const run = newRun(l, 11, { align: card.align === "right" ? "right" : "left", mandates: [m.id] });
          // Just above any line it keeps, in the card's first era, so a side that spends breaks it.
          const floor = m.floor;
          const meters = { ...run.meters };
          for (const k of floor?.meters ?? []) meters[k] = floor!.at + 2;
          const s = { ...run, era: card.eras[0]!, cardCount: (card.eras[0]! - 1) * l.config.eraLength + 1, nextElectionAt: 10_000, meters, current: card.id };
          return m.id in resolve(l, s, card.id, side).mandatesBroken;
        }),
      );
      expect(results, `${m.id}: a side that breaks it`).toContain(true);
      expect(results, `${m.id}: a side that keeps it`).toContain(false);
    }
  });

  it("breaks a clean fight on every campaign won the easy way, and on no honest one (BACKLOG-11 phase 66)", () => {
    // Its cost says one smeared, scared or bought campaign breaks it; until phase 66 none did.
    const campaigns = content.cards.filter((c) => c.campaign);
    expect(campaigns.length).toBeGreaterThanOrEqual(40);
    for (const card of campaigns) {
      const easy = easySide(card);
      expect(easy, card.id).not.toBeNull();
      for (const side of ["left", "right"] as const) {
        const run = newRun(l, 11, { align: card.align === "right" ? "right" : "left", mandates: ["m_fair"] });
        const after = resolve(l, { ...run, cardCount: 20, nextElectionAt: 25, current: card.id }, card.id, side);
        expect("m_fair" in after.mandatesBroken, `${card.id} ${side}`).toBe(side === easy);
        expect(after.flags.includes(EASY_CAMPAIGN_FLAG), `${card.id} ${side}`).toBe(side === easy);
      }
    }
  });

  it("gives each promise a card that arrives when it goes", () => {
    for (const m of MANDATES) {
      const card = l.cards.get(m.brokeCard);
      expect(card, `${m.id} has a card for having broken it`).toBeTruthy();
      // Only the engine sends it, so it must never turn up in the ordinary deck.
      expect(card!.weight, `${m.brokeCard} is delivered, never drawn`).toBe(0);
    }
  });

  it("writes every promise so a player knows what they are taking on", () => {
    for (const m of MANDATES) {
      expect(m.title.length, `${m.id} title`).toBeLessThan(40);
      // Two short names share a line in the run on the narrowest phone (phase 62).
      expect(m.short.length, `${m.id} short name`).toBeLessThanOrEqual(16);
      expect(m.short.length, `${m.id} short name`).toBeLessThanOrEqual(m.title.length);
      expect(m.promise.length, `${m.id} promise`).toBeGreaterThan(20);
      expect(m.cost.length, `${m.id} cost`).toBeGreaterThan(20);
    }
    expect(new Set(MANDATES.map((m) => m.id)).size).toBe(MANDATES.length);
  });

  it("puts the promise and the country on opposite sides of at least one card each", () => {
    for (const m of MANDATES) {
      const flag = `${MANDATE_FLAG_PREFIX}${m.id}`;
      const written = content.cards.filter((c) => c.cond?.flags?.includes(flag));
      expect(written.length, `${m.id} has a card written for it`).toBeGreaterThanOrEqual(1);
      for (const c of written) {
        // A temptation the deck never stops offering is nagging, not temptation. It stops for
        // its own promise, not for any: a platform's other promise broken leaves this one to keep.
        expect(c.cond?.notFlags, `${c.id} stops once the promise is gone`).toContain(brokenFlag(m.id));
        expect(c.cond?.notFlags ?? [], `${c.id} goes on while its own promise holds`).not.toContain(BROKE_MANDATE_FLAG);
      }
    }
  });

  it("leaves a way back from ruling by decree, or the promise could never be broken", () => {
    const restorers = content.cards.filter((c) =>
      [c.left, c.right].some((s) => s.clearFlags?.includes(l.config.electionsAbolishedFlag)),
    );
    expect(restorers.length, "cards that restore the vote").toBeGreaterThanOrEqual(3);
    for (const c of restorers) {
      expect(c.cond?.flags, `${c.id} only comes up once the vote is gone`).toContain(l.config.electionsAbolishedFlag);
    }
  });
});
