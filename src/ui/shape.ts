import { STRINGS } from "../content/strings";
import { draw } from "../engine/draw";
import type { Library } from "../engine/library";
import { canRetrace, sameRun } from "../engine/replay";
import { resolve } from "../engine/resolve";
import { exitBand, exitDrift, newRun } from "../engine/state";
import type { Band, GameState, MeterKey, Meters, PlayerAlign } from "../engine/types";
import { METER_KEYS } from "../engine/types";
import { shownInDanger } from "./signals";
import { meterLevel, meterName } from "./speech";

/**
 * The shape of a run (BACKLOG-12 phase 74): how its meters and its direction moved, card by card,
 * for a chart on the end screen. The meters are gone by the end, and the timeline and the cause
 * say what happened in words; nothing showed where a run turned.
 *
 * Nothing new is kept. A run is its seed, its setup and its choices, and it is dealt again from
 * them card by card, as the way back into a run is (BACKLOG-5 phase 34): 11–17 ms for a whole run
 * on the audit machine. A run that cannot be dealt again, one saved before choices were kept or
 * dealt in part from another deck, has no shape, and the end screen does without it.
 *
 * It is read in words, never numbers, as the meters are: the levels the screen reader already
 * uses, and danger as the meters bar draws it. Direction is the band's, as the end screen's is: a
 * long reign's band is locked after the third era and drift goes on moving under it, so from
 * there the line is held inside the band the reign ends in (BACKLOG-11 phase 72), not drawn
 * heading for a future the run can no longer reach.
 */
export interface ShapePoint {
  /** Cards played: 0 is the run as dealt, before its first choice. */
  card: number;
  /** The era the card was played in: the card that closes an era is that era's, not the next. */
  era: number;
  meters: Meters;
  /** Drift as the end screen reads it: held inside a locked band. */
  drift: number;
  band: Band;
  /** Out of office once this card was played. */
  out: boolean;
}

/** The era a card is played in. */
export function eraOfCard(lib: Library, card: number): number {
  return Math.max(1, Math.ceil(card / lib.config.eraLength));
}

const pointOf = (lib: Library, card: number, s: GameState): ShapePoint => ({
  card,
  era: eraOfCard(lib, card),
  meters: { ...s.meters },
  drift: exitDrift(lib, s),
  band: exitBand(lib, s),
  out: !!s.opposition,
});

/** The run dealt again from its record, a point a card; null when the record does not deal it. */
export function shapeOf(lib: Library, state: GameState): ShapePoint[] | null {
  const record = state.choices;
  if (!state.over || !record || !canRetrace(state)) return null;
  const setup = {
    align: state.align,
    modifiers: [...state.modifiers],
    unlocked: [...state.unlocked],
    mandates: [...state.mandates],
    eraCount: state.eraCount,
    inheritance: state.inherited,
  };
  let s = draw(lib, newRun(lib, state.seed, setup));
  const points = [pointOf(lib, 0, s)];
  for (let i = 0; i < record.length; i++) {
    const [card, side] = record[i]!;
    if (s.current !== card) return null;
    const played = resolve(lib, s, card, side);
    points.push(pointOf(lib, i + 1, played));
    s = draw(lib, played);
  }
  // Dealt again, it ends where it ended, or it is not this run: the test the way back into a run uses.
  return sameRun(s, state) ? points : null;
}

/** Whether a meter was in danger at a point, as the meters bar would have shown it. */
export function inDangerAt(k: MeterKey, p: ShapePoint): boolean {
  return shownInDanger(k, p.meters[k], p.out);
}

/** A meter at a point, in the words its fill gives the eye. */
export function levelAt(k: MeterKey, p: ShapePoint): string {
  return meterLevel(k, p.meters[k], inDangerAt(k, p));
}

/** Which way the country was heading at a point, in the band's own words. */
export function headingAt(p: ShapePoint): string {
  return STRINGS.shape.heading[p.band];
}

/** Everything at one card, in a line: where it was, each meter, the direction. */
export function readoutAt(p: ShapePoint, align: PlayerAlign): string {
  const w = STRINGS.shape;
  const where = (p.card === 0 ? w.start : w.at.replace("{n}", String(p.card))).replace("{era}", String(p.era)) + (p.out ? `, ${w.out}` : "");
  const meters = METER_KEYS.map((k) => `${meterName(k, align)} ${levelAt(k, p)}`).join(" · ");
  return `${where}: ${meters} · ${headingAt(p)}.`;
}

/** Where each era left the run, its last card played, and the run's own last card, for the table the chart is read by. */
export function eraEnds(lib: Library, points: readonly ShapePoint[]): ShapePoint[] {
  const last = points[points.length - 1]!;
  const ends: ShapePoint[] = [];
  for (let e = 1; e * lib.config.eraLength < last.card; e++) ends.push(points[e * lib.config.eraLength]!);
  return [...ends, last];
}
