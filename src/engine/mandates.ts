import type { FxSpec, GameState } from "./types";
import { BLOC_KEYS } from "./types";

/**
 * A mandate is a promise made to get the job, chosen before the first card instead of
 * offered during the run (BACKLOG-2 phase 16). The engine already had promises — a card
 * offers one, a later card tempts you to break it, a third is about having broken it — and
 * a mandate is that same shape with the player, rather than the deck, deciding.
 *
 * Choosing one is not a difficulty slider. It narrows what you are allowed to do while the
 * run stays exactly as hard as it was, which is the only reason the objectives that reward
 * restraint are reachable at all: measured over 60 players of 40 runs each, `obj_saint`,
 * `obj_stepped_down` and `obj_ten_endings` were completed 0% of the time, because nothing
 * ever asked the player to try.
 */
export interface Mandate {
  id: string;
  /** What it is called, on the setup screen and in the run. */
  title: string;
  /** What you said to get the job, in the country's hearing. */
  promise: string;
  /** What it will take, said plainly, because a promise you do not understand is a trap. */
  cost: string;
  /** Flags the run starts with, for a mandate that changes the run rather than only its rules. */
  startFlags?: string[];
  /** What saying it cost before the first card was drawn. */
  meterStart?: FxSpec;
  /** The card that arrives once it is broken. */
  brokeCard: string;
  /** True once this run has broken it. Read after every card; never un-broken. */
  isBroken: (state: GameState) => boolean;
}

/** A bloc under this has stopped being part of the coalition you promised to govern for. */
export const MANDATE_BLOC_FLOOR = 40;

export const MANDATES: readonly Mandate[] = [
  {
    id: "m_clean",
    title: "Every vote counted once",
    promise: "You said it on a stage, twice, with the returning officer standing behind you.",
    cost: "Cheat a single election, or count anything you should not have, and the promise is gone.",
    brokeCard: "mn_clean_broke",
    // Not only the election cards: a count you fixed outside an election is the same
    // promise broken, and the deck is allowed to offer it that way.
    isBroken: (s) => s.stats.electionsCheated > 0 || s.flags.includes("counted_late_boxes"),
  },
  {
    id: "m_broad",
    title: "Nobody under forty",
    promise: "You said you would govern for all three of them, not for whichever one shouts.",
    cost: "Let any part of the coalition fall below forty and the promise is gone.",
    brokeCard: "mn_broad_broke",
    isBroken: (s) => BLOC_KEYS.some((b) => s.meters[b] < MANDATE_BLOC_FLOOR),
  },
  {
    id: "m_loyal",
    title: "The people I came in with",
    promise: "You said this cabinet would be the cabinet that turned the lights off.",
    cost: "Let one of them go, for any reason, and the promise is gone.",
    brokeCard: "mn_loyal_broke",
    isBroken: (s) => s.stats.advisorsFired > 0,
  },
  {
    // The one that changes the run rather than only its rules: no elections to lose, and a
    // coup check in their place from the first card. Restoring the vote breaks it.
    id: "m_decree",
    title: "There will be no more votes",
    promise: "You suspended them on the first morning and said it was for the duration.",
    cost: "Starts with the institutions and the public against you. Hold a vote again and the promise is gone.",
    startFlags: ["elections_abolished"],
    meterStart: { inst: -14, public: -8, base: 6 },
    brokeCard: "mn_decree_broke",
    isBroken: (s) => !s.flags.includes("elections_abolished"),
  },
];

export const MANDATES_BY_ID: ReadonlyMap<string, Mandate> = new Map(MANDATES.map((m) => [m.id, m]));

/** The flag a run carries once its promise is broken, so the deck can say so. */
export const BROKE_MANDATE_FLAG = "broke_mandate";

/** `mandate_m_loyal` and the like: which promise this run is under, for cards to read. */
export const MANDATE_FLAG_PREFIX = "mandate_";
