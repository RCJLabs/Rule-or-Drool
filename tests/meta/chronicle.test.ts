import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import {
  CHRONICLE_LENGTH,
  LEGACY_FLAGS,
  beforeChronicle,
  emptyMeta,
  foldRun,
  habitsOf,
  migrateMeta,
  type ChronicleEntry,
  type MetaState,
  type RunRecord,
} from "../../src/meta";
import { BOTS, makeContext, type BotName } from "../../src/sim";

/**
 * The chronicle (BACKLOG-12 phase 76): every run a profile finishes, oldest first, as the country's
 * history, the last thousand kept; a profile from before it starts it with the runs it kept.
 */

const cfg = library.config;

/** A run a bot plays from this seed to its end, dealt as a player's would be. */
function played(seed: number, bot: BotName = "mixed", eraCount?: number): GameState {
  const rng = makeRng(seed ^ 0x5bd1e995);
  const setup = rollSetup(library, seed, seed % 2 ? "left" : "right", []);
  let s: GameState = newRun(library, seed, eraCount ? { ...setup, eraCount } : setup);
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS[bot](makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

const entry = (n: number, patch: Partial<ChronicleEntry> = {}): ChronicleEntry => ({
  n,
  align: "left",
  cards: 105,
  endingId: "finale_muddle",
  band: "muddle",
  history: null,
  rival: null,
  left: [],
  mandates: [],
  votes: { honest: 1, lost: 0, cheated: 1 },
  ...patch,
});

describe("the chronicle", () => {
  it("keeps every run a profile finishes, oldest first, numbered as the run it was", () => {
    const runs = [played(1), played(2, "informed"), played(3, "greedy"), played(4, "informed", cfg.longEraCount), played(5, "mixed", 1)];
    let meta = emptyMeta();
    runs.forEach((run, i) => {
      const fold = foldRun(library, meta, run);
      meta = fold.meta;
      const e = meta.chronicle[i]!;
      expect(e.n).toBe(i + 1);
      expect(e).toMatchObject({
        align: run.align,
        cards: run.cardCount,
        endingId: run.over!.endingId,
        band: exitBand(library, run),
        history: fold.history!.key,
        rival: run.cabinet[cfg.rivalRole] ?? null,
        mandates: run.mandates.map((id) => ({ id, kept: !(id in run.mandatesBroken) })),
        votes: { honest: run.stats.electionsHonest, lost: run.stats.electionsLost, cheated: run.stats.electionsCheated },
      });
    });
    expect(meta.chronicle.map((e) => e.n)).toEqual([1, 2, 3, 4, 5]);
    // A long reign and a first term say how many eras they were dealt; the ordinary game does not.
    expect(meta.chronicle.map((e) => e.eras)).toEqual([undefined, undefined, undefined, cfg.longEraCount, 1]);
    // The last twelve are kept as they were for the line of reigns, as before.
    expect(meta.history.map((r) => r.cards)).toEqual(runs.map((r) => r.cardCount).reverse());
  });

  it("says what a reign left, not what it took over from the one before", () => {
    const run = [3, 6, 7, 8, 9, 10, 11, 12].map((seed) => played(seed)).find((r) => r.flags.filter((f) => LEGACY_FLAGS.has(f)).length >= 2)!;
    const [theirs, ours] = run.flags.filter((f) => LEGACY_FLAGS.has(f));
    const tookOver: GameState = { ...run, inherited: { band: "muddle", line: 2, legacies: [theirs!], rival: null, rivalStanding: 0 } };
    const e = foldRun(library, emptyMeta(), tookOver).meta.chronicle[0]!;
    expect(e.left).toContain(ours);
    expect(e.left).not.toContain(theirs);
    expect(e.line).toBe(2);
  });

  it("keeps the last thousand, dropping the oldest", () => {
    const full: MetaState = { ...emptyMeta(), runs: CHRONICLE_LENGTH, chronicle: Array.from({ length: CHRONICLE_LENGTH }, (_, i) => entry(i + 1)) };
    const next = foldRun(library, full, played(1)).meta;
    expect(next.chronicle).toHaveLength(CHRONICLE_LENGTH);
    expect(next.chronicle[0]!.n).toBe(2);
    expect(next.chronicle.at(-1)!.n).toBe(CHRONICLE_LENGTH + 1);
  });
});

describe("a profile from before the chronicle", () => {
  const record = (patch: Partial<RunRecord>): RunRecord => ({
    align: "right",
    cards: 105,
    era: 3,
    endingId: "finale_decay",
    band: "decay",
    rival: null,
    legacies: [],
    history: null,
    mandates: [],
    ...patch,
  });

  it("starts it with the runs its history kept, numbered from its count, with no votes guessed", () => {
    // Newest first, as the history keeps them: the newest took over from the one before it.
    const history = [
      record({ line: 2, legacies: ["seawall", "housing_built", "media_captured"], cards: 101 }),
      record({ legacies: ["seawall", "housing_built"], cards: 102, mandates: [{ id: "m_fair", kept: true }] }),
      record({ road: true, legacies: ["seawall"], cards: 103, band: "ascent", endingId: "finale_ascent" }),
    ];
    const meta = migrateMeta({ v: 9, runs: 40, history, endings: {} })!;
    expect(meta.chronicle.map((e) => [e.n, e.cards])).toEqual([
      [38, 103],
      [39, 102],
      [40, 101],
    ]);
    // What the one that took over left is what it ended with less what it took over.
    expect(meta.chronicle[2]!.left).toEqual(["media_captured"]);
    expect(meta.chronicle[1]!.left).toEqual(["seawall", "housing_built"]);
    expect(meta.chronicle.every((e) => e.votes === undefined)).toBe(true);
    expect(meta.chronicle[0]!.road).toBe(true);
    expect(meta.chronicle[2]!.line).toBe(2);
    expect(meta.chronicle[1]!.mandates).toEqual([{ id: "m_fair", kept: true }]);
    expect(beforeChronicle(meta)).toBe(37);
  });

  it("starts with none for a profile that has kept none", () => {
    const meta = migrateMeta({ v: 9, runs: 0 })!;
    expect(meta.chronicle).toEqual([]);
    expect(beforeChronicle(meta)).toBe(0);
  });
});

describe("a chronicle brought in", () => {
  it("comes back from a save exactly", () => {
    let meta = emptyMeta();
    for (const seed of [1, 2, 3]) meta = foldRun(library, meta, played(seed)).meta;
    expect(migrateMeta(JSON.parse(JSON.stringify(meta)))).toEqual(meta);
  });

  it("is read entry by entry: what a profile could not have written is left out", () => {
    const meta = migrateMeta({
      v: 10,
      runs: 6,
      chronicle: [
        entry(4),
        "a string",
        entry(1, { left: ["seawall", "not_a_legacy"] }),
        { ...entry(2), band: "gold" },
        entry(3, { votes: { honest: 1, lost: 3, cheated: 0 } }),
        entry(3, { cards: 7 }),
        entry(9),
        { ...entry(5), mandates: [{ id: "m_fair", kept: true }, { nope: 1 }, "x"] },
        { ...entry(6), n: -1 },
      ],
    })!;
    // In order, each run once and the first written kept, none past the runs it finished.
    expect(meta.chronicle.map((e) => e.n)).toEqual([1, 3, 4, 5]);
    expect(meta.chronicle[0]!.left).toEqual(["seawall"]);
    // More lost at the count than were left to it is no count at all.
    expect(meta.chronicle[1]!.votes).toBeUndefined();
    expect(meta.chronicle[1]!.cards).toBe(105);
    expect(meta.chronicle[3]!.mandates).toEqual([{ id: "m_fair", kept: true }]);
  });

  it("is kept to its last thousand", () => {
    const n = CHRONICLE_LENGTH + 10;
    const meta = migrateMeta({ v: 10, runs: n, chronicle: Array.from({ length: n }, (_, i) => entry(i + 1)) })!;
    expect(meta.chronicle).toHaveLength(CHRONICLE_LENGTH);
    expect(meta.chronicle[0]!.n).toBe(11);
  });
});

describe("how the player has ruled", () => {
  it("counts where the reigns went and how they ended, votes where they were kept, and promises", () => {
    const h = habitsOf(library, [
      entry(1, { band: "ascent", endingId: "finale_ascent", votes: undefined, mandates: [{ id: "m_fair", kept: true }] }),
      entry(2, { band: "decay", endingId: cfg.coupEnding, votes: { honest: 2, lost: 1, cheated: 1 } }),
      entry(3, { band: "muddle", endingId: `${cfg.firstTermPrefix}muddle`, votes: { honest: 0, lost: 0, cheated: 0 }, mandates: [{ id: "m_loyal", kept: false }] }),
    ]);
    expect(h.reigns).toBe(3);
    expect(h.bands).toEqual({ decay: 1, muddle: 1, ascent: 1 });
    // A first term seen through is seen through, though the codex does not collect its end.
    expect(h.ended).toEqual({ finished: 2, chosen: 0, fallen: 1 });
    expect(h.votes).toEqual({ held: 3, honest: 2, lost: 1, cheated: 1, reigns: 2 });
    expect(h.promises).toEqual({ made: 2, kept: 1 });
  });
});
