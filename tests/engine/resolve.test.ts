import { describe, expect, it } from "vitest";
import { draw } from "../../src/engine/draw";
import { preview } from "../../src/engine/preview";
import { advanceEra, applyChoice, checkElection, checkOuster, coupRisk, resolve, traitScale } from "../../src/engine/resolve";
import { getCard } from "../../src/engine/library";
import { moodOf } from "../../src/engine/state";
import { BLOC_KEYS, type Band } from "../../src/engine/types";
import { buildLibrary } from "../../src/engine/library";
import { ev, makeFixture } from "../fixtures/content";
import { lib, meters, play, start, table } from "../helpers";

describe("resolve: effects", () => {
  it("applies fx and drift, clears the table and ticks the counter", () => {
    const l = lib();
    const s = resolve(l, table(start(l), "ev_fx"), "ev_fx", "left");
    expect(s.meters).toEqual(meters({ mood: 55, money: 47 }));
    expect(s.drift).toBe(2);
    expect(s.current).toBeNull();
    expect(s.cardCount).toBe(1);
    expect(s.over).toBeNull();
  });

  it("scales meter effects by band volatility with rounding", () => {
    const l = lib();
    expect(resolve(l, table(start(l, { band: "decay" }), "ev_fx"), "ev_fx", "left").meters.base).toBe(57);
    expect(resolve(l, table(start(l, { band: "ascent" }), "ev_fx"), "ev_fx", "left").meters.base).toBe(54);
    expect(resolve(l, table(start(l, { band: "muddle" }), "ev_fx"), "ev_fx", "left").meters.base).toBe(55);
  });

  it("clamps meters to 0..100 and drift to ±100", () => {
    const l = lib();
    const high = resolve(l, table(start(l, { drift: 95 }), "ev_big"), "ev_big", "left");
    expect(high.meters.base).toBe(100);
    expect(high.drift).toBe(100);
    const low = resolve(l, table(start(l, { drift: -95 }), "ev_big"), "ev_big", "right");
    expect(low.meters.base).toBe(0);
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
    expect(plain.meters).toMatchObject({ base: 55, money: 47 });
    const corrupt = resolve(l, table(start(l, { cabinet: { chief: "c2" } }), "ev_fx"), "ev_fx", "left");
    expect(corrupt.meters).toMatchObject({ base: 55, money: 46 });
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

describe("resolve: run stats", () => {
  const l = lib();

  it("counts tempting, honest and neutral choices", () => {
    let s = start(l);
    s = resolve(l, table(s, "ev_fx"), "ev_fx", "left"); // drift +2
    s = resolve(l, table(s, "ev_fx"), "ev_fx", "right"); // drift -2
    s = resolve(l, table(s, "ev_fire"), "ev_fire", "left"); // drift +1, fires
    expect(s.stats).toMatchObject({ honest: 2, tempting: 1, neutral: 0 });
  });

  it("counts elections by whether the honest side was taken", () => {
    const won = start(l, { cabinet: { chief: "c0", general: "g0" } });
    const honest = resolve(l, table(won, "el_basic"), "el_basic", "left");
    expect(honest.stats).toMatchObject({ electionsHonest: 1, electionsCheated: 0 });
    const cheat = resolve(l, table(won, "el_basic"), "el_basic", "right");
    expect(cheat.stats).toMatchObject({ electionsHonest: 0, electionsCheated: 1 });
  });

  it("counts a firing only when someone was actually replaced", () => {
    const s = start(l, { cabinet: { chief: "c2", general: "g0" } });
    expect(resolve(l, table(s, "ev_fire"), "ev_fire", "left").stats.advisorsFired).toBe(1);
    expect(resolve(l, table(s, "ev_fire"), "ev_fire", "right").stats.advisorsFired).toBe(0);
  });

  it("counts arcs as they are entered", () => {
    const arcy = lib({ arcEntryProb: 1 });
    const s = draw(arcy, start(arcy));
    expect(s.stats.arcsEntered).toBe(1);
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
      ["base", 0, "abandoned_base"],
      ["backers", 0, "abandoned_backers"],
      ["public", 0, "riots"],
      ["money", 0, "bankruptcy"],
      ["money", 100, "oligarchy"],
      ["order", 0, "anarchy"],
      ["order", 100, "police_state"],
      ["inst", 0, "state_collapse"],
      ["inst", 100, "paralysis"],
    ];
    for (const [k, v, ending] of cases) {
      const s = start(l, { meters: meters({ [k]: v }) });
      expect(checkOuster(l, s).over?.endingId, `${k} at ${v}`).toBe(ending);
    }
    expect(checkOuster(l, start(l)).over).toBeNull();
  });

  it("does not oust on a single adored bloc, only on all of them at once", () => {
    const l = lib();
    // One bloc at the ceiling is a strong coalition, not a cult.
    expect(checkOuster(l, start(l, { meters: meters({ base: 100 }) })).over).toBeNull();
    const cult = Object.fromEntries(BLOC_KEYS.map((b) => [b, l.config.cultAt])) as Record<string, number>;
    expect(checkOuster(l, start(l, { meters: meters(cult) })).over?.endingId).toBe("personality_cult");
    // One bloc short of the threshold is still a country with dissent in it.
    expect(checkOuster(l, start(l, { meters: meters({ ...cult, public: l.config.cultAt - 1 }) })).over).toBeNull();
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
    const s = start(l, { nextElectionAt: 0, meters: meters({ mood: 39 }) });
    const r = resolve(l, table(s, "el_basic"), "el_basic", "left");
    expect(r.over?.endingId).toBe("election_loss");
  });

  it("wins an honest election at the threshold and reschedules", () => {
    const l = lib({ electionInterval: 25 });
    const s = start(l, { cardCount: 30, nextElectionAt: 30, meters: meters({ mood: 40 }) });
    const r = resolve(l, table(s, "el_basic"), "el_basic", "left");
    expect(r.over).toBeNull();
    // The election's mood bonus lands on every bloc, so the average moves with them.
    expect(moodOf(r.meters)).toBe(41);
    expect(r.drift).toBe(2);
    expect(r.nextElectionAt).toBe(55);
  });

  it("cheating keeps you in office at a drift cost and sets flags", () => {
    const l = lib({ electionInterval: 25 });
    const s = start(l, { cardCount: 30, nextElectionAt: 30, meters: meters({ mood: 10 }) });
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
    expect(coupRisk(l, start(l, { meters: meters({ order: 30, inst: 40 }) }))).toBeCloseTo(0.35);
    expect(coupRisk(l, start(l, { meters: meters({ order: 90, inst: 90 }) }))).toBeCloseTo(0.05);
  });
});

describe("resolve: eras", () => {
  it("advances at the era boundary: recomputes band, pulls meters, resets the election clock", () => {
    const l = lib({ eraLength: 5, electionInterval: 25, eraCount: 3, eraMeterPull: 0.5 });
    const s = start(l, { cardCount: 5, drift: -30, meters: meters({ mood: 20, money: 90 }) });
    const r = advanceEra(l, s);
    expect(r.era).toBe(2);
    expect(r.band).toBe("decay");
    expect(r.bandLocked).toBe(false);
    expect(r.meters).toEqual(meters({ mood: 35, money: 70 }));
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
    const s = table(start(l, { meters: meters() }), "ev_big");
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
    // The mood shorthand moves all three blocs, so all three take a dot.
    expect(p.affected).toEqual(["base", "backers", "public", "money"]);
    expect(s.current).toBe("ev_fx");

    const lost = start(l, { nextElectionAt: 0, meters: meters({ mood: 10 }) });
    expect(preview(l, lost, getCard(l, "el_basic"), "left").endingId).toBe("election_loss");
    expect(preview(l, lost, getCard(l, "el_basic"), "right").endingId).toBeNull();
    expect(preview(l, start(l), getCard(l, "ev_big"), "left").endingId).toBe("personality_cult");
  });
});

describe("resolve: arcs that branch by side", () => {
  /** One arc whose step 1 sends each alignment to its own step 2. */
  function branching(nextByAlign: Record<string, string>, next?: string) {
    const fx = makeFixture();
    const arcCards = [
      { ...ev("b1"), type: "arc" as const, arc: "arc_b", step: 1, left: { label: "go on", nextByAlign, ...(next ? { next } : {}) }, right: { label: "refuse" } },
      { ...ev("b2l"), type: "arc" as const, arc: "arc_b", step: 2, left: { label: "done" }, right: { label: "done" } },
      { ...ev("b2r"), type: "arc" as const, arc: "arc_b", step: 2, left: { label: "done" }, right: { label: "done" } },
      { ...ev("b2"), type: "arc" as const, arc: "arc_b", step: 2, left: { label: "done" }, right: { label: "done" } },
    ];
    const content = {
      ...fx,
      cards: [...fx.cards, ...arcCards],
      arcs: [...fx.arcs, { id: "arc_b", align: "any" as const, entry: { eras: [1, 2, 3], bands: ["decay", "muddle", "ascent"] as Band[] }, weight: 1, cards: ["b1", "b2l", "b2r", "b2"] }],
    };
    return buildLibrary(content, { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0 });
  }

  const enter = (l: ReturnType<typeof branching>, align: "left" | "right") =>
    table(start(l, { activeArcs: [{ id: "arc_b", nextCard: "b1" }] }, align), "b1");

  it("follows the pointer for the player's side", () => {
    const l = branching({ left: "b2l", right: "b2r" });
    expect(resolve(l, enter(l, "left"), "b1", "left").activeArcs).toEqual([{ id: "arc_b", nextCard: "b2l" }]);
    expect(resolve(l, enter(l, "right"), "b1", "left").activeArcs).toEqual([{ id: "arc_b", nextCard: "b2r" }]);
  });

  it("falls back to next when the player's side has no branch", () => {
    const l = branching({ left: "b2l" }, "b2");
    expect(resolve(l, enter(l, "right"), "b1", "left").activeArcs).toEqual([{ id: "arc_b", nextCard: "b2" }]);
    expect(resolve(l, enter(l, "left"), "b1", "left").activeArcs).toEqual([{ id: "arc_b", nextCard: "b2l" }]);
  });
});

describe("resolve: losing to the rival", () => {
  it("names them when they are somebody, and does not when they are not", () => {
    const l = lib();
    const losing = { meters: meters({ mood: 10 }), cardCount: 5 };
    const weak = table(start(l, { ...losing, rivalStanding: 10, drift: 0 }), "el_basic");
    const strong = table(start(l, { ...losing, rivalStanding: 90, drift: 0 }), "el_basic");
    expect(resolve(l, weak, "el_basic", "left").over?.endingId).toBe(l.config.electionLossEnding);
    expect(resolve(l, strong, "el_basic", "left").over?.endingId).toBe(l.config.rivalEnding);
  });

  it("banks a stolen vote for them and a clean one against them", () => {
    const l = lib();
    const s = start(l, { rivalStanding: 40, meters: meters({ mood: 90 }), cardCount: 5 });
    const cheated = resolve(l, table(s, "el_basic"), "el_basic", "right");
    const clean = resolve(l, table(s, "el_basic"), "el_basic", "left");
    expect(cheated.rivalStanding).toBe(40 + l.config.rivalCheatGain);
    expect(clean.rivalStanding).toBe(40 - l.config.rivalHonestLoss);
  });
});

describe("resolve: what each era changes about the rules", () => {
  /** A library whose era rules are known, so the assertions are about the mechanism. */
  const ruled = () =>
    lib({
      eraLength: 1000,
      eraRules: [{}, { passive: { money: 2, public: -2 }, passiveEvery: 3 }, { passive: { inst: -1 }, passiveEvery: 2, volatility: 2, queueScale: 0.5 }],
    });

  it("leaves era one alone", () => {
    const l = ruled();
    let s = start(l, { era: 1, cardCount: 2 });
    s = resolve(l, table(s, "f01"), "f01", "left");
    expect(s.meters.money).toBe(50);
    expect(s.meters.public).toBe(50);
  });

  it("applies the era's standing pressure on its own beat, with no card to blame", () => {
    const l = ruled();
    // cardCount ticks to 3, which is the beat.
    const onBeat = resolve(l, table(start(l, { era: 2, cardCount: 2 }), "f01"), "f01", "left");
    expect(onBeat.meters.money).toBe(52);
    expect(onBeat.meters.public).toBe(48);
    // cardCount ticks to 4, which is not.
    const offBeat = resolve(l, table(start(l, { era: 2, cardCount: 3 }), "f01"), "f01", "left");
    expect(offBeat.meters.money).toBe(50);
  });

  it("scales card effects by the era on top of the band", () => {
    const l = ruled();
    const era1 = resolve(l, table(start(l, { era: 1, cardCount: 1 }), "ev_fx"), "ev_fx", "left");
    const era3 = resolve(l, table(start(l, { era: 3, cardCount: 1 }), "ev_fx"), "ev_fx", "left");
    const move1 = Math.abs(era1.meters.money - 50);
    const move3 = Math.abs(era3.meters.money - 50);
    expect(move3).toBeGreaterThan(move1);
  });

  it("brings deferred bills due sooner in a late era", () => {
    const l = ruled();
    const early = resolve(l, table(start(l, { era: 1, cardCount: 0 }), "ev_enq"), "ev_enq", "left");
    const late = resolve(l, table(start(l, { era: 3, cardCount: 0 }), "ev_enq"), "ev_enq", "left");
    expect(late.queue[0]!.dueAt).toBeLessThan(early.queue[0]!.dueAt);
    expect(late.queue[0]!.dueAt).toBeGreaterThanOrEqual(1);
  });
});

describe("resolve: a crisis that bends an era", () => {
  /**
   * The fixture with two crises that bend eras, and era rules that are known: era 2 adds 2
   * Money every 3 cards. A bend is added to the era's own rules rather than replacing them
   * (BACKLOG-5 phase 35).
   */
  const bent = () => {
    const fx = makeFixture();
    return buildLibrary(
      {
        ...fx,
        modifiers: [
          ...fx.modifiers,
          { id: "mod_grid", kind: "crisis", bends: [{ era: 2, passive: { order: -2 }, passiveEvery: 4, volatility: 2 }] },
          { id: "mod_debt", kind: "crisis", bends: [{ era: 1, queueScale: 0.5 }] },
        ],
      },
      { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0, eraRules: [{}, { passive: { money: 2 }, passiveEvery: 3 }, {}] },
    );
  };
  const after = (l: ReturnType<typeof bent>, over: Parameters<typeof start>[1], id = "f01") => resolve(l, table(start(l, over), id), id, "left");

  it("adds its pressure on a beat of its own, beside the era's", () => {
    const l = bent();
    const grid = ["mod_grid"];
    // The count ticks to 12, which is both beats; to 9, the era's; to 8, the bend's.
    expect(after(l, { era: 2, cardCount: 11, modifiers: grid }).meters).toMatchObject({ money: 52, order: 48 });
    expect(after(l, { era: 2, cardCount: 8, modifiers: grid }).meters).toMatchObject({ money: 52, order: 50 });
    expect(after(l, { era: 2, cardCount: 7, modifiers: grid }).meters).toMatchObject({ money: 50, order: 48 });
  });

  it("bends only its own era, and only the runs that inherited it", () => {
    const l = bent();
    expect(after(l, { era: 3, cardCount: 11, modifiers: ["mod_grid"] }).meters.order).toBe(50);
    expect(after(l, { era: 2, cardCount: 11, modifiers: [] }).meters.order).toBe(50);
  });

  it("stacks its multipliers on the era's and the band's", () => {
    const l = bent();
    const plain = after(l, { era: 2, cardCount: 1, modifiers: [] }, "ev_fx");
    const grid = after(l, { era: 2, cardCount: 1, modifiers: ["mod_grid"] }, "ev_fx");
    expect(grid.meters.money - 50).toBe(2 * (plain.meters.money - 50));
  });

  it("brings a deferred bill due sooner in the era it bends", () => {
    const l = bent();
    const plain = after(l, { era: 1, cardCount: 10, modifiers: [] }, "ev_enq");
    const debt = after(l, { era: 1, cardCount: 10, modifiers: ["mod_debt"] }, "ev_enq");
    expect(plain.queue[0]!.dueAt).toBe(12);
    expect(debt.queue[0]!.dueAt).toBe(11);
  });
});

describe("resolve: what a run records about itself", () => {
  it("records the choice that left an arc, and nothing that stayed in it", () => {
    const l = lib({ arcEntryProb: 1, arcContinueProb: 1 });
    let s = draw(l, start(l));
    s = resolve(l, s, "arc_t1", "left"); // goes on to arc_t2, so not an outcome
    expect(s.stats.arcOutcomes).toEqual([]);
    s = draw(l, s);
    s = resolve(l, s, "arc_t2", "right"); // ends the arc
    expect(s.stats.arcOutcomes).toEqual(["arc_t2:right"]);
  });

  it("dates each flag by the card that set it, and keeps the first date", () => {
    // The end-of-run timeline says when a decision was made, and a flag is the only record a
    // decision leaves (post-run histories).
    const l = lib();
    let s = start(l, { cardCount: 6 });
    s = resolve(l, table(s, "ev_flags"), "ev_flags", "left");
    expect(s.flagSince.f1).toBe(7);
    expect(s.flagSince.f2).toBe(7);
    // Cleared and set again later: still the day it was first done.
    s = resolve(l, table(s, "ev_flags"), "ev_flags", "right");
    s = resolve(l, table(s, "ev_flags"), "ev_flags", "left");
    expect(s.flagSince.f1).toBe(7);
    expect(s.flagSince.f3).toBe(8);
  });

  it("dates what a run starts with to card 0", () => {
    const l = lib();
    const s = start(l);
    for (const f of s.flags) expect(s.flagSince[f]).toBe(0);
  });

  it("records who was let go, not just how many", () => {
    const l = lib();
    const s = resolve(l, table(start(l), "ev_fire"), "ev_fire", "left");
    expect(s.stats.advisorsFired).toBe(1);
    expect(s.stats.firedAdvisors).toEqual(["c0"]);
    expect(s.cabinet.chief).not.toBe("c0");
  });
});
