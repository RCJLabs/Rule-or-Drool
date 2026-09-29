/**
 * How many runs each weekly contract takes a player who aims at it (BACKLOG-10 phase 60).
 *
 *   npm run contracts -- [--runs 500]
 *
 * Every contract the weeks to come can deal is played with the competent bots, each with what a person
 * aiming at it would add: taking the side and the promise it names, counting every vote
 * honestly, keeping the promise, taking the side that leaves the legacy it asks for. The best of
 * them is the contract's rate, and each tier has a band it should sit in.
 */
import { content } from "../src/content";
import { buildLibrary } from "../src/engine";
import { draw } from "../src/engine/draw";
import { getCard } from "../src/engine/library";
import { resolve } from "../src/engine/resolve";
import { makeRng } from "../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../src/engine/state";
import type { PlayerAlign } from "../src/engine/types";
import { contractPool, keepsContract, type Tier } from "../src/meta/contracts";
import { allUnlockTokens } from "../src/meta/objectives";
import { BOTS, holdCabinet, honest, keep, leave, makeContext, raiseRival, type Bot } from "../src/sim";

/** The band each tier's rate should sit in: the share of runs a player aiming at it keeps it in. */
const TIER_BANDS: Record<Tier, [number, number]> = { easy: [0.5, 0.9], fair: [0.2, 0.5], hard: [0.07, 0.2] };

const lib = buildLibrary(content);
const runsArg = process.argv.indexOf("--runs");
const RUNS = runsArg > 0 ? Number(process.argv[runsArg + 1]) : 500;

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
    // The rival's (BACKLOG-13 phase 85): keep who they try to hire; let them climb, then beat them.
    case "rivalKept":
      return [["holding informed", holdCabinet(I)], ["holding eyes", holdCabinet(E)], ["holding mixed", holdCabinet(M)]];
    case "rivalBeaten":
      return [["eyes", E], ["greedy", G], ["honest eyes raising", honest(raiseRival(E))], ["honest mixed raising", honest(raiseRival(M))]];
    default:
      throw new Error(`no aim for contract ${key}`);
  }
}

const unlocked = allUnlockTokens();
let off = 0;
let onLine = 0;
for (const contract of contractPool()) {
  const { id, tier } = contract;
  const [key = "", param = ""] = id.split(/:(.*)/s);
  const align = sideOf(param);
  const mandate = key === "promise" ? param : key === "promiseBroad" ? "m_broad" : null;
  let best = 0;
  const rates: string[] = [];
  for (const [name, bot] of aims(key, param)) {
    let kept = 0;
    for (let i = 0; i < RUNS; i++) {
      const seed = 900_000 + i;
      const side: PlayerAlign = align ?? (i % 2 ? "left" : "right");
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s = newRun(lib, seed, { ...rollSetup(lib, seed, side, unlocked), mandates: mandate ? [mandate] : [] });
      while (!s.over) {
        s = draw(lib, s);
        const card = getCard(lib, s.current!);
        s = resolve(lib, s, card.id, bot(makeContext(lib, s, card, rng, { danger: 25 })));
      }
      if (keepsContract(id, s, exitBand(lib, s))) kept++;
    }
    best = Math.max(best, kept / RUNS);
    rates.push(`${name} ${((100 * kept) / RUNS).toFixed(1)}%`);
  }
  const [lo, hi] = TIER_BANDS[tier];
  const fits = best >= lo && best <= hi;
  // A rate read from RUNS runs is good to about two standard errors: past its band by less than
  // that, a contract is on the line, not out of it. At 500 runs, two of the three read just over
  // their lines in BACKLOG-13 phase 94 were inside on 2,000 fresh runs (phase 95).
  const margin = 1.96 * Math.sqrt((best * (1 - best)) / RUNS);
  const near = !fits && best >= lo - margin && best <= hi + margin;
  if (near) onLine++;
  else if (!fits) off++;
  console.log(`${fits ? " " : near ? "~" : "!"} ${tier.padEnd(4)} ${id.padEnd(28)} ${(100 * best).toFixed(1).padStart(5)}%  ~${(1 / Math.max(best, 1e-9)).toFixed(1)} runs  | ${rates.join(", ")}  | ${contract.text}`);
}
const lines = onLine ? `; ${onLine} on its line, within the noise of ${RUNS} runs (~)` : "";
console.log(`\n${off === 0 ? "Every contract sits in its tier's band" : `${off} contract(s) outside their tier's band (!)`}${lines}. ${RUNS} runs a policy.`);

/** The side a contract names, if it names one. */
function sideOf(param: string): PlayerAlign | null {
  return param === "left" || param === "right" ? param : null;
}
