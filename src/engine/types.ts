/**
 * Engine types. Mirrors TRANSFER.md section 6 with a few documented additions:
 *
 *  - Choice.honest      election cards only: marks the honest side (section 5.4).
 *  - Choice.electionDelay election cards only: cheat options that postpone the vote
 *                       can shorten the interval before the next election.
 *  - Card.weight === 0  the card is never drawn from the random pool; it can only
 *                       arrive via a queue (enqueue), an arc (next) or an election slot.
 *  - GameState.current  the card on the table (drawn, not yet resolved).
 *  - GameState.arcBudget how many arcs this run may start (rolled from seed).
 *
 * Everything here is plain JSON-serializable data.
 */

export type Align = "left" | "right" | "any";
export type PlayerAlign = "left" | "right";
export type Band = "decay" | "muddle" | "ascent";
/**
 * The coalition blocs that replaced a single Mood meter (BACKLOG item 5). The three slots
 * are the same for both sides; what differs is who they are and what they want, which is
 * content. Display names live in strings.ts.
 */
export type BlocKey = "base" | "backers" | "public";
/** Meters that belong to the state rather than to people. */
export type CoreMeterKey = "money" | "order" | "inst";
export type MeterKey = BlocKey | CoreMeterKey;
export type Side = "left" | "right";
export type CardType = "event" | "arc" | "election" | "ending";

export const BLOC_KEYS: readonly BlocKey[] = ["base", "backers", "public"];
export const CORE_KEYS: readonly CoreMeterKey[] = ["money", "order", "inst"];
export const METER_KEYS: readonly MeterKey[] = [...BLOC_KEYS, ...CORE_KEYS];
export const BANDS: readonly Band[] = ["decay", "muddle", "ascent"];
export const ALIGNS: readonly Align[] = ["left", "right", "any"];
export const PLAYER_ALIGNS: readonly PlayerAlign[] = ["left", "right"];
export const CARD_TYPES: readonly CardType[] = ["event", "arc", "election", "ending"];

export type Meters = Record<MeterKey, number>;

/**
 * Meter effects. `mood` is a shorthand meaning "the public moves as one": it applies to all
 * three blocs. A card may use both, to say everyone disliked this and one bloc especially.
 */
export type FxSpec = Partial<Record<MeterKey, number>> & { mood?: number };
/** Conditions may also read `mood`, which is the average of the three blocs. */
export type CondMeterKey = MeterKey | "mood";

export interface MeterCond {
  lt?: number;
  gt?: number;
}

export interface Cond {
  /** All of these flags must be set. */
  flags?: string[];
  /** None of these flags may be set. */
  notFlags?: string[];
  /** Strict comparisons against current meter values, or against `mood` (the bloc average). */
  meters?: Partial<Record<CondMeterKey, MeterCond>>;
}

export interface Enqueue {
  id: string;
  /** Delay in cards. 1 = the very next draw. */
  delay: number;
}

export interface Choice {
  label: string;
  fx?: FxSpec;
  drift?: number;
  setFlags?: string[];
  clearFlags?: string[];
  enqueue?: Enqueue[];
  /** Arc branching: id of the next arc card. Omit to exit the arc. */
  next?: string;
  /**
   * Arc branching that differs by side, so a shared arc can tell a different story to each
   * alignment (BACKLOG item 2). Takes precedence over `next` for the matching side.
   */
  nextByAlign?: Partial<Record<PlayerAlign, string>>;
  /** Ending id if this choice ends the run. On an election card's honest side the
   *  ending applies only when the vote is lost (mood below the threshold). */
  ending?: string;
  /** Election cards only. Exactly one side should be honest. */
  honest?: boolean;
  /** Election cards only. Overrides the interval until the next election. */
  electionDelay?: number;
  /** Replace the advisor holding this card's speaker role (5.8). Applied by resolve, not preview. */
  fireSpeaker?: boolean;
}

export interface Card {
  id: string;
  type: CardType;
  align: Align;
  eras: number[];
  bands: Band[];
  /** Role id, resolved to an advisor through the cabinet at runtime. */
  speaker: string;
  text: string;
  cond?: Cond;
  /** Draw weight, default 1. 0 means queue/arc/election only. */
  weight?: number;
  oneShot?: boolean;
  arc?: string;
  step?: number;
  left: Choice;
  right: Choice;
}

export interface Arc {
  id: string;
  align: Align;
  /** Unlock id required before this arc can start (5.10). */
  requires?: string;
  entry: Cond & { eras: number[]; bands: Band[] };
  weight: number;
  /** Card ids; the first is the entry card. */
  cards: string[];
}

export interface Advisor {
  id: string;
  role: string;
  name: string;
  traits: string[];
}

export interface Modifier {
  id: string;
  kind: "trait" | "flaw" | "crisis";
  /** Unlock id required before this modifier can be drawn at run setup (5.10). */
  requires?: string;
  meterStart?: FxSpec;
  flags?: string[];
  arcWeights?: Record<string, number>;
}

export interface Ending {
  id: string;
  title: string;
  text: string;
}

export interface Epilogue {
  band: Band;
  align: Align;
  era: number;
  text: string;
}

export interface Content {
  cards: Card[];
  arcs: Arc[];
  advisors: Advisor[];
  modifiers: Modifier[];
  endings: Ending[];
  epilogues: Epilogue[];
}

export interface QueueItem {
  id: string;
  /** Card count at which the card becomes due. */
  dueAt: number;
}

export interface ActiveArc {
  id: string;
  /** Next card to play, or null once the arc has exited. */
  nextCard: string | null;
}

export interface RunOver {
  endingId: string;
  epilogueKey: string;
}

/**
 * Counters a run accumulates, so meta-progression objectives can ask questions like
 * "did you ever cheat an election" without replaying the run (5.10).
 */
export interface RunStats {
  /** Choices taken with negative drift. */
  tempting: number;
  /** Choices taken with positive drift. */
  honest: number;
  /** Choices with no drift either way. */
  neutral: number;
  electionsHonest: number;
  electionsCheated: number;
  advisorsFired: number;
  arcsEntered: number;
}

export const EMPTY_STATS: RunStats = {
  tempting: 0,
  honest: 0,
  neutral: 0,
  electionsHonest: 0,
  electionsCheated: 0,
  advisorsFired: 0,
  arcsEntered: 0,
};

export interface GameState {
  seed: number;
  rngState: number;
  align: PlayerAlign;
  era: number;
  cardCount: number;
  meters: Meters;
  drift: number;
  band: Band;
  bandLocked: boolean;
  flags: string[];
  queue: QueueItem[];
  seen: string[];
  cooldown: string[];
  activeArcs: ActiveArc[];
  cabinet: Record<string, string>;
  modifiers: string[];
  nextElectionAt: number;
  over: RunOver | null;
  /** Card on the table, or null between draws. */
  current: string | null;
  arcBudget: number;
  stats: RunStats;
  /** Meta unlock ids in force for this run; gates modifiers and arcs that name a `requires`. */
  unlocked: string[];
}

export interface RunSetup {
  align: PlayerAlign;
  modifiers?: string[];
  /** Unlock ids the player has earned; omitted means only always-available content. */
  unlocked?: string[];
}

/** Advisor traits the engine knows about (5.8). */
export const TRAITS = ["loyal", "corrupt", "competent", "zealot"] as const;
export type Trait = (typeof TRAITS)[number];
