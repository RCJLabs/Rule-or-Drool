import { describe, expect, it } from "vitest";
import { bandOf, cabinetFlags, condMet, exitBand, fxDeltas, moodOf, newRun, replaceAdvisor, rivalPressure, rollSetup, tenureOf } from "../../src/engine/state";
import { library } from "../../src/content";
import { buildLibrary } from "../../src/engine/library";
import { makeFixture } from "../fixtures/content";
import { lib, meters, start } from "../helpers";

describe("newRun", () => {
  it("starts every meter at 50 with the spec defaults", () => {
    const l = lib();
    const s = { ...newRun(l, 1, { align: "left" }), flags: [] };
    expect(s.meters).toEqual(meters());
    expect(s).toMatchObject({
      seed: 1,
      align: "left",
      era: 1,
      cardCount: 0,
      drift: 0,
      band: "muddle",
      bandLocked: false,
      flags: [],
      queue: [],
      seen: [],
      cooldown: [],
      activeArcs: [],
      modifiers: [],
      over: null,
      current: null,
    });
    expect(s.nextElectionAt).toBe(l.config.electionInterval);
    expect(s.arcBudget).toBeGreaterThanOrEqual(l.config.arcBudgetMin);
    expect(s.arcBudget).toBeLessThanOrEqual(l.config.arcBudgetMax);
  });

  it("fills one advisor per role from the pool", () => {
    const s = newRun(lib(), 5, { align: "right" });
    expect(Object.keys(s.cabinet).sort()).toEqual(["chief", "general"]);
    expect(["c0", "c1", "c2"]).toContain(s.cabinet.chief);
    expect(["g0", "g1"]).toContain(s.cabinet.general);
  });

  it("flags who is in the cabinet, by person and by trait", () => {
    const l = lib();
    const s = newRun(l, 1, { align: "left" });
    const expected = cabinetFlags(l, s.cabinet);
    for (const f of expected) expect(s.flags).toContain(f);
    for (const f of s.flags) if (f.startsWith("advisor_")) expect(expected).toContain(f);
    // Trait-free advisors still get a flag of their own, so a card can name the person.
    expect(cabinetFlags(l, { chief: "c0", general: "g0" }).sort()).toEqual(["advisor_c0", "advisor_g0"]);
    expect(cabinetFlags(l, { chief: "c2", general: "g1" }).sort()).toEqual([
      "advisor_c2",
      "advisor_corrupt",
      "advisor_g1",
      "advisor_zealot",
    ]);
  });

  it("applies modifiers and rejects unknown ones", () => {
    const s = newRun(lib(), 1, { align: "left", modifiers: ["mod_crisis"] });
    expect(s.meters.money).toBe(30);
    expect(s.flags).toContain("crisis");
    expect(s.modifiers).toEqual(["mod_crisis"]);
    expect(() => newRun(lib(), 1, { align: "left", modifiers: ["nope"] })).toThrow(/unknown modifier/);
  });

  it("is deterministic for a seed", () => {
    expect(newRun(lib(), 77, { align: "left" })).toEqual(newRun(lib(), 77, { align: "left" }));
    expect(newRun(lib(), 77, { align: "left" }).rngState).not.toBe(newRun(lib(), 78, { align: "left" }).rngState);
  });
});

describe("bands", () => {
  it("uses inclusive thresholds at ±25", () => {
    const l = lib();
    expect(bandOf(l, -25)).toBe("decay");
    expect(bandOf(l, -24)).toBe("muddle");
    expect(bandOf(l, 0)).toBe("muddle");
    expect(bandOf(l, 24)).toBe("muddle");
    expect(bandOf(l, 25)).toBe("ascent");
  });

  it("exitBand follows drift unless locked", () => {
    const l = lib();
    expect(exitBand(l, start(l, { drift: 40 }))).toBe("ascent");
    expect(exitBand(l, start(l, { drift: 40, band: "decay", bandLocked: true }))).toBe("decay");
  });
});

describe("condMet", () => {
  const l = lib();
  const s = start(l, { flags: ["a", "b"], meters: meters({ mood: 30, order: 70 }) });

  it("treats a missing cond as true", () => {
    expect(condMet(l, undefined, s)).toBe(true);
  });

  it("requires all flags and forbids notFlags", () => {
    expect(condMet(l, { flags: ["a", "b"] }, s)).toBe(true);
    expect(condMet(l, { flags: ["a", "c"] }, s)).toBe(false);
    expect(condMet(l, { notFlags: ["c"] }, s)).toBe(true);
    expect(condMet(l, { notFlags: ["b"] }, s)).toBe(false);
  });

  it("compares meters strictly", () => {
    expect(condMet(l, { meters: { mood: { lt: 31 } } }, s)).toBe(true);
    expect(condMet(l, { meters: { mood: { lt: 30 } } }, s)).toBe(false);
    expect(condMet(l, { meters: { order: { gt: 69 } } }, s)).toBe(true);
    expect(condMet(l, { meters: { order: { gt: 70 } } }, s)).toBe(false);
    expect(condMet(l, { meters: { mood: { gt: 20, lt: 40 }, order: { gt: 60 } } }, s)).toBe(true);
  });
});

describe("rollSetup", () => {
  it("draws one crisis, one trait and one flaw, deterministically per seed", () => {
    const l = lib();
    const a = rollSetup(l, 4, "left");
    expect(a).toEqual(rollSetup(l, 4, "left"));
    expect(a.align).toBe("left");
    expect(a.modifiers).toEqual(["mod_crisis", "mod_trait", "mod_flaw"]);
    expect(rollSetup(l, 4, "right").align).toBe("right");
  });

  it("feeds straight into newRun", () => {
    const l = lib();
    const s = newRun(l, 4, rollSetup(l, 4, "left"));
    expect(s.meters).toEqual(meters({ mood: 55, money: 30, order: 45 }));
  });
});

describe("replaceAdvisor", () => {
  it("swaps in a different advisor of the same role and refreshes trait flags", () => {
    const l = lib();
    const s = start(l, { cabinet: { chief: "c2", general: "g0" }, flags: ["advisor_corrupt", "keep_me"] });
    const after = replaceAdvisor(l, s, "chief");
    expect(after.cabinet.chief).not.toBe("c2");
    expect(["c0", "c1"]).toContain(after.cabinet.chief);
    expect(after.flags).toContain("keep_me");
    expect(after.flags).not.toContain("advisor_corrupt");
    expect(after.cabinet.general).toBe("g0");
  });

  it("is a no-op for an unknown role or a role with no second advisor", () => {
    const l = lib();
    const s0 = start(l);
    expect(replaceAdvisor(l, s0, "nobody")).toBe(s0);

    const fx = makeFixture();
    const solo = buildLibrary({ ...fx, advisors: fx.advisors.filter((a) => a.id === "c0" || a.id === "g0") });
    const s = start(solo, { cabinet: { chief: "c0", general: "g0" } });
    expect(replaceAdvisor(solo, s, "chief")).toBe(s);
  });
});

describe("coalition blocs", () => {
  it("reads mood as the average of the three blocs", () => {
    expect(moodOf(meters())).toBe(50);
    expect(moodOf(meters({ mood: 30 }))).toBe(30);
    expect(moodOf(meters({ base: 60, backers: 30, public: 45 }))).toBe(45);
    // The state meters are not part of the coalition and must not move the average.
    expect(moodOf(meters({ money: 0, order: 100 }))).toBe(50);
  });

  it("expands the mood shorthand across every bloc, and adds to an explicit bloc", () => {
    expect(fxDeltas({ mood: 4 })).toEqual({ base: 4, backers: 4, public: 4 });
    expect(fxDeltas({ money: -3 })).toEqual({ money: -3 });
    // "Everyone disliked this, the backers especially."
    expect(fxDeltas({ mood: -2, backers: -4 })).toEqual({ base: -2, backers: -6, public: -2 });
    expect(fxDeltas(undefined)).toEqual({});
  });

  it("lets a condition read mood or a single bloc", () => {
    const l = lib();
    const split = start(l, { meters: meters({ base: 20, backers: 80, public: 50 }) });
    expect(condMet(l, { meters: { mood: { gt: 45 } } }, split)).toBe(true);
    expect(condMet(l, { meters: { base: { lt: 25 } } }, split)).toBe(true);
    expect(condMet(l, { meters: { base: { gt: 25 } } }, split)).toBe(false);
    expect(condMet(l, { meters: { backers: { gt: 75 }, base: { lt: 25 } } }, split)).toBe(true);
  });

  it("starts a run with every bloc and meter at the configured middle", () => {
    const s = newRun(lib(), 3, { align: "left" });
    for (const k of ["base", "backers", "public", "money", "order", "inst"] as const) {
      expect(s.meters[k], k).toBe(50);
    }
  });
});

describe("the rival", () => {
  const l = lib();

  it("comes from the side you did not pick, in either direction", () => {
    // newRun, not the start() helper: that pins a trait-free cabinet and would mask this.
    for (const align of ["left", "right"] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const s = newRun(library, seed, { align });
        const rival = library.advisorsById.get(s.cabinet[library.config.rivalRole]!);
        expect(rival, `${align} run has a rival`).toBeTruthy();
        expect(rival!.align, `${align} run faces the other side`).not.toBe(align);
      }
    }
  });

  it("is not yours to replace", () => {
    const s = newRun(library, 7, { align: "left" });
    const before = s.cabinet[library.config.rivalRole];
    expect(replaceAdvisor(library, s, library.config.rivalRole).cabinet[library.config.rivalRole]).toBe(before);
    // A cabinet role still swaps.
    const chief = s.cabinet.chief;
    expect(replaceAdvisor(library, s, "chief").cabinet.chief).not.toBe(chief);
  });

  it("rises with how far you have gone, whichever way you went", () => {
    const base = start(l, { rivalStanding: 30, drift: 0 });
    const rotting = { ...base, drift: -80 };
    const ascending = { ...base, drift: 80 };
    expect(rivalPressure(l, base)).toBe(30);
    expect(rivalPressure(l, rotting)).toBeGreaterThan(30);
    expect(rivalPressure(l, rotting)).toBe(rivalPressure(l, ascending));
  });

  it("can be read by a condition, and so can drift", () => {
    const s = start(l, { rivalStanding: 70, drift: -40 });
    expect(condMet(l, { meters: { rival: { gt: 60 } } }, s)).toBe(true);
    expect(condMet(l, { meters: { rival: { gt: 90 } } }, s)).toBe(false);
    expect(condMet(l, { meters: { drift: { lt: -20 } } }, s)).toBe(true);
    expect(condMet(l, { meters: { drift: { gt: 0 } } }, s)).toBe(false);
  });
});

describe("run setup by side", () => {
  it("never hands a side the other side's opening", () => {
    for (const align of ["left", "right"] as const) {
      for (let seed = 1; seed <= 200; seed++) {
        for (const id of rollSetup(library, seed, align).modifiers ?? []) {
          const mod = library.modifiers.get(id)!;
          expect(mod.align === undefined || mod.align === align, `${align} drew ${id}`).toBe(true);
        }
      }
    }
  });

  it("still draws one of each kind for either side", () => {
    for (const align of ["left", "right"] as const) {
      for (let seed = 1; seed <= 50; seed++) {
        const kinds = (rollSetup(library, seed, align).modifiers ?? []).map((id) => library.modifiers.get(id)!.kind);
        expect([...kinds].sort(), `${align} seed ${seed}`).toEqual(["crisis", "flaw", "trait"]);
      }
    }
  });

  it("gives each side openings the other cannot have", () => {
    const openings = (align: "left" | "right") => {
      const out = new Set<string>();
      for (let seed = 1; seed <= 3000; seed++) out.add((rollSetup(library, seed, align).modifiers ?? []).join("+"));
      return out;
    };
    const left = openings("left");
    const right = openings("right");
    const shared = [...left].filter((o) => right.has(o)).length;
    expect(shared).toBeLessThan(left.size / 2);
  });
});

describe("how long someone has served", () => {
  it("starts everyone on day one", () => {
    const s = newRun(library, 5, { align: "left" });
    for (const role of Object.keys(s.cabinet)) expect(s.cabinetSince[role], role).toBe(0);
  });

  it("restarts the clock for a replacement, and leaves everyone else alone", () => {
    const l = lib();
    const before = start(l, { cardCount: 40 });
    const after = replaceAdvisor(l, before, "chief");
    expect(after.cabinet.chief).not.toBe(before.cabinet.chief);
    expect(after.cabinetSince.chief).toBe(40);
    expect(after.cabinetSince.general).toBe(before.cabinetSince.general);
  });
});

describe("tenure as a condition", () => {
  const l = lib();

  it("counts from when the person in that role took it", () => {
    const s = start(l, { cardCount: 50, cabinetSince: { chief: 20, general: 0 } });
    expect(tenureOf(s, "chief")).toBe(30);
    expect(tenureOf(s, "general")).toBe(50);
    expect(tenureOf(s, "nobody")).toBe(0);
    expect(tenureOf(s, undefined)).toBe(0);
  });

  it("is read against whoever speaks the card, not the run", () => {
    const s = start(l, { cardCount: 50, cabinetSince: { chief: 45, general: 0 } });
    // The same condition, asked about two different people, answers differently.
    expect(condMet(l, { meters: { tenure: { gt: 30 } } }, s, "general")).toBe(true);
    expect(condMet(l, { meters: { tenure: { gt: 30 } } }, s, "chief")).toBe(false);
    // With nobody named it is nobody's tenure, so a "served a while" card cannot fire.
    expect(condMet(l, { meters: { tenure: { gt: 30 } } }, s)).toBe(false);
  });
});
