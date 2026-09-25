/**
 * How many runs each weekly contract takes a player who aims at it (BACKLOG-10 phase 60).
 *
 *   npm run contracts -- [--runs 500]
 *
 * Every contract a week can deal is played with the competent bots, each with what a person
 * aiming at it would add: taking the side and the promise it names, counting every vote
 * honestly, keeping the promise, taking the side that leaves the legacy it asks for. The best of
 * them is the contract's rate, and each tier has a band it should sit in.
 */
import { content } from "../src/content";
import { buildLibrary } from "../src/engine";
import { draw } from "../src/engine/draw";
import { getCard } from "../src/engine/library";
import { MANDATES_BY_ID } from "../src/engine/mandates";
import { applyChoice, resolve } from "../src/engine/resolve";
import { makeRng } from "../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../src/engine/state";
import type { PlayerAlign, Side } from "../src/engine/types";
import { CONTRACT_TEMPLATES, contractById, type Tier } from "../src/meta/contracts";
import { allUnlockTokens } from "../src/meta/objectives";
import { BOTS, makeContext, type Bot, type BotContext } from "../src/sim";

/** The band each tier's rate should sit in: the share of runs a player aiming at it keeps it in. */
const TIER_BANDS: Record<Tier, [number, number]> = { easy: [0.5, 0.9], fair: [0.2, 0.5], hard: [0.07, 0.2] };

const lib = buildLibrary(content);
const runsArg = process.argv.indexOf("--runs");
const RUNS = runsArg > 0 ? Number(process.argv[runsArg + 1]) : 500;

const other = (s: Side): Side => (s === "left" ? "right" : "left");
/** Take the side `want` picks when only one side has it and it does not end the run the other would not. */
const prefer = (b: Bot, want: (ctx: BotContext, s: Side) => boolean): Bot => (ctx) => {
  const l = want(ctx, "left");
  if (l !== want(ctx, "right")) {
    const s: Side = l ? "left" : "right";
    if (!ctx[s].endingId || ctx[other(s)].endingId) return s;
  }
  return b(ctx);
};
const honest = (b: Bot): Bot => (ctx) => (ctx.card.type === "election" ? (ctx.card.left.honest ? "left" : "right") : b(ctx));
const keep = (b: Bot): Bot =>
  prefer(b, (ctx, s) => {
    const m = ctx.state.mandate ? MANDATES_BY_ID.get(ctx.state.mandate) : undefined;
    return !!m && ctx.state.mandateBrokenAt === null && !m.isBroken(applyChoice(ctx.lib, ctx.state, ctx.card, s));
  });
const leave = (b: Bot, flag: string): Bot => prefer(b, (ctx, s) => !ctx.state.flags.includes(flag) && applyChoice(ctx.lib, ctx.state, ctx.card, s).flags.includes(flag));

const { informed: I, eyes: E, mixed: M, greedy: G, saint: S } = BOTS;
/** How a player would aim at each kind of contract. */
function aims(key: string, param: string): [string, Bot][] {
  switch (key) {
    case "ascent":
    case "decay":
    case "muddle":
    case "broad":
      return [["informed", I], ["eyes", E], ["mixed", M], ["greedy", G]];
    case "clean":
    case "muddleClean":
    case "ascentClean":
    case "wonBackFinale":
      return [["honest informed", honest(I)], ["honest eyes", honest(E)], ["honest mixed", honest(M)]];
    case "promise":
    case "promiseBroad":
      return [["keeping informed", keep(I)], ["keeping eyes", keep(E)], ["keeping mixed", keep(M)]];
    case "saint":
    case "saintEra":
      return [["saint", S]];
    case "legacy":
    case "legacyHard":
      return [["informed", leave(I, param)], ["eyes", leave(E, param)], ["greedy", leave(G, param)]];
    default:
      throw new Error(`no aim for contract ${key}`);
  }
}

const unlocked = allUnlockTokens();
let off = 0;
for (const t of CONTRACT_TEMPLATES) {
  for (const param of t.params.length ? t.params : [""]) {
    const id = param ? `${t.key}:${param}` : t.key;
    const contract = contractById(id)!;
    const align = sideOf(param);
    const mandate = t.key === "promise" ? param : t.key === "promiseBroad" ? "m_broad" : null;
    let best = 0;
    const rates: string[] = [];
    for (const [name, bot] of aims(t.key, param)) {
      let kept = 0;
      for (let i = 0; i < RUNS; i++) {
        const seed = 900_000 + i;
        const side: PlayerAlign = align ?? (i % 2 ? "left" : "right");
        const rng = makeRng(seed ^ 0x5bd1e995);
        let s = newRun(lib, seed, { ...rollSetup(lib, seed, side, unlocked), mandate });
        while (!s.over) {
          s = draw(lib, s);
          const card = getCard(lib, s.current!);
          s = resolve(lib, s, card.id, bot(makeContext(lib, s, card, rng, { danger: 25 })));
        }
        if (t.keeps(s, exitBand(lib, s), param)) kept++;
      }
      best = Math.max(best, kept / RUNS);
      rates.push(`${name} ${((100 * kept) / RUNS).toFixed(1)}%`);
    }
    const [lo, hi] = TIER_BANDS[t.tier];
    const fits = best >= lo && best <= hi;
    if (!fits) off++;
    console.log(`${fits ? " " : "!"} ${t.tier.padEnd(4)} ${id.padEnd(28)} ${(100 * best).toFixed(1).padStart(5)}%  ~${(1 / Math.max(best, 1e-9)).toFixed(1)} runs  | ${rates.join(", ")}  | ${contract.text}`);
  }
}
console.log(`\n${off === 0 ? "Every contract sits in its tier's band." : `${off} contract(s) outside their tier's band.`} ${RUNS} runs a policy.`);

/** The side a contract names, if it names one. */
function sideOf(param: string): PlayerAlign | null {
  return param === "left" || param === "right" ? param : null;
}
