import type { FxSpec, GameState, MeterKey } from "./types";
import { BLOC_KEYS } from "./types";
import { EASY_CAMPAIGN_FLAG } from "./campaign";
import { RIVAL_POACHED_FLAG } from "./rival";

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
  /**
   * A name short enough to share a line with another in the run, where a platform's two would
   * otherwise take two lines off the card on a small phone (BACKLOG-10 phase 62).
   */
  short: string;
  /** What you said to get the job, in the country's hearing. */
  promise: string;
  /** What it will take, said plainly, because a promise you do not understand is a trap. */
  cost: string;
  /** Flags the run starts with, for a mandate that changes the run rather than only its rules. */
  startFlags?: string[];
  /** What saying it cost before the first card was drawn. */
  meterStart?: FxSpec;
  /**
   * Meters it promises to keep at or above a line, for a promise that is a floor. A run taken on
   * it starts at the line at least, so no floor is broken before the first card (BACKLOG-10
   * phase 62), and the meters draw the line while it holds.
   */
  floor?: { meters: readonly MeterKey[]; at: number };
  /** The card that arrives once it is broken. */
  brokeCard: string;
  /** For a promise never to do something: the flags that doing it sets, any of which breaks it. */
  neverFlags?: readonly string[];
  /** True once this run has broken it. Read after every card; never un-broken. */
  isBroken: (state: GameState) => boolean;
}

/** A bloc under this has stopped being part of the coalition you promised to govern for. */
export const MANDATE_BLOC_FLOOR = 40;

/** Under this, the treasury has spent what was set aside (BACKLOG-10 phase 62). */
export const MANDATE_RESERVE_FLOOR = 30;

/** Broken once any of a floor's meters is under its line. */
function under(floor: NonNullable<Mandate["floor"]>) {
  return (s: GameState) => floor.meters.some((k) => s.meters[k] < floor.at);
}

/** A promise never to set these flags, broken by the first of them set (BACKLOG-10 phase 62). */
function never(...flags: string[]) {
  return (s: GameState) => flags.some((f) => s.flags.includes(f));
}

const BROAD_FLOOR = { meters: BLOC_KEYS, at: MANDATE_BLOC_FLOOR } as const;
const RESERVE_FLOOR = { meters: ["money"], at: MANDATE_RESERVE_FLOOR } as const;

export const MANDATES: readonly Mandate[] = [
  {
    id: "m_clean",
    title: "Every vote counted once",
    short: "Clean count",
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
    short: "Nobody under 40",
    promise: "You said you would govern for all three of them, not for whichever one shouts.",
    cost: "Let any part of the coalition fall below forty and the promise is gone.",
    brokeCard: "mn_broad_broke",
    floor: BROAD_FLOOR,
    isBroken: under(BROAD_FLOOR),
  },
  {
    id: "m_loyal",
    title: "The people I came in with",
    short: "The same cabinet",
    promise: "You said this cabinet would be the cabinet that turned the lights off.",
    cost: "Let one of them go, for any reason, and the promise is gone.",
    brokeCard: "mn_loyal_broke",
    // Letting one go to the rival is letting them go (BACKLOG-10 phase 65).
    isBroken: (s) => s.stats.advisorsFired > 0 || s.flags.includes(RIVAL_POACHED_FLAG),
  },
  {
    // The one that changes the run rather than only its rules: no elections to lose, and a
    // coup check in their place from the first card. Restoring the vote breaks it.
    id: "m_decree",
    title: "There will be no more votes",
    short: "No more votes",
    promise: "You suspended them on the first morning and said it was for the duration.",
    cost: "Starts with the institutions and the public against you. Hold a vote again and the promise is gone.",
    startFlags: ["elections_abolished"],
    meterStart: { inst: -14, public: -8, base: 6 },
    brokeCard: "mn_decree_broke",
    isBroken: (s) => !s.flags.includes("elections_abolished"),
  },
  // Five more, so a run can stand on two (BACKLOG-10 phase 62). Each is broken by something the
  // screen shows: a meter under a line it draws, or a choice whose words say what it does. The
  // habits a card marks (skim, bend, clamp) were measured and left out, because the side that
  // sets one does not say so; so were a floor for the institutions, which starts under any line
  // that would bite in two runs of five, and one for order, which a crackdown keeps best.
  {
    id: "m_reserve",
    title: "Something set aside",
    short: "Something aside",
    promise: "You said there would always be something in the treasury, and pointed at the rain.",
    cost: "Let the treasury fall below thirty, for anything at all, and the promise is gone.",
    brokeCard: "mn_reserve_broke",
    floor: RESERVE_FLOOR,
    isBroken: under(RESERVE_FLOOR),
  },
  {
    id: "m_press",
    title: "The papers print what they like",
    short: "A free press",
    promise: "You said it to a room of editors, and one of them took it down in shorthand.",
    cost: "Put a paper, a licence or the feed in friendly hands, by any route, and the promise is gone.",
    brokeCard: "mn_press_broke",
    neverFlags: ["media_captured", "feed_captured"],
    isBroken: never("media_captured", "feed_captured"),
  },
  {
    id: "m_hands",
    title: "Not a coin for us",
    short: "Not a coin",
    promise: "You turned out your pockets on the treasury steps, and the cameras got the lint.",
    cost: "Take the money once, or bury an audit that found some, and the promise is gone.",
    brokeCard: "mn_hands_broke",
    neverFlags: ["took_the_skim", "buried_the_audit"],
    isBroken: never("took_the_skim", "buried_the_audit"),
  },
  {
    id: "m_fair",
    title: "A clean fight",
    short: "A clean fight",
    promise: "You said you would beat the other side on the record, and never on a rumour.",
    cost: "Smear, scare or buy your way through a single campaign, and the promise is gone.",
    brokeCard: "mn_fair_broke",
    // A campaign's easy side breaks it as the cost says, not only the cards that make a habit of
    // the cheap win: until BACKLOG-11 phase 66 it was kept through every easy campaign.
    neverFlags: ["dirty_politics", EASY_CAMPAIGN_FLAG],
    isBroken: never("dirty_politics", EASY_CAMPAIGN_FLAG),
  },
  {
    id: "m_barracks",
    title: "The army stays in its barracks",
    short: "Army in barracks",
    promise: "You said the army's only job was the border. The generals applauded, which was the worrying part.",
    cost: "Let the general handle anyone at home, or open a register of the disloyal, and the promise is gone.",
    brokeCard: "mn_barracks_broke",
    neverFlags: ["general_unleashed", "purge_begun"],
    isBroken: never("general_unleashed", "purge_begun"),
  },
];

export const MANDATES_BY_ID: ReadonlyMap<string, Mandate> = new Map(MANDATES.map((m) => [m.id, m]));

/** The most promises a run can be taken on: a platform of two (BACKLOG-10 phase 62). */
export const PLATFORM_SIZE = 2;

/**
 * Promises that cannot be made together. Every vote counted once and no more votes is one promise
 * kept by the other, not two; so is a clean fight with no campaign to fight (measured: a clean
 * fight under the decree was kept exactly as often as the decree alone). And the price of no
 * more votes puts the public under forty in a large share of runs, which would break nobody
 * under forty before the first card.
 */
export const INCOMPATIBLE: readonly (readonly [string, string])[] = [
  ["m_clean", "m_decree"],
  ["m_fair", "m_decree"],
  ["m_broad", "m_decree"],
];

/** Whether two promises can stand on one platform. */
export function compatible(a: string, b: string): boolean {
  return a !== b && !INCOMPATIBLE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Every platform of two a run can be taken on, each in the catalog's order. */
export const PLATFORMS: readonly (readonly [string, string])[] = MANDATES.flatMap((a, i) =>
  MANDATES.slice(i + 1)
    .filter((b) => compatible(a.id, b.id))
    .map((b) => [a.id, b.id] as const),
);

/**
 * A run's promises in the catalog's order, whatever order they were picked in, so that one
 * platform is one run and one run code (BACKLOG-10 phase 62). Unknown ids are left out.
 */
export function inCatalogOrder(ids: readonly string[]): string[] {
  return MANDATES.filter((m) => ids.includes(m.id)).map((m) => m.id);
}

/** What is wrong with a run's promises, or null: at most two, each known, none twice, and able to stand together. */
export function platformProblem(ids: readonly string[]): string | null {
  if (ids.length > PLATFORM_SIZE) return `a run is taken on at most ${PLATFORM_SIZE} promises, not ${ids.length}`;
  const unknown = ids.find((id) => !MANDATES_BY_ID.has(id));
  if (unknown) return `unknown mandate id: ${unknown}`;
  if (new Set(ids).size < ids.length) return `a promise is made once: ${ids.join(", ")}`;
  if (ids.length === 2 && !compatible(ids[0]!, ids[1]!)) return `${ids[0]} and ${ids[1]} cannot be promised together`;
  return null;
}

/**
 * The promises a country's standing flags already break, so none of them can be made in it: a
 * run that took over a press answering to the office cannot promise to keep it free (BACKLOG-10
 * phase 63).
 */
export function brokenByFlags(flags: readonly string[]): string[] {
  return MANDATES.filter((m) => m.neverFlags?.some((f) => flags.includes(f))).map((m) => m.id);
}

/** Whether a run still holds this promise: it was made, and it has not been broken. */
export function holds(state: Pick<GameState, "mandates" | "mandatesBroken">, id: string): boolean {
  return state.mandates.includes(id) && !(id in state.mandatesBroken);
}

/** Whether a run made at least one promise and has broken none: its word, kept so far. */
export function wordKept(state: Pick<GameState, "mandates" | "mandatesBroken">): boolean {
  return state.mandates.length > 0 && state.mandates.every((id) => !(id in state.mandatesBroken));
}

/** The line each meter is promised above, by the floors a run still holds; a meter under none is absent. */
export function heldFloors(state: Pick<GameState, "mandates" | "mandatesBroken">): Partial<Record<MeterKey, number>> {
  const lines: Partial<Record<MeterKey, number>> = {};
  for (const id of state.mandates) {
    const floor = MANDATES_BY_ID.get(id)?.floor;
    if (!floor || id in state.mandatesBroken) continue;
    for (const k of floor.meters) lines[k] = Math.max(lines[k] ?? 0, floor.at);
  }
  return lines;
}

/** The flag a run carries once its promise is broken, so the deck can say so. */
export const BROKE_MANDATE_FLAG = "broke_mandate";

/** `mandate_m_loyal` and the like: which promise this run is under, for cards to read. */
export const MANDATE_FLAG_PREFIX = "mandate_";

/**
 * `mandate_m_loyal_broken` and the like: which promise is broken, for a card that tempts a run to
 * break one of two to stop once that one is gone and not the other (BACKLOG-10 phase 62).
 */
export function brokenFlag(id: string): string {
  return `${MANDATE_FLAG_PREFIX}${id}_broken`;
}
