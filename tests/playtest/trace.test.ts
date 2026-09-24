import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { rollSetup } from "../../src/engine/state";
import type { TakenCard } from "../../src/playtest/record";
import { traceBot, traceRecorded } from "../../src/playtest/trace";
import { BOT_NAMES, playRunFrom, type BotName } from "../../src/sim";
import { recordBotRun } from "./helpers";

// BACKLOG-7 phase 46: a person's run is rebuilt from its code and the sides they took, for
// the look each card was read in and how each vote stood. Checked against bots' runs, recorded
// the way a person's are, whose answers were worked out while they were played.
describe("a recorded run, rebuilt", () => {
  it("gives back the look of every card and how every vote stood, as they were when played", () => {
    const cases: [number, BotName][] = [[801, "mixed"], [802, "greedy"], [803, "random"], [804, "mixed"], [805, "saint"]];
    for (const [seed, bot] of cases) {
      const { run, seen } = recordBotRun(seed, bot);
      expect(traceRecorded(library, run)).toEqual(seen);
    }
  }, 30_000);

  it("leaves out a run this version would deal differently, rather than describe one nobody played", () => {
    const { run } = recordBotRun(821, "mixed");
    const k = 10;
    const at = (patch: Partial<TakenCard>) => ({ ...run, cards: run.cards.map((c, i) => (i === k ? { ...c, ...patch } : c)) });
    expect(traceRecorded(library, run)).not.toBeNull();
    // Another card dealt, other meters or another drift in front of the same card: another run.
    expect(traceRecorded(library, at({ card: "not_a_card" }))).toBeNull();
    expect(traceRecorded(library, at({ drift: run.cards[k]!.drift + 1 }))).toBeNull();
    expect(traceRecorded(library, at({ before: run.cards[k]!.before.map((v, i) => (i === 0 ? v + 1 : v)) }))).toBeNull();
    // Ending somewhere else, or not at the card the record ended on.
    expect(traceRecorded(library, { ...run, end: { ...run.end!, ending: `${run.end!.ending}_elsewhere` } })).toBeNull();
    expect(traceRecorded(library, { ...run, cards: run.cards.slice(0, -1) })).toBeNull();
    // Not finished, or a code this version cannot read.
    expect(traceRecorded(library, { ...run, end: null })).toBeNull();
    expect(traceRecorded(library, { ...run, code: "not a code" })).toBeNull();
  });
});

describe("a bot's walk of the same run", () => {
  it("is the run playRunFrom plays for the report's other tables", () => {
    for (const bot of BOT_NAMES) {
      for (const seed of [811, 812]) {
        const setup = rollSetup(library, seed, seed % 2 ? "left" : "right", []);
        const t = traceBot(library, bot, seed, setup);
        const r = playRunFrom(library, bot, seed, setup);
        expect([t.looks.length, t.votes.length, t.votes.filter((v) => !v.honest).length]).toEqual([r.cards, r.electionsSeen, r.cheats]);
      }
    }
  }, 30_000);
});
