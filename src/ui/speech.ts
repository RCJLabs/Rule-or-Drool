import { STRINGS } from "../content/strings";
import type { Preview } from "../engine/preview";
import { BLOC_KEYS, METER_KEYS, type BlocKey, type MeterKey, type Meters, type PlayerAlign } from "../engine/types";

/**
 * What a screen reader is told (BACKLOG-5 phase 30), kept to what a sighted player gets.
 * The numbers are hidden on screen, so they are hidden here; the preview shows which meters
 * a choice moves and roughly how much, so that is what is said about a choice; the look is
 * the only sign of the hidden drift, so it is described, and the drift never is.
 */

/**
 * A meter's plain name. Not the label on screen: the deep looks print slang ("CA$H",
 * "EVERYONE!!"), which is a joke for the eye and noise read aloud.
 */
export function meterName(k: MeterKey, align: PlayerAlign): string {
  return (BLOC_KEYS as readonly string[]).includes(k) ? STRINGS.blocNames[align][k as BlocKey] : STRINGS.meters[k];
}

/** How full a meter is, in the words its fill gives the eye. Never the number. */
export function meterLevel(k: MeterKey, value: number, danger: boolean): string {
  const { levels } = STRINGS.speech;
  if (danger) {
    // A bloc is only ever in danger at the bottom; the state's meters fail at both ends.
    if ((BLOC_KEYS as readonly string[]).includes(k)) return levels.danger;
    return value < 50 ? levels.tooLow : levels.tooHigh;
  }
  return value < 35 ? levels.low : value > 65 ? levels.high : levels.half;
}

/**
 * The size a change shows as: the preview's one, two or three dots. The meter bar uses this
 * too, so the dots and the words cannot drift apart.
 */
export function stepOf(delta: number): 1 | 2 | 3 {
  const d = Math.abs(delta);
  return d <= 2 ? 1 : d <= 5 ? 2 : 3;
}

const sized = (name: string, step: 1 | 2 | 3) => `${name} ${STRINGS.speech.sizes[step - 1]}`;

/**
 * What a choice would move, as the preview dots show it: which meters and how much, never which
 * way; and, as the card marks it, whether it ends the run (BACKLOG-11 phase 68).
 */
export function choiceSummary(p: Preview, before: Meters, align: PlayerAlign, ends = false): string {
  const moved = METER_KEYS.filter((k) => p.affected.includes(k));
  const list = moved.map((k) => sized(meterName(k, align), stepOf(p.meters[k] - before[k]))).join(", ");
  const moves = moved.length ? STRINGS.speech.moves.replace("{list}", list) : STRINGS.speech.movesNothing;
  return ends ? `${moves} ${STRINGS.speech.endsRule}` : moves;
}

/** What a choice did, as the meters show it afterwards: which moved, which way, and how much. */
export function resultSummary(before: Meters, after: Meters, align: PlayerAlign): string {
  const parts: string[] = [];
  for (const k of METER_KEYS) {
    const d = Math.round(after[k]) - Math.round(before[k]);
    if (d === 0) continue;
    parts.push(sized(`${meterName(k, align)} ${d > 0 ? STRINGS.speech.up : STRINGS.speech.down}`, stepOf(d)));
  }
  return parts.length ? `${parts.join(", ")}.` : "";
}

/**
 * The look, in its own terms, when its stage changes (-3 deep Decay to +3 deep Ascent).
 * Deeper into a look reads that stage's line, easing back within it reads the easing line,
 * and the plain screen has its own. Crossing straight from one look to the other reads as
 * arriving in the new one.
 */
export function lookChange(from: number, to: number): string | null {
  const { look } = STRINGS.speech;
  if (from === to) return null;
  if (to === 0) return look.quiet;
  const deeper = Math.sign(from) !== Math.sign(to) || Math.abs(to) > Math.abs(from);
  if (!deeper) return to < 0 ? look.easeDecay : look.easeAscent;
  return (to < 0 ? look.decay : look.ascent)[Math.abs(to) - 1] ?? null;
}
