import { STRINGS } from "../content/strings";
import { DEFAULT_CONFIG, type EngineConfig } from "../engine/config";
import { makeRng } from "../engine/rng";
import type { Band, MeterKey, PlayerAlign } from "../engine/types";
import { BLOC_KEYS } from "../engine/types";

/**
 * Frame theming is the trajectory meter (section 9). The theme follows live drift, not the
 * era-locked band, so early signs show up well before a boundary.
 */
export interface Theme {
  /** Band implied by drift right now. */
  band: Band;
  /** -3..3: negative stages are Decay signs, positive are Ascent signs, 0 is neutral. */
  stage: number;
  /** Continuous 0..1 strength of the Decay / Ascent look, for CSS variables. */
  decay: number;
  ascent: number;
  /** data-theme attribute value: muddle, decay1..3, ascent1..3. */
  name: string;
}

/**
 * |drift| at which each stage begins. Stage 1 lands before the ±25 band line on purpose.
 *
 * These were [10, 30, 55], set before the deck's drift distribution was what it is, and the
 * result was that the game's two named looks were decoration: measured over 3,000 runs per
 * bot, the deepest Decay stage covered 0.1% of a competent run's cards and 1.9% of the
 * deepest Ascent. Drift is past 55 on 1.6% of cards drawn. At [8, 20, 36] the third stage
 * is 15.5% of a competent run's cards and 21.6% of a cynical one's, with most of the run
 * still at stages one and two, which is the shape it should have been all along — the deep
 * look is a destination, not a default (BACKLOG-3 phase 18).
 */
export const STAGE_AT = [8, 20, 36] as const;

export function themeFor(drift: number, config: EngineConfig = DEFAULT_CONFIG): Theme {
  const mag = Math.abs(drift);
  let s = 0;
  for (const t of STAGE_AT) if (mag >= t) s++;
  const stage = s === 0 ? 0 : drift < 0 ? -s : s;
  const level = Math.min(1, Math.max(0, (mag - STAGE_AT[0]) / 34));
  const band: Band = drift <= config.bandDecayAt ? "decay" : drift >= config.bandAscentAt ? "ascent" : "muddle";
  const name = stage === 0 ? "muddle" : `${stage < 0 ? "decay" : "ascent"}${Math.abs(stage)}`;
  return { band, stage, decay: drift < 0 ? level : 0, ascent: drift > 0 ? level : 0, name };
}

/** Labels get dumber as Decay deepens. Bloc names also depend on which side you lead. */
export function meterLabel(key: MeterKey, theme: Theme, align: PlayerAlign): string {
  const isBloc = (BLOC_KEYS as readonly string[]).includes(key);
  const [, dumb, dumber] = (isBloc ? STRINGS.blocDecay : STRINGS.meterLabels)[key]!;
  if (theme.stage <= -3) return dumber;
  if (theme.stage <= -2) return dumb;
  return isBloc ? STRINGS.blocNames[align][key as "base"] : STRINGS.meterLabels[key]![0];
}

/**
 * How hard degrade() may lean on the card text. Softened with the stage re-scale: the typos
 * used to carry the dumbing-down on their own and were seen on almost nothing, and now the
 * stream chrome carries it on a fifth of a cynical run's cards. Two things shouting the
 * same thing is one thing too many.
 */
export function degradeLevel(theme: Theme): number {
  if (theme.stage <= -3) return 0.4;
  if (theme.stage <= -2) return 0.2;
  return 0;
}

export function sponsorCount(theme: Theme): number {
  return theme.stage < 0 ? Math.min(3, -theme.stage) : 0;
}

/**
 * How much of the stream is on screen: 0 none, 1 the LIVE badge and a viewer count, 2 the
 * chat as well, 3 everything — alerts, emotes, a subscriber goal (BACKLOG-3 phase 18).
 */
export function streamLevel(theme: Theme): 0 | 1 | 2 | 3 {
  return theme.stage < 0 ? (Math.min(3, -theme.stage) as 1 | 2 | 3) : 0;
}

/**
 * Where the run is heading, as one number for the sound to follow: -1 in deep Decay, +1 in
 * deep Ascent, 0 in the middle. The same continuous value the frame uses, so what a swipe
 * sounds like and what the screen looks like move together (BACKLOG-3 phase 22).
 */
export function soundLevel(theme: Theme): number {
  return theme.ascent - theme.decay;
}

/** The matching ladder on the way up: the projection gets deeper rather than louder. */
export function holoLevel(theme: Theme): 0 | 1 | 2 | 3 {
  return theme.stage > 0 ? (Math.min(3, theme.stage) as 1 | 2 | 3) : 0;
}

/**
 * A stream gets an audience as it gets worse, which is the joke. Stable for a (seed, n)
 * pair so the number does not flicker between renders, and rising with the stage.
 */
export function viewersFor(seed: number, n: number, level: number): number {
  const rng = makeRng((Math.imul(seed, 2654435761) + Math.imul(n, 40503)) | 0);
  const base = [0, 4_000, 26_000, 110_000][Math.min(3, level)] ?? 0;
  return Math.round(base * (0.7 + rng() * 0.75));
}

/** Procedural sponsor name, stable for a (seed, n) pair so banners do not flicker. */
export function sponsorFor(seed: number, n: number): string {
  const rng = makeRng((Math.imul(seed, 31) + Math.imul(n, 7919)) | 0);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)]!;
  const { adjectives, nouns, suffixes } = STRINGS.sponsors;
  return `${pick(adjectives)} ${pick(nouns)}${pick(suffixes)}`;
}
