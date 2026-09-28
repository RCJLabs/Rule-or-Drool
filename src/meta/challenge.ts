import type { Library } from "../engine/library";
import { playSides } from "../engine/replay";
import { exitBand } from "../engine/state";
import type { Band, GameState, Side } from "../engine/types";
import { ALL_HISTORY_KEYS, historyOfRun } from "./histories";
import { setupOf, type RunCode } from "./runcode";

/**
 * How a run someone sent went (BACKLOG-5 phase 37). A shared link started the sender's run and
 * said nothing about how it went, though two people given the same run almost never end it the
 * same way: over 1,000 codes, the mixed and greedy bots earned different history names 98% of
 * the time.
 *
 * The result rides beside the run code in the link (`?run=…&vs=…`), not inside it. The code
 * stays what a run started from, which the playtest record and the replay both key on, and a
 * version of the game from before this still opens the link as a run someone sent and leaves
 * the rest alone, where a new code format would have been a broken link to it.
 *
 * `1.seawall~ascent~left.finale_ascent.2x.g5Zk…` is the format version, what history called the
 * run, how it ended, how many cards it took, and the side taken on every one of them, a bit
 * each. The sides are what bring the run back: the deal decides which card comes, so the
 * receiver's game plays the same sides and draws the sender's world from the run itself.
 */
export interface RunResult {
  /** What history called the run, as a history key; null if this version has no such name. */
  history: string | null;
  /** How it ended, as an ending id; null if this version has no such ending. */
  ending: string | null;
  cards: number;
  /** The side taken on each card, in order; null when the run kept no record of them. */
  sides: Side[] | null;
  /**
   * The deck their run was dealt from, when the link said (BACKLOG-8 phase 49). It rides in
   * the link beside the result, `&deck=…`, not in it, so the result's format is unchanged.
   */
  deck?: string;
}

const VERSION = "1";
const NONE = "-";

/** What a finished run amounts to, for a link; null for a run still going. */
export function resultOf(lib: Library, state: GameState): RunResult | null {
  if (!state.over) return null;
  const sides = state.choices && state.choices.length === state.cardCount ? state.choices.map(([, side]) => side) : null;
  return { history: historyOfRun(lib, state, exitBand(lib, state)).key, ending: state.over.endingId, cards: state.cardCount, sides };
}

export function encodeRunResult(r: RunResult): string {
  return [VERSION, r.history ? r.history.replaceAll(":", "~") : NONE, r.ending ?? NONE, r.cards.toString(36), r.sides ? packSides(r.sides) : NONE].join(".");
}

/**
 * Read a result back, or null if it is not one. A history or an ending this version does not
 * have is kept as unknown rather than refusing the whole result: it still says how far they got.
 */
export function decodeRunResult(lib: Library, raw: string): RunResult | null {
  const parts = raw.trim().split(".");
  if (parts.length !== 5 || parts[0] !== VERSION) return null;
  const [, h, e, n36, s] = parts as [string, string, string, string, string];
  const cards = /^[0-9a-z]{1,3}$/.test(n36) ? parseInt(n36, 36) : NaN;
  // As long as the longest run there is: a long reign's result is up to five eras of cards.
  const most = Math.max(lib.config.eraCount, lib.config.longEraCount) * lib.config.eraLength;
  if (!Number.isInteger(cards) || cards < 1 || cards > most) return null;
  const key = h === NONE ? null : h.replaceAll("~", ":");
  const sides = s === NONE ? null : unpackSides(s, cards);
  if (s !== NONE && !sides) return null;
  return {
    history: key && ALL_HISTORY_KEYS.includes(key) ? key : null,
    ending: e !== NONE && lib.endings.has(e) ? e : null,
    cards,
    sides,
  };
}

/**
 * Their run, dealt again from the code and played with their sides, when it ends where they say
 * it ended: on the same card, the same ending and the same history. A run played on a version
 * of the game that deals differently does not, and comes back as null. The result still says
 * what they got; there is only no run to draw it from.
 */
export function theirRun(lib: Library, code: RunCode, result: RunResult): GameState | null {
  if (!result.sides || result.sides.length !== result.cards || !result.ending) return null;
  // playSides only hands back a run that ends on its last side, so the card count is theirs.
  const run = playSides(lib, code.seed, setupOf(code), result.sides);
  if (!run?.over || run.over.endingId !== result.ending) return null;
  if (result.history && historyOfRun(lib, run, exitBand(lib, run)).key !== result.history) return null;
  return run;
}

/** The direction a history key names, when it names one. */
export function bandOfHistory(key: string | null): Band | null {
  const band = key?.split(":")[1];
  return band === "decay" || band === "muddle" || band === "ascent" ? band : null;
}

/** A side a bit, first card in the top bit of the first byte, in base64url. */
function packSides(sides: readonly Side[]): string {
  const bytes = new Uint8Array(Math.ceil(sides.length / 8));
  sides.forEach((side, i) => {
    if (side === "right") bytes[i >> 3]! |= 0x80 >> (i & 7);
  });
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unpackSides(text: string, n: number): Side[] | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  if (bytes.length !== Math.ceil(n / 8)) return null;
  return Array.from({ length: n }, (_, i) => ((bytes[i >> 3]! & (0x80 >> (i & 7))) !== 0 ? "right" : "left"));
}

/**
 * A card both runs met, and how each answered it (BACKLOG-14 phase 89): the run someone sent,
 * dealt again from its sides, card by card beside the receiver's own. One deal per seed makes
 * three in four of one run's cards the other's too.
 */
export interface Alongside {
  /** The card's place in this run's record, from 0: it was card k + 1. */
  k: number;
  cardId: string;
  mine: Side;
  theirs: Side;
}

/** A run's answers by card, in the order it met each: a card can come round twice. */
function answersByCard(run: GameState): Map<string, Side[]> {
  const out = new Map<string, Side[]>();
  for (const [id, side] of run.choices ?? []) out.set(id, [...(out.get(id) ?? []), side]);
  return out;
}

/**
 * Every card this run met that theirs met too, each time this run met it beside the same time
 * theirs did, with both answers, in this run's order. A card they never met, or met fewer times,
 * is left out.
 */
export function alongside(mine: GameState, theirs: GameState): Alongside[] {
  const them = answersByCard(theirs);
  const times = new Map<string, number>();
  const out: Alongside[] = [];
  (mine.choices ?? []).forEach(([cardId, side], k) => {
    const n = times.get(cardId) ?? 0;
    times.set(cardId, n + 1);
    const theirSide = them.get(cardId)?.[n];
    if (theirSide) out.push({ k, cardId, mine: side, theirs: theirSide });
  });
  return out;
}

/** The card this run answered last, beside how they answered it, when they met it too. */
export function lastAlongside(mine: GameState, theirs: GameState): Alongside | null {
  const record = mine.choices;
  if (!record?.length) return null;
  const k = record.length - 1;
  const [cardId, side] = record[k]!;
  const n = record.slice(0, k).filter(([id]) => id === cardId).length;
  const theirSide = (theirs.choices ?? []).filter(([id]) => id === cardId)[n]?.[1];
  return theirSide ? { k, cardId, mine: side, theirs: theirSide } : null;
}
