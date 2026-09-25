import { draw } from "../engine/draw";
import { getCard, type Library } from "../engine/library";
import { honestCount, resolve } from "../engine/resolve";
import { makeRng } from "../engine/rng";
import { newRun } from "../engine/state";
import type { Card, GameState, RunSetup, Side } from "../engine/types";
import { BLOC_KEYS, METER_KEYS } from "../engine/types";
import { decodeRunCode, setupOf } from "../meta/runcode";
import { BOTS, makeContext, nearAnEdge, type BotName } from "../sim/bots";
import { DEFAULT_RUN_OPTIONS, type RunOptions } from "../sim/run";
import { meterList, type RecordedRun } from "./record";

/**
 * A run walked card by card for what a record does not say outright (BACKLOG-7 phase 46):
 * the look each card was read in, and for every vote whether an honest one would have won.
 * A person's run is rebuilt from its code and the sides they took; a bot's is played from the
 * same code. Both go through the same walk, so the report sets them side by side on the same
 * terms.
 */

/** One vote at an election. */
export interface Vote {
  honest: boolean;
  /** An honest vote would have won it: the coalition was at or over the bar that day. */
  winnable: boolean;
  /** A meter was within `near` of the edge that ends a run: the line the mixed bot turns greedy at. */
  near: boolean;
}

export interface Trace {
  /** The look each card was read in, -3 to 3, as this version of the game shows it. */
  looks: number[];
  votes: Vote[];
  /**
   * The ordinary choices with an honest side, and at each one taken the other way, how near
   * the nearest meter was to the edge that ends a run, as the screen draws it (BACKLOG-10
   * phase 57). The bots turn careful at a line the screen never draws; this says where people do.
   */
  choices: number;
  turns: number[];
  /**
   * Whether the election cards said how an honest count would go when the run was played
   * (BACKLOG-9 phase 53): a person's version decides it. Absent for a bot, which always knows.
   */
  line?: boolean;
}

/** The first version whose election cards say how an honest count goes (BACKLOG-9 phase 53). */
export const LINE_SINCE = "0.63.0";

/** Whether a run played on version `game` was told the count: LINE_SINCE or later. */
export function toldTheCount(game: string): boolean {
  const parts = (v: string) => v.split(".").map((n) => (/^\d+$/.test(n) ? Number(n) : Number.NaN));
  const [a, b] = [parts(game), parts(LINE_SINCE)];
  if (a.length !== 3 || a.some(Number.isNaN)) return false;
  const at = a.findIndex((n, i) => n !== b[i]);
  return at < 0 || a[at]! > b[at]!;
}

/** The line a vote is split at: the mixed bot's own (`DEFAULT_RUN_OPTIONS.danger`). */
export const NEAR_EDGE = DEFAULT_RUN_OPTIONS.danger;

/**
 * How near the nearest meter is to the edge that ends a run, as the screen can show it: a bloc
 * from nothing, the state from either end, and the state not at all out of office.
 */
export function edgeGap(s: GameState): number {
  const gaps: number[] = [];
  for (const k of METER_KEYS) {
    if ((BLOC_KEYS as readonly string[]).includes(k)) gaps.push(s.meters[k]);
    else if (!s.opposition) gaps.push(Math.min(s.meters[k], 100 - s.meters[k]));
  }
  return Math.min(...gaps);
}

/** The side a card's words make the honest one: the one that drifts toward the Ascent. None when both drift alike. */
function honestSide(card: Card): Side | null {
  const [l, r] = [card.left.drift ?? 0, card.right.drift ?? 0];
  return l === r ? null : l > r ? "left" : "right";
}

type Chooser = (state: GameState, card: Card, index: number) => Side | null;

function walk(lib: Library, seed: number, setup: RunSetup, choose: Chooser): { trace: Trace; state: GameState } | null {
  let s = draw(lib, newRun(lib, seed, setup));
  const trace: Trace = { looks: [], votes: [], choices: 0, turns: [] };
  for (let i = 0; !s.over; i++) {
    if (i >= DEFAULT_RUN_OPTIONS.maxCards || !s.current) return null;
    const card = getCard(lib, s.current);
    const side = choose(s, card, i);
    if (!side) return null;
    trace.looks.push(s.look);
    if (card.type === "election") {
      trace.votes.push({ honest: card[side].honest === true, winnable: honestCount(lib, s).wins, near: nearAnEdge(s.meters, NEAR_EDGE) });
    } else if (!card.campaign) {
      // A campaign card has a line of its own to be read by, and is not counted here.
      const honest = honestSide(card);
      if (honest) {
        trace.choices++;
        if (side !== honest) trace.turns.push(edgeGap(s));
      }
    }
    s = draw(lib, resolve(lib, s, card.id, side));
  }
  return { trace, state: s };
}

/**
 * A finished run a person played, rebuilt from its code and their sides; or null when this
 * version of the game does not deal that run. Every card dealt has to be the card they were
 * shown, with the meters and drift the record saw in front of it, and the run has to end
 * where theirs ended. A record made on another version can part from it anywhere a card, a
 * number or the deal changed, and a rebuild that parted would describe a run nobody played.
 */
export function traceRecorded(lib: Library, run: RecordedRun): Trace | null {
  if (!run.end) return null;
  const decoded = decodeRunCode(lib, run.code);
  if (!decoded.ok) return null;
  const out = walk(lib, decoded.code.seed, setupOf(decoded.code), (s, card, i) => {
    const taken = run.cards[i];
    if (!taken || taken.card !== card.id || Math.round(s.drift) !== taken.drift) return null;
    const meters = meterList(s.meters);
    if (meters.length !== taken.before.length || meters.some((v, k) => v !== taken.before[k])) return null;
    return taken.side;
  });
  if (!out || out.state.cardCount !== run.cards.length || out.state.over?.endingId !== run.end.ending) return null;
  return { ...out.trace, line: toldTheCount(run.game) };
}

/** A bot playing the run a person played, from its code: the same run `playRunFrom` plays. */
export function traceBot(lib: Library, bot: BotName, seed: number, setup: RunSetup, opts: RunOptions = DEFAULT_RUN_OPTIONS): Trace {
  const rng = makeRng(seed ^ 0x5bd1e995);
  const out = walk(lib, seed, setup, (s, card) => BOTS[bot](makeContext(lib, s, card, rng, opts)));
  if (!out) throw new Error(`run exceeded ${DEFAULT_RUN_OPTIONS.maxCards} cards (seed ${seed}, bot ${bot})`);
  return out.trace;
}
