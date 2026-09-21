import type { Library } from "../engine/library";
import { preview, type Preview } from "../engine/preview";
import type { Card, GameState, Meters, Side } from "../engine/types";
import { METER_KEYS } from "../engine/types";

/**
 * Headless policies from TRANSFER.md section 8. Bots are omniscient about card data:
 * they see the projected meters and drift of both sides (the engine's preview), which
 * a human never does. That is the point: they tune survival and band distribution,
 * not whether temptation feels tempting.
 */
export type BotName = "random" | "greedy" | "saint" | "mixed";
export const BOT_NAMES: readonly BotName[] = ["random", "greedy", "saint", "mixed"];

export interface BotOptions {
  /** Mixed bot: a meter below this or above 100 - this counts as "in danger". */
  danger: number;
}

export interface BotContext {
  lib: Library;
  state: GameState;
  card: Card;
  left: Preview;
  right: Preview;
  /** Bot-private RNG, independent of the run's RNG. */
  rng: () => number;
  opts: BotOptions;
}

export type Bot = (ctx: BotContext) => Side;

/** Higher is calmer: negative sum of squared distance from the centre. */
export function stability(meters: Meters): number {
  let s = 0;
  for (const k of METER_KEYS) {
    const d = meters[k] - 50;
    s -= d * d;
  }
  return s;
}

function greedyScore(p: Preview): number {
  return p.endingId ? Number.NEGATIVE_INFINITY : stability(p.meters);
}

function pickBy(ctx: BotContext, score: (p: Preview) => number): Side {
  const l = score(ctx.left);
  const r = score(ctx.right);
  if (l > r) return "left";
  if (r > l) return "right";
  return ctx.rng() < 0.5 ? "left" : "right";
}

const random: Bot = (ctx) => (ctx.rng() < 0.5 ? "left" : "right");

/** Always the side that leaves the meters closest to 50 (never a side that ends the run). */
const greedy: Bot = (ctx) => pickBy(ctx, greedyScore);

/** Always the side with more drift, whatever it costs. */
const saint: Bot = (ctx) => pickBy(ctx, (p) => p.drift);

/**
 * Saint unless a meter is in danger, in which case greedy. A saint choice that ends the
 * run on the spot (a lost election, a meter hitting an edge) also counts as danger when
 * the other side survives.
 */
const mixed: Bot = (ctx) => {
  const d = ctx.opts.danger;
  const inDanger = METER_KEYS.some((k) => ctx.state.meters[k] < d || ctx.state.meters[k] > 100 - d);
  if (inDanger) return greedy(ctx);
  const side = saint(ctx);
  const other: Side = side === "left" ? "right" : "left";
  if (ctx[side].endingId && !ctx[other].endingId) return other;
  return side;
};

export const BOTS: Record<BotName, Bot> = { random, greedy, saint, mixed };

export function makeContext(lib: Library, state: GameState, card: Card, rng: () => number, opts: BotOptions): BotContext {
  return {
    lib,
    state,
    card,
    left: preview(lib, state, card, "left"),
    right: preview(lib, state, card, "right"),
    rng,
    opts,
  };
}
