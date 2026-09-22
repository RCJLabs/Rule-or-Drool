import { DEFAULT_CONFIG } from "../../src/engine/config";
import type { Card, Content } from "../../src/engine/types";
import { engineEndings, type RuleOptions } from "../../src/validate/rules";

const bands = ["decay", "muddle", "ascent"] as const;

/** A compact content set the validator accepts with zero issues under VALID_OPTIONS. */
export const VALID_OPTIONS: Partial<RuleOptions> = { minCell: 2, minSetupPool: 1, eras: [1], unlockTokens: [] };

export function makeValid(): Content {
  const base = { eras: [1], bands: [...bands] };
  const cards: Card[] = [
    {
      id: "ev_a",
      type: "event",
      align: "any",
      ...base,
      speaker: "chief",
      text: "A.",
      left: { label: "Up", fx: { mood: 3 }, drift: -2 },
      right: { label: "Down", fx: { mood: -3 }, drift: 2 },
    },
    {
      id: "ev_b",
      type: "event",
      align: "left",
      ...base,
      speaker: "chief",
      text: "B.",
      left: { label: "Grease", fx: { money: 2 }, drift: -1, setFlags: ["greased"] },
      right: { label: "Refuse", fx: { money: -3 }, drift: 2 },
    },
    {
      id: "ev_c",
      type: "event",
      align: "right",
      ...base,
      speaker: "general",
      text: "C.",
      cond: { notFlags: ["charming"] },
      left: { label: "Crack down", fx: { order: 2 }, drift: -1, enqueue: [{ id: "q_a", delay: 3 }] },
      right: { label: "Talk", fx: { order: -2 }, drift: 2 },
    },
    {
      id: "q_a",
      type: "event",
      align: "any",
      ...base,
      speaker: "chief",
      text: "Q.",
      weight: 0,
      cond: { flags: ["greased"] },
      left: { label: "Hide it", fx: { inst: -2 }, drift: -1, clearFlags: ["greased"] },
      right: { label: "Own it", fx: { inst: 1 }, drift: 1 },
    },
    {
      id: "el_a",
      type: "election",
      align: "any",
      ...base,
      speaker: "chief",
      text: "E.",
      left: { label: "Honest", honest: true, fx: { mood: 1 }, drift: 2 },
      right: { label: "Rig", fx: { inst: -4 }, drift: -20, setFlags: ["cheated"] },
    },
    {
      id: "el_b",
      type: "election",
      align: "any",
      ...base,
      speaker: "chief",
      text: "E2.",
      cond: { flags: ["cheated"] },
      left: { label: "Abolish", fx: { inst: -8 }, drift: -25, setFlags: ["elections_abolished"] },
      right: { label: "Honest", honest: true, fx: { inst: 2 }, drift: 3 },
    },
    {
      id: "arc_a1",
      type: "arc",
      arc: "arc_a",
      step: 1,
      align: "any",
      ...base,
      speaker: "general",
      text: "Arc 1.",
      left: { label: "Go on", fx: { order: 2 }, drift: -3, next: "arc_a2" },
      right: { label: "Refuse", fx: { order: -2 }, drift: 2 },
    },
    {
      id: "arc_a2",
      type: "arc",
      arc: "arc_a",
      step: 2,
      align: "any",
      ...base,
      speaker: "general",
      text: "Arc 2.",
      left: { label: "Seize it", fx: { order: 4 }, drift: -5, ending: "ending_a" },
      right: { label: "Step back", fx: { order: -3 }, drift: 3 },
    },
  ];
  return {
    cards,
    arcs: [{ id: "arc_a", align: "any", entry: { eras: [1], bands: [...bands] }, weight: 1, cards: ["arc_a1", "arc_a2"] }],
    advisors: [
      { id: "c1", role: "chief", name: "Chief", traits: ["loyal"] },
      { id: "g1", role: "general", name: "General", traits: ["zealot"] },
    ],
    // One of each kind, because run setup draws one of each and valid content must be able
    // to open a run for either side (BACKLOG item 4).
    modifiers: [
      { id: "mod_a", kind: "trait", meterStart: { base: 5, public: -5 }, flags: ["charming"], arcWeights: { arc_a: 2 } },
      { id: "mod_crisis_a", kind: "crisis", meterStart: { money: -6 } },
      { id: "mod_flaw_a", kind: "flaw", meterStart: { order: 4, inst: -4 } },
    ],
    endings: [...engineEndings(DEFAULT_CONFIG), "ending_a"].map((id) => ({ id, title: id, text: id })),
    epilogues: bands.map((band) => ({ band, align: "any" as const, era: 1, text: `${band}.` })),
  };
}

export function card(content: Content, id: string): Card {
  const c = content.cards.find((x) => x.id === id);
  if (!c) throw new Error(`fixture has no card ${id}`);
  return c;
}
