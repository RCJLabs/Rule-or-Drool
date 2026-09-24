import type { Library } from "../engine/library";
import { exitBand } from "../engine/state";
import { METER_KEYS, type Band, type GameState, type MeterKey, type Meters, type Side } from "../engine/types";
import { encodeRunCode, runCodeOf } from "../meta/runcode";

/**
 * A record of how a person played (BACKLOG-5 phase 31). Every balance number so far comes
 * from bots that see the exact meters on both sides of every card; this is the first thing
 * that can say what a person does instead.
 *
 * It is kept only when the player turns it on, stays on the device, and leaves only when
 * they send it. What it holds is the run and nothing about the person: the run's code
 * (seed and setup), and for each card the side taken, how long it was in front of them,
 * how long each side's preview was up, and the meters either side of the choice. No
 * dates, no device, no settings — a setting can say more about a player than they meant
 * to send, the choice buttons most of all.
 */
export const RECORD_FORMAT = "rule-or-drool-playtest";
export const RECORD_VERSION = 1;

/** How a run began: a new one, today's daily, or from a code someone sent. */
export const RUN_KINDS = ["own", "daily", "shared"] as const;
export type RunKind = (typeof RUN_KINDS)[number];

/** What the clock in front of a card measured. */
export interface Measure {
  /** Milliseconds the card was in front of the player: the page showing, no menu over it. */
  ms: number;
  /** Milliseconds each side's preview was on screen, [left, right], within that. */
  looked: [number, number];
}

export interface TakenCard extends Measure {
  card: string;
  side: Side;
  /**
   * The hidden drift before the choice. The look the card was read in follows from the drifts
   * before it, since a look is left only past a margin (BACKLOG-7 phase 45).
   */
  drift: number;
  /** The meters before and after the choice, in the file's `meters` order. */
  before: number[];
  after: number[];
  /** The card was left (the menu, a reload) and came back, so `ms` counts from its return. */
  resumed?: true;
}

export interface RunEnd {
  ending: string;
  era: number;
  cards: number;
  band: Band;
}

export interface RecordedRun {
  /** The version of the game it was played on. */
  game: string;
  /**
   * The deck it was dealt from (BACKLOG-8 phase 49). The report rebuilds a run only on the deck
   * it names. Absent from records made before stamps, and for a run no one deck dealt.
   */
  deck?: string;
  /** The run code: seed and setup, enough for the report to replay the run with bots. */
  code: string;
  kind: RunKind;
  /** Which of this player's runs it was, counting those they finished: 1 is their first. */
  run: number;
  /** How it ended, or null for a run left for another before it did. */
  end: RunEnd | null;
  cards: TakenCard[];
}

export interface RecordFile {
  format: typeof RECORD_FORMAT;
  v: typeof RECORD_VERSION;
  /** The order of the six numbers in every `before` and `after`. */
  meters: MeterKey[];
  runs: RecordedRun[];
}

/** The six meters as whole numbers: the bars show nothing finer. */
export const meterList = (m: Meters): number[] => METER_KEYS.map((k) => Math.round(m[k]));

export function openRun(state: GameState, opts: { kind: RunKind; run: number; game: string }): RecordedRun {
  return { game: opts.game, ...(state.deck ? { deck: state.deck } : {}), code: encodeRunCode(runCodeOf(state)), kind: opts.kind, run: opts.run, end: null, cards: [] };
}

/** One choice, from the state it was made in and the state it left. */
export function takeCard(before: GameState, after: GameState, side: Side, measure: Measure, resumed = false): TakenCard {
  const card: TakenCard = {
    card: before.current ?? "",
    side,
    ms: Math.round(measure.ms),
    looked: [Math.round(measure.looked[0]), Math.round(measure.looked[1])],
    drift: Math.round(before.drift),
    before: meterList(before.meters),
    after: meterList(after.meters),
  };
  if (resumed) card.resumed = true;
  return card;
}

export function closeRun(lib: Library, run: RecordedRun, state: GameState): RecordedRun {
  if (!state.over) return run;
  return { ...run, end: { ending: state.over.endingId, era: state.era, cards: state.cardCount, band: exitBand(lib, state) } };
}

export function toFile(runs: readonly RecordedRun[]): RecordFile {
  return { format: RECORD_FORMAT, v: RECORD_VERSION, meters: [...METER_KEYS], runs: [...runs] };
}

/**
 * JSON, laid out to be read: one line per run and one per card, so a tester who opens the
 * file before sending it can see that it holds what the setting said and nothing else.
 */
export function serialize(file: RecordFile): string {
  const runs = file.runs.map((r) => {
    const { cards, ...head } = r;
    return `${JSON.stringify(head).slice(0, -1)},"cards":[\n${cards.map((c) => JSON.stringify(c)).join(",\n")}\n]}`;
  });
  return `{"format":${JSON.stringify(file.format)},"v":${file.v},"meters":${JSON.stringify(file.meters)},"runs":[\n${runs.join(",\n")}\n]}\n`;
}
