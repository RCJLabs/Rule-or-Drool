import { STRINGS } from "../content/strings";
import { DEFAULT_CONFIG, type EngineConfig } from "../engine/config";
import { makeRng } from "../engine/rng";
import type { Band, MeterKey } from "../engine/types";

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

/** |drift| at which each stage begins. Stage 1 lands before the ±25 band line on purpose. */
export const STAGE_AT = [10, 30, 55] as const;

export function themeFor(drift: number, config: EngineConfig = DEFAULT_CONFIG): Theme {
  const mag = Math.abs(drift);
  let s = 0;
  for (const t of STAGE_AT) if (mag >= t) s++;
  const stage = s === 0 ? 0 : drift < 0 ? -s : s;
  const level = Math.min(1, Math.max(0, (mag - 8) / 62));
  const band: Band = drift <= config.bandDecayAt ? "decay" : drift >= config.bandAscentAt ? "ascent" : "muddle";
  const name = stage === 0 ? "muddle" : `${stage < 0 ? "decay" : "ascent"}${Math.abs(stage)}`;
  return { band, stage, decay: drift < 0 ? level : 0, ascent: drift > 0 ? level : 0, name };
}

/** Labels get dumber as Decay deepens. */
export function meterLabel(key: MeterKey, theme: Theme): string {
  const [plain, dumb, dumber] = STRINGS.meterLabels[key];
  if (theme.stage <= -3) return dumber;
  if (theme.stage <= -2) return dumb;
  return plain;
}

/** How hard degrade() may lean on the card text. */
export function degradeLevel(theme: Theme): number {
  if (theme.stage <= -3) return 0.6;
  if (theme.stage <= -2) return 0.3;
  return 0;
}

export function sponsorCount(theme: Theme): number {
  return theme.stage < 0 ? Math.min(3, -theme.stage) : 0;
}

/** Procedural sponsor name, stable for a (seed, n) pair so banners do not flicker. */
export function sponsorFor(seed: number, n: number): string {
  const rng = makeRng((Math.imul(seed, 31) + Math.imul(n, 7919)) | 0);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)]!;
  const { adjectives, nouns, suffixes } = STRINGS.sponsors;
  return `${pick(adjectives)} ${pick(nouns)}${pick(suffixes)}`;
}
