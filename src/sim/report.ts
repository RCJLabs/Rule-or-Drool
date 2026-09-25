import { DEFAULT_CONFIG } from "../engine/config";
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
  /** Fraction of runs that reached each era, whatever became of them there (BACKLOG-5 phase 39). */
  reachedEra: Record<number, number>;
  /**
   * Of the runs that reached a long reign's fourth era, the share that saw its finale, by the
   * band the first three eras locked in; null for a band no such run was in (BACKLOG-5 phase 39).
   */
  longFinishByBand: Record<Band, number | null>;
  /** Ending id -> fraction of runs, sorted descending. */
  endings: [string, number][];
  /** Exit band -> fraction of runs. */
  exitBands: Record<Band, number>;
  /** Exit band among finale runs only (empty if none). */
  finaleBands: Record<Band, number>;
  electionsPerRun: number;
  cheatsPerElection: number;
  /** Campaign cards per run, and the share campaigned the easy way (BACKLOG-10 phase 56). */
  campaignsPerRun: number;
  easyCampaigns: number;
  /** Every vote held, and those the card told wrong (BACKLOG-9 phase 53). */
  votes: { held: number; mistold: number };
  arcsPerRun: number;
  questionsPerRun: number;
  relaxedPerRun: { cooldown: number; band: number; era: number };
  /** Each cabinet advisor -> the share of runs they held their role in at some point, fewest first. */
  served: [string, number][];
  /** Each crisis -> the share of runs that inherited it, most first. */
  crises: [string, number][];
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
  let mistold = 0;
  let arcs = 0;
  let questions = 0;
  const relaxed = { cooldown: 0, band: 0, era: 0 };
  const served = new Map<string, number>();
  const crises = new Map<string, number>();
  for (const r of results) {
    for (const id of r.served) served.set(id, (served.get(id) ?? 0) + 1);
    // Setup draws the crisis first, so it leads the list (5.9).
    const crisis = r.modifiers[0];
    if (crisis) crises.set(crisis, (crises.get(crisis) ?? 0) + 1);
    endingCounts.set(r.endingId, (endingCounts.get(r.endingId) ?? 0) + 1);
    byEraCounts.set(r.era, (byEraCounts.get(r.era) ?? 0) + 1);
    elections += r.electionsSeen;
    cheats += r.cheats;
    mistold += r.mistold;
    arcs += r.arcs;
    questions += r.questions;
    relaxed.cooldown += r.relaxed.cooldown;
    relaxed.band += r.relaxed.band;
    relaxed.era += r.relaxed.era;
  }
  const byEra: Record<number, number> = {};
  for (const [era, c] of [...byEraCounts.entries()].sort((a, b) => a[0] - b[0])) byEra[era] = c / n;
  const reachedEra: Record<number, number> = {};
  const lastEra = Math.max(0, ...results.map((r) => r.era));
  for (let era = 1; era <= lastEra; era++) reachedEra[era] = results.filter((r) => r.era >= era).length / n;
  const long = results.filter((r) => r.era >= LONG_VIEW_ERA);
  const longFinishByBand = Object.fromEntries(
    BANDS.map((b) => {
      const inBand = long.filter((r) => r.exitBand === b);
      return [b, inBand.length ? inBand.filter((r) => r.finale).length / inBand.length : null];
    }),
  ) as Record<Band, number | null>;
  const campaigns = results.reduce((a, r) => a + r.campaigns, 0);
  return {
    bot,
    runs: n,
    cards: quantiles(results.map((r) => r.cards)),
    drift: quantiles(results.map((r) => r.drift)),
    endedBeforeEra2: results.filter((r) => r.era === 1).length / n,
    finale: results.filter((r) => r.finale).length / n,
    byEra,
    reachedEra,
    longFinishByBand,
    endings: [...endingCounts.entries()].map(([id, c]) => [id, c / n] as [string, number]).sort((a, b) => b[1] - a[1]),
    exitBands: bandShares(results),
    finaleBands: bandShares(results.filter((r) => r.finale)),
    electionsPerRun: elections / n,
    cheatsPerElection: elections > 0 ? cheats / elections : 0,
    campaignsPerRun: campaigns / n,
    easyCampaigns: campaigns > 0 ? results.reduce((a, r) => a + r.easyCampaigns, 0) / campaigns : 0,
    votes: { held: elections, mistold },
    arcsPerRun: arcs / n,
    questionsPerRun: questions / n,
    relaxedPerRun: { cooldown: relaxed.cooldown / n, band: relaxed.band / n, era: relaxed.era / n },
    served: [...served.entries()].map(([id, c]) => [id, c / n] as [string, number]).sort((a, b) => a[1] - b[1]),
    crises: [...crises.entries()].map(([id, c]) => [id, c / n] as [string, number]).sort((a, b) => b[1] - a[1]),
  };
}

/** The first era only a long reign reaches. */
const LONG_VIEW_ERA = DEFAULT_CONFIG.eraCount + 1;

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
  if ((s.reachedEra[LONG_VIEW_ERA] ?? 0) > 0) {
    const eras = Object.entries(s.reachedEra).map(([e, v]) => `e${e} ${pct(v)}`).join(", ");
    const fin = BANDS.map((b) => `${b} ${s.longFinishByBand[b] === null ? "-" : pct(s.longFinishByBand[b]!)}`).join("  ");
    lines.push(`long reign  reached ${eras}   finished from era ${LONG_VIEW_ERA}: ${fin}`);
  }
  if (s.finale > 0) {
    lines.push(
      `finale band decay ${pct(s.finaleBands.decay)}  muddle ${pct(s.finaleBands.muddle)}  ascent ${pct(s.finaleBands.ascent)}`,
    );
  }
  lines.push(`elections   ${f1(s.electionsPerRun)} per run, cheated ${pct(s.cheatsPerElection)} of them   stories ${f1(s.arcsPerRun)}, questions ${f1(s.questionsPerRun)} per run`);
  lines.push(`campaigns   ${f1(s.campaignsPerRun)} cards per run, the easy way ${pct(s.easyCampaigns)} of them`);
  lines.push(
    `relaxed draws per run   cooldown ${f1(s.relaxedPerRun.cooldown)}  band ${f1(s.relaxedPerRun.band)}  era ${f1(s.relaxedPerRun.era)}`,
  );
  const fewest = s.served[0];
  const most = s.served[s.served.length - 1];
  if (fewest && most) {
    lines.push(`cabinet     ${s.served.length} advisors, each served in ${pct(fewest[1])}–${pct(most[1])} of runs (fewest ${fewest[0]}, most ${most[0]})`);
  }
  const common = s.crises[0];
  if (common) lines.push(`crises      ${s.crises.length} inherited, the most common in ${pct(common[1])} of runs (${common[0]})`);
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
