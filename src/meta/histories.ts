import data from "../content/histories.json";
import type { Band, GameState, PlayerAlign } from "../engine/types";
import { LEGACIES } from "./legacies";

/**
 * What history calls a run (post-run histories).
 *
 * The game had 23 endings, and measured over 200 players of 40 runs each a competent player
 * saw a median of 3 of them in twenty runs: 97% of competent runs survive to a finale, and
 * the other twenty endings are ways of failing (BACKLOG-3 phase 26). More failure endings
 * would not have changed that. So a history is not a way the run stopped; it is what the run
 * *did*, and every run gets one, including the ones that win.
 *
 * A history is keyed by the run's defining decision, where the country ended up, and which
 * side held the office: 33 decisions x 3 directions x 2 sides = 198 named histories, every
 * title written rather than assembled. The defining decision is the first legacy in `order`
 * that the run carries — ranked by how much history it makes, because three legacies are
 * carried by 95-99% of runs and a naive pick would give almost everyone the same name.
 * Measured over 6,000 competent runs, no single decision defines more than 15% of them.
 */
export interface HistoryText {
  titles: Record<Band, Record<PlayerAlign, string>>;
  /** What became of the decision, by where the country ended up. */
  after: Record<Band, string>;
}

interface HistoryFile {
  order: string[];
  histories: Record<string, HistoryText>;
}

const FILE = data as HistoryFile;

/** The fallback for a run that left no legacy at all: 0.5% of random runs, 0% of others. */
export const NO_LEGACY = "none";
export const HISTORY_ORDER: readonly string[] = FILE.order;
export const HISTORIES: Readonly<Record<string, HistoryText>> = FILE.histories;
const BANDS: readonly Band[] = ["decay", "muddle", "ascent"];
const SIDES: readonly PlayerAlign[] = ["left", "right"];

/** Every history key there is, which is the codex's denominator. */
export const ALL_HISTORY_KEYS: readonly string[] = Object.keys(HISTORIES).flatMap((sig) =>
  BANDS.flatMap((band) => SIDES.map((side) => historyKey(sig, band, side))),
);

export function historyKey(signature: string, band: Band, align: PlayerAlign): string {
  return `${signature}:${band}:${align}`;
}

export interface Consequence {
  flag: string;
  /** The legacy as the country names it. */
  label: string;
  /** What became of it, in the direction the country went. */
  after: string;
  /** The card after which it was done, where the run knows. */
  at: number | null;
}

export interface History {
  key: string;
  /** The defining legacy, or NO_LEGACY. */
  signature: string;
  title: string;
  /** What became of the decisions that shaped the run, most history-making first. */
  consequences: Consequence[];
}

/** How many of a run's decisions the end screen follows up on. */
export const CONSEQUENCES_SHOWN = 4;

export function historyOf(state: GameState, band: Band): History {
  const carried = HISTORY_ORDER.filter((f) => state.flags.includes(f) && HISTORIES[f]);
  const signature = carried[0] ?? NO_LEGACY;
  const text = HISTORIES[signature]!;
  const consequences: Consequence[] = carried.slice(0, CONSEQUENCES_SHOWN).map((f) => ({
    flag: f,
    label: LEGACIES[f] ?? f,
    after: HISTORIES[f]!.after[band],
    at: state.flagSince?.[f] ?? null,
  }));
  if (consequences.length === 0) consequences.push({ flag: NO_LEGACY, label: "", after: text.after[band], at: null });
  return { key: historyKey(signature, band, state.align), signature, title: text.titles[band][state.align], consequences };
}

/** The title a key names, for the codex. */
export function historyTitle(key: string): string | null {
  const [sig, band, side] = key.split(":") as [string, Band, PlayerAlign];
  return HISTORIES[sig]?.titles[band]?.[side] ?? null;
}
