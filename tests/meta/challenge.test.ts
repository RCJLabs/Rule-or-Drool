import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { decodeRunCode, decodeRunResult, encodeRunCode, encodeRunResult, resultOf, runCodeOf, theirRun, type RunResult } from "../../src/meta";
import { BOT_NAMES, BOTS, makeContext, type BotName } from "../../src/sim";
import { shareLink } from "../../src/ui/share";

/**
 * Challenge a friend (BACKLOG-5 phase 37): a link carries how the run went as well as where it
 * started, and the receiver's game deals the sender's run again from it.
 */

function played(seed: number, bot: BotName): GameState {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s = draw(library, newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", [])));
  while (!s.over) {
    const card = getCard(library, s.current!);
    s = draw(library, resolve(library, s, card.id, BOTS[bot](makeContext(library, s, card, rng, { danger: 25 }))));
  }
  return s;
}

describe("a v2 link", () => {
  it("round-trips, and deals the sender's whole run again, across 400 runs by every bot", () => {
    let longest = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const run = played(seed, BOT_NAMES[seed % BOT_NAMES.length]!);
      const result = resultOf(library, run)!;
      const text = encodeRunResult(result);
      longest = Math.max(longest, text.length);
      const back = decodeRunResult(library, text);
      expect(back, `seed ${seed}`).toEqual(result);
      // Not only the same name and ending: the same run, to the last meter and flag.
      expect(theirRun(library, runCodeOf(run), back!), `seed ${seed}`).toEqual(run);
    }
    // A side a bit: a full run's result is short enough to ride in a link.
    expect(longest).toBeLessThanOrEqual(80);
  });

  it("keeps the run code as it was, so a version of the game from before still opens the link", () => {
    const run = played(7, "mixed");
    const link = new URL(shareLink(run, "https://rcjlabs.github.io/Rule-or-Drool/", resultOf(library, run)));
    const code = link.searchParams.get("run")!;
    expect(code).toBe(encodeRunCode(runCodeOf(run)));
    // The v1 reader: six parts, version 1, nothing more.
    expect(code.split(".")).toHaveLength(6);
    expect(decodeRunCode(library, code)).toEqual({ ok: true, code: runCodeOf(run) });
    expect(decodeRunResult(library, link.searchParams.get("vs")!)).toEqual(resultOf(library, run));
  });
});

describe("a long reign's link (BACKLOG-5 phase 39)", () => {
  it("carries its five eras in the code and deals the whole reign again from the result", () => {
    let long = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const rng = makeRng(seed ^ 0x5bd1e995);
      const setup = { ...rollSetup(library, seed, seed % 2 ? "left" : "right", []), eraCount: library.config.longEraCount };
      let s = draw(library, newRun(library, seed, setup));
      while (!s.over) {
        const card = getCard(library, s.current!);
        s = draw(library, resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 }))));
      }
      if (s.cardCount <= library.config.eraCount * library.config.eraLength) continue;
      long++;
      const link = new URL(shareLink(s, "https://rcjlabs.github.io/Rule-or-Drool/", resultOf(library, s)));
      const code = decodeRunCode(library, link.searchParams.get("run")!);
      expect(code).toEqual({ ok: true, code: runCodeOf(s) });
      const back = decodeRunResult(library, link.searchParams.get("vs")!)!;
      expect(back.cards).toBe(s.cardCount);
      expect(theirRun(library, runCodeOf(s), back)).toEqual(s);
    }
    expect(long).toBeGreaterThan(20);
  });
});

describe("the result's format", () => {
  it("is fixed: links already sent must keep meaning what they meant", () => {
    // Three cards: right, left, right is 101 in the top bits of one byte, 0xA0, "oA" in base64url.
    const result: RunResult = { history: "seawall:ascent:left", ending: "finale_ascent", cards: 3, sides: ["right", "left", "right"] };
    expect(encodeRunResult(result)).toBe("1.seawall~ascent~left.finale_ascent.3.oA");
    expect(decodeRunResult(library, "1.seawall~ascent~left.finale_ascent.3.oA")).toEqual(result);
    expect(decodeRunResult(library, "1.-.riots.2x.-")).toEqual({ history: null, ending: "riots", cards: 105, sides: null });
  });
});

describe("a v1 link", () => {
  it("still opens, and says nothing of a result", () => {
    const run = played(8, "greedy");
    const link = new URL(shareLink(run, "https://rcjlabs.github.io/Rule-or-Drool/"));
    expect(link.searchParams.get("vs")).toBeNull();
    expect(decodeRunCode(library, link.searchParams.get("run")!)).toEqual({ ok: true, code: runCodeOf(run) });
  });
});

describe("a result that is not quite one", () => {
  const run = played(9, "random");
  const result = resultOf(library, run)!;
  const text = encodeRunResult(result);
  const parts = text.split(".");
  const swap = (i: number, v: string) => parts.map((p, j) => (j === i ? v : p)).join(".");

  it("is refused when it is not the format", () => {
    // Sides one byte longer than this run's cards: "AAAA" was three bytes, which is the right
    // length for any run of 17-24 cards, and so only wrong for runs of other lengths.
    const tooLong = btoa("\0".repeat(Math.ceil(result.cards / 8) + 1)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    for (const bad of ["", "2" + text.slice(1), text + ".x", swap(3, "zzzz"), swap(3, "0"), swap(3, (176).toString(36)), "1.-.riots.4w.-", swap(4, "!!"), swap(4, tooLong)]) {
      expect(decodeRunResult(library, bad), bad).toBeNull();
    }
  });

  it("keeps a history or an ending this version does not have as unknown, and still says how far they got", () => {
    const other = decodeRunResult(library, swap(1, "a_later_decision~ascent~left"))!;
    expect(other).toMatchObject({ history: null, ending: result.ending, cards: result.cards });
    expect(decodeRunResult(library, swap(2, "a_later_ending"))).toMatchObject({ ending: null, cards: result.cards });
  });

  it("deals no run for them when their sides do not end where they say", () => {
    const flipped: RunResult = { ...result, sides: result.sides!.map((s, i) => (i === 3 ? (s === "left" ? "right" : "left") : s)) };
    // Taking one card the other way ends somewhere else; if it happened to end the same way,
    // the history or the card count still gives it away.
    const again = theirRun(library, runCodeOf(run), flipped);
    if (again) expect([again.cardCount, again.over?.endingId]).toEqual([result.cards, result.ending]);
    expect(theirRun(library, runCodeOf(run), { ...result, sides: null })).toBeNull();
    // The same sides dealt the same length of run and ended it another way: an update that
    // changed what those sides come to. Their run is not the one being drawn.
    const otherEnding = [...library.endings.keys()].find((e) => e !== result.ending)!;
    expect(theirRun(library, runCodeOf(run), { ...result, ending: otherEnding })).toBeNull();
    const otherHistory = result.history!.replace(/:(decay|muddle|ascent):/, (m) => (m === ":ascent:" ? ":decay:" : ":ascent:"));
    expect(theirRun(library, runCodeOf(run), { ...result, history: otherHistory })).toBeNull();
    expect(theirRun(library, runCodeOf(run), result)).toEqual(run);
    expect(theirRun(library, runCodeOf(run), { ...result, ending: null })).toBeNull();
    expect(theirRun(library, runCodeOf(run), { ...result, cards: result.cards - 1, sides: result.sides!.slice(0, -1) })).toBeNull();
  });
});
