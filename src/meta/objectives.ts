import { MANDATES } from "../engine/mandates";
import { BLOC_KEYS } from "../engine/types";
import type { MetaState, Objective } from "./types";

/** Bands a finished run has exited in, read back off the epilogue keys it collected. */
function bandsSeen(meta: MetaState): Set<string> {
  return new Set(meta.epilogues.map((k) => k.split(":")[0]!));
}

/** True when some band has been reached from both sides, whatever the era. */
function bandSeenBothWays(meta: MetaState): boolean {
  const sides = new Map<string, Set<string>>();
  for (const key of meta.epilogues) {
    const [band, align] = key.split(":");
    if (!band || !align || align === "any") continue;
    const set = sides.get(band) ?? new Set<string>();
    set.add(align);
    sides.set(band, set);
  }
  return [...sides.values()].some((s) => s.has("left") && s.has("right"));
}

/**
 * Run objectives (5.10). Each is checked once, against the finished run and the meta state
 * that already includes it. Anything an objective needs from a run lives in
 * `GameState.stats`, so no replay is required.
 *
 * Ordered by roughly when a competent player reaches them, because the codex renders them
 * in this order and should read as a ladder. The five that grant unlocks are spaced along
 * it on purpose: measured against a competent bot they land on runs 2, 6, 8, 10 and 10,
 * where they used to land on 1, 2, 2, 8 and never (BACKLOG item 9). No unlock may sit on an
 * objective that consistent good play cannot finish.
 */
export const OBJECTIVES: readonly Objective[] = [
  {
    id: "obj_first_run",
    title: "Take office, leave office",
    hint: "Finish a run, any run.",
    check: ({ run }) => !!run?.over,
  },
  {
    id: "obj_plotline",
    title: "An eventful century",
    hint: "Enter five story arcs in one run.",
    check: ({ run }) => (run?.stats.arcsEntered ?? 0) >= 5,
  },
  {
    id: "obj_finale",
    title: "Outlast yourself",
    hint: "Survive every era to the finale.",
    check: ({ run }) => !!run?.over?.endingId.startsWith("finale_"),
  },
  {
    id: "obj_honest_election",
    /* Was "Won without counting twice", which the check does not test: it fires on one
       honest win regardless of how many were arranged. A run that cheated twice and won
       once honestly earned a title saying the opposite of what the new end-of-run record
       says on the same screen (BACKLOG-3 phase 27). */
    title: "A clean win",
    hint: "Win an election honestly.",
    unlocks: "u_dissident",
    check: ({ run }) => (run?.stats.electionsHonest ?? 0) >= 1,
  },
  {
    id: "obj_reach_ascent",
    title: "Pointed the other way",
    hint: "End a run with the country on the Ascent.",
    check: ({ band }) => band === "ascent",
  },
  {
    id: "obj_both_sides",
    title: "Both roads",
    hint: "Finish a run for each side.",
    check: ({ meta }) => meta.alignsPlayed.includes("left") && meta.alignsPlayed.includes("right"),
  },
  {
    id: "obj_broad_coalition",
    title: "Nobody left out",
    hint: "Finish a run with all three blocs above 60.",
    check: ({ run }) => !!run?.over && BLOC_KEYS.every((b) => run.meters[b] >= 60),
  },
  {
    id: "obj_both_futures",
    title: "Two countries",
    hint: "Reach the same ending band once for each side.",
    check: ({ meta }) => bandSeenBothWays(meta),
  },
  {
    id: "obj_decay_finale",
    title: "Under its own weight",
    hint: "Ride it all the way down to the Decay finale.",
    check: ({ run }) => run?.over?.endingId === "finale_decay",
  },
  {
    id: "obj_all_bands",
    title: "Every way it can go",
    hint: "End runs in Decay, in Muddle and on the Ascent.",
    unlocks: "u_truth",
    check: ({ meta }) => {
      const bands = bandsSeen(meta);
      return bands.has("decay") && bands.has("muddle") && bands.has("ascent");
    },
  },
  {
    id: "obj_three_honest",
    title: "Three clean votes",
    hint: "Survive three elections without cheating once.",
    unlocks: "u_referendum",
    check: ({ run }) => (run?.stats.electionsHonest ?? 0) >= 3 && (run?.stats.electionsCheated ?? 0) === 0,
  },
  {
    id: "obj_orbit_clean",
    title: "Orbit, honestly",
    hint: "Reach the Ascent finale without cheating a single election.",
    unlocks: "u_engineer",
    check: ({ run }) => run?.over?.endingId === "finale_ascent" && run.stats.electionsCheated === 0,
  },
  {
    id: "obj_ten_runs",
    title: "Ten administrations",
    hint: "Finish ten runs.",
    unlocks: "u_survivor",
    check: ({ meta }) => meta.runs >= 10,
  },
  {
    id: "obj_five_endings",
    title: "Five ways out",
    hint: "Discover five different endings.",
    check: ({ meta }) => Object.keys(meta.endings).length >= 5,
  },
  {
    id: "obj_clearout",
    title: "New blood",
    hint: "Fire three advisors in one run.",
    check: ({ run }) => (run?.stats.advisorsFired ?? 0) >= 3,
  },
  {
    id: "obj_ten_endings",
    title: "Collector",
    hint: "Discover ten different endings.",
    check: ({ meta }) => Object.keys(meta.endings).length >= 10,
  },
  {
    id: "obj_stepped_down",
    title: "Handed it over",
    hint: "Leave office on time, to someone competent.",
    check: ({ run }) => run?.over?.endingId === "stepped_down",
  },
  {
    id: "obj_saint",
    title: "Not once",
    hint: "Finish a run of twenty cards or more without taking a single self-serving choice.",
    check: ({ run }) => !!run?.over && run.stats.tempting === 0 && run.cardCount >= 20,
  },
  // Mandates sit at the end because they are the only objectives the player chooses to
  // attempt rather than happens into. None of them grants an unlock: a mandate is opt-in,
  // so content behind one would be content a player who never takes a promise can never
  // see, which is the rule above in reverse.
  //
  // They do not rescue `obj_saint` above, and a fifth mandate for it was measured and not
  // shipped: asking for no self-serving choice at all is keepable 2.5% of the time even
  // by a run trying its hardest, because the deck reliably reaches a card where the honest
  // side ends the run. That objective is hard for a reason, not for want of being asked.
  {
    id: "obj_mandate_kept",
    title: "Kept your word",
    hint: "Finish a run under a mandate without breaking it.",
    check: ({ run }) => !!run?.over && !!run.mandate && run.mandateBrokenAt === null,
  },
  {
    id: "obj_mandate_finale",
    title: "A whole term, as promised",
    hint: "Reach a finale with a mandate still intact.",
    check: ({ run }) => !!run?.over?.endingId.startsWith("finale_") && !!run.mandate && run.mandateBrokenAt === null,
  },
  {
    id: "obj_mandate_all",
    title: "Four promises",
    hint: "Keep every one of the four mandates at least once.",
    check: ({ meta }) => MANDATES.every((m) => (meta.mandatesKept[m.id] ?? 0) > 0),
  },
];

export const OBJECTIVES_BY_ID: ReadonlyMap<string, Objective> = new Map(OBJECTIVES.map((o) => [o.id, o]));

/** Every unlock token any objective can grant. */
export function allUnlockTokens(): string[] {
  return [...new Set(OBJECTIVES.flatMap((o) => (o.unlocks ? [o.unlocks] : [])))].sort();
}
