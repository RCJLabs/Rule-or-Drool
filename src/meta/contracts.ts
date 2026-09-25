import { STRINGS } from "../content/strings";
import { DEFAULT_CONFIG } from "../engine/config";
import { MANDATES_BY_ID, holds } from "../engine/mandates";
import { WON_BACK_FLAG } from "../engine/opposition";
import { makeRng } from "../engine/rng";
import { BLOC_KEYS, PLAYER_ALIGNS, type Band, type GameState } from "../engine/types";
import { FIRST_DAILY, dayIndex, dayKey } from "./daily";
import { LEGACIES } from "./legacies";
import type { ContractWeek, MetaState } from "./types";

/**
 * Weekly contracts (BACKLOG-10 phase 60): three a week, the same for everyone, dealt from the
 * week's number the way the daily is dealt from its day, with no server. Past the tenth run the
 * daily was the only thing that changed; a contract is a reason to play a reign a particular way.
 *
 * A contract asks only for what the screen shows a person: the side they lead, how the reign
 * ends, the votes they cheat or do not, the promise they took, and what the country is left
 * carrying. Each was measured by how often a competent player who aims at it gets it in one
 * run (`npm run contracts`): the easy one in half the runs or more, the fair one every two to
 * five runs, the hard one every five to fourteen.
 */

export type Tier = "easy" | "fair" | "hard";
export const TIERS: readonly Tier[] = ["easy", "fair", "hard"];

export interface Contract {
  /** The template and its parameter, `${key}:${param}` or the key alone: stable across versions. */
  id: string;
  tier: Tier;
  /** What it asks, as the player reads it. */
  text: string;
}

interface Template {
  key: string;
  tier: Tier;
  /** What it can be dealt with; one is picked each time it is dealt. Empty for none. */
  params: readonly string[];
  text: (param: string) => string;
  /** The finished run, and the band it ended in, keep it. */
  keeps: (run: GameState, band: Band, param: string) => boolean;
}

const k = STRINGS.contracts;
const party = (side: string) => STRINGS.parties[side as "left" | "right"];
const finale = (run: GameState, band?: Band) => {
  const id = run.over?.endingId ?? "";
  const { finalePrefix, longFinalePrefix } = DEFAULT_CONFIG;
  return band ? id === `${finalePrefix}${band}` || id === `${longFinalePrefix}${band}` : id.startsWith(finalePrefix);
};
const clean = (run: GameState) => run.stats.electionsCheated === 0;
function legacyText(flag: string): string {
  return k.legacy.replace("{legacy}", LEGACIES[flag] ?? flag);
}

/** A vote to win: a reign with elections abolished cheats none, and should not keep a contract for it. */
const honestly = (run: GameState) => clean(run) && run.stats.electionsHonest > 0;

/**
 * The pool, by tier, with the share of runs a player aiming at each keeps it in, measured in
 * phase 60 at 500 runs a policy (BACKLOG-10 has the table). Keep a template's key once shipped:
 * the contracts a profile kept name it.
 *
 * Left out: anything that scores a policy (a question's answer is one), and anything the deal
 * decides more than the player (a story's legacy under one run in fourteen).
 */
export const CONTRACT_TEMPLATES: readonly Template[] = [
  // Easy: about half the runs or more.
  { key: "ascent", tier: "easy", params: PLAYER_ALIGNS, text: (s) => k.ascent.replace("{party}", party(s)), keeps: (r, _, s) => r.align === s && finale(r, "ascent") },
  { key: "decay", tier: "easy", params: PLAYER_ALIGNS, text: (s) => k.decay.replace("{party}", party(s)), keeps: (r, _, s) => r.align === s && finale(r, "decay") },
  { key: "muddle", tier: "easy", params: PLAYER_ALIGNS, text: (s) => k.muddle.replace("{party}", party(s)), keeps: (r, _, s) => r.align === s && finale(r, "muddle") },
  { key: "clean", tier: "easy", params: [], text: () => k.clean, keeps: (r) => finale(r) && honestly(r) },
  {
    key: "promise",
    tier: "easy",
    params: ["m_clean", "m_loyal", "m_decree"],
    text: (m) => k.promise.replace("{promise}", MANDATES_BY_ID.get(m)?.title ?? m),
    keeps: (r, _, m) => holds(r, m) && finale(r),
  },
  { key: "saint", tier: "easy", params: [], text: () => k.saint, keeps: (r) => r.stats.tempting === 0 && r.cardCount >= 20 },
  // Fair: one run in two to five.
  {
    key: "promiseBroad",
    tier: "fair",
    params: [],
    text: () => k.promise.replace("{promise}", MANDATES_BY_ID.get("m_broad")?.title ?? "m_broad"),
    keeps: (r) => holds(r, "m_broad") && finale(r),
  },
  { key: "muddleClean", tier: "fair", params: [], text: () => k.muddleClean, keeps: (r) => finale(r, "muddle") && honestly(r) },
  { key: "wonBackFinale", tier: "fair", params: [], text: () => k.wonBackFinale, keeps: (r) => r.flags.includes(WON_BACK_FLAG) && finale(r) },
  { key: "ascentClean", tier: "fair", params: PLAYER_ALIGNS, text: (s) => k.ascentClean.replace("{party}", party(s)), keeps: (r, _, s) => r.align === s && finale(r, "ascent") && honestly(r) },
  { key: "legacy", tier: "fair", params: ["media_captured", "took_the_skim", "schools_starved"], text: legacyText, keeps: (r, _, f) => r.flags.includes(f) && finale(r) },
  // Hard: one run in five to fourteen.
  { key: "broad", tier: "hard", params: [], text: () => k.broad, keeps: (r) => finale(r) && BLOC_KEYS.every((b) => r.meters[b] >= 60) },
  { key: "saintEra", tier: "hard", params: [], text: () => k.saintEra, keeps: (r) => r.stats.tempting === 0 && r.cardCount >= DEFAULT_CONFIG.eraLength },
  {
    key: "legacyHard",
    tier: "hard",
    params: ["ring_started", "long_ship", "seawall", "pension_raided", "feed_captured"],
    text: legacyText,
    keeps: (r, _, f) => r.flags.includes(f) && finale(r),
  },
];

const TEMPLATES_BY_KEY = new Map(CONTRACT_TEMPLATES.map((t) => [t.key, t]));

function make(t: Template, param: string): Contract {
  return { id: param ? `${t.key}:${param}` : t.key, tier: t.tier, text: t.text(param) };
}

/** A contract by its id, or undefined for one this version does not deal. */
export function contractById(id: string): Contract | undefined {
  const [key, param = ""] = id.split(/:(.*)/s);
  const t = TEMPLATES_BY_KEY.get(key ?? "");
  if (!t || (t.params.length ? !t.params.includes(param) : param !== "")) return undefined;
  return make(t, param);
}

/**
 * The week a day falls in, numbered from the first daily's, which was a Monday: week #1 is the
 * daily's first seven days. Weeks turn over when the daily does, at midnight UTC on a Monday. A
 * day before the first week has none.
 */
export function weekNumber(day: string): number | null {
  const d = dayIndex(day) - dayIndex(FIRST_DAILY);
  return Number.isFinite(d) && d >= 0 ? Math.floor(d / 7) + 1 : null;
}

/** The Monday a week starts on. */
export function weekStart(week: number): string {
  return dayKey(dayIndex(FIRST_DAILY) + (week - 1) * 7);
}

/** The week's three contracts, one of each tier, the same on every device. */
export function contractsFor(week: number): Contract[] {
  const rng = makeRng(0x0c0ffee ^ Math.imul(week, 0x9e3779b1));
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)]!;
  return TIERS.map((tier) => {
    const t = pick(CONTRACT_TEMPLATES.filter((x) => x.tier === tier));
    return make(t, t.params.length ? pick(t.params) : "");
  });
}

/**
 * The contracts of this week a finished run keeps, of those not kept already. Only a full
 * reign counts: a first term is where a profile learns the game, before it has contracts.
 */
export function contractsKept(run: GameState, band: Band, week: number, already: readonly string[] = []): string[] {
  if (!run.over || (run.eraCount ?? DEFAULT_CONFIG.eraCount) < DEFAULT_CONFIG.eraCount) return [];
  return contractsFor(week)
    .filter((c) => !already.includes(c.id))
    .filter((c) => {
      const [key, param = ""] = c.id.split(/:(.*)/s);
      return TEMPLATES_BY_KEY.get(key!)!.keeps(run, band, param);
    })
    .map((c) => c.id);
}

/** What a profile kept in a week. */
export function keptIn(meta: Pick<MetaState, "contracts">, week: number): string[] {
  return meta.contracts.find((w) => w.week === week)?.kept ?? [];
}

/** The profile's record with these contracts kept in this week added, oldest week first. */
export function withKept(contracts: readonly ContractWeek[], week: number, kept: readonly string[]): ContractWeek[] {
  if (kept.length === 0) return [...contracts];
  const had = contracts.find((w) => w.week === week);
  const rest = contracts.filter((w) => w.week !== week);
  return [...rest, { week, kept: [...(had?.kept ?? []), ...kept.filter((id) => !had?.kept.includes(id))] }].sort((a, b) => a.week - b.week);
}

export interface WeekStreak {
  /** Weeks in a row with a contract kept, up to this one, or up to last week while this one is still open. */
  current: number;
  best: number;
}

/** Weeks in a row with at least one contract kept, as the daily's streak counts days. */
export function contractStreak(meta: Pick<MetaState, "contracts">, week: number): WeekStreak {
  const weeks = new Set(meta.contracts.filter((w) => w.kept.length > 0).map((w) => w.week));
  let best = 0;
  for (const w of weeks) {
    if (weeks.has(w - 1)) continue;
    let n = 1;
    while (weeks.has(w + n)) n++;
    best = Math.max(best, n);
  }
  const end = weeks.has(week) ? week : weeks.has(week - 1) ? week - 1 : null;
  let current = 0;
  if (end !== null) while (weeks.has(end - current)) current++;
  return { current, best };
}
