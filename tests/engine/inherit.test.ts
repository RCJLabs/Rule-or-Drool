import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { TOOK_OVER_FLAG, handoverCard, leanOf, makesInherited, settledByInheritance } from "../../src/engine/inherit";
import { getCard } from "../../src/engine/library";
import { stageOf } from "../../src/engine/look";
import { replayTo } from "../../src/engine/replay";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { advisorPool, newRun, rollSetup } from "../../src/engine/state";
import { BANDS, type GameState, type Inheritance, type PlayerAlign } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim";

/**
 * A run that takes over the country the last one left (BACKLOG-10 phase 63): the lean of the
 * last reign's band, a legacy or two in force, and the rival who remembers it, dealt from the
 * same dice a fresh start on the seed would use.
 */

const cfg = library.config;
const rivalOf = (align: PlayerAlign, n = 0) => advisorPool(library, cfg.rivalRole, align)[n]!.id;
const took = (patch: Partial<Inheritance> = {}): Inheritance => ({ band: "decay", line: 2, legacies: ["ring_started", "went_to_war"], rival: null, rivalStanding: 36, ...patch });

function playOut(s0: GameState, seed: number): GameState {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s = s0;
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

describe("taking over", () => {
  it("starts leaning the way the last reign ended, with its legacies in force and the look to show it", () => {
    for (const band of BANDS) {
      const s = newRun(library, 7, { align: "left", inheritance: took({ band }) });
      expect(s.drift).toBe(leanOf(library, band));
      expect(s.look).toBe(stageOf(s.drift, cfg));
      expect(s.band).toBe(cfg.startBand);
      expect(s.flags).toEqual(expect.arrayContaining(["ring_started", "went_to_war", TOOK_OVER_FLAG]));
      expect(s.flagSince.ring_started).toBe(0);
      expect(s.inherited).toEqual(took({ band }));
    }
    expect(leanOf(library, "decay")).toBe(-cfg.inheritLean);
    expect(leanOf(library, "muddle")).toBe(0);
    expect(leanOf(library, "ascent")).toBe(cfg.inheritLean);
  });

  it("deals from the same dice as a fresh start, but for the rival it keeps", () => {
    const fresh = newRun(library, 11, rollSetup(library, 11, "right", []));
    const rival = advisorPool(library, cfg.rivalRole, "right").find((a) => a.id !== fresh.cabinet[cfg.rivalRole])!.id;
    const heir = newRun(library, 11, { ...rollSetup(library, 11, "right", []), inheritance: took({ rival, rivalStanding: 44 }) });
    expect(heir.rngState).toEqual(fresh.rngState);
    expect(heir.arcBudget).toBe(fresh.arcBudget);
    expect(heir.meters).toEqual(fresh.meters);
    expect({ ...heir.cabinet, [cfg.rivalRole]: "" }).toEqual({ ...fresh.cabinet, [cfg.rivalRole]: "" });
    expect(heir.cabinet[cfg.rivalRole]).toBe(rival);
    expect(heir.rivalStanding).toBe(44);
    // With no rival named, the seat is dealt as a fresh run's is.
    expect(newRun(library, 11, { ...rollSetup(library, 11, "right", []), inheritance: took() }).cabinet[cfg.rivalRole]).toBe(fresh.cabinet[cfg.rivalRole]);
    // And a fresh start is exactly what it was.
    expect(fresh.inherited).toBeNull();
    expect(fresh.drift).toBe(0);
    expect(fresh.flags).not.toContain(TOOK_OVER_FLAG);
  });

  it("hands the country over on the first card, in the voice of the last reign's band", () => {
    for (const band of BANDS) {
      const s = draw(library, newRun(library, 3, { align: "left", inheritance: took({ band }) }));
      expect(s.current).toBe(handoverCard(library, took({ band })));
      expect(s.current).toBe(`${cfg.handoverPrefix}${band}`);
      // Queued to come first, but not a choice coming back: it has a source of its own.
      expect(s.currentFrom).toBe("handover");
    }
    // A fresh start never sees one.
    expect(draw(library, newRun(library, 3, { align: "left" })).current?.startsWith(cfg.handoverPrefix)).toBe(false);
  });

  it("refuses an inheritance it could not have been handed", () => {
    const start = (inh: Inheritance, align: PlayerAlign = "left") => () => newRun(library, 1, { align, inheritance: inh });
    expect(start(took({ band: "nowhere" as never }))).toThrow(/no band/);
    expect(start(took({ line: 1 }))).toThrow(/second of its line/);
    expect(start(took({ legacies: ["seawall", "ring_started", "long_ship"] }))).toThrow(/at most 2/);
    expect(start(took({ legacies: ["seawall", "seawall"] }))).toThrow(/once/);
    expect(start(took({ rivalStanding: 101 }))).toThrow(/0-100/);
    // The rival sits against the side: one who could only sit against the other side is no rival.
    expect(start(took({ rival: rivalOf("right") }), "left")).toThrow(/no rival/);
    expect(start(took({ rival: rivalOf("right") }), "right")).not.toThrow();
  });

  it("will not let a run promise what the country it takes over already breaks", () => {
    expect(() => newRun(library, 1, { align: "left", mandates: ["m_press"], inheritance: took({ legacies: ["media_captured"] }) })).toThrow(/already broken/);
    expect(() => newRun(library, 1, { align: "left", mandates: ["m_press"], inheritance: took({ legacies: ["seawall"] }) })).not.toThrow();
  });

  it("does not tell a story again, ask a question again, or deal a card that makes what the country already has", () => {
    let arcs = 0;
    let made = 0;
    let settled = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const inh = took({ band: BANDS[seed % 3]!, legacies: ["seawall", "went_to_war"] });
      let s = newRun(library, seed, { ...rollSetup(library, seed, seed % 2 ? "left" : "right", []), inheritance: inh });
      const rng = makeRng(seed ^ 0x5bd1e995);
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        if (makesInherited(card, s)) made++;
        s = resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 })));
      }
      for (const a of s.activeArcs) {
        arcs++;
        if (settledByInheritance(library, s, a.id)) settled++;
      }
    }
    expect(arcs).toBeGreaterThan(40);
    expect(settled).toBe(0);
    expect(made).toBe(0);
    // The treaty question is what an inherited answer settles, and funding the seawall is a card
    // an heir who has one is never dealt.
    const treaty = [...library.arcSets].filter(([, sets]) => sets.has("went_to_war")).map(([id]) => id);
    expect(treaty.length).toBe(2);
    const heir = newRun(library, 1, { align: "left", inheritance: took({ legacies: ["seawall", "went_to_war"] }) });
    for (const id of treaty) expect(settledByInheritance(library, heir, id)).toBe(true);
    expect(settledByInheritance(library, newRun(library, 1, { align: "left" }), treaty[0]!)).toBe(false);
    const fundSeawall = library.content.cards.find((c) => c.left.setFlags?.includes("seawall") || c.right.setFlags?.includes("seawall"))!;
    expect(makesInherited(fundSeawall, heir)).toBe(true);
    expect(makesInherited(fundSeawall, newRun(library, 1, { align: "left" }))).toBe(false);
  });

  it("puts a run that took over back on the table exactly, for the other road", () => {
    const seed = 21;
    const s = playOut(newRun(library, seed, { ...rollSetup(library, seed, "left", []), inheritance: took({ band: "ascent", rival: rivalOf("left", 1), rivalStanding: 25 }) }), seed);
    for (const k of [0, 10, Math.floor(s.cardCount / 2)]) {
      const back = replayTo(library, s, k)!;
      expect(back, `card ${k}`).not.toBeNull();
      expect(back.current).toBe(s.choices![k]![0]);
      expect(back.inherited).toEqual(s.inherited);
    }
  });
});
