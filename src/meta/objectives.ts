import type { Objective } from "./types";

/**
 * Run objectives (5.10). Each is checked once, against the finished run and the meta state
 * that already includes it. Anything an objective needs from a run lives in
 * `GameState.stats`, so no replay is required.
 */
export const OBJECTIVES: readonly Objective[] = [
  {
    id: "obj_first_run",
    title: "Take office, leave office",
    hint: "Finish a run, any run.",
    check: ({ run }) => !!run?.over,
  },
  {
    id: "obj_honest_election",
    title: "Won without counting twice",
    hint: "Win an election honestly.",
    unlocks: "u_dissident",
    check: ({ run }) => (run?.stats.electionsHonest ?? 0) >= 1,
  },
  {
    id: "obj_three_honest",
    title: "Three clean votes",
    hint: "Survive three elections without cheating once.",
    unlocks: "u_referendum",
    check: ({ run }) => (run?.stats.electionsHonest ?? 0) >= 3 && (run?.stats.electionsCheated ?? 0) === 0,
  },
  {
    id: "obj_reach_ascent",
    title: "Pointed the other way",
    hint: "End a run with the country on the Ascent.",
    unlocks: "u_engineer",
    check: ({ band }) => band === "ascent",
  },
  {
    id: "obj_finale",
    title: "Outlast yourself",
    hint: "Survive every era to the finale.",
    unlocks: "u_survivor",
    check: ({ run }) => !!run?.over?.endingId.startsWith("finale_"),
  },
  {
    id: "obj_orbit_clean",
    title: "Orbit, honestly",
    hint: "Reach the Ascent finale without cheating a single election.",
    check: ({ run }) => run?.over?.endingId === "finale_ascent" && run.stats.electionsCheated === 0,
  },
  {
    id: "obj_saint",
    title: "Not once",
    hint: "Finish a run of twenty cards or more without taking a single self-serving choice.",
    check: ({ run }) => !!run?.over && run.stats.tempting === 0 && run.cardCount >= 20,
  },
  {
    id: "obj_decay_finale",
    title: "Under its own weight",
    hint: "Ride it all the way down to the Decay finale.",
    check: ({ run }) => run?.over?.endingId === "finale_decay",
  },
  {
    id: "obj_clearout",
    title: "New blood",
    hint: "Fire three advisors in one run.",
    check: ({ run }) => (run?.stats.advisorsFired ?? 0) >= 3,
  },
  {
    id: "obj_plotline",
    title: "An eventful century",
    hint: "Enter five story arcs in one run.",
    check: ({ run }) => (run?.stats.arcsEntered ?? 0) >= 5,
  },
  {
    id: "obj_stepped_down",
    title: "Handed it over",
    hint: "Leave office on time, to someone competent.",
    check: ({ run }) => run?.over?.endingId === "stepped_down",
  },
  {
    id: "obj_both_sides",
    title: "Both roads",
    hint: "Finish a run for each side.",
    check: ({ meta }) => meta.alignsPlayed.includes("left") && meta.alignsPlayed.includes("right"),
  },
  {
    id: "obj_ten_endings",
    title: "Collector",
    hint: "Discover ten different endings.",
    unlocks: "u_truth",
    check: ({ meta }) => Object.keys(meta.endings).length >= 10,
  },
];

export const OBJECTIVES_BY_ID: ReadonlyMap<string, Objective> = new Map(OBJECTIVES.map((o) => [o.id, o]));

/** Every unlock token any objective can grant. */
export function allUnlockTokens(): string[] {
  return [...new Set(OBJECTIVES.flatMap((o) => (o.unlocks ? [o.unlocks] : [])))].sort();
}
