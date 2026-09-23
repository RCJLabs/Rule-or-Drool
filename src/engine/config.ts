import type { Band, EraRule, MeterKey } from "./types";

/**
 * Tunable engine constants. Starting values come from TRANSFER.md; anything marked
 * "added" is a knob the spec did not name. Override per Library via buildLibrary().
 */
export interface EngineConfig {
  /** Eras in the ordinary game (5.3 shipped three). The last era is the finale. */
  eraCount: number;
  /**
   * Eras in the long reign, the rest of the five that 5.3 describes: two centuries on and five
   * centuries on (BACKLOG-5 phase 39). A run has one count or the other, chosen at setup.
   */
  longEraCount: number;
  /** Cards per era (5.3 says 30–40). */
  eraLength: number;
  /** Cards between elections (5.4 says ~25). */
  electionInterval: number;
  /** An honest election is lost when the average of the three blocs falls below this (5.4). */
  electionMoodThreshold: number;
  /** Role whose advisor is the rival, drawn from the side the player did not pick. */
  rivalRole: string;
  /** Where the rival's standing starts, on 0-100. */
  rivalStart: number;
  /** Standing the rival gains from an election you cheated, and loses from one you won clean. */
  rivalCheatGain: number;
  rivalHonestLoss: number;
  /**
   * How much of your distance from the middle the rival converts into standing. They are
   * whoever you are not: a reformer while you rot, a demagogue while you ascend (5.9), so
   * it is the size of your drift that feeds them, not its direction.
   */
  rivalDriftPull: number;
  /** Each point of pressure above rivalStart raises the vote you need by this much. */
  rivalElectionPull: number;
  /** Lose a vote with the rival at or above this standing and it is their win, by name. */
  rivalWinsAt: number;
  /** Coup risk added per point of rival pressure above rivalStart, once the ballot is gone. */
  rivalCoupPerPoint: number;
  /** Ending when the rival takes the office from you, at the ballot or without one. */
  rivalEnding: string;
  /** Ending used when an honest election is lost and the card names none. */
  electionLossEnding: string;
  /** Flag that replaces elections with the coup-risk check (5.4). */
  electionsAbolishedFlag: string;
  /**
   * Drift lost each time the slot where an election would have been passes without one.
   * Abolishing the vote takes away the cheating that the deck charges drift for, so
   * without this a run that abolishes them early reads as the honest one (phase 16).
   */
  decreeDriftPull: number;
  /** Coup risk per check = coupBase + coupPerPoint * (shortfall of Order + Institutions below 50). Added. */
  coupBase: number;
  coupPerPoint: number;
  /**
   * A coup needs an institution left to mount it. Below this much Institutions there is
   * nobody organised enough to take over, which is what separates a coup from anarchy
   * (BACKLOG-2 phase 13).
   */
  coupNeedsInst: number;
  coupEnding: string;
  /** drift <= decayAt is decay, >= ascentAt is ascent (5.2). */
  bandDecayAt: number;
  bandAscentAt: number;
  /**
   * Band is locked when advancing past this era (5.2: "after era 3"). An ordinary run ends
   * in a finale rather than advancing past era 3, so only a long reign reaches it: its last
   * two eras are lived in the direction the first three set (BACKLOG-5 phase 39).
   */
  bandLockAfterEra: number;
  /** Meter effect multiplier per band (5.2). */
  volatility: Record<Band, number>;
  /**
   * Advisor traits scale the meter effects of cards their own role speaks (5.8). `gain`
   * scales effects that help, `loss` scales effects that hurt. Traits multiply together.
   */
  traitEffects: Record<string, { gain: number; loss: number }>;
  /**
   * The band a run opens in. It matters beyond the first card: the band only recomputes at
   * an era boundary, so for the whole of era 1 this *is* the band, and a card restricted to
   * era 1 in any other band can never be drawn (BACKLOG-3 phase 20).
   */
  startBand: Band;
  /** Run start sets `${advisorFlagPrefix}${trait}` for every trait sitting in the cabinet. */
  advisorFlagPrefix: string;
  /**
   * Flags that count how often a kind of choice has been made, rather than naming a thing
   * that happened. A card gated on one is here because of a pattern (BACKLOG-2 phase 14),
   * which is how the draw tells a habit apart from an ordinary card (phase 19).
   */
  habitMarkPrefix: string;
  /** How many recently drawn ids are ineligible (7). */
  cooldownSize: number;
  /**
   * Weight multiplier for cards that match the player's side, so a left run leans on left
   * content instead of drawing the shared deck at the same rate (BACKLOG item 2). 1 disables.
   */
  alignAffinity: number;
  /**
   * The same idea for bands: a card written for one band is drawn more readily while you
   * are in it, so Decay and Ascent look like different games (BACKLOG item 8). 1 disables.
   */
  bandAffinity: number;
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
  /** One entry per era, indexed from era 1. Missing or empty means the baseline rules. */
  eraRules: EraRule[];
  meterStart: number;
  /** After run-setup modifiers, meters are clamped here so no run opens in the danger zone. */
  meterStartMin: number;
  meterStartMax: number;
  /** Ending id prefix for surviving the last era: `${finalePrefix}${band}`. */
  finalePrefix: string;
  /**
   * The same for a long reign, which has finales of its own: five centuries on is a different
   * place to arrive at (BACKLOG-5 phase 39). Starts with `finalePrefix`, so it is a finale.
   */
  longFinalePrefix: string;
  /**
   * Ending ids for meter extremes. Blocs only end a run at the bottom: a bloc at zero has
   * abandoned you. There is no per-bloc ceiling, because adoration is only a problem when
   * every bloc shares it (see cultAt).
   */
  meterEndings: Record<MeterKey, { low: string; high?: string }>;
  /** Every bloc at or above this is a personality cult: nobody left to disagree with you. */
  cultAt: number;
  cultEnding: string;
}

export const DEFAULT_CONFIG: EngineConfig = {
  eraCount: 3,
  longEraCount: 5,
  eraLength: 35,
  electionInterval: 25,
  electionMoodThreshold: 40,
  rivalRole: "rival",
  rivalStart: 30,
  rivalCheatGain: 9,
  rivalHonestLoss: 6,
  rivalDriftPull: 0.35,
  rivalElectionPull: 0.06,
  rivalWinsAt: 60,
  rivalCoupPerPoint: 0.006,
  rivalEnding: "rival_wins",
  electionLossEnding: "election_loss",
  electionsAbolishedFlag: "elections_abolished",
  decreeDriftPull: 16,
  coupBase: 0.05,
  coupPerPoint: 0.01,
  coupNeedsInst: 12,
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
  startBand: "muddle",
  advisorFlagPrefix: "advisor_",
  habitMarkPrefix: "mark_",
  cooldownSize: 30,
  alignAffinity: 2,
  bandAffinity: 3,
  arcContinueProb: 0.5,
  /**
   * Lowered with the arc-budget fix (BACKLOG-3 phase 26). The budget used to count finished
   * arcs, which capped a run at about five arcs by accident; counting only running ones
   * freed the slots and took a run to 14, which is a different game and cost 6 points of
   * Ascent. At 0.075 a run enters 6.3 arcs against the 5.0 it always had, the arcs gated to
   * era 2 or 3 are no longer locked out by era-1 arcs that already ended, and every section 8
   * target passes at 20,000 runs. Ascent passes narrowly at 15.1% against a 15% floor, down
   * from 15.8%: about one standard error of headroom, which is the price of the fix.
   */
  arcEntryProb: 0.075,
  arcBudgetMin: 4,
  arcBudgetMax: 6,
  eraMeterPull: 0.22,
  eraRules: [
    // Era 1 is the honeymoon: the rules are just the rules.
    {},
    // Era 2, the machines. The state gets richer and the people do not, which walks you
    // toward oligarchy at one end and riots at the other without a single card to blame.
    { passive: { money: 1, public: -1 }, passiveEvery: 6 },
    // Era 3, the long shadow. The machinery is thin, so everything lands harder, and the
    // bills you deferred arrive sooner than the delay you were quoted.
    { passive: { inst: -1 }, passiveEvery: 8, volatility: 1.15, queueScale: 0.6 },
    // Era 4, two centuries on, only in a long reign. Nobody remembers your name, and nobody
    // owes your party anything: its base and its backers drift away unless they are won again.
    { passive: { base: -1, backers: -1 }, passiveEvery: 6 },
    // Era 5, five centuries on. This is where it was always going: the direction the country
    // took is the whole of what happens to it. In Decay it comes apart on its own and takes
    // everything harder; in Muddle the public's patience runs down; on the Ascent it absorbs
    // almost anything and keeps adding to the state, which has its own way of ending you.
    {
      passiveEvery: 5,
      bandPassive: { decay: { order: -1, inst: -1 }, muddle: { public: -1 }, ascent: { inst: 1 } },
      bandVolatility: { decay: 1.3, ascent: 0.8 },
    },
  ],
  meterStart: 50,
  meterStartMin: 25,
  meterStartMax: 75,
  finalePrefix: "finale_",
  longFinalePrefix: "finale_long_",
  meterEndings: {
    base: { low: "abandoned_base" },
    backers: { low: "abandoned_backers" },
    public: { low: "riots" },
    money: { low: "bankruptcy", high: "oligarchy" },
    order: { low: "anarchy", high: "police_state" },
    inst: { low: "state_collapse", high: "paralysis" },
  },
  cultAt: 92,
  cultEnding: "personality_cult",
};
