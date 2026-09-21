import type { Library } from "../engine/library";
import type { Band } from "../engine/types";
import { BANDS, METER_KEYS } from "../engine/types";
import type { BotName } from "./bots";
import type { RunResult } from "./run";

export interface Quantiles {
  min: number;
  p10: number;
  median: number;
  mean: number;
  p90: number;
  max: number;
}

export interface BotSummary {
  bot: BotName;
  runs: number;
  cards: Quantiles;
  drift: Quantiles;
  /** Fraction of runs that ended while still in era 1. */
  endedBeforeEra2: number;
  /** Fraction of runs that survived to a finale. */
  finale: number;
  /** Fraction of runs ending in each era. */
  byEra: Record<number, number>;
  /** Ending id -> fraction of runs, sorted descending. */
  endings: [string, number][];
  /** Exit band -> fraction of runs. */
  exitBands: Record<Band, number>;
  /** Exit band among finale runs only (empty if none). */
  finaleBands: Record<Band, number>;
  electionsPerRun: number;
  cheatsPerElection: number;
  arcsPerRun: number;
  relaxedPerRun: { cooldown: number; band: number; era: number };
}

export function quantiles(values: number[]): Quantiles {
  if (values.length === 0) return { min: 0, p10: 0, median: 0, mean: 0, p90: 0, max: 0 };
  const v = [...values].sort((a, b) => a - b);
  const at = (q: number) => v[Math.min(v.length - 1, Math.floor(q * v.length))]!;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return { min: v[0]!, p10: at(0.1), median: at(0.5), mean, p90: at(0.9), max: v[v.length - 1]! };
}

function bandShares(results: RunResult[]): Record<Band, number> {
  const out: Record<Band, number> = { decay: 0, muddle: 0, ascent: 0 };
  if (results.length === 0) return out;
  for (const r of results) out[r.exitBand] += 1;
  for (const b of BANDS) out[b] /= results.length;
  return out;
}

export function summarize(bot: BotName, results: RunResult[]): BotSummary {
  const n = results.length;
  const endingCounts = new Map<string, number>();
  const byEraCounts = new Map<number, number>();
  let elections = 0;
  let cheats = 0;
  let arcs = 0;
  const relaxed = { cooldown: 0, band: 0, era: 0 };
  for (const r of results) {
    endingCounts.set(r.endingId, (endingCounts.get(r.endingId) ?? 0) + 1);
    byEraCounts.set(r.era, (byEraCounts.get(r.era) ?? 0) + 1);
    elections += r.electionsSeen;
    cheats += r.cheats;
    arcs += r.arcs;
    relaxed.cooldown += r.relaxed.cooldown;
    relaxed.band += r.relaxed.band;
    relaxed.era += r.relaxed.era;
  }
  const byEra: Record<number, number> = {};
  for (const [era, c] of [...byEraCounts.entries()].sort((a, b) => a[0] - b[0])) byEra[era] = c / n;
  return {
    bot,
    runs: n,
    cards: quantiles(results.map((r) => r.cards)),
    drift: quantiles(results.map((r) => r.drift)),
    endedBeforeEra2: results.filter((r) => r.era === 1).length / n,
    finale: results.filter((r) => r.finale).length / n,
    byEra,
    endings: [...endingCounts.entries()].map(([id, c]) => [id, c / n] as [string, number]).sort((a, b) => b[1] - a[1]),
    exitBands: bandShares(results),
    finaleBands: bandShares(results.filter((r) => r.finale)),
    electionsPerRun: elections / n,
    cheatsPerElection: elections > 0 ? cheats / elections : 0,
    arcsPerRun: arcs / n,
    relaxedPerRun: { cooldown: relaxed.cooldown / n, band: relaxed.band / n, era: relaxed.era / n },
  };
}

export const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const f1 = (x: number): string => x.toFixed(1);

export function formatSummary(s: BotSummary): string {
  const lines: string[] = [];
  lines.push(`== ${s.bot} bot (${s.runs} runs) ==`);
  lines.push(
    `cards   median ${s.cards.median}  mean ${f1(s.cards.mean)}  p10 ${s.cards.p10}  p90 ${s.cards.p90}  min ${s.cards.min}  max ${s.cards.max}`,
  );
  lines.push(`drift   median ${s.drift.median}  mean ${f1(s.drift.mean)}  p10 ${s.drift.p10}  p90 ${s.drift.p90}`);
  lines.push(
    `ended   before era 2: ${pct(s.endedBeforeEra2)}   reached finale: ${pct(s.finale)}   by era: ${Object.entries(s.byEra)
      .map(([e, v]) => `e${e} ${pct(v)}`)
      .join(", ")}`,
  );
  lines.push(`exit band   decay ${pct(s.exitBands.decay)}  muddle ${pct(s.exitBands.muddle)}  ascent ${pct(s.exitBands.ascent)}`);
  if (s.finale > 0) {
    lines.push(
      `finale band decay ${pct(s.finaleBands.decay)}  muddle ${pct(s.finaleBands.muddle)}  ascent ${pct(s.finaleBands.ascent)}`,
    );
  }
  lines.push(`elections   ${f1(s.electionsPerRun)} per run, cheated ${pct(s.cheatsPerElection)} of them   arcs ${f1(s.arcsPerRun)} per run`);
  lines.push(
    `relaxed draws per run   cooldown ${f1(s.relaxedPerRun.cooldown)}  band ${f1(s.relaxedPerRun.band)}  era ${f1(s.relaxedPerRun.era)}`,
  );
  lines.push("endings");
  for (const [id, share] of s.endings) lines.push(`  ${id.padEnd(18)} ${pct(share).padStart(6)}`);
  return lines.join("\n");
}

export function formatContentStats(lib: Library): string {
  const cards = lib.content.cards;
  const byType = new Map<string, number>();
  for (const c of cards) byType.set(c.type, (byType.get(c.type) ?? 0) + 1);
  const lines: string[] = [];
  lines.push(
    `content: ${cards.length} cards (${[...byType.entries()].map(([t, n]) => `${n} ${t}`).join(", ")}), ${lib.arcs.size} arcs, ${lib.endings.size} endings, ${lib.epilogues.length} epilogues`,
  );
  lines.push("event pool by era x band (own-align cards + any-align cards):");
  for (const era of lib.eras) {
    const cells = BANDS.map((band) => {
      const left = lib.eventPool.get(`${era}:${band}:left`)?.length ?? 0;
      const right = lib.eventPool.get(`${era}:${band}:right`)?.length ?? 0;
      const any = lib.eventPool.get(`${era}:${band}:any`)?.length ?? 0;
      return `${band} L${left}+${any} R${right}+${any}`;
    });
    lines.push(`  era ${era}: ${cells.join("   ")}`);
  }
  // Per-side effect budget: the dial for the section 5.2 rule that temptation pays now
  // and honesty pays later. Tune content against these numbers, not by feel.
  const choices = cards.filter((c) => c.type === "event").flatMap((c) => [c.left, c.right]);
  const tempting = choices.filter((ch) => (ch.drift ?? 0) < 0);
  const honest = choices.filter((ch) => (ch.drift ?? 0) > 0);
  const neutral = choices.filter((ch) => (ch.drift ?? 0) === 0);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const perMeter = (list: typeof choices) => METER_KEYS.map((k) => avg(list.map((ch) => ch.fx?.[k] ?? 0)));
  const total = (list: typeof choices) => avg(list.map((ch) => METER_KEYS.reduce((a, k) => a + (ch.fx?.[k] ?? 0), 0)));
  const row = (label: string, list: typeof choices) =>
    `  ${label.padEnd(9)} n=${String(list.length).padStart(3)}  drift ${avg(list.map((ch) => ch.drift ?? 0))
      .toFixed(2)
      .padStart(6)}  ${METER_KEYS.map((k, i) => `${k} ${perMeter(list)[i]!.toFixed(2).padStart(5)}`).join("  ")}  total ${total(list).toFixed(2).padStart(6)}`;
  lines.push("event choice budget (mean per choice):");
  lines.push(row("tempting", tempting));
  lines.push(row("honest", honest));
  if (neutral.length) lines.push(row("neutral", neutral));
  lines.push(row("all", choices));
  const enq = (list: typeof choices) => list.filter((ch) => (ch.enqueue?.length ?? 0) > 0).length;
  lines.push(`  delayed consequences: ${enq(tempting)}/${tempting.length} tempting, ${enq(honest)}/${honest.length} honest`);
  return lines.join("\n");
}
