import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { decodeRunCode, setupOf } from "../../src/meta/runcode";
import { serialize, toFile, type RecordedRun, type TakenCard } from "../../src/playtest/record";
import { deckStamp } from "../../src/engine/deck";
import { buildReport, formatReport, gather, onThisDeck, type Source } from "../../src/playtest/report";
import { LINE_SINCE, toldTheCount, traceBot, traceRecorded, type Trace } from "../../src/playtest/trace";
import { playRunFrom, type BotName, type RunResult } from "../../src/sim";
import { APP_VERSION } from "../../src/version";
import { recordBotRun, recordRun } from "./helpers";

const source = (name: string, runs: RecordedRun[]): Source => ({ name, file: toFile(runs) });
const OPTS = { files: 0, replayed: 0, lookMs: 300, minDecisions: 2 };

/** A made-up run of named cards with given times, for the arithmetic. */
function made(run: number, cards: [string, number, Partial<TakenCard>?][], ending = "riots"): RecordedRun {
  const m = [50, 50, 50, 50, 50, 50];
  return {
    game: "0.43.0",
    code: "1.1.L.-.-.-",
    kind: "own",
    run,
    end: { ending, era: 1, cards: cards.length, band: "muddle" },
    cards: cards.map(([card, ms, rest]) => ({ card, side: "left", ms, looked: [0, 0], drift: 0, before: m, after: m, ...rest })),
  };
}

// BACKLOG-8 phase 49: a run from another deck is a different run by its 13th card, the median
// over 2,000 seeds when phase 48's stories came. Set beside the bots, it would be set beside
// runs nobody played.
describe("sorting the runs by deck", () => {
  it("keeps only the runs this deck dealt, and counts the rest", () => {
    let n = 0;
    const at = (deck: string | undefined, end = true): RecordedRun => ({ ...made(++n, [["x", 1000]]), ...(deck ? { deck } : {}), ...(end ? {} : { end: null }) });
    const rebuilt = at(undefined);
    const g = gather([source("a", [at("aaaaaaaa"), at("bbbbbbbb"), rebuilt, at(undefined, false), at(undefined)]), source("b", [at("bbbbbbbb")])]);
    // Only the unstamped run the test says rebuilds does; the other finished one does not.
    const { gathered, decks } = onThisDeck(g, "aaaaaaaa", (run) => run === rebuilt);
    expect(decks).toEqual({ stamp: "aaaaaaaa", kept: 2, other: [["bbbbbbbb", 2]], unverified: 2 });
    expect(gathered.runs).toBe(2);
    // A player with no run from this deck is not one of this report's players.
    expect(gathered.players.map((p) => p.files)).toEqual([["a"]]);
    const text = formatReport(buildReport(library, gathered, new Map(), { ...OPTS, decks }));
    expect(text).toContain("Dealt from this version's deck, aaaaaaaa: 2 runs, the only ones below.");
    expect(text).toContain("Left out, dealt from other decks: bbbbbbbb 2.");
    expect(text).toContain("Left out, from before decks were stamped: 2 runs this deck does not deal again card for card, or that stopped too soon to tell.");
  });
});

describe("gathering the files", () => {
  it("counts a run sent twice once, and takes files that share a run to be one player's", () => {
    const a = recordRun(41).run;
    const b = recordRun(42).run;
    const c = recordRun(43).run;
    const g = gather([source("sam.txt", [a]), source("sam-later.txt", [a, b]), source("kit.txt", [c])]);
    expect(g.runs).toBe(3);
    expect(g.repeats).toBe(1);
    expect(g.players.map((p) => p.files)).toEqual([["sam.txt", "sam-later.txt"], ["kit.txt"]]);
    expect(g.players[0]!.runs).toEqual([a, b]);
  });
});

describe("the report", () => {
  it("ranks a card slow against each player's own pace, not everyone's", () => {
    // Quick reads at 1s a card and slow at 4s; both took three times their usual on "hard".
    const quick = made(1, [["easy_a", 1000], ["easy_b", 1000], ["hard", 3000], ["easy_c", 1000]]);
    const slow = made(1, [["easy_a", 4000], ["easy_b", 4000], ["hard", 12000], ["easy_c", 4000]]);
    const r = buildReport(library, gather([source("q", [quick]), source("s", [slow])]), new Map(), OPTS);
    expect(r.hesitation[0]).toMatchObject({ card: "hard", n: 2, players: 2, ratio: 3 });
    expect(r.hesitation.find((h) => h.card === "easy_a")!.ratio).toBe(1);
  });

  it("tells looking at the side not taken from looking at the side a swipe was going to", () => {
    const run = made(1, [
      ["a", 2000, { side: "left", looked: [900, 0] }], // a slow swipe left: the gesture shows left
      ["b", 2000, { side: "left", looked: [500, 800] }], // looked at the right, went left
      ["c", 2000, { side: "right", looked: [0, 100] }], // too brief to count
      ["d", 2000, { side: "right", resumed: true, looked: [900, 900] }], // not timed: it was left and come back to
    ]);
    const r = buildReport(library, gather([source("p", [run])]), new Map(), OPTS);
    expect(r.timing.decisions).toBe(3);
    expect(r.timing.resumed).toBe(1);
    expect(r.timing.looked).toBeCloseTo(2 / 3);
    expect(r.timing.lookedOther).toBeCloseTo(1 / 3);
  });

  it("places each card in the era it was played in", () => {
    const { eraLength } = library.config;
    const cards: [string, number][] = Array.from({ length: eraLength + 2 }, (_, i) => [`c${i}`, i < eraLength ? 1000 : 3000]);
    const r = buildReport(library, gather([source("p", [made(1, cards)])]), new Map(), OPTS);
    expect(r.timing.byEra).toEqual([
      { era: 1, n: eraLength, median: 1000 },
      { era: 2, n: 2, median: 3000 },
    ]);
  });

  it("sets the people beside each bot on the same runs, and says where the people's runs ended", () => {
    const runs = [recordRun(51).run, recordRun(52).run, { ...recordRun(53).run, end: null }];
    const g = gather([source("p", runs)]);
    const finished = runs.filter((r) => r.end);
    const mixed = finished.map((r) => {
      const d = decodeRunCode(library, r.code);
      if (!d.ok) throw new Error("a recorded code should decode");
      return playRunFrom(library, "mixed", d.code.seed, setupOf(d.code));
    });
    const r = buildReport(library, g, new Map([["mixed", mixed]]), { ...OPTS, files: 1, replayed: 2 });
    expect(r).toMatchObject({ runs: 3, finished: 2, unfinished: 1, players: 1 });
    expect(r.humans.runs).toBe(2);
    expect([...r.humans.endings.values()].reduce((a, b) => a + b, 0)).toBe(2);
    expect(r.bots[0]!.out.runs).toBe(2);
    const text = formatReport(r);
    expect(text).toMatch(/^people\s+2\s/m);
    expect(text).toMatch(/^mixed bot\s+2\s/m);
    expect(text).toContain("1st run");
  });
});

// BACKLOG-7 phase 46: where the country ended up, how the votes went and the look each card
// was read in, for people and for each bot on the same runs.
describe("bands, votes and looks", () => {
  it("reads a bot's runs, sent as records, exactly as that bot's own", () => {
    for (const bot of ["mixed", "greedy"] as BotName[]) {
      const runs = [901, 902, 903, 904, 905, 906].map((seed) => recordBotRun(seed, bot).run);
      const results: RunResult[] = [];
      const walked: Trace[] = [];
      const people: Trace[] = [];
      for (const run of runs) {
        const d = decodeRunCode(library, run.code);
        if (!d.ok) throw new Error("a recorded code should decode");
        results.push(playRunFrom(library, bot, d.code.seed, setupOf(d.code)));
        walked.push(traceBot(library, bot, d.code.seed, setupOf(d.code)));
        people.push(traceRecorded(library, run)!);
      }
      const r = buildReport(library, gather([source("b", runs)]), new Map([[bot, results]]), { ...OPTS, files: 1, replayed: 6 }, { people, bots: new Map([[bot, walked]]) });
      expect(r.rebuilt).toBe(6);
      for (const rows of [r.bands, r.votes, r.looks] as { label: string }[][]) {
        const [person, them] = rows.map(({ label: _, ...rest }) => rest);
        expect(person).toEqual(them);
      }
      expect(r.votes[0]!.votes).toBeGreaterThan(0);
    }
  }, 60_000);

  it("splits the votes by whether an honest count would have won them, and the cheated ones by the meters", () => {
    const v = (honest: boolean, winnable: boolean, near: boolean) => ({ honest, winnable, near });
    const people: Trace[] = [
      { looks: [0, 1, 1, 0], votes: [v(true, true, false), v(false, true, true), v(false, true, false)] },
      { looks: [0, -1, -1, -2, -2, -2], votes: [v(false, false, true), v(true, false, false)] },
    ];
    const r = buildReport(library, gather([source("p", [made(1, [["x", 1000]])])]), new Map(), OPTS, { people, bots: new Map() });
    // Three of five cheated. Three could have been won honestly, and two of those were cheated
    // anyway, one with a meter near its edge. Of the two that could not, one was taken honestly.
    expect(r.votes).toEqual([{ label: "people", runs: 2, votes: 5, cheated: 0.6, winnable: 0.6, cheatedWinnable: 2 / 3, near: 0.5, honestLosing: 0.5 }]);
    // Two changes in each run: into a look and out again, and down two steps.
    expect(r.looks[0]).toMatchObject({ runs: 2, cards: 10, changes: 2 });
    expect(r.looks[0]!.share).toEqual([0, 0.3, 0.2, 0.3, 0.2, 0, 0]);
    // Nothing cheated reads as nothing, not as a share of nothing.
    const clean = buildReport(library, gather([source("p", [made(1, [["x", 1000]])])]), new Map(), OPTS, { people: [{ looks: [0], votes: [v(true, true, false)] }], bots: new Map() });
    expect(clean.votes[0]!.cheated).toBe(0);
    expect(formatReport(clean)).toMatch(/^people\s+1\s+1\s+0\.0%\s+100\.0%\s+0\.0%\s+–\s+–$/m);
  });

  // BACKLOG-9 phase 53: whether people use the line shows as those told beside those not told.
  it("sets people told how the count stood beside people who were not, when there are both", () => {
    const v = (honest: boolean, winnable: boolean) => ({ honest, winnable, near: false });
    const told: Trace = { looks: [0], votes: [v(true, true), v(true, true)], line: true };
    const before: Trace = { looks: [0], votes: [v(false, true), v(true, true)], line: false };
    const g = gather([source("p", [made(1, [["x", 1000]])])]);
    const both = buildReport(library, g, new Map(), OPTS, { people: [told, before], bots: new Map() });
    expect(both.votes.map((r) => [r.label.trim(), r.runs, r.cheatedWinnable])).toEqual([
      ["people", 2, 0.25],
      ["told", 1, 0],
      ["not told", 1, 0.5],
    ]);
    expect(both.told).toBe(1);
    expect(formatReport(both)).toContain("Not told: before it.");
    // All on one side of it: the people's row alone, and a word on which side.
    const allTold = buildReport(library, g, new Map(), OPTS, { people: [told, told], bots: new Map() });
    expect(allTold.votes.map((r) => r.label)).toEqual(["people"]);
    expect(formatReport(allTold)).toContain("All of them were told on the card how the count stood.");
    const noneTold = buildReport(library, g, new Map(), OPTS, { people: [before], bots: new Map() });
    expect(noneTold.votes.map((r) => r.label)).toEqual(["people"]);
    expect(formatReport(noneTold)).toContain(`that came in ${LINE_SINCE}.`);
  });

  it("knows a version told the count from its number, and does not guess at one it cannot read", () => {
    expect(["0.62.0", "0.9.9", "0.62.99"].map(toldTheCount)).toEqual([false, false, false]);
    expect([LINE_SINCE, "0.63.1", "0.64.0", "0.100.0", "1.0.0"].map(toldTheCount)).toEqual([true, true, true, true, true]);
    expect(["", "dev", "0.63", "0.63.0-beta", "v0.63.0"].map(toldTheCount)).toEqual([false, false, false, false, false]);
    // A record made on this version was told.
    expect(toldTheCount(APP_VERSION)).toBe(true);
    // A rebuilt run carries it from the version it was played on.
    const { run } = recordBotRun(831, "mixed");
    expect(traceRecorded(library, run)!.line).toBe(false);
    expect(traceRecorded(library, { ...run, game: LINE_SINCE })!.line).toBe(true);
  });
});

describe("npm run playtests", () => {
  it("reads a folder, names and skips a file that is not a record, and reports the rest", () => {
    const dir = mkdtempSync(join(tmpdir(), "playtests-"));
    try {
      writeFileSync(join(dir, "sam.txt"), serialize(toFile([recordRun(61).run, recordRun(62).run])));
      writeFileSync(join(dir, "kit.json"), serialize(toFile([recordRun(63).run])));
      writeFileSync(join(dir, "notes.txt"), "remember to ask about the election card");
      const out = spawnSync(process.execPath, ["--import", "tsx", "scripts/playtests.ts", dir], { encoding: "utf8" });
      expect(out.status).toBe(0);
      expect(out.stderr).toContain("skipped notes.txt");
      expect(out.stdout).toContain("2 files, 2 players, 3 runs");
      expect(out.stdout).toMatch(/^people\s+3\s/m);
      expect(out.stdout).toMatch(/^mixed bot\s+3\s/m);
      expect(out.stdout).toContain("== where the country ends up ==");
      expect(out.stdout).toContain("== elections: people's 3 of 3 finished runs, rebuilt on this version ==");
      expect(out.stdout).toContain("== the look each card was read in ==");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);

  it("leaves out a run from another deck, and says so", () => {
    const dir = mkdtempSync(join(tmpdir(), "playtests-"));
    try {
      writeFileSync(join(dir, "sam.txt"), serialize(toFile([recordRun(64).run, { ...recordRun(65).run, deck: "zzzzzzzz" }])));
      const out = spawnSync(process.execPath, ["--import", "tsx", "scripts/playtests.ts", dir], { encoding: "utf8" });
      expect(out.status).toBe(0);
      expect(out.stdout).toContain(`Dealt from this version's deck, ${deckStamp(library)}: 1 run, the only ones below.`);
      expect(out.stdout).toContain("Left out, dealt from other decks: zzzzzzzz 1.");
      expect(out.stdout).toMatch(/^people\s+1\s/m);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);

  it("fails, and says why, on a folder with no records in it", () => {
    const dir = mkdtempSync(join(tmpdir(), "playtests-"));
    try {
      const out = spawnSync(process.execPath, ["--import", "tsx", "scripts/playtests.ts", dir], { encoding: "utf8" });
      expect(out.status).toBe(1);
      expect(out.stderr).toContain("No record files");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
