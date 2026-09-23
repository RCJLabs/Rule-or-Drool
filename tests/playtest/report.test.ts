import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { decodeRunCode, setupOf } from "../../src/meta/runcode";
import { serialize, toFile, type RecordedRun, type TakenCard } from "../../src/playtest/record";
import { buildReport, formatReport, gather, type Source } from "../../src/playtest/report";
import { playRunFrom } from "../../src/sim";
import { recordRun } from "./helpers";

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
