/**
 * The week's scenario (BACKLOG-12 phase 78): one run for everyone each week, and a goal, measured
 * before it is dealt.
 *
 *   npm run scenarios -- [--weeks 156] [--from 1]
 *
 * A seed dealt the same way plays the same way for a bot, so a goal on it is met always or never.
 * People do not play alike, so each week is measured with the informed voter and the eyes bot
 * each aiming at the goal, as the contracts are measured, and each deciding a card in five
 * differently (`noisy`). A week tries first the kinds of goal the fewest weeks before it have
 * had, and takes the first goal, side and seed that both meet in a fifth to a half of their runs:
 * screened on 30 runs a bot, then kept on 100 more.
 *
 * `--from` keeps the scenarios of the weeks before it, which players may already have played, and
 * measures them again on this deck; it searches only from that week on. Run it from the current
 * week whenever the deck moves.
 */
import { writeFileSync } from "node:fs";
import { content } from "../src/content";
import { buildLibrary } from "../src/engine";
import { deckStamp } from "../src/engine/deck";
import { makeRng } from "../src/engine/rng";
import { PLAYER_ALIGNS, type PlayerAlign } from "../src/engine/types";
import { contractById } from "../src/meta/contracts";
import { SCENARIO_MEASURE, SCENARIO_WEEKS, type ScenarioWeek } from "../src/meta/scenario";
import { GOAL_KINDS as KINDS, goalRate, measureWeek, type Bot } from "../src/sim";

const lib = buildLibrary(content);
const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? Number(process.argv[i + 1]) : fallback;
};
const WEEKS = arg("--weeks", 156);
const FROM = arg("--from", 1);
const { screen: SCREEN, band: BAND } = SCENARIO_MEASURE;
const OUT = new URL("../src/meta/scenario-weeks.json", import.meta.url);

/** Candidates a kind gets before the week tries the next. */
const TRIES = 12;

const inBand = (r: number, [lo, hi]: readonly [number, number]) => r >= lo && r <= hi;
const measure = (w: Omit<ScenarioWeek, "rates">) => measureWeek(lib, w);

/**
 * A week's run and goal. The kinds take turns, the least used so far first: a kind no seed fits in
 * its tries passes the week on, and in a fixed order the kind after the hardest took a quarter of
 * the weeks. Its first tries take the goal and the side the kind has set least, then any.
 */
function search(week: number, before: readonly ScenarioWeek[]): { found: ScenarioWeek; tried: number } {
  const rng = makeRng(0x5ce0a410 ^ Math.imul(week, 0x9e3779b1));
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)]!;
  const count = (keep: (w: ScenarioWeek) => boolean) => before.filter(keep).length;
  const least = <T>(xs: readonly T[], n: (x: T) => number): T => [...xs].sort((x, y) => n(x) - n(y))[0]!;
  const keyOf = (w: ScenarioWeek) => w.goal.split(":")[0];
  const start = (week - 1) % KINDS.length;
  const turn = (i: number) => (i - start + KINDS.length) % KINDS.length;
  const order = KINDS.map((kind, i) => ({ kind, i, n: count((w) => keyOf(w) === kind.key) })).sort((a, b) => a.n - b.n || turn(a.i) - turn(b.i));
  let tried = 0;
  for (const { kind } of order) {
    const goalOf = (param: string) => (param ? `${kind.key}:${param}` : kind.key);
    const fewest = least(kind.params, (p) => count((w) => w.goal === goalOf(p)));
    const side = least(PLAYER_ALIGNS, (a) => count((w) => keyOf(w) === kind.key && w.align === a));
    for (let t = 0; t < TRIES; t++) {
      const first = t < TRIES / 2;
      const param = first ? fewest : pick(kind.params);
      const align: PlayerAlign = kind.sided ? (param as PlayerAlign) : first ? side : pick(PLAYER_ALIGNS);
      const w = { week, seed: Math.floor(rng() * 1_000_000_000), align, mandates: kind.promise ? [kind.promise(param)] : [], goal: goalOf(param) };
      tried++;
      const aim = (b: Bot) => kind.aim(b, param);
      // Screened wide, since 30 runs can be off by a tenth either way, then kept on the full count.
      if (!inBand(goalRate(lib, w, aim, "informed", SCREEN, 0), [BAND[0] - 0.1, BAND[1] + 0.1])) continue;
      if (!inBand(goalRate(lib, w, aim, "eyes", SCREEN, 0), [BAND[0] - 0.1, BAND[1] + 0.1])) continue;
      const rates = measure(w);
      if (rates.every((r) => inBand(r, BAND))) return { found: { ...w, rates }, tried };
    }
  }
  throw new Error(`week ${week}: no goal fits`);
}

const t0 = performance.now();
const weeks: ScenarioWeek[] = [];
let tried = 0;
for (let week = 1; week <= WEEKS; week++) {
  const kept = week < FROM ? SCENARIO_WEEKS.find((w) => w.week === week) : undefined;
  if (kept) {
    const { rates: _old, ...w } = kept;
    weeks.push({ ...w, rates: measure(w) });
    continue;
  }
  const r = search(week, weeks);
  tried += r.tried;
  weeks.push(r.found);
  if (week % 10 === 0) console.log(`week ${week}: ${r.found.goal}, ${r.found.rates.join(" / ")}, ${((performance.now() - t0) / 1000).toFixed(0)} s`);
}

const lines = weeks.map((w) => `    ${JSON.stringify(w)}`);
const file = `{
  "deck": ${JSON.stringify(deckStamp(lib))},
  "weeks": [
${lines.join(",\n")}
  ]
}
`;
writeFileSync(OUT, file);

const byKey = new Map<string, number>();
for (const w of weeks) byKey.set(w.goal.split(":")[0]!, (byKey.get(w.goal.split(":")[0]!) ?? 0) + 1);
const mean = (i: 0 | 1) => weeks.reduce((n, w) => n + w.rates[i], 0) / weeks.length;
console.log(
  `\n${weeks.length} weeks on deck ${deckStamp(lib)}, ${tried} candidates tried from week ${FROM}, ${((performance.now() - t0) / 1000).toFixed(0)} s.`,
);
console.log(`Goals: ${[...byKey].map(([k, n]) => `${k} ${n}`).join(", ")}.`);
console.log(
  `Mean rate: informed ${(100 * mean(0)).toFixed(1)}%, eyes ${(100 * mean(1)).toFixed(1)}%. Every week in ${BAND[0] * 100}–${BAND[1] * 100}% for both.`,
);
console.log(`Week 1: ${contractById(weeks[0]!.goal)?.text}`);
