import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { LOST_OFFICE_FLAG } from "../../src/engine/opposition";
import { makeRng } from "../../src/engine/rng";
import { exitBand, isFirstTerm, newRun, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign } from "../../src/engine/types";
import {
  codexProgress,
  collectsEnding,
  contractsFor,
  contractsKept,
  decodeRunCode,
  emptyMeta,
  encodeRunCode,
  firstTermDue,
  foldRun,
  longReignOpen,
  runCodeOf,
} from "../../src/meta";
import { BOTS, makeContext, type BotName } from "../../src/sim";

/**
 * A first term (BACKLOG-10 phase 59): a new profile's runs are the ordinary game's first era,
 * ended in an end of their own, until it has seen a run through.
 */

const cfg = library.config;
const FIRST = cfg.firstTermEras;

/** A run played by a bot from a new profile's setup, and the cards it was dealt. */
function play(bot: BotName, seed: number, eraCount?: number): { run: GameState; dealt: string[] } {
  const rng = makeRng(seed ^ 0x5bd1e995);
  const align: PlayerAlign = seed % 2 ? "left" : "right";
  let s = newRun(library, seed, { ...rollSetup(library, seed, align, []), mandates: [], ...(eraCount === undefined ? {} : { eraCount }) });
  const dealt: string[] = [];
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    dealt.push(card.id);
    s = resolve(library, s, card.id, BOTS[bot](makeContext(library, s, card, rng, { danger: 25 })));
  }
  return { run: s, dealt };
}

describe("a first term", () => {
  it("is the ordinary game's first era, ended in an end of its own named for where the country went", () => {
    let compared = 0;
    for (let seed = 1; seed <= 40 && compared < 5; seed++) {
      const term = play("mixed", seed, FIRST);
      if (!term.run.over!.endingId.startsWith(cfg.firstTermPrefix)) continue;
      // A run in opposition meets a return vote on the era's last card; a first term, ending there, does not.
      if (term.run.flags.includes(LOST_OFFICE_FLAG)) continue;
      const full = play("mixed", seed);
      expect(isFirstTerm(library, term.run)).toBe(true);
      expect(term.run.cardCount).toBe(cfg.eraLength);
      expect(term.run.over!.endingId).toBe(`${cfg.firstTermPrefix}${exitBand(library, term.run)}`);
      expect(term.dealt).toEqual(full.dealt.slice(0, cfg.eraLength));
      compared++;
    }
    expect(compared).toBe(5);
  });

  it("is seen through by nearly every careful player, and most careless ones", () => {
    const through = (bot: BotName, runs: number) => {
      let n = 0;
      for (let seed = 1; seed <= runs; seed++) if (play(bot, 700 + seed, FIRST).run.over!.endingId.startsWith(cfg.firstTermPrefix)) n++;
      return n / runs;
    };
    expect(through("mixed", 60)).toBeGreaterThan(0.9);
    expect(through("random", 120)).toBeGreaterThan(0.5);
  }, 60_000);

  it("writes its length into the run's code, so a shared first term deals the same", () => {
    const run = newRun(library, 42, { align: "left", eraCount: FIRST });
    const code = runCodeOf(run);
    expect(code.eraCount).toBe(FIRST);
    const back = decodeRunCode(library, encodeRunCode(code));
    expect(back).toEqual({ ok: true, code });
    // Only lengths the game plays: two eras is none of them.
    expect(decodeRunCode(library, encodeRunCode({ ...code, eraCount: 2 }))).toEqual({ ok: false, reason: "content" });
  });
});

describe("what a first term counts for", () => {
  const ended = (endingId: string, cards: number, eraCount?: number): GameState => ({
    ...newRun(library, 1, { align: "left", ...(eraCount === undefined ? {} : { eraCount }) }),
    cardCount: cards,
    over: { endingId, epilogueKey: "muddle:left:1" },
  });

  it("is due to a profile until it sees a run through, a first term's or a finale's", () => {
    expect(firstTermDue(emptyMeta())).toBe(true);
    const lost = foldRun(library, emptyMeta(), ended("riots", 20, FIRST)).meta;
    expect(firstTermDue(lost)).toBe(true);
    expect(firstTermDue(foldRun(library, lost, ended(`${cfg.firstTermPrefix}muddle`, 35, FIRST)).meta)).toBe(false);
    expect(firstTermDue(foldRun(library, emptyMeta(), ended(`${cfg.finalePrefix}muddle`, 105)).meta)).toBe(false);
  });

  it("opens nothing a finale opens, and is not an ending the codex collects", () => {
    const fold = foldRun(library, emptyMeta(), ended(`${cfg.firstTermPrefix}ascent`, 35, FIRST));
    expect(fold.newEnding).toBe(false);
    expect(fold.meta.objectives.obj_finale).toBeUndefined();
    expect(longReignOpen(fold.meta)).toBe(false);
    expect(codexProgress(library, fold.meta).endingsSeen).toBe(0);
    const ends = [...library.endings.keys()].filter((id) => !collectsEnding(id));
    expect(ends.sort()).toEqual(["ascent", "decay", "muddle"].map((b) => `${cfg.firstTermPrefix}${b}`));
    expect(codexProgress(library, emptyMeta()).endingsTotal).toBe(library.endings.size - 3);
  });
});

describe("what a short term counts for (BACKLOG-12 phase 77)", () => {
  const ended = (endingId: string, cards: number, eraCount?: number): GameState => ({
    ...newRun(library, 1, { align: "left", ...(eraCount === undefined ? {} : { eraCount }) }),
    cardCount: cards,
    over: { endingId, epilogueKey: "ascent:left:1" },
  });
  const veteran = foldRun(library, emptyMeta(), ended(`${cfg.finalePrefix}muddle`, 105)).meta;

  it("keeps no contracts, though a clean era's would be kept in a third of a reign's cards", () => {
    const week = Array.from({ length: 300 }, (_, i) => i + 1).find((w) => contractsFor(w).some((c) => c.id === "saintEra"))!;
    const run = { ...ended(`${cfg.firstTermPrefix}ascent`, cfg.eraLength, FIRST), stats: { ...newRun(library, 1, { align: "left" }).stats, tempting: 0 } };
    expect(contractsKept({ ...run, eraCount: cfg.eraCount }, "ascent", week)).toContain("saintEra");
    expect(contractsKept(run, "ascent", week)).toEqual([]);
  });

  it("opens no long reign, and its end is not collected, for a veteran either", () => {
    const run = ended(`${cfg.firstTermPrefix}ascent`, cfg.eraLength, FIRST);
    const fold = foldRun(library, veteran, run);
    expect(fold.newEnding).toBe(false);
    expect(fold.firstSeenThrough).toBe(false);
    expect(codexProgress(library, fold.meta).endingsSeen).toBe(codexProgress(library, veteran).endingsSeen);
    expect(longReignOpen(foldRun(library, emptyMeta(), run).meta)).toBe(false);
  });
});
