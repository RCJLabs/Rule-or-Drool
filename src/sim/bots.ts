import type { Library } from "../engine/library";
import { preview, type Preview } from "../engine/preview";
import { LOST_OFFICE_FLAG } from "../engine/opposition";
import { honestCount } from "../engine/resolve";
import { candidatesFor, hasFlag } from "../engine/state";
import type { Advisor, Card, GameState, MeterKey, Meters, Side } from "../engine/types";
import { BLOC_KEYS, CORE_KEYS, METER_KEYS } from "../engine/types";
import { countBand } from "../ui/count";
import { shownInDanger } from "../ui/signals";
import { stepOf } from "../ui/speech";

/**
 * Headless policies from TRANSFER.md section 8. Bots are omniscient about card data:
 * they see the projected meters and drift of both sides (the engine's preview), which
 * a human never does. That is the point: they tune survival and band distribution,
 * not whether temptation feels tempting.
 */
export type BotName = "random" | "greedy" | "saint" | "mixed" | "informed" | "eyes";
export const BOT_NAMES: readonly BotName[] = ["random", "greedy", "saint", "mixed", "informed", "eyes"];

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

/**
 * Higher is calmer: negative sum of squared distance from the centre.
 *
 * The three coalition blocs are averaged rather than summed, so the bot weighs its
 * coalition as one concern and not three. Summing them would triple the weight of public
 * opinion purely because it is now drawn as three bars, which is a modelling artifact
 * rather than a change in the game (BACKLOG item 5).
 */
export function stability(meters: Meters): number {
  let s = 0;
  for (const k of CORE_KEYS) {
    const d = meters[k] - 50;
    s -= d * d;
  }
  let coalition = 0;
  for (const b of BLOC_KEYS) {
    const d = meters[b] - 50;
    coalition -= d * d;
  }
  return s + coalition / BLOC_KEYS.length;
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
 * Whether a meter is within `d` of the edge that ends a run: the line the mixed bot turns
 * greedy at. A bloc only ends a run at the bottom, so a high bloc is not near an edge; the
 * state meters still fail at both ends. The playtest report splits votes by it too, to set
 * a person beside the bot on the bot's own terms (BACKLOG-7 phase 46).
 */
export function nearAnEdge(meters: Meters, d: number): boolean {
  return BLOC_KEYS.some((b) => meters[b] < d) || CORE_KEYS.some((k) => meters[k] < d || meters[k] > 100 - d);
}

/**
 * Saint unless a meter is in danger, in which case greedy. A saint choice that ends the
 * run on the spot (a lost election, a meter hitting an edge) also counts as danger when
 * the other side survives.
 */
const mixed: Bot = (ctx) => {
  if (nearAnEdge(ctx.state.meters, ctx.opts.danger)) return greedy(ctx);
  const side = saint(ctx);
  const other: Side = side === "left" ? "right" : "left";
  if (ctx[side].endingId && !ctx[other].endingId) return other;
  return side;
};

/**
 * How the informed voter campaigns (BACKLOG-10 phase 56), reading the line a campaign card
 * carries: honestly when that wins the count, the easy way when the count is a narrow loss, and
 * honestly when the loss is too deep for a campaign to make up.
 */
function campaign(ctx: BotContext): Side {
  const clean = saint(ctx);
  const easy: Side = clean === "left" ? "right" : "left";
  if (ctx[clean].endingId) return ctx[easy].endingId ? clean : easy;
  if (ctx[clean].count.wins) return clean;
  if (countBand(honestCount(ctx.lib, ctx.state)) === "narrowLoss" && !ctx[easy].endingId) return easy;
  return clean;
}

/**
 * The mixed bot with the election card read (BACKLOG-9 phase 54). Since phase 53 the card says
 * whether an honest count wins, so this player never cheats a vote they can win honestly: they
 * take the honest side unless it ends the run on the spot, and otherwise play as the mixed bot.
 * It reads a campaign card's line too (phase 56). It is the player the balance is for; the
 * mixed bot, which cheats to spare a meter near its edge, is the floor.
 */
const informed: Bot = (ctx) => {
  if (ctx.card.type === "election") {
    const honest = (["left", "right"] as const).find((s) => ctx.card[s].honest);
    if (honest && !ctx[honest].endingId) return honest;
  }
  if (ctx.card.campaign && !nearAnEdge(ctx.state.meters, ctx.opts.danger)) return campaign(ctx);
  return mixed(ctx);
};

/** How far a person reads each of the preview's dot sizes as moving a meter: `stepOf` draws 2 or less, 5 or less, and more. */
const DOT_READS_AS = [0, 2, 4, 8] as const;

/**
 * The meters after a side as a person reads them off the table (BACKLOG-10 phase 57): which way
 * each moves from the card's words, and how far only from the dot's size.
 */
export function readAs(ctx: BotContext, side: Side): Meters {
  const out = { ...ctx.state.meters };
  for (const k of ctx[side].affected) {
    const delta = ctx[side].meters[k] - ctx.state.meters[k];
    if (delta !== 0) out[k] = ctx.state.meters[k] + Math.sign(delta) * DOT_READS_AS[stepOf(delta)];
  }
  return out;
}

/** How near the worst of these meters would be to the edge that ends a run. */
function headroom(meters: Meters, worried: readonly MeterKey[]): number {
  return Math.min(...worried.map((k) => ((BLOC_KEYS as readonly string[]).includes(k) ? meters[k] : Math.min(meters[k], 100 - meters[k]))));
}

/**
 * A bot with a person's eyes (BACKLOG-10 phase 57). Every other bot sees both sides' exact
 * effects, and turns careful at a line the screen never draws. This one decides from what the
 * table shows a person:
 * - which side is the honest one, and which way each meter goes, as the card's words say;
 * - how far, only in the preview's three dot sizes;
 * - the meters, and the danger the screen draws them in;
 * - the count line on a vote or a campaign card.
 *
 * It plays as the informed voter would with those alone. On a vote it stands honestly unless
 * the line says a loss that would end the run, which by the rules it has been taught is a
 * second lost count or the return vote. A side the card says ends the reign (a resignation, a
 * handover) it reads as one, and never takes while the other does not. Otherwise it is honest
 * unless a meter is drawn in danger, when it takes the side it reads as leaving the worst of
 * those furthest from its edge. On a campaign card it campaigns the easy way when the line
 * says a narrow loss.
 */
const eyes: Bot = (ctx) => {
  const { card, state } = ctx;
  const clean = saint(ctx);
  const easy: Side = clean === "left" ? "right" : "left";
  const band = countBand(honestCount(ctx.lib, state));
  if (card.type === "election") {
    const honest = (["left", "right"] as const).find((s) => card[s].honest);
    if (honest) {
      const wins = band === "easy" || band === "win" || band === "narrowWin";
      const lossEnds = !!state.opposition || hasFlag(state, LOST_OFFICE_FLAG);
      return wins || !lossEnds ? honest : honest === "left" ? "right" : "left";
    }
  }
  if (!!card.left.ending !== !!card.right.ending) return card.left.ending ? "right" : "left";
  const worried = METER_KEYS.filter((k) => shownInDanger(k, state.meters[k], !!state.opposition));
  if (worried.length) {
    const l = headroom(readAs(ctx, "left"), worried);
    const r = headroom(readAs(ctx, "right"), worried);
    return l === r ? clean : l > r ? "left" : "right";
  }
  if (card.campaign && band === "narrowLoss") return easy;
  return clean;
};

/**
 * How a player who reads the trait blurbs rates a candidate at an appointment (BACKLOG-10 phase
 * 61): competent gets more out of what works, loyal takes the edge off, a zealot makes all of it
 * land harder, and whatever goes wrong under the corrupt goes further wrong.
 */
const TRAIT_WORTH: Readonly<Record<string, number>> = { competent: 2, loyal: 1, zealot: -1, corrupt: -2 };

/** The side that appoints the candidate a bot would, on an appointment card; null on any other. */
export function appointee(ctx: BotContext, prefer: 1 | -1): Side | null {
  const role = ctx.card.appoints;
  if (!role) return null;
  const pair = candidatesFor(ctx.lib, ctx.state, role);
  if (!pair) return "left";
  const worth = (a: Advisor) => a.traits.reduce((n, t) => n + (TRAIT_WORTH[t] ?? 0), 0);
  return prefer * (worth(pair[1]) - worth(pair[0])) > 0 ? "right" : "left";
}

/** A bot that appoints by the traits, the careful ones the better reading and the greedy one the worse. */
const appointing =
  (bot: Bot, prefer: 1 | -1): Bot =>
  (ctx) =>
    appointee(ctx, prefer) ?? bot(ctx);

export const BOTS: Record<BotName, Bot> = {
  random,
  greedy: appointing(greedy, -1),
  saint: appointing(saint, 1),
  mixed: appointing(mixed, 1),
  informed: appointing(informed, 1),
  eyes: appointing(eyes, 1),
};

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
