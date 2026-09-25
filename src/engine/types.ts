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
export type CondMeterKey = MeterKey | "mood" | "rival" | "drift" | "tenure";

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
  /**
   * Every one of these traits must belong to whoever speaks the card. `advisor_corrupt` is
   * true when anyone in the room is corrupt, so a card written about a crooked treasurer and
   * gated on it would accuse an honest one whenever the crook sat elsewhere (BACKLOG-5
   * phase 35). An arc entry reads it against the speaker of the arc's first card.
   */
  speakerTraits?: string[];
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
  /**
   * How much this choice hands your rival, on their 0-100 standing. Positive helps them.
   * Most movement is automatic (they campaign on whatever you just did); this is for
   * choices that are specifically about them.
   */
  rival?: number;
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
  /**
   * The speaker goes over to the rival (BACKLOG-10 phase 65): their seat is dealt someone new
   * from its pool, as a firing is, but it is not a firing. It is letting them go, though, so it
   * breaks a promise to keep the cabinet. Applied by resolve, not preview.
   */
  poach?: boolean;
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
  /**
   * Dealt only while the run is out of office (BACKLOG-10 phase 55): an event card from the
   * opposition deck, or an election card that is the return vote at the era's end.
   */
  opposition?: boolean;
  /**
   * Dealt only as one of the cards before a vote in office (BACKLOG-10 phase 56): a choice of
   * how to campaign, honestly or not, with the count as it stands on the card.
   */
  campaign?: boolean;
  /**
   * The cabinet seat this card fills (BACKLOG-10 phase 61): the first card of each era after the
   * first, on which the player appoints one of the two people the seat's pool holds besides its
   * holder. The left side appoints the first by id, the right side the second.
   */
  appoints?: string;
  /**
   * An election the rival stands in by name (BACKLOG-10 phase 65). Dealt whenever a vote comes
   * with the rival high enough that losing it would be their win, and never otherwise. Since
   * they replace every other vote then, they are written in the numbers and weights of the votes
   * they replace: five for each side, as its plain votes are, and the rigged count, the
   * emergency, the abolition and the scapegoat any side can be offered. Without the last four,
   * the top rung was the one place a run was never offered the way out of a vote, and long
   * reigns got safer.
   */
  rivalStands?: boolean;
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
  /**
   * Set on a question: a policy the country argues about, asked plainly (BACKLOG-6 phase 40).
   * The id is the question's, shared by each side's arc for it, since each side asks it in
   * its own voice. A question is drawn from a budget of its own rather than the stories',
   * and its first card carries no drift: the answer decides who is pleased and who pays,
   * and only how it is carried out decides where the country goes.
   */
  question?: string;
}

export interface Advisor {
  id: string;
  role: string;
  name: string;
  traits: string[];
  /**
   * Which side this person belongs to. Cabinet roles leave it off and serve anyone; the
   * rival sets it, and run setup hands you the one from the side you did not pick
   * (BACKLOG item 7).
   */
  align?: PlayerAlign;
}

export interface Modifier {
  id: string;
  kind: "trait" | "flaw" | "crisis";
  /**
   * Which side can draw this at run setup. Unset means either: a recession does not care
   * who you are. Set it for the traits and flaws that only make sense on one side
   * (BACKLOG item 4).
   */
  align?: PlayerAlign;
  /** Unlock id required before this modifier can be drawn at run setup (5.10). */
  requires?: string;
  meterStart?: FxSpec;
  flags?: string[];
  arcWeights?: Record<string, number>;
  /**
   * Eras whose rules this modifier changes, on top of the era's own (BACKLOG-5 phase 35). A
   * crisis you inherit can outlast you: the grid nobody fixed is still failing twenty years
   * on.
   */
  bends?: EraBend[];
}

/**
 * What changes about the game itself in a given era, as opposed to which cards are eligible
 * (BACKLOG item 8). Era 1 is the baseline and carries no rule of its own.
 */
export interface EraRule {
  /** Meter deltas applied every `passiveEvery` cards, with no card to blame for them. */
  passive?: FxSpec;
  passiveEvery?: number;
  /** Multiplier on top of band volatility: above 1 and everything lands harder. */
  volatility?: number;
  /**
   * A further multiplier for the band the run is in, so an era can pull the bands further
   * apart: five centuries on, a country in Decay takes everything harder and one on the
   * Ascent takes it softer (BACKLOG-5 phase 39).
   */
  bandVolatility?: Partial<Record<Band, number>>;
  /**
   * Standing pressure for the band the run is in, on the same beat as `passive`: five
   * centuries on, a country in Decay comes apart on its own and one on the Ascent keeps
   * adding to itself (BACKLOG-5 phase 39).
   */
  bandPassive?: Partial<Record<Band, FxSpec>>;
  /** Multiplies enqueue delays. Below 1 and the bill comes due sooner than it used to. */
  queueScale?: number;
}

/**
 * An era rule a modifier adds. It is added to the era's own rather than replacing it: its
 * standing pressure runs on its own beat beside the era's, and its multipliers multiply.
 */
export interface EraBend extends EraRule {
  era: number;
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
  /** Who you let go, in order, so the codex can be a history rather than a count (item 10). */
  firedAdvisors: string[];
  /**
   * Which arcs you saw the end of, as `${cardId}:${side}` — the choice that left the arc.
   * An arc has several of these and they are the real collectible: they reward playing a
   * story out rather than dying in a new way.
   */
  arcOutcomes: string[];
}

export const EMPTY_STATS: RunStats = {
  tempting: 0,
  honest: 0,
  neutral: 0,
  electionsHonest: 0,
  electionsCheated: 0,
  advisorsFired: 0,
  arcsEntered: 0,
  firedAdvisors: [],
  arcOutcomes: [],
};

export interface GameState {
  seed: number;
  rngState: number;
  align: PlayerAlign;
  era: number;
  /**
   * How many eras this run has: the ordinary three, or five for a long reign (BACKLOG-5
   * phase 39). The run ends in a finale when it outlasts the last of them.
   */
  eraCount: number;
  cardCount: number;
  meters: Meters;
  drift: number;
  /**
   * The frame's look, -3 to 3, as the player has been shown it (BACKLOG-7 phase 45). It
   * follows drift into a look at once and out of one only past a margin, so it depends on
   * where drift has been, not just where it is. Nothing in the engine reads it.
   */
  look: number;
  band: Band;
  bandLocked: boolean;
  flags: string[];
  queue: QueueItem[];
  seen: string[];
  cooldown: string[];
  activeArcs: ActiveArc[];
  cabinet: Record<string, string>;
  /**
   * Role -> the card count at which whoever holds it took the job. Tenure is the only way
   * to tell a advisor you chose to keep from one you have never thought about
   * (BACKLOG-2 phase 12).
   */
  cabinetSince: Record<string, number>;
  /** The rival's standing, 0-100. They lead the side you did not pick (5.9, item 7). */
  rivalStanding: number;
  modifiers: string[];
  nextElectionAt: number;
  over: RunOver | null;
  /** Card on the table, or null between draws. */
  current: string | null;
  /**
   * Why that card is on the table (BACKLOG-3 phase 19). The draw order already knows and
   * used to throw the answer away, leaving everything downstream to guess from
   * `weight === 0`. Measured over 309,076 cards that guess was wrong exactly zero times —
   * but only because every arc card happens to be weight 1 and every weight-0 card happens
   * to be queued. It is a convention, not a rule, and it cannot express the thing this
   * phase needs at all: a habit card is weight 4 and drawn from the pool like any other.
   */
  currentFrom: CardSource | null;
  arcBudget: number;
  stats: RunStats;
  /** Meta unlock ids in force for this run; gates modifiers and arcs that name a `requires`. */
  unlocked: string[];
  /**
   * The promises this run was taken on, in the catalog's order: none, one (BACKLOG-2 phase 16),
   * or two, a platform (BACKLOG-10 phase 62).
   */
  mandates: string[];
  /** Each promise broken, and the card count it was broken at. A promise not here still holds. */
  mandatesBroken: Record<string, number>;
  /**
   * Flag -> the card count after which it was first set; 0 for anything the run started
   * with. The end of a run tells the player *when* they did the things that defined it, not
   * only that they did them, and a flag is the only record a decision leaves
   * (post-run histories). Recorded once: a flag cleared and set again keeps its first date.
   */
  flagSince: Record<string, number>;
  /**
   * Every choice the run has made, as the card and the side taken, in order (BACKLOG-5
   * phase 34). The same seed and the same choices deal the same run, so this is enough to
   * put any card of it back on the table. Null for a run saved before choices were kept,
   * whose early choices are not known.
   */
  choices: ChoiceMade[] | null;
  /** Set on a second road: the run it branched from, finished, and the card it went back to. */
  road: Road | null;
  /**
   * The stamp of the deck the run was dealt from (BACKLOG-8 phase 49). Unset for a run saved
   * before stamps, and for one continued on another deck, since no one deck dealt it.
   */
  deck?: string;
  /** Out of office since losing an honest vote, or null while in it (BACKLOG-10 phase 55). */
  opposition: Opposition | null;
  /** What the run took over from the last one, or null for a fresh start (BACKLOG-10 phase 63). */
  inherited: Inheritance | null;
}

/**
 * The country a run takes over from the one before it (BACKLOG-10 phase 63): the way the
 * last reign leaned, a legacy or two still in force, and the rival who remembers it. The
 * engine takes the legacies as flags; which flags a country can hand on is the profile's to say.
 */
export interface Inheritance {
  /** The band the last reign ended in, which sets the lean this one starts with. */
  band: Band;
  /** Which reign of its line this is: 2 for the first to take over, and so on. */
  line: number;
  /** In force from the first card, and counted as the last reign's, not this one's. */
  legacies: string[];
  /** The last reign's rival, who takes the seat again, or null to deal one as a fresh run does. */
  rival: string | null;
  /** Where the rival's standing starts. */
  rivalStanding: number;
}

/**
 * A run out of office (BACKLOG-10 phase 55). The first honest vote a run loses does not end
 * it: the rival takes the office, and the run plays the opposition until the era ends.
 */
export interface Opposition {
  /** Cards played when the office went, the lost vote included. */
  since: number;
  /**
   * The card count at which the return vote is dealt: the era's last card. Null when there is
   * none, in the run's last era, which ends with the run still out.
   */
  returnAt: number | null;
}

/** One choice made: the card, and the side taken on it. */
export type ChoiceMade = [card: string, side: Side];

/**
 * Where a second road left the first (phase 34): the first road as it ended, and the index
 * of the card on which this one chose the other side.
 */
export interface Road {
  first: GameState;
  at: number;
}

/**
 * How a card reached the table. `habit` is a pool draw like `deck`, told apart because the
 * card is gated on counting marks: it is not here because of one choice, it is here because
 * of a pattern of them, which is a different thing to say to the player.
 */
export const CARD_SOURCES = ["deck", "habit", "queue", "arc", "election", "opposition", "campaign", "appointment", "handover"] as const;
export type CardSource = (typeof CARD_SOURCES)[number];

export interface RunSetup {
  align: PlayerAlign;
  modifiers?: string[];
  /** Unlock ids the player has earned; omitted means only always-available content. */
  unlocked?: string[];
  /** The promises the player took the job on, one or two (phase 16; BACKLOG-10 phase 62). */
  mandates?: readonly string[];
  /** One promise, the way a setup said it before a run could take two. Ignored beside `mandates`. */
  mandate?: string | null;
  /** Eras the run has; omitted means the ordinary game's (BACKLOG-5 phase 39). */
  eraCount?: number;
  /** The country taken over from the last run, for a run that is not a fresh start (BACKLOG-10 phase 63). */
  inheritance?: Inheritance | null;
}

/** Advisor traits the engine knows about (5.8). */
export const TRAITS = ["loyal", "corrupt", "competent", "zealot"] as const;
export type Trait = (typeof TRAITS)[number];
