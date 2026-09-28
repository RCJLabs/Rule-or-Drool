import { draw } from "../engine/draw";
import { survivedTo, withNames } from "../engine/endings";
import { getCard, type Library } from "../engine/library";
import { sideEnds } from "../engine/preview";
import { canRetrace, otherSide, setupOfRun } from "../engine/replay";
import { resolve } from "../engine/resolve";
import { makeRng } from "../engine/rng";
import { exitBand, newRun } from "../engine/state";
import type { Band, GameState, Side } from "../engine/types";
import { BOTS, makeContext, type Bot } from "./bots";

/**
 * Where a run turned (BACKLOG-14 phase 88): each decision of a finished run taken the other way,
 * and the rest of the run played on, to see which would have ended it differently.
 *
 * The rest is played as the player played it: wherever the road the other side opens deals a
 * card the player met after that decision, they answer it as they did, and a side it marks as
 * ending the reign they do not take, as a player who reads the mark would not. One deal per
 * seed (BACKLOG-13 phase 81) makes most of the cards after a decision the same either way, so
 * a road is mostly the player's own. A card the player never met is answered carefully: by the
 * eyes bot, which decides only from what the screen shows, and again by the informed voter. A
 * decision is a turning point only when both roads end the same way, and not as the run did, so
 * that nothing a bot decided alone makes it one. Everything is dealt from the run's seed, with
 * the bots' coin-flips seeded by the card, so a run always turns at the same places.
 *
 * A side that ends the reign on the spot is no turning point: the card marks it, or it was the
 * coup's dice. What the other side sets in motion is.
 */

export interface TurningPoint {
  /** The decision's place in the run's record, from 0: it was made on card k + 1. */
  k: number;
  cardId: string;
  /** The side the player took. */
  side: Side;
  /** The two sides' words as the card showed them, names filled in: the one taken, and the other. */
  chose: string;
  other: string;
  /** How the run ends with the other side taken, the rest played as the player played it. */
  endingId: string;
  /** The band it ends in, when seen through; null for a reign cut short. */
  band: Band | null;
  /** The card that road ends on. */
  cards: number;
  /**
   * Whether it set more in motion than its own weight on the direction: a band crossed by the
   * card's own drift, and nothing after it, is only a close run. A reign kept or cut short by it
   * always did.
   */
  knockOn: boolean;
  /** How far the direction ends from where the run's did. */
  moved: number;
}

/** Who answers a card the player never met: the eyes bot, then the informed voter. */
export const TURNING_FILLERS: readonly Bot[] = [BOTS.eyes, BOTS.informed];

/** How far the direction must move past a card's own weight to count as set in motion. */
const SLACK = 2;
/** No road runs longer than this, whatever goes wrong. */
const MAX_CARDS = 400;
const OPTS = { danger: 25 };

/** The player's later answers, taken in turn as the same cards come on another road. */
class Mirror {
  constructor(
    private readonly positions: ReadonlyMap<string, readonly number[]>,
    private readonly record: readonly (readonly [string, Side])[],
    private readonly after: number,
    private readonly used: Set<number> = new Set(),
  ) {}
  take(cardId: string): Side | null {
    const p = this.positions.get(cardId)?.find((i) => i > this.after && !this.used.has(i));
    if (p === undefined) return null;
    this.used.add(p);
    return this.record[p]![1];
  }
  copy(): Mirror {
    return new Mirror(this.positions, this.record, this.after, new Set(this.used));
  }
}

/** The side a player who answered `side` here before takes now: not one the card marks as ending the reign, when the other is not. */
function asBefore(lib: Library, s: GameState, cardId: string, side: Side): GameState {
  const next = resolve(lib, s, cardId, side);
  if (!next.over || survivedTo(lib.config, next.over.endingId)) return next;
  const card = getCard(lib, cardId);
  return sideEnds(lib, s, card, side) && !sideEnds(lib, s, card, otherSide(side)) ? resolve(lib, s, cardId, otherSide(side)) : next;
}

/**
 * From a state with a choice just made, the road to its end: shared while the player met every
 * card it deals, and parting at the first they did not, where each filler answers for them. Each
 * filler's road is played only when asked for, so a decision whose first road ends as the run did
 * costs one road, not two.
 */
function roadsFrom(lib: Library, start: GameState, mirror: Mirror, fillers: readonly Bot[], seed: number): (i: number) => GameState {
  let s = start;
  while (!s.over && s.cardCount < MAX_CARDS) {
    s = draw(lib, s);
    const side = mirror.take(s.current!);
    if (side === null) break;
    s = asBefore(lib, s, s.current!, side);
  }
  if (s.over || s.cardCount >= MAX_CARDS) return () => s;
  const table = s;
  return (i) => {
    const own = mirror.copy();
    const rng = makeRng((seed ^ Math.imul(table.cardCount + 1, 0x9e3779b1) ^ Math.imul(i + 1, 0x85ebca6b)) >>> 0);
    let r = table;
    let first = true;
    while (!r.over && r.cardCount < MAX_CARDS) {
      if (!first) r = draw(lib, r);
      first = false;
      const cardId = r.current!;
      const side = own.take(cardId);
      if (side !== null) r = asBefore(lib, r, cardId, side);
      else r = resolve(lib, r, cardId, fillers[i]!(makeContext(lib, r, getCard(lib, cardId), rng, OPTS)));
    }
    return r;
  };
}

/**
 * The turning points of a finished run, worked out a decision at a time: it yields after each
 * decision, so a screen can do the work in slices, and returns them in card order. Null for a
 * run that cannot be retraced: no record, or one this version deals differently.
 */
export function* turningPointsOf(lib: Library, run: GameState, fillers: readonly Bot[] = TURNING_FILLERS): Generator<void, TurningPoint[] | null> {
  if (!run.over || !canRetrace(run)) return null;
  const record = run.choices!;
  const positions = new Map<string, number[]>();
  record.forEach(([id], i) => positions.set(id, [...(positions.get(id) ?? []), i]));
  const actual = run.over.endingId;
  const seenThrough = survivedTo(lib.config, actual);
  const out: TurningPoint[] = [];
  let s = draw(lib, newRun(lib, run.seed, setupOfRun(run)));
  for (let k = 0; k < record.length; k++) {
    const [cardId, side] = record[k]!;
    if (s.current !== cardId) return null;
    const flipped = resolve(lib, s, cardId, otherSide(side));
    if (!flipped.over) {
      const road = roadsFrom(lib, flipped, new Mirror(positions, record, k), fillers, run.seed);
      const end = road(0);
      const endingId = end.over?.endingId ?? null;
      if (endingId && endingId !== actual && fillers.every((_, i) => i === 0 || road(i).over?.endingId === endingId)) {
        const card = getCard(lib, cardId);
        const weight = Math.abs((card.left.drift ?? 0) - (card.right.drift ?? 0));
        const moved = Math.abs(end.drift - run.drift);
        const kept = survivedTo(lib.config, endingId);
        const named = (x: Side) => withNames(lib, s, card[x].label, card.speaker);
        out.push({
          k,
          cardId,
          side,
          chose: named(side),
          other: named(otherSide(side)),
          endingId,
          band: kept ? exitBand(lib, end) : null,
          cards: end.cardCount,
          knockOn: kept !== seenThrough || !kept || moved > weight + SLACK,
          moved,
        });
      }
    }
    s = draw(lib, resolve(lib, s, cardId, side));
    yield;
  }
  return out;
}

/** The turning points of a finished run, all at once. */
export function turningPoints(lib: Library, run: GameState, fillers?: readonly Bot[]): TurningPoint[] | null {
  const it = turningPointsOf(lib, run, fillers);
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}

const BAND_RANK: Record<Band, number> = { decay: 1, muddle: 2, ascent: 3 };

/**
 * The few to show, in card order: those that set something in motion, a reign kept or cut short
 * first, then the furthest from how it did end, then those that moved the direction most. A
 * close run's turning points, the card's own weight and nothing more, are only counted.
 */
export function pickTurningPoints(points: readonly TurningPoint[], run: GameState, lib: Library, n = 3, prefer?: ReadonlySet<number>): TurningPoint[] {
  const actualBand = survivedTo(lib.config, run.over?.endingId ?? "") ? exitBand(lib, run) : null;
  const rank = (b: Band | null) => (b ? BAND_RANK[b] : 0);
  const score = (p: TurningPoint) =>
    [prefer?.has(p.k) ? 1 : 0, p.band === null || actualBand === null ? 1 : 0, Math.abs(rank(p.band) - rank(actualBand)), p.moved] as const;
  return points
    .filter((p) => p.knockOn)
    .sort((a, b) => {
      const [x, y] = [score(a), score(b)];
      return y[0] - x[0] || y[1] - x[1] || y[2] - x[2] || y[3] - x[3] || a.k - b.k;
    })
    .slice(0, n)
    .sort((a, b) => a.k - b.k);
}
