import { describe, expect, it } from "vitest";
import { draw } from "../../src/engine/draw";
import { buildLibrary, getCard } from "../../src/engine/library";
import { preview } from "../../src/engine/preview";
import { resolve } from "../../src/engine/resolve";
import { RIVAL_POACHED_FLAG, isRivalCard, poachedAdvisors } from "../../src/engine/rival";
import { candidatesFor, rivalPressure, rivalStands } from "../../src/engine/state";
import type { Card } from "../../src/engine/types";
import { ev, makeFixture } from "../fixtures/content";
import { start, table } from "../helpers";

/**
 * A rival who plays (BACKLOG-10 phase 65): someone in the cabinet can go over to them, and at a
 * vote they could win they stand against you by name. How often each happens is measured in
 * the harness; what each does is checked here.
 */

const poach = ev("ev_poach", { weight: 0, left: { label: "Let them go", poach: true, drift: 1 }, right: { label: "Keep them", drift: -1 } });
const theirs: Card = {
  ...ev("el_theirs"),
  type: "election",
  rivalStands: true,
  left: { label: "honest", honest: true, drift: 2 },
  right: { label: "cheat", drift: -18, setFlags: ["cheated"] },
};
const fx = makeFixture();
const l = buildLibrary({ ...fx, cards: [...fx.cards, poach, theirs] }, { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0 });
const cfg = l.config;

describe("going over to the rival", () => {
  it("puts someone new in the seat, and says who went", () => {
    const s = start(l, { cabinet: { chief: "c2", general: "g0" } });
    const gone = resolve(l, table(s, "ev_poach"), "ev_poach", "left");
    expect(gone.cabinet.chief).not.toBe("c2");
    expect(gone.cabinet.general).toBe("g0");
    expect(gone.flags).toContain(RIVAL_POACHED_FLAG);
    expect(poachedAdvisors(gone)).toEqual(["c2"]);
    // Dated like any flag, for the record's timeline.
    expect(gone.flagSince.poached_c2).toBe(gone.cardCount);

    const kept = resolve(l, table(s, "ev_poach"), "ev_poach", "right");
    expect(kept.cabinet.chief).toBe("c2");
    expect(kept.flags).not.toContain(RIVAL_POACHED_FLAG);
  });

  it("is not a firing: nobody was let go, and the run's count of firings says so", () => {
    const gone = resolve(l, table(start(l, { cabinet: { chief: "c2", general: "g0" } }), "ev_poach"), "ev_poach", "left");
    expect(gone.stats.advisorsFired).toBe(0);
    expect(gone.stats.firedAdvisors).toEqual([]);
  });

  it("leaves the cabinet alone in a preview", () => {
    const s = table(start(l, { cabinet: { chief: "c2", general: "g0" } }), "ev_poach");
    preview(l, s, getCard(l, "ev_poach"), "left");
    expect(s.cabinet.chief).toBe("c2");
    expect(s.flags).not.toContain(RIVAL_POACHED_FLAG);
  });

  it("names each who went, and the run as one that lost someone once", () => {
    let s = start(l, { cabinet: { chief: "c2", general: "g0" } });
    s = resolve(l, table(s, "ev_poach"), "ev_poach", "left");
    const second = s.cabinet.chief!;
    s = resolve(l, table(s, "ev_poach"), "ev_poach", "left");
    expect(poachedAdvisors(s)).toEqual(["c2", second]);
    expect(s.flags.filter((f) => f === RIVAL_POACHED_FLAG)).toHaveLength(1);
  });

  it("does not offer anyone who went a seat again, by a firing or at an era's start", () => {
    let s = start(l, { cabinet: { chief: "c2", general: "g0" } });
    s = resolve(l, table(s, "ev_poach"), "ev_poach", "left");
    for (let i = 0; i < 20; i++) {
      s = resolve(l, table(s, "ev_fire"), "ev_fire", "left");
      expect(s.cabinet.chief).not.toBe("c2");
    }
    // Two chiefs are left to offer, c0 and c1, so the seat stays open to a firing but cannot be
    // offered as a choice of two at an era's start.
    expect(candidatesFor(l, { ...s, cabinet: { ...s.cabinet, chief: "c0" } }, "chief")).toBeNull();
    expect(candidatesFor(l, start(l, { cabinet: { chief: "c0", general: "g0" } }), "chief")!.map((a) => a.id)).toEqual(["c1", "c2"]);
  });

  it("breaks the promise of a cabinet that stays together, as a firing does", () => {
    const s = start(l, { cabinet: { chief: "c2", general: "g0" }, mandates: ["m_loyal"] });
    const gone = resolve(l, table(s, "ev_poach"), "ev_poach", "left");
    expect(gone.mandatesBroken).toHaveProperty("m_loyal");
    const kept = resolve(l, table(s, "ev_poach"), "ev_poach", "right");
    expect(kept.mandatesBroken).not.toHaveProperty("m_loyal");
  });

  it("does nothing when there is nobody to take the seat", () => {
    const alone = buildLibrary(
      { ...fx, advisors: fx.advisors.filter((a) => a.role !== "chief" || a.id === "c0"), cards: [...fx.cards, poach] },
      { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0 },
    );
    const gone = resolve(alone, table(start(alone), "ev_poach"), "ev_poach", "left");
    expect(gone.cabinet.chief).toBe("c0");
    expect(gone.flags).not.toContain(RIVAL_POACHED_FLAG);
  });
});

describe("the rival standing by name", () => {
  const vote = (rivalStanding: number, seed = 1, lib = l) => draw(lib, start(lib, { nextElectionAt: 0, rivalStanding, drift: 0 }, "left", seed)).current;

  it("stands exactly where losing the vote would be their win", () => {
    for (let standing = 0; standing <= 100; standing++) {
      const s = start(l, { rivalStanding: standing, drift: 0 });
      expect(rivalStands(l, s)).toBe(rivalPressure(l, s) >= cfg.rivalWinsAt);
    }
  });

  it("is dealt at every vote they could win, and at no other", () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(vote(cfg.rivalWinsAt, seed)).toBe("el_theirs");
      expect(vote(cfg.rivalWinsAt - 1, seed)).not.toBe("el_theirs");
    }
  });

  it("counts how far you have gone, as the rival's pressure does", () => {
    // Standing alone is not enough; a run deep into either look feeds them the rest.
    const s = start(l, { nextElectionAt: 0, rivalStanding: cfg.rivalWinsAt - 10, drift: -40 });
    expect(rivalPressure(l, s)).toBeGreaterThanOrEqual(cfg.rivalWinsAt);
    expect(draw(l, s).current).toBe("el_theirs");
  });

  it("falls back to an ordinary vote when none of theirs can be dealt, rather than none", () => {
    const never = buildLibrary(
      { ...makeFixture(), cards: [...makeFixture().cards, { ...theirs, cond: { flags: ["never_set"] } }] },
      { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0 },
    );
    expect(vote(cfg.rivalWinsAt, 1, never)).toBe("el_basic");
  });

  it("ends a lost honest count as the rival's win", () => {
    const s = draw(l, start(l, { nextElectionAt: 0, rivalStanding: cfg.rivalWinsAt, drift: 0, meters: { ...start(l).meters, base: 5, backers: 5, public: 5 } }));
    expect(s.current).toBe("el_theirs");
    // The fixture has no opposition, so the vote lost is the run lost.
    expect(resolve(l, s, "el_theirs", "left").over?.endingId).toBe(cfg.rivalEnding);
  });
});

describe("what counts as the rival's card", () => {
  it("is a card dealt only because the rival is somebody, not every card they speak", () => {
    expect(isRivalCard(theirs)).toBe(true);
    expect(isRivalCard(ev("up", { cond: { meters: { rival: { gt: 44 } } } }))).toBe(true);
    expect(isRivalCard(ev("after", { cond: { flags: [RIVAL_POACHED_FLAG] } }))).toBe(true);
    // Their own words, dealt whatever their standing, and a card for when they are nobody.
    expect(isRivalCard(ev("spoken", { speaker: "rival" }))).toBe(false);
    expect(isRivalCard(ev("down", { cond: { meters: { rival: { lt: 30 } } } }))).toBe(false);
    expect(isRivalCard(poach)).toBe(false);
  });
});
