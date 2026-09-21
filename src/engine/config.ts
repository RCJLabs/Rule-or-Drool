import type { Band } from "./types";

/**
 * Tunable engine constants. Starting values come from TRANSFER.md; anything marked
 * "added" is a knob the spec did not name. Override per Library via buildLibrary().
 */
export interface EngineConfig {
  /** Number of playable eras. MVP ships 3 (5.3). The last era is the finale. */
  eraCount: number;
  /** Cards per era (5.3 says 30–40). */
  eraLength: number;
  /** Cards between elections (5.4 says ~25). */
  electionInterval: number;
  /** Honest election below this Mood is a loss (5.4, start at 40). */
  electionMoodThreshold: number;
  /** Ending used when an honest election is lost and the card names none. */
  electionLossEnding: string;
  /** Flag that replaces elections with the coup-risk check (5.4). */
  electionsAbolishedFlag: string;
  /** Coup risk per check = coupBase + coupPerPoint * (shortfall of Order + Institutions below 50). Added. */
  coupBase: number;
  coupPerPoint: number;
  coupEnding: string;
  /** drift <= decayAt is decay, >= ascentAt is ascent (5.2). */
  bandDecayAt: number;
  bandAscentAt: number;
  /** Band is locked when advancing past this era (5.2: "after era 3"). */
  bandLockAfterEra: number;
  /** Meter effect multiplier per band (5.2). */
  volatility: Record<Band, number>;
  /**
   * Advisor traits scale the meter effects of cards their own role speaks (5.8). `gain`
   * scales effects that help, `loss` scales effects that hurt. Traits multiply together.
   */
  traitEffects: Record<string, { gain: number; loss: number }>;
  /** Run start sets `${advisorFlagPrefix}${trait}` for every trait sitting in the cabinet. */
  advisorFlagPrefix: string;
  /** How many recently drawn ids are ineligible (7). */
  cooldownSize: number;
  /** Chance per draw to continue an active arc (7, step 3). */
  arcContinueProb: number;
  /** Chance per draw to start a new arc when eligible and under budget. Added. */
  arcEntryProb: number;
  /** Arcs per run (5.7: 4–6). */
  arcBudgetMin: number;
  arcBudgetMax: number;
  /**
   * At an era boundary meters move this fraction of the way back to 50. Added; 0 disables.
   * This is the main dial between "random runs end too late" and "a careful player can
   * never reach Ascent": lower shortens runs, higher gives recovery room. See ROADMAP.
   */
  eraMeterPull: number;
  meterStart: number;
  /** After run-setup modifiers, meters are clamped here so no run opens in the danger zone. */
  meterStartMin: number;
  meterStartMax: number;
  /** Ending id prefix for surviving the last era: `${finalePrefix}${band}`. */
  finalePrefix: string;
  /** Ending ids for meter extremes. */
  meterEndings: {
    mood: { low: string; high: string };
    money: { low: string; high: string };
    order: { low: string; high: string };
    inst: { low: string; high: string };
  };
}

export const DEFAULT_CONFIG: EngineConfig = {
  eraCount: 3,
  eraLength: 35,
  electionInterval: 25,
  electionMoodThreshold: 40,
  electionLossEnding: "election_loss",
  electionsAbolishedFlag: "elections_abolished",
  coupBase: 0.05,
  coupPerPoint: 0.01,
  coupEnding: "coup",
  bandDecayAt: -25,
  bandAscentAt: 25,
  bandLockAfterEra: 3,
  volatility: { decay: 1.4, muddle: 1, ascent: 0.8 },
  traitEffects: {
    competent: { gain: 1.3, loss: 0.7 },
    loyal: { gain: 1, loss: 0.85 },
    zealot: { gain: 1.4, loss: 1.4 },
    corrupt: { gain: 1, loss: 1.35 },
  },
  advisorFlagPrefix: "advisor_",
  cooldownSize: 15,
  arcContinueProb: 0.5,
  arcEntryProb: 0.2,
  arcBudgetMin: 4,
  arcBudgetMax: 6,
  eraMeterPull: 0.65,
  meterStart: 50,
  meterStartMin: 25,
  meterStartMax: 75,
  finalePrefix: "finale_",
  meterEndings: {
    mood: { low: "riots", high: "personality_cult" },
    money: { low: "bankruptcy", high: "oligarchy" },
    order: { low: "anarchy", high: "police_state" },
    inst: { low: "state_collapse", high: "paralysis" },
  },
};
