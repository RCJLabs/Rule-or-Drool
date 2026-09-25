import type { Card, Content } from "../../src/engine/types";

const ALL = ["decay", "muddle", "ascent"] as const;

/** Minimal event card; override anything. */
export function ev(id: string, extra: Partial<Card> = {}): Card {
  return {
    id,
    type: "event",
    align: "any",
    eras: [1, 2, 3],
    bands: [...ALL],
    speaker: "chief",
    text: id,
    left: { label: "L" },
    right: { label: "R" },
    ...extra,
  };
}

/** Engine-required endings plus one card-driven ending. */
export const ENDING_IDS = [
  "abandoned_base",
  "abandoned_backers",
  "riots",
  "personality_cult",
  "bankruptcy",
  "oligarchy",
  "anarchy",
  "police_state",
  "state_collapse",
  "paralysis",
  "election_loss",
  "rival_wins",
  "coup",
  "finale_decay",
  "finale_muddle",
  "finale_ascent",
  "ending_x",
];

export function makeFixture(): Content {
  const fillers: Card[] = [];
  for (let i = 1; i <= 20; i++) fillers.push(ev(`f${String(i).padStart(2, "0")}`));

  const cards: Card[] = [
    ...fillers,
    ev("ev_left", { align: "left" }),
    ev("ev_right", { align: "right" }),
    ev("ev_decay", { bands: ["decay"] }),
    ev("ev_era2", { eras: [2] }),
    ev("ev_oneshot", { oneShot: true, weight: 50 }),
    ev("ev_cond", { cond: { flags: ["f1"] }, weight: 50 }),
    ev("ev_enq", {
      weight: 0,
      left: { label: "L", enqueue: [{ id: "q1", delay: 2 }] },
      right: { label: "R", setFlags: ["averted"], enqueue: [{ id: "q1", delay: 2 }] },
    }),
    ev("ev_next", { left: { label: "L", next: "chained" }, right: { label: "R" } }),
    // Cards below are reached through table() in tests, not the random pool (weight 0),
    // so long play() loops do not end a run by accident.
    ev("ev_fx", {
      weight: 0,
      left: { label: "L", fx: { mood: 5, money: -3 }, drift: 2 },
      right: { label: "R", fx: { mood: -5, order: 3 }, drift: -2 },
    }),
    ev("ev_big", {
      weight: 0,
      left: { label: "L", fx: { mood: 60 }, drift: 10 },
      right: { label: "R", fx: { mood: -60 }, drift: -10 },
    }),
    ev("ev_flags", {
      weight: 0,
      left: { label: "L", setFlags: ["f1", "f2", "f1"] },
      right: { label: "R", clearFlags: ["f1"], setFlags: ["f3"] },
    }),
    ev("ev_fire", { weight: 0, left: { label: "Fire them", fireSpeaker: true, drift: 1 }, right: { label: "Keep them", drift: -1 } }),
    ev("ev_end", { weight: 0, left: { label: "L", ending: "ending_x", drift: 30 }, right: { label: "R" } }),
    ev("q1", { weight: 0, cond: { notFlags: ["averted"] } }),
    ev("chained", { weight: 0 }),
    {
      ...ev("el_basic"),
      type: "election",
      left: { label: "honest", honest: true, fx: { mood: 1 }, drift: 2 },
      right: { label: "cheat", fx: { inst: -5 }, drift: -20, setFlags: ["cheated"] },
    },
    {
      ...ev("el_abolish"),
      type: "election",
      cond: { flags: ["cheated"] },
      left: { label: "honest", honest: true, drift: 2 },
      right: { label: "abolish", drift: -25, setFlags: ["elections_abolished"] },
    },
    {
      ...ev("el_delay"),
      type: "election",
      cond: { flags: ["want_delay"] },
      weight: 100,
      left: { label: "honest", honest: true },
      right: { label: "postpone" },
    },
    {
      ...ev("arc_t1"),
      type: "arc",
      arc: "arc_t",
      step: 1,
      left: { label: "go on", next: "arc_t2" },
      right: { label: "refuse" },
    },
    {
      ...ev("arc_t2"),
      type: "arc",
      arc: "arc_t",
      step: 2,
      left: { label: "go on", next: "arc_t3" },
      right: { label: "end it", ending: "ending_x" },
    },
    {
      ...ev("arc_t3"),
      type: "arc",
      arc: "arc_t",
      step: 3,
      left: { label: "done", setFlags: ["arc_done"] },
      right: { label: "done", setFlags: ["arc_done"] },
    },
  ];

  return {
    cards,
    arcs: [
      {
        id: "arc_t",
        align: "any",
        entry: { eras: [1, 2, 3], bands: [...ALL] },
        weight: 1,
        cards: ["arc_t1", "arc_t2", "arc_t3"],
      },
    ],
    advisors: [
      // c0 / g0 carry no traits, so tests that assert exact meter maths can pin the
      // cabinet to them and stay clear of trait scaling (5.8).
      { id: "c0", role: "chief", name: "Plain Chief", traits: [] },
      { id: "c1", role: "chief", name: "Chief One", traits: ["loyal"] },
      { id: "c2", role: "chief", name: "Chief Two", traits: ["corrupt"] },
      { id: "g0", role: "general", name: "Plain General", traits: [] },
      { id: "g1", role: "general", name: "General One", traits: ["zealot"] },
    ],
    modifiers: [
      { id: "mod_crisis", kind: "crisis", meterStart: { money: -20 }, flags: ["crisis"], arcWeights: { arc_t: 3 } },
      { id: "mod_trait", kind: "trait", meterStart: { mood: 5 } },
      { id: "mod_flaw", kind: "flaw", meterStart: { order: -5 } },
    ],
    endings: ENDING_IDS.map((id) => ({ id, title: id, text: id })),
    epilogues: [
      { band: "decay", align: "any", era: 1, text: "decay1" },
      { band: "muddle", align: "any", era: 1, text: "muddle1" },
      { band: "ascent", align: "any", era: 1, text: "ascent1" },
      { band: "ascent", align: "left", era: 2, text: "ascent-left2" },
      { band: "ascent", align: "any", era: 3, text: "ascent3" },
    ],
  };
}
