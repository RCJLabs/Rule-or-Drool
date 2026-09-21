import type { BotName } from "./bots";
import { pct, type BotSummary } from "./report";

/**
 * Acceptance targets from TRANSFER.md section 8. These are starting values; phase 4
 * tunes content until they pass.
 */
export interface TargetResult {
  bot: BotName;
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
  return out;
}

export function formatTargets(results: TargetResult[]): string {
  const lines = ["== section 8 targets =="];
  for (const r of results) {
    const mark = r.info ? "INFO" : r.pass ? "PASS" : "MISS";
    lines.push(`${mark}  ${r.bot.padEnd(7)} ${r.name.padEnd(28)} target ${r.target.padEnd(18)} actual ${r.actual}`);
  }
  return lines.join("\n");
}
