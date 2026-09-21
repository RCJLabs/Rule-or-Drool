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
    expect(resolveEras(c, { eras: "all", config: DEFAULT_CONFIG })).toEqual({ eras: [1, 2, 3], empty: [2, 3] });
    expect(resolveEras(c, { eras: "auto", config: DEFAULT_CONFIG })).toEqual({ eras: [1], empty: [2, 3] });
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

  it("flags a weight-0 arc as dead", () => {
    const c = makeValid();
    c.arcs[0]!.weight = 0;
    expect(codes(c)).toEqual(["error:arc-dead", "error:ending-unreachable"]);
  });
});

describe("rules: reachability", () => {
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

describe("rules: coverage", () => {
  it("fails thin cells and reports the count", () => {
    const issues = run(makeValid(), { minCell: 3 }).filter((i) => i.code === "cell-thin");
    expect(issues).toHaveLength(6);
    expect(issues[0]!.message).toMatch(/2 eligible event cards, minimum 3/);
    expect(run(makeValid(), { minCell: 3, eras: "all" }).filter((i) => i.code === "cell-thin")).toHaveLength(18);
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
    card(c, "ev_c").eras = [1, 4];
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
