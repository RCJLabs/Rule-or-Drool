import type { Library } from "../engine/library";
import type { BotName } from "../sim/bots";
import { pct, quantiles, type Quantiles } from "../sim/report";
import type { RunResult } from "../sim/run";
import { RUN_KINDS, type RecordedRun, type RecordFile, type RunKind, type TakenCard } from "./record";
import type { Trace } from "./trace";

/**
 * What the people in a playtest did, beside what the bots did with the same runs
 * (BACKLOG-5 phase 31). Pure: `scripts/playtests.ts` reads the files and plays the bots.
 *
 * Every number the game has been tuned on came from a bot that sees the exact meters on
 * both sides of a card. The same runs are played again here by each bot, from the codes the
 * testers played, so the comparison is run for run rather than one crowd against another.
 */

export interface Source {
  name: string;
  file: RecordFile;
}

export interface Player {
  /**
   * The files this player sent. Files that share a run are taken to be one player's: a
   * record is sent whole, so a second send repeats the first; and two people matching a
   * run card for card, to the millisecond, is not a thing that happens.
   */
  files: string[];
  runs: RecordedRun[];
}

export interface Gathered {
  players: Player[];
  /** Runs counted once each. */
  runs: number;
  /** Runs that were in more than one file and counted once. */
  repeats: number;
}

/**
 * What a playtest's runs were dealt from, beside the deck this report runs on (BACKLOG-8
 * phase 49).
 */
export interface DeckCount {
  /** The deck this version of the game deals from. */
  stamp: string;
  /** Runs dealt from it: stamped with it, or from before stamps and dealt again card for card. */
  kept: number;
  /** Runs stamped with another deck, by deck, most first. */
  other: [deck: string, runs: number][];
  /** Runs from before stamps that this deck does not deal again, or that stopped too soon to tell. */
  unverified: number;
}

/**
 * Only the runs dealt from this deck. A run from another is a different run by the 13th card,
 * the median over 2,000 seeds when phase 48's stories came, so set beside the bots here it
 * would be set beside runs nobody played. A stamped run is kept on its stamp. A run from
 * before stamps is kept when this version deals it again card for card, which only a
 * finished run can show. Every run left out is counted, and none reaches a table.
 */
export function onThisDeck(g: Gathered, stamp: string, rebuilds: (run: RecordedRun) => boolean): { gathered: Gathered; decks: DeckCount } {
  const other = new Map<string, number>();
  let unverified = 0;
  const keep = (run: RecordedRun): boolean => {
    if (run.deck) {
      if (run.deck === stamp) return true;
      other.set(run.deck, (other.get(run.deck) ?? 0) + 1);
      return false;
    }
    if (run.end && rebuilds(run)) return true;
    unverified++;
    return false;
  };
  const players = g.players.map((p) => ({ files: p.files, runs: p.runs.filter(keep) })).filter((p) => p.runs.length > 0);
  const kept = players.reduce((n, p) => n + p.runs.length, 0);
  return {
    gathered: { players, runs: kept, repeats: g.repeats },
    decks: { stamp, kept, other: [...other].sort((a, b) => b[1] - a[1]), unverified },
  };
}

const fingerprint = (r: RecordedRun): string => `${r.code}|${r.kind}|${r.run}|${r.cards.map((c) => `${c.card}.${c.side}.${c.ms}`).join(",")}`;

export function gather(sources: readonly Source[]): Gathered {
  const parent = sources.map((_, i) => i);
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i]!)));
  const holder = new Map<string, number>();
  sources.forEach((s, i) => {
    for (const r of s.file.runs) {
      const key = fingerprint(r);
      const j = holder.get(key);
      if (j === undefined) holder.set(key, i);
      else parent[root(i)] = root(j);
    }
  });

  const groups = new Map<number, Player>();
  const counted = new Set<string>();
  let repeats = 0;
  sources.forEach((s, i) => {
    const g = root(i);
    const player = groups.get(g) ?? { files: [], runs: [] };
    groups.set(g, player);
    player.files.push(s.name);
    for (const r of s.file.runs) {
      const key = fingerprint(r);
      if (counted.has(key)) {
        repeats++;
        continue;
      }
      counted.add(key);
      player.runs.push(r);
    }
  });
  const players = [...groups.values()];
  // Stable, so runs sharing a number (one left unfinished, then the next) keep their order.
  for (const p of players) p.runs.sort((a, b) => a.run - b.run);
  return { players, runs: counted.size, repeats };
}

interface Ended {
  ending: string;
  era: number;
  cards: number;
}

export interface Outcomes {
  runs: number;
  /** Share of runs that survived every era. */
  finale: number;
  /** Share of runs over while still in the first era. */
  era1: number;
  cards: Quantiles;
  /** Ending id -> runs. */
  endings: Map<string, number>;
}

function outcomes(lib: Library, ended: readonly Ended[]): Outcomes {
  const endings = new Map<string, number>();
  for (const e of ended) endings.set(e.ending, (endings.get(e.ending) ?? 0) + 1);
  const n = Math.max(1, ended.length);
  return {
    runs: ended.length,
    finale: ended.filter((e) => e.ending.startsWith(lib.config.finalePrefix)).length / n,
    era1: ended.filter((e) => e.era === 1).length / n,
    cards: quantiles(ended.map((e) => e.cards)),
    endings,
  };
}

export interface Timing {
  /** Decisions timed. A card left and come back to is not: its clock restarted. */
  decisions: number;
  resumed: number;
  ms: Quantiles;
  /**
   * Share of decisions where a side's preview was up for at least `lookMs`. A drag shows the
   * preview of the side it is going to all the way to the commit, so a slow swipe counts.
   */
  looked: number;
  /**
   * Share where the side not taken was looked at. Nothing in the gesture shows that side on
   * the way to a choice, so this is the one that says the player weighed the other way.
   */
  lookedOther: number;
  byEra: { era: number; n: number; median: number }[];
  byType: { type: string; n: number; median: number }[];
}

export interface Stage {
  label: string;
  runs: number;
  finale: number;
  medianCards: number;
  medianMs: number;
}

export interface Hesitation {
  card: string;
  type: string;
  /** Decisions made on it, and by how many players. */
  n: number;
  players: number;
  /** Median of (time on this card / that player's median time on a card). */
  ratio: number;
  medianMs: number;
  /** Share of its decisions where the side not taken was looked at. */
  other: number;
  left: number;
  text: string;
}

/**
 * Where the country ended up, one row per player kind: people's finished runs by the band the
 * record says they ended in, each bot's by the runs it replayed (BACKLOG-7 phase 46).
 */
export interface BandRow {
  label: string;
  runs: number;
  ascent: number;
  muddle: number;
  decay: number;
}

/**
 * How the votes went. The mixed bot cheats two in three of its votes, and two in three of
 * those it would have won honestly, because a meter was near its edge and the cheat is easier
 * on the meters. A bot that never cheats a vote it can win reaches the Ascent twice as often
 * (BACKLOG-7's audit), so this is the row that says which of the two people are.
 */
export interface VoteRow {
  label: string;
  runs: number;
  votes: number;
  /** Share of votes cheated. */
  cheated: number;
  /** Of the cheated votes, the share an honest vote would have won. NaN with none cheated. */
  winnable: number;
  /** Of those, the share cast with a meter near its edge. NaN with none. */
  near: number;
}

/** The look each card was read in, -3 to 3, and how often it changed in a run. */
export interface LookRow {
  label: string;
  runs: number;
  cards: number;
  /** Share of cards in each look, deepest Decay first. */
  share: number[];
  /** Changes of look in a run, the median. */
  changes: number;
}

/** Runs walked card by card (`src/playtest/trace.ts`): what the votes and looks are read from. */
export interface Traces {
  /** People's finished runs that this version rebuilt card for card. */
  people: readonly Trace[];
  /** Each bot's walk of the runs it replayed. */
  bots: ReadonlyMap<BotName, readonly Trace[]>;
}

export interface Report {
  files: number;
  players: number;
  runs: number;
  finished: number;
  unfinished: number;
  repeats: number;
  versions: string[];
  decks: DeckCount | null;
  kinds: Record<RunKind, number>;
  humans: Outcomes;
  /** Each bot on the finished runs whose code this version of the game can still start. */
  bots: { bot: BotName; out: Outcomes }[];
  replayed: number;
  learning: Stage[];
  timing: Timing;
  hesitation: Hesitation[];
  /** The cards runs ended on, for runs that did not reach a finale. */
  lastCards: { card: string; ending: string; n: number }[];
  bands: BandRow[];
  /** People's finished runs this version rebuilt card for card, out of `finished`. */
  rebuilt: number;
  votes: VoteRow[];
  looks: LookRow[];
  lookMs: number;
  minDecisions: number;
}

export interface ReportOptions {
  files: number;
  replayed: number;
  /** How long a preview has to be up to count as looked at. */
  lookMs: number;
  /** Fewest decisions on a card before it can be called one people hesitate on. */
  minDecisions: number;
  /** Which decks the runs came from, when they were sorted by deck first (BACKLOG-8 phase 49). */
  decks?: DeckCount;
}

const median = (xs: readonly number[]): number => quantiles([...xs]).median;

interface Decision {
  player: number;
  run: RecordedRun;
  era: number;
  card: TakenCard;
}

const STAGES: [string, (n: number) => boolean][] = [
  ["1st run", (n) => n === 1],
  ["2nd run", (n) => n === 2],
  ["3rd-5th", (n) => n >= 3 && n <= 5],
  ["6th-10th", (n) => n >= 6 && n <= 10],
  ["11th on", (n) => n >= 11],
];

const share = (n: number, of: number): number => (of > 0 ? n / of : Number.NaN);

function bandRow(label: string, bands: readonly string[]): BandRow {
  const n = (b: string) => share(bands.filter((x) => x === b).length, bands.length);
  return { label, runs: bands.length, ascent: n("ascent"), muddle: n("muddle"), decay: n("decay") };
}

function voteRow(label: string, traces: readonly Trace[]): VoteRow {
  const votes = traces.flatMap((t) => t.votes);
  const cheats = votes.filter((v) => !v.honest);
  const winnable = cheats.filter((v) => v.winnable);
  return {
    label,
    runs: traces.length,
    votes: votes.length,
    cheated: share(cheats.length, votes.length),
    winnable: share(winnable.length, cheats.length),
    near: share(winnable.filter((v) => v.near).length, winnable.length),
  };
}

function lookRow(label: string, traces: readonly Trace[]): LookRow {
  const looks = traces.flatMap((t) => t.looks);
  const changes = traces.map((t) => t.looks.filter((l, i) => i > 0 && l !== t.looks[i - 1]).length);
  return {
    label,
    runs: traces.length,
    cards: looks.length,
    share: [-3, -2, -1, 0, 1, 2, 3].map((stage) => share(looks.filter((l) => l === stage).length, looks.length)),
    changes: traces.length ? median(changes) : Number.NaN,
  };
}

export function buildReport(lib: Library, g: Gathered, bots: ReadonlyMap<BotName, readonly RunResult[]>, opts: ReportOptions, traces: Traces = { people: [], bots: new Map() }): Report {
  const runs = g.players.flatMap((p) => p.runs);
  const finished = runs.filter((r) => r.end !== null);
  const kinds = Object.fromEntries(RUN_KINDS.map((k) => [k, runs.filter((r) => r.kind === k).length])) as Record<RunKind, number>;

  // Every decision, with the era it was made in. Cards are recorded from a run's first, so
  // the n-th card of a run was played in era floor(n / eraLength) + 1, up to a long reign's
  // fifth (BACKLOG-5 phase 39); an ordinary run has no card past its third.
  const lastEra = Math.max(lib.config.eraCount, lib.config.longEraCount);
  const decisions: Decision[] = g.players.flatMap((p, player) =>
    p.runs.flatMap((run) => run.cards.map((card, i) => ({ player, run, era: Math.min(lastEra, Math.floor(i / lib.config.eraLength) + 1), card }))),
  );
  const timed = decisions.filter((d) => !d.card.resumed);
  const typeOf = (id: string) => lib.cards.get(id)?.type ?? "gone";
  const saw = (c: TakenCard, side: 0 | 1) => c.looked[side] >= opts.lookMs;
  const sawOther = (c: TakenCard) => saw(c, c.side === "left" ? 1 : 0);

  // People read at their own speed, so a card is slow for someone against their own pace,
  // not against everyone's.
  const pace = g.players.map((_, player) => median(timed.filter((d) => d.player === player).map((d) => d.card.ms)) || 1);

  const byCard = new Map<string, Decision[]>();
  for (const d of timed) {
    const list = byCard.get(d.card.card) ?? [];
    list.push(d);
    byCard.set(d.card.card, list);
  }
  const hesitation: Hesitation[] = [...byCard.entries()]
    .filter(([, ds]) => ds.length >= opts.minDecisions)
    .map(([card, ds]) => ({
      card,
      type: typeOf(card),
      n: ds.length,
      players: new Set(ds.map((d) => d.player)).size,
      ratio: median(ds.map((d) => d.card.ms / pace[d.player]!)),
      medianMs: median(ds.map((d) => d.card.ms)),
      other: ds.filter((d) => sawOther(d.card)).length / ds.length,
      left: ds.filter((d) => d.card.side === "left").length / ds.length,
      text: (lib.cards.get(card)?.text ?? "").replace(/\s+/g, " "),
    }))
    .sort((a, b) => b.ratio - a.ratio);

  const lastCounts = new Map<string, { card: string; ending: string; n: number }>();
  for (const r of finished) {
    const last = r.cards[r.cards.length - 1];
    if (!last || r.end!.ending.startsWith(lib.config.finalePrefix)) continue;
    const key = `${last.card}|${r.end!.ending}`;
    const row = lastCounts.get(key) ?? { card: last.card, ending: r.end!.ending, n: 0 };
    row.n++;
    lastCounts.set(key, row);
  }

  const eras = [...new Set(timed.map((d) => d.era))].sort((a, b) => a - b);
  const types = [...new Set(timed.map((d) => typeOf(d.card.card)))].sort();
  return {
    files: opts.files,
    players: g.players.length,
    runs: runs.length,
    finished: finished.length,
    unfinished: runs.length - finished.length,
    repeats: g.repeats,
    versions: [...new Set(runs.map((r) => r.game))].sort(),
    decks: opts.decks ?? null,
    kinds,
    humans: outcomes(lib, finished.map((r) => r.end!)),
    bots: [...bots.entries()].map(([bot, results]) => ({ bot, out: outcomes(lib, results.map((r) => ({ ending: r.endingId, era: r.era, cards: r.cards }))) })),
    replayed: opts.replayed,
    learning: STAGES.map(([label, test]) => {
      const rs = finished.filter((r) => test(r.run));
      const ds = timed.filter((d) => test(d.run.run));
      return {
        label,
        runs: rs.length,
        finale: rs.length ? rs.filter((r) => r.end!.ending.startsWith(lib.config.finalePrefix)).length / rs.length : 0,
        medianCards: median(rs.map((r) => r.end!.cards)),
        medianMs: median(ds.map((d) => d.card.ms)),
      };
    }).filter((s) => s.runs > 0),
    timing: {
      decisions: timed.length,
      resumed: decisions.length - timed.length,
      ms: quantiles(timed.map((d) => d.card.ms)),
      looked: timed.length ? timed.filter((d) => saw(d.card, 0) || saw(d.card, 1)).length / timed.length : 0,
      lookedOther: timed.length ? timed.filter((d) => sawOther(d.card)).length / timed.length : 0,
      byEra: eras.map((era) => {
        const ds = timed.filter((d) => d.era === era);
        return { era, n: ds.length, median: median(ds.map((d) => d.card.ms)) };
      }),
      byType: types.map((type) => {
        const ds = timed.filter((d) => typeOf(d.card.card) === type);
        return { type, n: ds.length, median: median(ds.map((d) => d.card.ms)) };
      }),
    },
    hesitation,
    lastCards: [...lastCounts.values()].sort((a, b) => b.n - a.n),
    bands: [bandRow("people", finished.map((r) => r.end!.band)), ...[...bots.entries()].map(([bot, results]) => bandRow(`${bot} bot`, results.map((r) => r.exitBand)))],
    rebuilt: traces.people.length,
    votes: [voteRow("people", traces.people), ...[...traces.bots.entries()].map(([bot, ts]) => voteRow(`${bot} bot`, ts))],
    looks: [lookRow("people", traces.people), ...[...traces.bots.entries()].map(([bot, ts]) => lookRow(`${bot} bot`, ts))],
    lookMs: opts.lookMs,
    minDecisions: opts.minDecisions,
  };
}

const secs = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;
const LOOK_NAMES = ["decay3", "decay2", "decay1", "muddle", "ascent1", "ascent2", "ascent3"] as const;
const pad = (s: string | number, n: number): string => String(s).padStart(n);
const cut = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function formatReport(r: Report, top = 10): string {
  const out: string[] = [];
  const kinds = RUN_KINDS.filter((k) => r.kinds[k] > 0).map((k) => `${r.kinds[k]} ${k}`).join(", ");
  const n = (count: number, one: string) => `${count} ${one}${count === 1 ? "" : "s"}`;
  out.push(`rule-or-drool playtests: ${n(r.files, "file")}, ${n(r.players, "player")}, ${n(r.runs, "run")} (${kinds})`);
  out.push(`${r.finished} finished, ${r.unfinished} left for another run, ${r.repeats} repeated across files and counted once. Game ${r.versions.join(", ")}.`);
  if (r.decks) {
    const d = r.decks;
    const gone = d.other.reduce((s, [, k]) => s + k, 0);
    out.push(`Dealt from this version's deck, ${d.stamp}: ${n(d.kept, "run")}, the only ones below.`);
    if (gone) out.push(`Left out, dealt from other decks: ${d.other.map(([deck, k]) => `${deck} ${k}`).join(", ")}. Run the report on the version that dealt them.`);
    if (d.unverified) out.push(`Left out, from before decks were stamped: ${n(d.unverified, "run")} this deck does not deal again card for card, or that stopped too soon to tell.`);
  }
  out.push("");

  out.push(`== survival: people, and each bot playing the same ${r.replayed} runs ==`);
  out.push(`${"".padEnd(10)} ${pad("runs", 5)} ${pad("finale", 7)} ${pad("era 1", 7)} ${pad("median", 7)} ${pad("p10", 5)} ${pad("p90", 5)}`);
  const row = (label: string, o: Outcomes) =>
    `${label.padEnd(10)} ${pad(o.runs, 5)} ${pad(pct(o.finale), 7)} ${pad(pct(o.era1), 7)} ${pad(o.cards.median, 7)} ${pad(o.cards.p10, 5)} ${pad(o.cards.p90, 5)}`;
  out.push(row("people", r.humans));
  for (const b of r.bots) out.push(row(`${b.bot} bot`, b.out));
  out.push("(median, p10 and p90 are cards played)");
  out.push("");

  const or = (x: number) => (Number.isFinite(x) ? pct(x) : "–");
  out.push("== where the country ends up ==");
  out.push(`${"".padEnd(10)} ${pad("runs", 5)} ${pad("Ascent", 7)} ${pad("Muddle", 7)} ${pad("Decay", 7)}`);
  for (const b of r.bands) out.push(`${b.label.padEnd(10)} ${pad(b.runs, 5)} ${pad(or(b.ascent), 7)} ${pad(or(b.muddle), 7)} ${pad(or(b.decay), 7)}`);
  out.push("");

  out.push(`== elections: people's ${r.rebuilt} of ${r.finished} finished runs, rebuilt on this version ==`);
  out.push(`${"".padEnd(10)} ${pad("runs", 5)} ${pad("votes", 6)} ${pad("cheated", 8)} ${pad("of those, winnable", 19)} ${pad("and a meter near its edge", 26)}`);
  for (const v of r.votes) {
    out.push(`${v.label.padEnd(10)} ${pad(v.runs, 5)} ${pad(v.votes, 6)} ${pad(or(v.cheated), 8)} ${pad(or(v.winnable), 19)} ${pad(or(v.near), 26)}`);
  }
  out.push("(winnable: an honest vote would have won that day. Near its edge: a meter within 25 of the edge that ends a run,");
  out.push(" where the mixed bot turns greedy. A run this version deals differently is left out of the people's row.)");
  out.push("");

  if (r.learning.length) {
    out.push("== over a player's runs ==");
    for (const s of r.learning) {
      out.push(`${s.label.padEnd(10)} ${pad(s.runs, 4)} runs  finale ${pad(pct(s.finale), 6)}  median ${pad(s.medianCards, 3)} cards  ${secs(s.medianMs)} a card`);
    }
    out.push("");
  }

  out.push("== where runs end ==");
  const mixed = r.bots.find((b) => b.bot === "mixed");
  const ids = [...r.humans.endings.entries()].sort((a, b) => b[1] - a[1]);
  for (const [id, n] of ids) {
    const bot = mixed ? `  mixed bot ${pad(pct((mixed.out.endings.get(id) ?? 0) / Math.max(1, mixed.out.runs)), 6)}` : "";
    out.push(`${id.padEnd(18)} ${pad(n, 4)}  ${pad(pct(n / Math.max(1, r.humans.runs)), 6)}${bot}`);
  }
  if (r.lastCards.length) {
    out.push("the cards they ended on:");
    for (const c of r.lastCards.slice(0, top)) out.push(`  ${pad(c.n, 3)}  ${c.card.padEnd(34)} ${c.ending}`);
  }
  out.push("");

  out.push("== the look each card was read in ==");
  out.push(`${"".padEnd(10)} ${pad("cards", 6)} ${LOOK_NAMES.map((l) => pad(l, 8)).join(" ")} ${pad("changes a run", 14)}`);
  for (const l of r.looks) {
    out.push(`${l.label.padEnd(10)} ${pad(l.cards, 6)} ${l.share.map((x) => pad(or(x), 8)).join(" ")} ${pad(Number.isFinite(l.changes) ? l.changes : "–", 14)}`);
  }
  out.push("");

  const t = r.timing;
  out.push(`== time on a card (${t.decisions} decisions; ${t.resumed} left and come back to are not timed) ==`);
  out.push(`median ${secs(t.ms.median)}  p10 ${secs(t.ms.p10)}  p90 ${secs(t.ms.p90)}  longest ${secs(t.ms.max)}`);
  out.push(`looked at the side they did not take (${r.lookMs}ms or more): ${pct(t.lookedOther)} of decisions`);
  out.push(`looked at either side: ${pct(t.looked)} (a slow swipe counts: it shows the side it is going to)`);
  out.push(`by era:  ${t.byEra.map((e) => `era ${e.era} ${secs(e.median)} (${e.n})`).join("   ")}`);
  out.push(`by card: ${t.byType.map((e) => `${e.type} ${secs(e.median)} (${e.n})`).join("   ")}`);
  out.push("");

  out.push(`== cards people hesitate on (${r.minDecisions}+ decisions; time against each player's own median) ==`);
  if (!r.hesitation.length) out.push(`none yet: no card has ${r.minDecisions} timed decisions.`);
  for (const h of r.hesitation.slice(0, top)) {
    out.push(
      `${pad(h.ratio.toFixed(2), 5)}x  ${h.card.padEnd(34)} ${pad(h.n, 3)} by ${h.players}  ${secs(h.medianMs)}  other side ${pad(pct(h.other), 6)}  left ${pad(pct(h.left), 6)}  ${cut(h.text, 60)}`,
    );
  }
  return out.join("\n");
}
