import { STRINGS } from "../content/strings";
import { DEFAULT_CONFIG, type EngineConfig } from "../engine/config";
import type { Library } from "../engine/library";
import { settleLook, stageOf } from "../engine/look";
import { makeRng } from "../engine/rng";
import { exitDrift } from "../engine/state";
import type { Band, GameState, MeterKey, PlayerAlign } from "../engine/types";
import { BLOC_KEYS } from "../engine/types";

/**
 * Frame theming is the trajectory meter (section 9). The theme follows live drift, not the
 * era-locked band, so early signs show up well before a boundary.
 */
export interface Theme {
  /** Band implied by drift right now. */
  band: Band;
  /**
   * -3..3: negative stages are Decay signs, positive are Ascent signs, 0 is neutral. In a run
   * it is the look the run has settled on, which can hold a little past drift (BACKLOG-7
   * phase 45).
   */
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
 *
 * The numbers live in the engine's config as `lookAt` now, since a run keeps the look it is
 * showing (BACKLOG-7 phase 45). This is the same array.
 */
export const STAGE_AT = DEFAULT_CONFIG.lookAt;

/**
 * The theme for a drift, in the look that drift implies on its own unless a stage is given.
 * Screens outside a run use it as it is; a run shows the look it has settled on (`themeOf`).
 */
export function themeFor(drift: number, config: EngineConfig = DEFAULT_CONFIG, stage: number = stageOf(drift, config)): Theme {
  const mag = Math.abs(drift);
  const level = Math.min(1, Math.max(0, (mag - config.lookAt[0]) / 34));
  const band: Band = drift <= config.bandDecayAt ? "decay" : drift >= config.bandAscentAt ? "ascent" : "muddle";
  const name = stage === 0 ? "muddle" : `${stage < 0 ? "decay" : "ascent"}${Math.abs(stage)}`;
  return { band, stage, decay: drift < 0 ? level : 0, ascent: drift > 0 ? level : 0, name };
}

/**
 * The theme a run is showing: its drift, in the look it has settled on (BACKLOG-7 phase 45).
 * The run keeps its look as each choice resolves, so settling it again here changes nothing;
 * it only keeps a run whose drift was moved some other way (a test rewriting a save) in a
 * look that fits. The strength of the look still follows drift, and while a look is held
 * past its line that is the faint end of it, never the other side's.
 */
export function themeOf(state: GameState, config: EngineConfig = DEFAULT_CONFIG): Theme {
  return themeFor(state.drift, config, settleLook(state.look ?? stageOf(state.drift, config), state.drift, config));
}

/**
 * The look the end of a run is shown in (BACKLOG-11 phase 72): the run's own, held inside the
 * band its ending names, which is only ever different for a long reign. Its band is locked after
 * the third era and its look went on following drift, so a reign locked in the Ascent could end
 * in a Decay look around a gold city (1-5% of the bots' long reigns), and 23-33% ended in a look
 * no ordinary run ending in their band shows. The play screen still follows drift, as its only
 * sign of it.
 */
export function endThemeOf(lib: Library, state: GameState): Theme {
  const config = lib.config;
  if (!state.bandLocked) return themeOf(state, config);
  const drift = exitDrift(lib, state);
  const deepest = config.lookAt.length;
  const [low, high] =
    state.band === "ascent" ? [stageOf(config.bandAscentAt, config), deepest]
    : state.band === "decay" ? [-deepest, stageOf(config.bandDecayAt, config)]
    : [stageOf(config.bandDecayAt + 1, config), stageOf(config.bandAscentAt - 1, config)];
  return themeFor(drift, config, Math.min(high, Math.max(low, state.look ?? stageOf(drift, config))));
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
