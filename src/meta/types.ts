import type { Band, GameState, PlayerAlign } from "../engine/types";

/**
 * Meta progression (TRANSFER.md 5.10). Stored separately from run state and versioned
 * separately, per the house conventions in section 12.
 */
export interface MetaState {
  v: number;
  /** Runs finished, ever. */
  runs: number;
  /** Ending id -> how many times it has ended a run. */
  endings: Record<string, number>;
  /** Epilogue keys (`band:align:era`) seen. */
  epilogues: string[];
  /** Objective id -> the run number on which it was first completed. */
  objectives: Record<string, number>;
  /** Unlock tokens earned; gates modifiers and arcs that name a `requires`. */
  unlocks: string[];
  /** Longest run in cards. */
  bestCards: number;
  alignsPlayed: PlayerAlign[];
  /**
   * The history half of the codex (BACKLOG item 10). Endings reward dying in creative ways;
   * these reward playing a story out, keeping a cabinet, and leaving something behind.
   */
  /** Arc outcomes reached, as `${cardId}:${side}`: which branch of a story you have seen. */
  arcOutcomes: string[];
  /** Legacy flag -> how many runs ended with the country still carrying it. */
  legacies: Record<string, number>;
  /**
   * History key (`decision:band:side`) -> how many runs history has called that
   * (post-run histories). The collectible a run gets for what it did, not how it stopped.
   */
  histories: Record<string, number>;
  /** Advisor id -> runs they served to the end. */
  advisorsKept: Record<string, number>;
  /** Advisor id -> times you let them go. */
  advisorsFired: Record<string, number>;
  /** Mandate id -> runs finished with that promise still intact (BACKLOG-2 phase 16). */
  mandatesKept: Record<string, number>;
  /** Mandate id -> runs that took it on and broke it. */
  mandatesBroken: Record<string, number>;
  /** The last few runs, newest first. */
  history: RunRecord[];
  /**
   * Every run the profile finishes, oldest first, as the country's history (BACKLOG-12 phase 76):
   * the last thousand kept. `history` above keeps the last twelve as they ended, for the line of
   * reigns to take over from; this keeps what the codex tells of each.
   */
  chronicle: ChronicleEntry[];
  /**
   * Endings the player has come within reach of but not reached. The codex names these
   * rather than hiding them, so an undiscovered ending is a target rather than a blank
   * (BACKLOG-2 phase 13).
   */
  nearMissed: string[];
  /**
   * Every ending the codex has given a clue to, in the order they were given (BACKLOG-11 phase
   * 71). It showed one a run and kept none, so a clue read once could be seventy runs from
   * coming back.
   */
  heard: string[];
  /**
   * Every daily played to its end, oldest first and one a day (BACKLOG-5 phase 38). The
   * profile used to keep only the latest, which left nothing to come back for tomorrow.
   */
  dailies: DailyEntry[];
  /**
   * The weekly contracts kept, by week, oldest first (BACKLOG-10 phase 60). Only weeks with one
   * kept are here; the week's contracts themselves are dealt again from its number.
   */
  contracts: ContractWeek[];
  /**
   * The week's scenario, by week, oldest first (BACKLOG-12 phase 78): each week's one try, from the
   * moment it was started, and how it went once it ended.
   */
  scenarios: ScenarioTry[];
  /**
   * The ending the player is going looking for, from a rumour the codex gave (BACKLOG-13 phase
   * 83); absent when they are looking for none. Held until it is found or they stop.
   */
  pursuing?: string;
}

/** A week's contracts kept, by id. */
export interface ContractWeek {
  week: number;
  kept: string[];
}

/** One line of the history: enough to recognise the run, not enough to replay it. */
export interface RunRecord {
  align: PlayerAlign;
  cards: number;
  era: number;
  endingId: string;
  band: Band;
  /** The rival you faced, by advisor id. */
  rival: string | null;
  /** Legacy flags the country was left with. */
  legacies: string[];
  /** What history called the run, as a history key; null for runs recorded before histories. */
  history: string | null;
  /**
   * The promises the run was taken on, in the catalog's order, and whether each survived the
   * run: none, one, or two since BACKLOG-10 phase 62.
   */
  mandates: PromiseRecord[];
  /** A second road: the run taken again from one of its decisions (BACKLOG-5 phase 34). */
  road?: true;
  /**
   * Which reign of its line the run was: absent for a fresh start, which is the first of one,
   * and 2 on for a run that took over from the one before (BACKLOG-10 phase 63).
   */
  line?: number;
  /** The rival's standing at the end, which the next reign of the line starts halfway back from. */
  rivalStanding?: number;
}

/**
 * One reign in the chronicle: about 300 bytes, so a thousand of them are about 320 KB of profile
 * and a 36 KB code to move it (BACKLOG-12 phase 76).
 */
export interface ChronicleEntry {
  /** Which of the profile's runs it was: the first it ever finished is 1. */
  n: number;
  align: PlayerAlign;
  cards: number;
  /** The eras it was dealt, where not the ordinary game's three: a first or short term's one, a long reign's five. */
  eras?: number;
  endingId: string;
  band: Band;
  /** What history called it, as a history key. */
  history: string | null;
  /** The rival it faced, by advisor id. */
  rival: string | null;
  /** The legacies it ended with and did not take over: what this reign left. */
  left: string[];
  mandates: PromiseRecord[];
  /**
   * The votes held while the office was its own: left to the count, of those lost at the count,
   * and counted twice. Absent for a reign from before the chronicle, which the profile kept
   * without them.
   */
  votes?: { honest: number; lost: number; cheated: number };
  /** Which reign of its line, from the second on (BACKLOG-10 phase 63). */
  line?: number;
  /** A second road (BACKLOG-5 phase 34). */
  road?: true;
  /**
   * The crisis the reign took on when it was offered two, and the one it passed over (BACKLOG-13
   * phase 84). Absent for a reign that was offered no pick, or kept before there was one.
   */
  crisis?: { chose: string; over: string };
}

/**
 * A week's scenario, tried (BACKLOG-12 phase 78). Starting it is the try: one left for another run
 * stays here with no result, and the week is not offered again.
 */
export interface ScenarioTry {
  week: number;
  /** How it went, once it ended; absent while it is under way or after it was left. */
  result?: ScenarioResult;
}

export interface ScenarioResult {
  /** The run met the week's goal. */
  met: boolean;
  cards: number;
  ending: string;
  /** What history called the run, as a history key. */
  history: string;
}

export interface PromiseRecord {
  id: string;
  kept: boolean;
}

/** One day's daily, as the log keeps it: about 100 bytes, so a year of them is under 40 KB. */
export interface DailyEntry {
  /** UTC day, `YYYY-MM-DD`: the day the daily was dealt, which is not always the day it ended. */
  day: string;
  /** What history called the run, as a history key; null for the one a v5 profile kept. */
  history: string | null;
  ending: string;
  cards: number;
  /** The deck the day's run was dealt from (BACKLOG-8 phase 49); absent before stamps. */
  deck?: string;
}

export interface ObjectiveContext {
  /** The finished run, or null when objectives are evaluated outside a run. */
  run: GameState | null;
  /** Meta state with this run already folded in. */
  meta: MetaState;
  /** Exit band of the finished run. */
  band: Band | null;
}

export interface Objective {
  id: string;
  title: string;
  hint: string;
  /** Unlock token granted the first time this is completed. */
  unlocks?: string;
  /**
   * A way to play that completing this opens, as distinct from content it unlocks (BACKLOG-5
   * phase 39). An unlock token rides in every run's code; this changes no run it is not
   * chosen for, so it stays out of them.
   */
  opens?: typeof LONG_REIGN;
  check: (ctx: ObjectiveContext) => boolean;
}

/** What the first finale opens: a run of five eras rather than three (BACKLOG-5 phase 39). */
export const LONG_REIGN = "long_reign";
