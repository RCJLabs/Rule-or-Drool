import type { BotName } from "./bots";
import { pct, type BotSummary } from "./report";

/**
 * Acceptance targets from TRANSFER.md section 8. These are starting values; phase 4
 * tunes content until they pass.
 */
export interface TargetResult {
  /** The bot it is measured on, or every bot at once. */
  bot: BotName | "all";
  name: string;
  target: string;
  actual: string;
  pass: boolean;
  /** Informational lines have no pass/fail semantics. */
  info?: boolean;
}

export function evaluateTargets(summaries: ReadonlyMap<BotName, BotSummary>): TargetResult[] {
  const out: TargetResult[] = [];
  const random = summaries.get("random");
  if (random) {
    out.push({
      bot: "random",
      name: "median run length",
      target: "40–60 cards",
      actual: `${random.cards.median} cards`,
      pass: random.cards.median >= 40 && random.cards.median <= 60,
    });
    const top = random.endings[0];
    out.push({
      bot: "random",
      name: "no single ouster cause",
      target: "≤ 35%",
      actual: top ? `${top[0]} ${pct(top[1])}` : "n/a",
      pass: !!top && top[1] <= 0.35,
    });
  }
  const greedy = summaries.get("greedy");
  if (greedy) {
    out.push({
      bot: "greedy",
      name: "survives long",
      target: "(no number given)",
      actual: `median ${greedy.cards.median} cards, finale ${pct(greedy.finale)}`,
      pass: true,
      info: true,
    });
    out.push({
      bot: "greedy",
      name: "ends in Decay",
      target: "≥ 70%",
      actual: pct(greedy.exitBands.decay),
      pass: greedy.exitBands.decay >= 0.7,
    });
  }
  const saint = summaries.get("saint");
  if (saint) {
    out.push({
      bot: "saint",
      name: "ousted before era 2",
      target: "≥ 60%",
      actual: pct(saint.endedBeforeEra2),
      pass: saint.endedBeforeEra2 >= 0.6,
    });
  }
  const mixed = summaries.get("mixed");
  if (mixed) {
    out.push({
      bot: "mixed",
      name: "reaches Ascent (exit band)",
      target: "15–30%",
      actual: pct(mixed.exitBands.ascent),
      pass: mixed.exitBands.ascent >= 0.15 && mixed.exitBands.ascent <= 0.3,
    });
    out.push({
      bot: "mixed",
      name: "finale in Ascent (strict)",
      target: "(stricter reading)",
      actual: pct(mixed.finale * mixed.finaleBands.ascent),
      pass: true,
      info: true,
    });
  }
  out.push(voteLine(summaries));
  return out;
}

/**
 * The election card says whether an honest count wins (BACKLOG-9 phase 53), and it has to be
 * right every time, for every player: a line that is wrong once teaches that it can be.
 */
function voteLine(summaries: ReadonlyMap<BotName, BotSummary>): TargetResult {
  const all = [...summaries.values()];
  const held = all.reduce((n, s) => n + s.votes.held, 0);
  const mistold = all.reduce((n, s) => n + s.votes.mistold, 0);
  const row = { bot: "all" as const, name: "the card tells the vote true", target: "every vote" };
  // A batch that held no vote, a few runs of the saint say, has nothing to check.
  if (!held) return { ...row, actual: "no votes held", pass: true, info: true };
  return { ...row, actual: mistold ? `${mistold} of ${held} told wrong` : `${held} of ${held}`, pass: mistold === 0 };
}

/**
 * The long reign's own targets (BACKLOG-5 phase 39), set during that phase, for runs of five
 * eras. Section 8's stay what they were: a long reign is the ordinary run on its setup until
 * its fourth era, so the three-era targets are measured on three-era runs as before.
 *
 * The bots see every effect before they choose, and measured against any steady pressure an
 * era can apply they offset it: draining 24 points of order and of the state over era 5 left
 * the greedy bot finishing 95% of its Decay reigns. Survival targets for competent play would
 * be set by the bots' foresight, not by the game, and how hard five centuries are for a person
 * waits on playtest records, as the difficulty of the ordinary game does. So these hold the
 * long reign's shape: a competent player usually sees it through, it does not change where the
 * country ends up, and Decay is the hardest place to spend it.
 */
export function evaluateLongTargets(summaries: ReadonlyMap<BotName, BotSummary>, lastEra: number): TargetResult[] {
  const out: TargetResult[] = [];
  const mixed = summaries.get("mixed");
  if (mixed) {
    const reached = mixed.reachedEra[lastEra] ?? 0;
    out.push({ bot: "mixed", name: `reaches era ${lastEra}`, target: "85–97%", actual: pct(reached), pass: reached >= 0.85 && reached <= 0.97 });
    out.push({ bot: "mixed", name: "sees the long finale", target: "80–95%", actual: pct(mixed.finale), pass: mixed.finale >= 0.8 && mixed.finale <= 0.95 });
    out.push({
      bot: "mixed",
      name: "reaches Ascent (exit band)",
      target: "15–30%",
      actual: pct(mixed.exitBands.ascent),
      pass: mixed.exitBands.ascent >= 0.15 && mixed.exitBands.ascent <= 0.3,
    });
    out.push(harderInDecay("mixed", mixed, 0.03));
  }
  // Careless play is where the band tells: a random run that gets this far is as good as over
  // in Decay and has a fair chance on the Ascent.
  const random = summaries.get("random");
  if (random) out.push(harderInDecay("random", random, 0.2));
  const greedy = summaries.get("greedy");
  if (greedy) {
    out.push({ bot: "greedy", name: "ends in Decay", target: "≥ 70%", actual: pct(greedy.exitBands.decay), pass: greedy.exitBands.decay >= 0.7 });
    out.push({ bot: "greedy", name: "sees the long finale", target: "(no number given)", actual: pct(greedy.finale), pass: true, info: true });
  }
  out.push(voteLine(summaries));
  return out;
}

/** Of the long reigns that reached era 4, Decay's finish at least `gap` under the Ascent's. */
function harderInDecay(bot: BotName, s: BotSummary, gap: number): TargetResult {
  const { decay, ascent } = s.longFinishByBand;
  return {
    bot,
    name: "Decay is the hard place",
    target: `finish ≥ ${Math.round(gap * 100)} pts under Ascent`,
    actual: decay === null || ascent === null ? "n/a" : `decay ${pct(decay)}, ascent ${pct(ascent)}`,
    pass: decay !== null && ascent !== null && decay <= ascent - gap,
  };
}

export function formatTargets(results: TargetResult[], title = "section 8 targets"): string {
  const lines = [`== ${title} ==`];
  for (const r of results) {
    const mark = r.info ? "INFO" : r.pass ? "PASS" : "MISS";
    lines.push(`${mark}  ${r.bot.padEnd(7)} ${r.name.padEnd(28)} target ${r.target.padEnd(18)} actual ${r.actual}`);
  }
  return lines.join("\n");
}
