import type { Library } from "../engine/library";
import { crisisOf } from "../engine/state";
import type { Band, GameState } from "../engine/types";
import { BANDS } from "../engine/types";
import { endingKind, type EndingKind } from "./clues";
import { LEGACY_FLAGS } from "./legacies";
import type { ChronicleEntry, MetaState, PromiseRecord, RunRecord } from "./types";

/**
 * The chronicle (BACKLOG-12 phase 76): every run a profile finishes, in order, as the history of
 * one country. The codex said what had been collected, not in what order or by whom, and the
 * profile kept its last twelve runs. A reign is about 300 bytes here; the last thousand are kept,
 * which are about 320 KB of profile and a 36 KB code for Move my progress, well inside the 1 MB
 * that a code is allowed to unpack to.
 */
export const CHRONICLE_LENGTH = 1000;

/** A finished run as the chronicle keeps it, the profile's `n`th. */
export function chronicleEntry(run: GameState, record: RunRecord, n: number, ordinaryEras: number, lib: Library): ChronicleEntry {
  const inherited = run.inherited?.legacies ?? [];
  const eras = run.eraCount ?? ordinaryEras;
  const entry: ChronicleEntry = {
    n,
    align: record.align,
    cards: record.cards,
    endingId: record.endingId,
    band: record.band,
    history: record.history,
    rival: record.rival,
    left: record.legacies.filter((f) => !inherited.includes(f)),
    mandates: record.mandates,
    votes: { honest: run.stats.electionsHonest, lost: run.stats.electionsLost, cheated: run.stats.electionsCheated },
  };
  if (eras !== ordinaryEras) entry.eras = eras;
  if (record.line) entry.line = record.line;
  if (record.road) entry.road = true;
  // The crisis it took on, of two, and the other (BACKLOG-13 phase 84).
  const chose = run.passedOver ? crisisOf(lib, run.modifiers) : undefined;
  if (chose && run.passedOver) entry.crisis = { chose, over: run.passedOver };
  return entry;
}

/**
 * The chronicle a profile from before it starts with: the runs its history kept, oldest first.
 * What each reign left is what it ended with, less what the run before it ended with where it
 * took that over; its votes were never kept, and are left out rather than guessed.
 */
function fromHistory(history: readonly RunRecord[], runs: number): ChronicleEntry[] {
  const kept = history.slice(0, Math.max(0, Math.min(history.length, runs)));
  return kept
    .map((r, i) => {
      const before = (r.line ?? 1) > 1 ? (kept[i + 1]?.legacies ?? []) : [];
      const entry: ChronicleEntry = {
        n: runs - i,
        align: r.align,
        cards: r.cards,
        endingId: r.endingId,
        band: r.band,
        history: r.history,
        rival: r.rival,
        left: r.legacies.filter((f) => !before.includes(f)),
        mandates: r.mandates,
      };
      if (r.line) entry.line = r.line;
      if (r.road) entry.road = true;
      return entry;
    })
    .reverse();
}

const count = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** One entry as a profile holds it, or null. A profile can arrive in a link anyone can send (BACKLOG-5 phase 33). */
function entryOf(raw: unknown): ChronicleEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (!count(e.n) || e.n < 1 || (e.align !== "left" && e.align !== "right") || !count(e.cards)) return null;
  if (typeof e.endingId !== "string" || !BANDS.includes(e.band as never)) return null;
  const mandates: PromiseRecord[] = (Array.isArray(e.mandates) ? e.mandates : []).flatMap((m) =>
    m && typeof m === "object" && typeof (m as PromiseRecord).id === "string" ? [{ id: (m as PromiseRecord).id, kept: (m as PromiseRecord).kept === true }] : [],
  );
  const entry: ChronicleEntry = {
    n: e.n,
    align: e.align,
    cards: e.cards,
    endingId: e.endingId,
    band: e.band as ChronicleEntry["band"],
    history: typeof e.history === "string" ? e.history : null,
    rival: typeof e.rival === "string" ? e.rival : null,
    left: strings(e.left).filter((f) => LEGACY_FLAGS.has(f)),
    mandates,
  };
  const v = e.votes as Record<string, unknown> | undefined;
  if (v && typeof v === "object" && count(v.honest) && count(v.lost) && count(v.cheated) && v.lost <= v.honest) entry.votes = { honest: v.honest, lost: v.lost, cheated: v.cheated };
  if (count(e.eras) && e.eras > 0) entry.eras = e.eras;
  if (count(e.line) && e.line > 1) entry.line = e.line;
  if (e.road === true) entry.road = true;
  const c = e.crisis as Record<string, unknown> | undefined;
  if (c && typeof c === "object" && typeof c.chose === "string" && typeof c.over === "string" && ID.test(c.chose) && ID.test(c.over) && c.chose !== c.over) {
    entry.crisis = { chose: c.chose, over: c.over };
  }
  return entry;
}

/** A modifier's id, as a profile from anywhere may say one. */
const ID = /^[a-z0-9_]{1,64}$/;

/**
 * The chronicle a profile brings: its own, read entry by entry, in order and each run once, and
 * none past the runs it says it finished; or, from a profile saved before there was one, the runs
 * its history kept.
 */
export function chronicleOf(raw: unknown, history: readonly RunRecord[], runs: number): ChronicleEntry[] {
  if (!Array.isArray(raw)) return fromHistory(history, runs);
  const byRun = new Map<number, ChronicleEntry>();
  for (const e of raw.map(entryOf)) if (e && e.n <= runs && !byRun.has(e.n)) byRun.set(e.n, e);
  return [...byRun.values()].sort((a, b) => a.n - b.n).slice(-CHRONICLE_LENGTH);
}

/** How the reigns in a chronicle went, counted: what the player did, never a grade of it. */
export interface Habits {
  reigns: number;
  bands: Record<Band, number>;
  ended: Record<EndingKind, number>;
  /** Votes, over the reigns that kept them, and how many reigns those are. */
  votes: { held: number; honest: number; lost: number; cheated: number; reigns: number };
  promises: { made: number; kept: number };
}

export function habitsOf(lib: Library, chronicle: readonly ChronicleEntry[]): Habits {
  const habits: Habits = {
    reigns: chronicle.length,
    bands: { decay: 0, muddle: 0, ascent: 0 },
    ended: { finished: 0, chosen: 0, fallen: 0 },
    votes: { held: 0, honest: 0, lost: 0, cheated: 0, reigns: 0 },
    promises: { made: 0, kept: 0 },
  };
  for (const e of chronicle) {
    habits.bands[e.band]++;
    // A first term seen to its end is seen through, though it is not a finale the codex collects.
    habits.ended[e.endingId.startsWith(lib.config.firstTermPrefix) ? "finished" : endingKind(lib, e.endingId)]++;
    if (e.votes) {
      habits.votes.reigns++;
      habits.votes.held += e.votes.honest + e.votes.cheated;
      habits.votes.honest += e.votes.honest;
      habits.votes.lost += e.votes.lost;
      habits.votes.cheated += e.votes.cheated;
    }
    habits.promises.made += e.mandates.length;
    habits.promises.kept += e.mandates.filter((m) => m.kept).length;
  }
  return habits;
}

/** The first run the chronicle does not hold, counting from the first: 0 when it holds them all. */
export function beforeChronicle(meta: Pick<MetaState, "runs" | "chronicle">): number {
  return meta.chronicle.length ? meta.chronicle[0]!.n - 1 : meta.runs;
}
