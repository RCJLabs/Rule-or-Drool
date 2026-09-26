import { MANDATES_BY_ID, holds } from "../engine/mandates";
import { applyChoice } from "../engine/resolve";
import type { Side } from "../engine/types";
import type { Bot, BotContext } from "./bots";

/**
 * What a player aiming at a goal adds to a bot, for measuring how often a goal is met: the
 * weekly contracts (BACKLOG-10 phase 60) and the week's scenario (BACKLOG-12 phase 78).
 */

const other = (s: Side): Side => (s === "left" ? "right" : "left");

/** Take the side `want` picks when only one side has it and it does not end the run the other would not. */
export const prefer =
  (b: Bot, want: (ctx: BotContext, s: Side) => boolean): Bot =>
  (ctx) => {
    const l = want(ctx, "left");
    if (l !== want(ctx, "right")) {
      const s: Side = l ? "left" : "right";
      if (!ctx[s].endingId || ctx[other(s)].endingId) return s;
    }
    return b(ctx);
  };

/** Every vote counted honestly. */
export const honest =
  (b: Bot): Bot =>
  (ctx) =>
    ctx.card.type === "election" ? (ctx.card.left.honest ? "left" : "right") : b(ctx);

/** Whether a side breaks a promise the run still holds. */
export function breaksPromise(ctx: BotContext, s: Side): boolean {
  const held = ctx.state.mandates.filter((id) => holds(ctx.state, id));
  if (held.length === 0) return false;
  const after = applyChoice(ctx.lib, ctx.state, ctx.card, s);
  return held.some((id) => MANDATES_BY_ID.get(id)!.isBroken(after));
}

/** Every promise still held stays held: a platform's two are both aimed at (phase 62). */
export const keep = (b: Bot): Bot => prefer(b, (ctx, s) => ctx.state.mandates.some((id) => holds(ctx.state, id)) && !breaksPromise(ctx, s));

/** The side that leaves this legacy, when only one does. */
export const leave = (b: Bot, flag: string): Bot =>
  prefer(b, (ctx, s) => !ctx.state.flags.includes(flag) && applyChoice(ctx.lib, ctx.state, ctx.card, s).flags.includes(flag));

/**
 * A player who decides some cards differently from the bot (BACKLOG-12 phase 78). On a seed dealt
 * the same way every time, the bots play the same run every time, and a goal is met always or
 * never; people do not play alike. This one takes the other side on a share `eps` of cards, from
 * the context's rng, but never on a vote, never onto a side that ends the run where the bot's does
 * not, and never onto one that breaks a promise the bot's keeps: a person aiming at a goal does
 * those on purpose.
 */
export const noisy =
  (b: Bot, eps: number): Bot =>
  (ctx) => {
    const s = b(ctx);
    if (ctx.card.type === "election" || ctx.rng() >= eps) return s;
    const o = other(s);
    if (ctx[o].endingId && !ctx[s].endingId) return s;
    if (breaksPromise(ctx, o) && !breaksPromise(ctx, s)) return s;
    return o;
  };
