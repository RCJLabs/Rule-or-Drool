import { describe, expect, it } from "vitest";
import { draw } from "../../src/engine/draw";
import { preview } from "../../src/engine/preview";
import { advanceEra, applyChoice, checkElection, checkOuster, coupRisk, resolve, traitScale } from "../../src/engine/resolve";
import { getCard } from "../../src/engine/library";
import { lib, play, start, table } from "../helpers";

describe("resolve: effects", () => {
  it("applies fx and drift, clears the table and ticks the counter", () => {
    const l = lib();
    const s = resolve(l, table(start(l), "ev_fx"), "ev_fx", "left");
    expect(s.meters).toEqual({ mood: 55, money: 47, order: 50, inst: 50 });
    expect(s.drift).toBe(2);
    expect(s.current).toBeNull();
    expect(s.cardCount).toBe(1);
    expect(s.over).toBeNull();
  });

  it("scales meter effects by band volatility with rounding", () => {
    const l = lib();
    expect(resolve(l, table(start(l, { band: "decay" }), "ev_fx"), "ev_fx", "left").meters.mood).toBe(57);
    expect(resolve(l, table(start(l, { band: "ascent" }), "ev_fx"), "ev_fx", "left").meters.mood).toBe(54);
    expect(resolve(l, table(start(l, { band: "muddle" }), "ev_fx"), "ev_fx", "left").meters.mood).toBe(55);
  });

  it("clamps meters to 0..100 and drift to ±100", () => {
    const l = lib();
    const high = resolve(l, table(start(l, { drift: 95 }), "ev_big"), "ev_big", "left");
    expect(high.meters.mood).toBe(100);
    expect(high.drift).toBe(100);
    const low = resolve(l, table(start(l, { drift: -95 }), "ev_big"), "ev_big", "right");
    expect(low.meters.mood).toBe(0);
    expect(low.drift).toBe(-100);
  });

  it("sets, dedupes and clears flags", () => {
    const l = lib();
    let s = resolve(l, table(start(l), "ev_flags"), "ev_flags", "left");
    expect(s.flags).toEqual(["f1", "f2"]);
    s = resolve(l, table(s, "ev_flags"), "ev_flags", "right");
    expect(s.flags).toEqual(["f2", "f3"]);
  });

  it("enqueues consequences relative to the current card count", () => {
    const l = lib();
    const s = resolve(l, table(start(l, { cardCount: 10 }), "ev_enq"), "ev_enq", "left");
    expect(s.queue).toEqual([{ id: "q1", dueAt: 12 }]);
    const { ids } = play(l, s, 2);
    expect(ids[0]).not.toBe("q1");
    expect(ids[1]).toBe("q1");
  });

  it("lets a consequence be averted by clearing its condition", () => {
    const l = lib();
    const s = resolve(l, table(start(l), "ev_enq"), "ev_enq", "right");
    const { ids, state } = play(l, s, 3);
    expect(ids).not.toContain("q1");
    expect(state.queue.some((q) => q.id === "q1")).toBe(false);
  });

  it("plays a non-arc next pointer on the very next draw", () => {
    const l = lib();
    const s = resolve(l, table(start(l), "ev_next"), "ev_next", "left");
    expect(draw(l, s).current).toBe("chained");
  });

  it("refuses a card that is not on the table and ignores finished runs", () => {
    const l = lib();
    expect(() => resolve(l, table(start(l), "f01"), "f02", "left")).toThrow(/not on the table/);
    const over = { ...table(start(l), "f01"), over: { endingId: "riots", epilogueKey: "x" } };
    expect(resolve(l, over, "f01", "left")).toBe(over);
  });
});

describe("resolve: advisor traits", () => {
  const l = lib();

  it("scales by the traits of the advisor holding that role, multiplying when stacked", () => {
    expect(traitScale(l, start(l, { cabinet: { chief: "c0" } }), "chief")).toEqual({ gain: 1, loss: 1 });
    expect(traitScale(l, start(l, { cabinet: { chief: "c2" } }), "chief")).toEqual({ gain: 1, loss: 1.35 });
    expect(traitScale(l, start(l, { cabinet: { general: "g1" } }), "general")).toEqual({ gain: 1.4, loss: 1.4 });
    // An empty or unknown role is neutral, never a crash.
    expect(traitScale(l, start(l, { cabinet: {} }), "chief")).toEqual({ gain: 1, loss: 1 });
  });

  it("makes a corrupt advisor's losses hurt more, leaving gains alone", () => {
    const plain = resolve(l, table(start(l, { cabinet: { chief: "c0" } }), "ev_fx"), "ev_fx", "left");
    expect(plain.meters).toMatchObject({ mood: 55, money: 47 });
    const corrupt = resolve(l, table(start(l, { cabinet: { chief: "c2" } }), "ev_fx"), "ev_fx", "left");
    expect(corrupt.meters).toMatchObject({ mood: 55, money: 46 });
  });

  it("stacks trait scaling on top of band volatility", () => {
    const s = start(l, { band: "decay", cabinet: { chief: "c2" } });
    // money -3, decay 1.4, corrupt loss 1.35 -> -5.67 -> -6
    expect(resolve(l, table(s, "ev_fx"), "ev_fx", "left").meters.money).toBe(44);
  });

  it("fires the speaker's advisor on resolve, but preview leaves the cabinet alone", () => {
    const s = start(l, { cabinet: { chief: "c2", general: "g0" } });
    expect(preview(l, s, getCard(l, "ev_fire"), "left").endingId).toBeNull();
    expect(s.cabinet.chief).toBe("c2");

    const fired = resolve(l, table(s, "ev_fire"), "ev_fire", "left");
    expect(fired.cabinet.chief).not.toBe("c2");
    expect(fired.flags).not.toContain("advisor_corrupt");
    expect(fired.cabinet.general).toBe("g0");

    const kept = resolve(l, table(s, "ev_fire"), "ev_fire", "right");
    expect(kept.cabinet.chief).toBe("c2");
  });
});

describe("resolve: endings", () => {
  it("ends the run on a choice ending, choosing the epilogue by exit band", () => {
    const l = lib();
    const s = resolve(l, table(start(l), "ev_end"), "ev_end", "left");
    expect(s.over).toEqual({ endingId: "ending_x", epilogueKey: "ascent:any:1" });
    const era2 = resolve(l, table(start(l, { era: 2 }), "ev_end"), "ev_end", "left");
    expect(era2.over?.epilogueKey).toBe("ascent:left:2");
    const era3 = resolve(l, table(start(l, { era: 3 }), "ev_end"), "ev_end", "left");
    expect(era3.over?.epilogueKey).toBe("ascent:any:3");
    const right2 = resolve(l, table(start(l, { era: 2 }, "right"), "ev_end"), "ev_end", "left");
    expect(right2.over?.epilogueKey).toBe("ascent:any:1");
  });

  it("ousts on each meter extreme with the configured ending", () => {
    const l = lib();
    const cases: [keyof typeof l.config.meterEndings, number, string][] = [
      ["mood", 0, "riots"],
      ["mood", 100, "personality_cult"],
      ["money", 0, "bankruptcy"],
      ["money", 100, "oligarchy"],
      ["order", 0, "anarchy"],
      ["order", 100, "police_state"],
      ["inst", 0, "state_collapse"],
      ["inst", 100, "paralysis"],
    ];
    for (const [k, v, ending] of cases) {
      const s = start(l, { meters: { mood: 50, money: 50, order: 50, inst: 50, [k]: v } });
      expect(checkOuster(l, s).over?.endingId).toBe(ending);
    }
    expect(checkOuster(l, start(l)).over).toBeNull();
  });

  it("throws on an unknown ending id", () => {
    const l = lib();
    const card = { ...getCard(l, "ev_end"), left: { label: "L", ending: "nope" } };
    expect(() => applyChoice(l, start(l), card, "left")).toThrow(/unknown ending/);
  });
});

describe("resolve: elections", () => {
  it("loses an honest election below the mood threshold", () => {
    const l = lib();
    const s = start(l, { nextElectionAt: 0, meters: { mood: 39, money: 50, order: 50, inst: 50 } });
    const r = resolve(l, table(s, "el_basic"), "el_basic", "left");
    expect(r.over?.endingId).toBe("election_loss");
  });

  it("wins an honest election at the threshold and reschedules", () => {
    const l = lib({ electionInterval: 25 });
    const s = start(l, { cardCount: 30, nextElectionAt: 30, meters: { mood: 40, money: 50, order: 50, inst: 50 } });
    const r = resolve(l, table(s, "el_basic"), "el_basic", "left");
    expect(r.over).toBeNull();
    expect(r.meters.mood).toBe(41);
    expect(r.drift).toBe(2);
    expect(r.nextElectionAt).toBe(55);
  });

  it("cheating keeps you in office at a drift cost and sets flags", () => {
    const l = lib({ electionInterval: 25 });
    const s = start(l, { cardCount: 30, nextElectionAt: 30, meters: { mood: 10, money: 50, order: 50, inst: 50 } });
    const r = resolve(l, table(s, "el_basic"), "el_basic", "right");
    expect(r.over).toBeNull();
    expect(r.drift).toBe(-20);
    expect(r.flags).toEqual(["cheated"]);
    expect(r.meters.inst).toBe(45);
    expect(r.nextElectionAt).toBe(55);
  });

  it("honours electionDelay overrides", () => {
    const l = lib({ electionInterval: 25 });
    const s = start(l, { cardCount: 30, nextElectionAt: 30, flags: ["want_delay"] });
    expect(resolve(l, table(s, "el_delay"), "el_delay", "right").nextElectionAt).toBe(35);
  });

  it("replaces elections with a coup-risk check once abolished", () => {
    const risky = lib({ coupBase: 1, electionInterval: 25 });
    const s = start(risky, { cardCount: 10, nextElectionAt: 10, flags: ["elections_abolished"] });
    expect(checkElection(risky, s).over?.endingId).toBe("coup");

    const safe = lib({ coupBase: 0, coupPerPoint: 0, electionInterval: 25 });
    const survived = checkElection(safe, start(safe, { cardCount: 10, nextElectionAt: 10, flags: ["elections_abolished"] }));
    expect(survived.over).toBeNull();
    expect(survived.nextElectionAt).toBe(35);

    const notDue = checkElection(risky, start(risky, { cardCount: 5, nextElectionAt: 10, flags: ["elections_abolished"] }));
    expect(notDue.over).toBeNull();
    const notAbolished = checkElection(risky, start(risky, { cardCount: 10, nextElectionAt: 10 }));
    expect(notAbolished.over).toBeNull();
  });

  it("computes coup risk from the Order and Institutions shortfall", () => {
    const l = lib();
    expect(coupRisk(l, start(l))).toBeCloseTo(0.05);
    expect(coupRisk(l, start(l, { meters: { mood: 50, money: 50, order: 30, inst: 40 } }))).toBeCloseTo(0.35);
    expect(coupRisk(l, start(l, { meters: { mood: 50, money: 50, order: 90, inst: 90 } }))).toBeCloseTo(0.05);
  });
});

describe("resolve: eras", () => {
  it("advances at the era boundary: recomputes band, pulls meters, resets the election clock", () => {
    const l = lib({ eraLength: 5, electionInterval: 25, eraCount: 3, eraMeterPull: 0.5 });
    const s = start(l, { cardCount: 5, drift: -30, meters: { mood: 20, money: 90, order: 50, inst: 50 } });
    const r = advanceEra(l, s);
    expect(r.era).toBe(2);
    expect(r.band).toBe("decay");
    expect(r.bandLocked).toBe(false);
    expect(r.meters).toEqual({ mood: 35, money: 70, order: 50, inst: 50 });
    expect(r.nextElectionAt).toBe(30);
    expect(advanceEra(l, start(l, { cardCount: 4 })).era).toBe(1);
  });

  it("locks the band after the configured era", () => {
    const l = lib({ eraLength: 5, eraCount: 5, bandLockAfterEra: 1 });
    const locked = advanceEra(l, start(l, { cardCount: 5, drift: 30 }));
    expect(locked).toMatchObject({ era: 2, band: "ascent", bandLocked: true });
    const still = advanceEra(l, { ...locked, cardCount: 10, drift: -60 });
    expect(still).toMatchObject({ era: 3, band: "ascent", bandLocked: true });
  });

  it("ends in a finale by exit band after the last era", () => {
    const l = lib({ eraLength: 5, eraCount: 1 });
    expect(advanceEra(l, start(l, { cardCount: 5, drift: 30 })).over?.endingId).toBe("finale_ascent");
    expect(advanceEra(l, start(l, { cardCount: 5, drift: -30 })).over?.endingId).toBe("finale_decay");
    expect(advanceEra(l, start(l, { cardCount: 5 })).over?.endingId).toBe("finale_muddle");
  });

  it("runs the whole loop: an ouster beats the era transition on the same card", () => {
    const l = lib({ eraLength: 1, eraCount: 3 });
    const s = table(start(l, { meters: { mood: 50, money: 50, order: 50, inst: 50 } }), "ev_big");
    const r = resolve(l, s, "ev_big", "left");
    expect(r.over?.endingId).toBe("personality_cult");
    expect(r.era).toBe(1);
  });
});

describe("resolve: determinism and preview", () => {
  it("replays identically from the same seed and choices", () => {
    const l = lib({ eraLength: 12, electionInterval: 7, arcEntryProb: 0.5, arcContinueProb: 0.5 });
    const policy = (id: string) => (id.length % 2 === 0 ? "left" : "right");
    const a = play(l, start(l, {}, "left", 123), 60, policy);
    const b = play(l, start(l, {}, "left", 123), 60, policy);
    expect(a.ids).toEqual(b.ids);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
  });

  it("preview matches what resolve would do, without committing", () => {
    const l = lib();
    const s = table(start(l), "ev_fx");
    const p = preview(l, s, getCard(l, "ev_fx"), "left");
    const r = resolve(l, s, "ev_fx", "left");
    expect(p.meters).toEqual(r.meters);
    expect(p.drift).toBe(r.drift);
    expect(p.endingId).toBeNull();
    expect(p.affected).toEqual(["mood", "money"]);
    expect(s.current).toBe("ev_fx");

    const lost = start(l, { nextElectionAt: 0, meters: { mood: 10, money: 50, order: 50, inst: 50 } });
    expect(preview(l, lost, getCard(l, "el_basic"), "left").endingId).toBe("election_loss");
    expect(preview(l, lost, getCard(l, "el_basic"), "right").endingId).toBeNull();
    expect(preview(l, start(l), getCard(l, "ev_big"), "left").endingId).toBe("personality_cult");
  });
});
