import { describe, expect, it } from "vitest";
import type { Card, Content } from "../../src/engine/types";
import { resolveEras, validateContent } from "../../src/validate";
import { DEFAULT_CONFIG } from "../../src/engine/config";
import { VALID_OPTIONS, card, makeValid } from "../fixtures/valid";

function run(content: Content, extra: Record<string, unknown> = {}) {
  return validateContent(content, { ...VALID_OPTIONS, ...extra });
}

function codes(content: Content, extra: Record<string, unknown> = {}): string[] {
  return [...new Set(run(content, extra).map((i) => `${i.level}:${i.code}`))].sort();
}

const extraCard = (over: Partial<Card>): Card => ({
  id: "extra",
  type: "event",
  align: "any",
  eras: [1],
  bands: ["decay", "muddle", "ascent"],
  speaker: "chief",
  text: "Extra.",
  left: { label: "A", fx: { mood: 2 }, drift: -1 },
  right: { label: "B", fx: { mood: -2 }, drift: 1 },
  ...over,
});

describe("rules: baseline", () => {
  it("accepts the valid fixture with no issues at all", () => {
    expect(run(makeValid())).toEqual([]);
  });

  it("resolves era scope", () => {
    const c = makeValid();
    // Five: a long reign's two eras are eras a run can reach (BACKLOG-5 phase 39).
    expect(resolveEras(c, { eras: "all", config: DEFAULT_CONFIG })).toEqual({ eras: [1, 2, 3, 4, 5], empty: [2, 3, 4, 5] });
    expect(resolveEras(c, { eras: "auto", config: DEFAULT_CONFIG })).toEqual({ eras: [1], empty: [2, 3, 4, 5] });
    expect(resolveEras(c, { eras: "all", config: { ...DEFAULT_CONFIG, longEraCount: 3 } }).eras).toEqual([1, 2, 3]);
    expect(resolveEras(c, { eras: [3, 1], config: DEFAULT_CONFIG }).eras).toEqual([1, 3]);
    expect(codes(c, { eras: "auto" })).toEqual(["warn:era-empty"]);
  });
});

describe("rules: ids and references", () => {
  it("flags duplicate ids of every kind", () => {
    const c = makeValid();
    c.cards.push({ ...card(c, "ev_a") });
    c.arcs.push({ ...c.arcs[0]! });
    c.endings.push({ ...c.endings[0]! });
    c.advisors.push({ ...c.advisors[0]! });
    c.modifiers.push({ ...c.modifiers[0]! });
    c.epilogues.push({ ...c.epilogues[0]! });
    const dupes = run(c).filter((i) => i.code === "duplicate-id");
    expect(dupes.map((i) => i.kind).sort()).toEqual(["advisor", "arc", "card", "ending", "epilogue", "modifier"]);
  });

  it("flags enqueue, next, ending, arc and arcWeights references that do not exist", () => {
    const c = makeValid();
    card(c, "ev_a").left = { label: "A", drift: -1, enqueue: [{ id: "nope", delay: 1 }], next: "nada", ending: "gone" };
    card(c, "ev_a").arc = "arc_missing";
    c.arcs[0]!.cards.push("arc_ghost");
    c.modifiers[0]!.arcWeights = { arc_none: 1 };
    const refs = run(c).filter((i) => i.code === "unknown-ref");
    expect(refs.map((i) => i.path).sort()).toEqual(["arc", "arcWeights.arc_none", "cards[2]", "left.ending", "left.enqueue[0].id", "left.next"]);
  });
});

describe("rules: flags", () => {
  it("catches set-but-unread, read-but-unset, cleared-but-unset and set-and-cleared", () => {
    const c = makeValid();
    card(c, "ev_a").left.setFlags = ["never_read"];
    card(c, "ev_a").cond = { flags: ["ghost"] };
    card(c, "ev_a").right.clearFlags = ["phantom"];
    card(c, "ev_b").right = { label: "B", drift: 2, setFlags: ["twin"], clearFlags: ["twin"] };
    const flagIssues = run(c).filter((i) => i.code.startsWith("flag-"));
    expect(flagIssues.map((i) => `${i.code}:${i.message.match(/"(\w+)"/)?.[1]}`).sort()).toEqual([
      "flag-cleared-unset:phantom",
      "flag-set-and-cleared:twin",
      "flag-unread:never_read",
      "flag-unread:twin",
      "flag-unset:ghost",
    ]);
  });

  it("treats the engine's abolished-elections flag as read, and only warns when nothing sets it", () => {
    const c = makeValid();
    expect(codes(c)).toEqual([]);
    c.cards = c.cards.filter((x) => x.id !== "el_b");
    card(c, "el_a").right.setFlags = [];
    const issues = run(c).filter((i) => i.code === "flag-unset");
    expect(issues).toHaveLength(1);
    expect(issues[0]!.level).toBe("warn");
  });
});

describe("rules: run setup", () => {
  it("reports a side that cannot open a run, and warns on a thin pool", () => {
    const c = makeValid();
    c.modifiers = [
      { id: "m_crisis", kind: "crisis" },
      { id: "m_trait", kind: "trait" },
      { id: "m_flaw_l", kind: "flaw", align: "left" },
    ];
    // Right has no flaw at all; left has exactly one of each.
    const found = run(c, { minSetupPool: 2 });
    expect(found.filter((i) => i.code === "setup-empty").map((i) => i.id)).toEqual(["flaw:right"]);
    expect(found.some((i) => i.code === "setup-thin")).toBe(true);
  });

  it("is happy when both sides can draw from enough", () => {
    const c = makeValid();
    c.modifiers = ["crisis", "trait", "flaw"].flatMap((kind) =>
      [0, 1].map((n) => ({ id: `m_${kind}_${n}`, kind: kind as "crisis" | "trait" | "flaw" })),
    );
    expect(run(c, { minSetupPool: 2 }).filter((i) => i.code.startsWith("setup-"))).toEqual([]);
  });
});

describe("rules: the rival", () => {
  it("refuses to let a card fire the rival", () => {
    const c = makeValid();
    c.advisors.push({ id: "adv_r", role: "rival", name: "A Rival", traits: [], align: "right" });
    c.cards.push(extraCard({ id: "rv_card", speaker: "rival", left: { label: "Fire them", drift: -1, fireSpeaker: true } }));
    expect(codes(c)).toContain("error:fire-the-rival");
  });

  it("accepts rival and drift as conditions, and drift may be negative", () => {
    const c = makeValid();
    card(c, "ev_a").cond = { meters: { rival: { gt: 55 }, drift: { lt: -20 } } };
    expect(codes(c)).toEqual([]);

    const impossible = makeValid();
    card(impossible, "ev_a").cond = { meters: { drift: { lt: -100 } } };
    expect(codes(impossible)).toContain("error:cond-unsatisfiable");
  });
});

describe("rules: delayed consequences", () => {
  it("rejects an enqueue chain that loops", () => {
    // An arc cycle is only a warning because a refusal always ends an arc. A queue has no
    // refusal, so a loop is a run that never stops paying (BACKLOG item 6).
    const c = makeValid();
    c.cards.push(extraCard({ id: "q_one", weight: 0, left: { label: "A", drift: -1, enqueue: [{ id: "q_two", delay: 3 }] } }));
    c.cards.push(extraCard({ id: "q_two", weight: 0, left: { label: "A", drift: -1, enqueue: [{ id: "q_one", delay: 3 }] } }));
    expect(codes(c)).toContain("error:enqueue-cycle");
  });

  it("allows a chain that ends", () => {
    const c = makeValid();
    card(c, "ev_a").right.enqueue = [{ id: "q_one", delay: 2 }];
    c.cards.push(extraCard({ id: "q_one", weight: 0, left: { label: "A", drift: -1, enqueue: [{ id: "q_two", delay: 3 }] } }));
    c.cards.push(extraCard({ id: "q_two", weight: 0, left: { label: "A", drift: -1, enqueue: [{ id: "q_three", delay: 3 }] } }));
    c.cards.push(extraCard({ id: "q_three", weight: 0 }));
    expect(codes(c)).toEqual([]);
  });
});

describe("rules: modifiers", () => {
  it("rejects the mood shorthand in a starting position", () => {
    // It means all three blocs, so a number written when support was one meter is silently
    // tripled. That is how the flaws stopped being the even trades they were meant to be.
    const c = makeValid();
    c.modifiers[0]!.meterStart = { mood: -5, inst: 5 };
    expect(codes(c)).toEqual(["error:meterstart-mood"]);

    const explicit = makeValid();
    explicit.modifiers[0]!.meterStart = { base: -2, backers: -2, public: -1, inst: 5 };
    expect(codes(explicit)).toEqual([]);
  });
});

describe("rules: a modifier bending an era", () => {
  it("rejects a bend that can never apply, changes nothing, or bends one era twice", () => {
    // A bend is a rule the player is told about at the jump, so one that never fires is a
    // promise the game does not keep (BACKLOG-5 phase 35).
    const c = makeValid();
    c.modifiers[1]!.bends = [{ era: 2, passive: { order: -1 } }, { era: 3 }, { era: 3, volatility: 1.1 }, { era: 9, queueScale: 0.5 }];
    expect(codes(c)).toEqual(["error:bend-empty", "error:bend-no-beat", "error:bend-twice", "warn:era-out-of-range"]);

    const fine = makeValid();
    fine.modifiers[1]!.bends = [{ era: 1, queueScale: 0.7 }, { era: 2, passive: { order: -1 }, passiveEvery: 6 }];
    expect(codes(fine)).toEqual([]);
  });
});

describe("rules: written for whoever speaks", () => {
  it("rejects a card or an arc waiting for a speaker nobody in the role can be", () => {
    // The fixture's only chief is loyal and its only general a zealot. An arc entry is read
    // against the speaker of its first card, which here is the general.
    const c = makeValid();
    card(c, "ev_a").cond = { speakerTraits: ["corrupt"] };
    c.arcs[0]!.entry = { ...c.arcs[0]!.entry, speakerTraits: ["loyal"] };
    const issues = run(c).filter((i) => i.code === "cond-unsatisfiable");
    expect(issues.map((i) => `${i.kind}:${i.id}:${i.path}`).sort()).toEqual(["arc:arc_a:entry.speakerTraits", "card:ev_a:cond.speakerTraits"]);

    const fine = makeValid();
    card(fine, "ev_a").cond = { speakerTraits: ["loyal"] };
    fine.arcs[0]!.entry = { ...fine.arcs[0]!.entry, speakerTraits: ["zealot"] };
    expect(codes(fine)).toEqual([]);
  });

  it("warns on a trait nobody has heard of", () => {
    const c = makeValid();
    c.advisors[0]!.traits = ["loyal", "sparkly"];
    card(c, "ev_a").cond = { speakerTraits: ["sparkly"] };
    expect(codes(c)).toEqual(["warn:trait-unknown"]);
  });
});

describe("rules: arcs", () => {
  it("reports cards unreachable from the entry card", () => {
    const c = makeValid();
    c.cards.push(extraCard({ id: "arc_a3", type: "arc", arc: "arc_a" }));
    c.arcs[0]!.cards.push("arc_a3");
    expect(codes(c)).toEqual(["error:arc-unreachable"]);
  });

  it("reports arcs with no exit and warns on loops", () => {
    const c = makeValid();
    card(c, "arc_a1").right.next = "arc_a2";
    card(c, "arc_a2").left = { label: "Loop", drift: -1, next: "arc_a1" };
    card(c, "arc_a2").right.next = "arc_a1";
    expect(codes(c)).toEqual(["error:arc-no-exit", "error:ending-unreachable", "warn:arc-cycle"]);

    const loopWithExit = makeValid();
    card(loopWithExit, "arc_a2").right.next = "arc_a1";
    expect(codes(loopWithExit)).toEqual(["warn:arc-cycle"]);
  });

  it("checks membership both ways and the card type", () => {
    const c = makeValid();
    c.cards.push(extraCard({ id: "stray_arc", type: "arc", arc: "arc_a" }));
    c.cards.push(extraCard({ id: "no_arc_id", type: "arc" }));
    card(c, "arc_a1").type = "event";
    const issues = run(c).filter((i) => i.code === "arc-membership");
    expect(issues.map((i) => `${i.kind}:${i.id}:${i.path}`).sort()).toEqual(["card:arc_a1:type", "card:no_arc_id:arc", "card:stray_arc:arc"]);
  });

  it("keeps next pointers inside the arc, and warns when a plain card jumps into one", () => {
    const c = makeValid();
    card(c, "arc_a1").left.next = "ev_a";
    card(c, "ev_b").left.next = "arc_a2";
    card(c, "ev_c").left.enqueue = [{ id: "arc_a2", delay: 2 }, { id: "q_a", delay: 3 }];
    expect(codes(c)).toEqual(["error:arc-next-outside", "error:arc-unreachable", "warn:next-into-arc"]);
  });

  it("follows nextByAlign the same way it follows next", () => {
    // Reachability, arc membership and cycle detection all have to see both pointers,
    // or a per-side branch reads as a dead card (BACKLOG item 2).
    const reachable = makeValid();
    delete card(reachable, "arc_a1").left.next;
    card(reachable, "arc_a1").left.nextByAlign = { left: "arc_a2", right: "arc_a2" };
    expect(codes(reachable)).toEqual([]);

    const outside = makeValid();
    card(outside, "arc_a1").left.nextByAlign = { left: "ev_a" };
    expect(codes(outside)).toContain("error:arc-next-outside");

    const notAnArc = makeValid();
    card(notAnArc, "ev_b").left.nextByAlign = { left: "ev_c" };
    expect(codes(notAnArc)).toContain("error:arc-membership");
  });

  it("flags a weight-0 arc as dead", () => {
    const c = makeValid();
    c.arcs[0]!.weight = 0;
    expect(codes(c)).toEqual(["error:arc-dead", "error:ending-unreachable"]);
  });
});

describe("rules: reachability", () => {
  it("rejects a card whose only era is one it can never be in the right band for", () => {
    // A run opens in muddle and the band only recomputes at an era boundary, so era 1 is
    // always muddle. Twenty-seven shipped cards were in this state (BACKLOG-3 phase 20).
    const withCard = (over: Partial<Card>) => {
      const c = makeValid();
      c.cards.push(extraCard(over));
      return codes(c);
    };
    expect(withCard({ id: "stranded", eras: [1], bands: ["decay"] })).toContain("error:card-era1-band");
    // Across every era it is fine: eras 2 and 3 can be in decay.
    expect(withCard({ id: "fine", eras: [1, 2, 3], bands: ["decay"] })).not.toContain("error:card-era1-band");
    // And so is one that includes the band a run starts in.
    expect(withCard({ id: "also_fine", eras: [1], bands: ["decay", "muddle"] })).not.toContain("error:card-era1-band");
  });

  it("reports endings nothing can reach and engine endings that are missing", () => {
    const c = makeValid();
    c.endings.push({ id: "lonely", title: "x", text: "x" });
    c.endings = c.endings.filter((e) => e.id !== "coup");
    expect(codes(c)).toEqual(["error:ending-missing", "error:ending-unreachable"]);
  });

  it("reports cards that can never be drawn", () => {
    const c = makeValid();
    c.cards.push(extraCard({ id: "orphan", weight: 0 }));
    c.cards.push(extraCard({ id: "final", type: "ending", left: { label: "A", ending: "ending_a" }, right: { label: "B", ending: "ending_a" } }));
    const issues = run(c).filter((i) => i.code === "card-unreachable");
    expect(issues.map((i) => i.id).sort()).toEqual(["final", "orphan"]);

    card(c, "ev_a").right.enqueue = [{ id: "final", delay: 5 }];
    card(c, "ev_a").left.next = "orphan";
    expect(codes(c)).toEqual([]);
  });
});

describe("rules: unlocks", () => {
  it("rejects a requires that no objective grants, and warns about a token nothing uses", () => {
    const c = makeValid();
    c.arcs[0]!.requires = "u_ghost";
    c.modifiers[0]!.requires = "u_real";
    const issues = run(c, { unlockTokens: ["u_real", "u_spare"] });
    expect(issues.filter((i) => i.code === "unknown-unlock").map((i) => i.id)).toEqual(["arc_a"]);
    expect(issues.filter((i) => i.code === "unlock-unused").map((i) => i.message)).toEqual([
      'objectives grant "u_spare" but nothing requires it',
    ]);
  });

  it("is silent when every token is both granted and required", () => {
    const c = makeValid();
    c.arcs[0]!.requires = "u_real";
    expect(codes(c, { unlockTokens: ["u_real"] })).toEqual([]);
  });
});

describe("rules: coverage", () => {
  it("fails thin cells and reports the count", () => {
    const issues = run(makeValid(), { minCell: 3 }).filter((i) => i.code === "cell-thin");
    expect(issues).toHaveLength(6);
    expect(issues[0]!.message).toMatch(/2 eligible event cards, minimum 3/);
    expect(run(makeValid(), { minCell: 3, eras: "all" }).filter((i) => i.code === "cell-thin")).toHaveLength(30);
  });

  it("requires an unconditional election card per cell", () => {
    const c = makeValid();
    card(c, "el_a").cond = { meters: { mood: { lt: 30 } } };
    expect(run(c).filter((i) => i.code === "election-missing")).toHaveLength(6);
  });

  it("requires an epilogue to resolve for every band, align and era", () => {
    const c = makeValid();
    c.epilogues = c.epilogues.filter((e) => e.band !== "ascent");
    expect(run(c).filter((i) => i.code === "epilogue-missing").map((i) => i.message)).toEqual([
      "no epilogue resolves for band ascent, align left, era 1",
      "no epilogue resolves for band ascent, align right, era 1",
    ]);
  });
});

describe("rules: per-card", () => {
  it("warns on cards with no real tradeoff", () => {
    const c = makeValid();
    c.cards.push(extraCard({ id: "same", left: { label: "A", fx: { mood: 3 }, drift: -1 }, right: { label: "B", fx: { mood: 1 }, drift: -2 } }));
    c.cards.push(extraCard({ id: "empty", left: { label: "A" }, right: { label: "B" } }));
    expect(run(c).filter((i) => i.code === "no-tradeoff").map((i) => i.id)).toEqual(["same", "empty"]);
  });

  it("checks election honesty markers", () => {
    const c = makeValid();
    card(c, "el_a").right.honest = true;
    card(c, "el_b").right.honest = false;
    card(c, "ev_a").left.honest = true;
    card(c, "ev_a").right.electionDelay = 4;
    expect(run(c).filter((i) => i.code === "election-honest").map((i) => i.id)).toEqual(["el_a", "el_b"]);
    expect(run(c).filter((i) => i.code === "honest-misplaced").map((i) => i.path)).toEqual(["left", "right"]);
  });

  it("checks speakers, lengths, zero effects, eras and traits", () => {
    const c = makeValid();
    card(c, "ev_a").speaker = "nobody";
    card(c, "ev_b").text = "x".repeat(161);
    card(c, "ev_b").left.label = "y".repeat(25);
    card(c, "ev_c").left.fx = { order: 0, money: 1 };
    card(c, "ev_c").eras = [1, 6];
    c.advisors[0]!.traits = ["sparkly"];
    expect(codes(c)).toEqual([
      "error:speaker-unknown",
      "warn:era-out-of-range",
      "warn:fx-zero",
      "warn:label-length",
      "warn:text-length",
      "warn:trait-unknown",
    ]);
  });

  it("rejects conditions that can never hold", () => {
    const c = makeValid();
    card(c, "ev_a").cond = { flags: ["greased"], notFlags: ["greased"], meters: { mood: { gt: 60, lt: 40 }, money: { lt: 0 }, order: { gt: 100 }, inst: { gt: 10, lt: 11 } } };
    const issues = run(c).filter((i) => i.code === "cond-unsatisfiable");
    expect(issues.map((i) => i.path).sort()).toEqual(["cond", "cond.meters.inst", "cond.meters.money", "cond.meters.mood", "cond.meters.order"]);
    const fine = makeValid();
    card(fine, "ev_a").cond = { meters: { mood: { gt: 10, lt: 12 } } };
    expect(codes(fine)).toEqual([]);
  });

  it("warns when an ending-type card does not end on both sides", () => {
    const c = makeValid();
    c.cards.push(extraCard({ id: "final", type: "ending", left: { label: "A", ending: "ending_a" }, right: { label: "B", drift: 1 } }));
    card(c, "ev_a").right.next = "final";
    expect(codes(c)).toEqual(["warn:ending-card"]);
  });
});
