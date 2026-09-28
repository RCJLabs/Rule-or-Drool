// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { epilogueByKey, withNames } from "../../src/engine/endings";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { HISTORY_ORDER, LEGACIES, NO_LEGACY, emptyMeta, followUpKey, foldRun, historyOfRun } from "../../src/meta";
import { BOTS, makeContext } from "../../src/sim";
import { Ending } from "../../src/ui/Ending";

/**
 * An end screen that does not repeat itself (BACKLOG-13 phase 86): what the player has read on one
 * before folds into a line they can open, and the follow-ups new to them lead.
 */

afterEach(cleanup);
const noop = () => {};

/** A run the mixed bot plays from this seed, as a player would deal it. */
function played(seed: number): GameState {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s: GameState = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

const followUpsOf = (s: GameState) => historyOfRun(library, s, exitBand(library, s)).consequences;

/** A played run with one to three follow-ups, so one more decision still gets followed up. */
function withFollowUps(): GameState {
  for (let seed = 1; seed <= 200; seed++) {
    const s = played(seed);
    const shown = followUpsOf(s);
    if (shown.length >= 1 && shown.length <= 3 && shown.every((c) => c.flag !== NO_LEGACY)) return s;
  }
  throw new Error("no run in 200 had one to three follow-ups");
}

const a = withFollowUps();
/** The same run with a decision it did not make, which history now follows up too. */
const decided = HISTORY_ORDER.find((f) => !a.flags.includes(f) && LEGACIES[f])!;
const b: GameState = { ...a, flags: [...a.flags, decided], flagSince: { ...a.flagSince, [decided]: 5 } };
const endingText = (s: GameState) => withNames(library, s, library.endings.get(s.over!.endingId)!.text);
const texts = (sel: string) => [...document.querySelectorAll(sel)].map((e) => e.textContent);
/** A follow-up's name, without the card it was made on. */
const named = (sel: string) => [...document.querySelectorAll(sel)].map((b) => b.firstChild?.textContent);

describe("an end screen the first time", () => {
  it("tells everything in full", () => {
    const fold = foldRun(library, emptyMeta(), a);
    expect(fold.read).toEqual({ ending: false, epilogue: false, followUps: [] });
    render(<Ending lib={library} state={a} fold={fold} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".read-before")).toBeNull();
    expect(texts(".ending > .ending-text")).toEqual([endingText(a)]);
    expect(texts(".epilogue > p:not(.band-label)")).toEqual([epilogueByKey(library, a.over!.epilogueKey)!.text]);
    expect(named(".became > ul > li > b")).toEqual(followUpsOf(a).map((c) => c.label));
  });
});

describe("an end screen the player has read before", () => {
  const meta = foldRun(library, emptyMeta(), a).meta;
  const fold = foldRun(library, meta, b);

  it("knows the ending, the epilogue and the follow-ups the player read, in the band they read them in", () => {
    const band = exitBand(library, b);
    expect(fold.read.ending).toBe(true);
    expect(fold.read.epilogue).toBe(true);
    expect(fold.read.followUps).toEqual(followUpsOf(a).map((c) => followUpKey(c.flag, band)));
    expect(followUpsOf(b).map((c) => c.flag)).toContain(decided);
  });

  it("folds what was read into lines that open, and leads with the follow-up that is new", () => {
    render(<Ending lib={library} state={b} fold={fold} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    // The ending's words and the epilogue, each a line that opens on them.
    expect(texts(".ending-again > summary")).toEqual([STRINGS.after.readBefore.ending]);
    expect(texts(".ending-again > .ending-text")).toEqual([endingText(b)]);
    expect(texts(".epilogue .read-before > summary")).toEqual([STRINGS.after.readBefore.epilogue]);
    expect(texts(".epilogue .read-before > p")).toEqual([epilogueByKey(library, b.over!.epilogueKey)!.text]);
    // The new follow-up in full, first; the ones read, folded after it under their names.
    expect(named(".became > ul > li > b")).toEqual([LEGACIES[decided]]);
    const read = followUpsOf(a).map((c) => c.label);
    expect(texts(".became-again > summary")).toEqual([STRINGS.after.readBefore.followUps.replace("{labels}", read.join(" · "))]);
    expect(document.querySelectorAll(".became-again li")).toHaveLength(read.length);
    const [list, folded] = [document.querySelector(".became > ul")!, document.querySelector(".became-again")!];
    expect(list.compareDocumentPosition(folded) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("folds nothing when the screen has no fold to say what was read, as after a reload", () => {
    render(<Ending lib={library} state={b} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".read-before")).toBeNull();
    expect(texts(".ending > .ending-text")).toEqual([endingText(b)]);
  });

  it("folds every follow-up when all were read, and the section is one line", () => {
    const again = foldRun(library, fold.meta, b);
    expect(again.read.followUps).toHaveLength(followUpsOf(b).length);
    render(<Ending lib={library} state={b} fold={again} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".became > ul")).toBeNull();
    expect(document.querySelectorAll(".became-again li")).toHaveLength(followUpsOf(b).length);
  });
});
