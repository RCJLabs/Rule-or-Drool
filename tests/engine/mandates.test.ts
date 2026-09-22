import { describe, expect, it } from "vitest";
import { content } from "../../src/content";
import { buildLibrary } from "../../src/engine/library";
import { BROKE_MANDATE_FLAG, MANDATES, MANDATES_BY_ID, MANDATE_BLOC_FLOOR, MANDATE_FLAG_PREFIX } from "../../src/engine/mandates";
import { checkMandate, resolve } from "../../src/engine/resolve";
import { newRun } from "../../src/engine/state";
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
    const decree = newRun(l, 1, { align: "left", mandate: "m_decree" });
    expect(plain.mandate).toBeNull();
    expect(decree.mandate).toBe("m_decree");
    expect(decree.flags).toContain(`${MANDATE_FLAG_PREFIX}m_decree`);
    expect(decree.flags).toContain(l.config.electionsAbolishedFlag);
    // Suspending the vote on the first morning is not free.
    expect(decree.meters.inst).toBeLessThan(plain.meters.inst);
    expect(decree.mandateBrokenAt).toBeNull();
  });

  it("refuses a mandate it does not have, rather than quietly running without one", () => {
    expect(() => newRun(lib(), 1, { align: "left", mandate: "m_nonsense" })).toThrow(/unknown mandate/);
  });

  it("latches at the card that broke it and never unlatches", () => {
    const l = lib();
    const s = start(l, { mandate: "m_broad", cardCount: 12 });
    const low = { ...s, meters: { ...s.meters, public: MANDATE_BLOC_FLOOR - 1 } };
    const broken = checkMandate(l, low);
    expect(broken.mandateBrokenAt).toBe(12);
    expect(broken.flags).toContain(BROKE_MANDATE_FLAG);
    // Back above the floor, and the promise stays broken: that is what a promise is.
    const recovered = checkMandate(l, { ...broken, meters: { ...broken.meters, public: 70 }, cardCount: 40 });
    expect(recovered.mandateBrokenAt).toBe(12);
  });

  it("sends the card that says so, once, a couple of draws later", () => {
    const l = lib();
    const s = checkMandate(l, { ...start(l, { mandate: "m_loyal", cardCount: 5 }), stats: { ...start(l).stats, advisorsFired: 1 } });
    const queued = s.queue.filter((q) => q.id === MANDATES_BY_ID.get("m_loyal")!.brokeCard);
    expect(queued).toHaveLength(1);
    expect(queued[0]!.dueAt).toBe(7);
    // Checking again does not queue it twice.
    expect(checkMandate(l, s).queue).toEqual(s.queue);
  });

  it("leaves a run that promised nothing completely alone", () => {
    const l = lib();
    const s = start(l, { mandate: null });
    const low = { ...s, meters: { ...s.meters, public: 1 }, stats: { ...s.stats, advisorsFired: 4, electionsCheated: 3 } };
    expect(checkMandate(l, low)).toEqual(low);
  });

  it("checks the promise on the card that breaks it, even when that card ends the run", () => {
    const l = lib({ eraLength: 1000 });
    // `ev_big` right takes the whole coalition to the floor, which breaks the promise and
    // ends the run on the same card. The promise still has to register.
    const after = resolve(l, table(start(l, { mandate: "m_broad" }), "ev_big"), "ev_big", "right");
    expect(BLOC_KEYS.every((b) => after.meters[b] < MANDATE_BLOC_FLOOR)).toBe(true);
    expect(after.over).not.toBeNull();
    expect(after.mandateBrokenAt).toBe(1);
  });
});

describe("mandates: what the shipped set asks of a player", () => {
  const l = buildLibrary(content);

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
        // A temptation the deck never stops offering is nagging, not temptation.
        expect(c.cond?.notFlags, `${c.id} stops once the promise is gone`).toContain(BROKE_MANDATE_FLAG);
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
