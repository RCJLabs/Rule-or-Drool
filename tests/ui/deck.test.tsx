// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { deckStamp, missingContent } from "../../src/engine/deck";
import type { GameState, Side } from "../../src/engine/types";
import { emptyMeta, encodeRunCode, loadMeta, resultOf, runCodeOf, saveMeta, type RunCode, type RunResult } from "../../src/meta";
import type { Measure } from "../../src/playtest/record";
import { App } from "../../src/ui/App";
import { Ending } from "../../src/ui/Ending";
import { beginRun } from "../../src/ui/flow";
import { loadRunChallenge, saveRun } from "../../src/ui/save";
import { shareLink } from "../../src/ui/share";
import { useGame } from "../../src/ui/useGame";

/**
 * A run knows its deck (BACKLOG-8 phase 49): links, saves and the daily log say which deck a
 * run was dealt from, and the game says "the same deck" only when it is.
 */

const T: Measure = { ms: 1000, looked: [0, 0] };
const noop = () => {};
/** A stamp no deck here has: the deck of some other version of the game. */
const OTHER = "zzzzzzzz";
const CODE: RunCode = { seed: 2024, align: "left", modifiers: [], unlocked: [], mandates: [] };
type Game = { current: ReturnType<typeof useGame> };

function finish(g: Game, sides: readonly Side[] = []) {
  for (let i = 0; i < 400 && g.current.state && !g.current.state.over; i++) {
    if (g.current.transition !== null) act(() => g.current.dismissTransition());
    act(() => g.current.choose(sides[i] ?? (i % 3 ? "right" : "left"), T));
  }
  expect(g.current.state?.over).toBeTruthy();
}

/** How the run from CODE went for someone who played it to the end. */
function sent(): RunResult {
  const g = renderHook(() => useGame(library)).result;
  act(() => g.current.startFromCode(CODE));
  finish(g);
  const result = resultOf(library, g.current.state!)!;
  cleanup();
  localStorage.clear();
  return result;
}

/** Their run, played here from its code, and its end screen. */
function endAgainst(vs: RunResult) {
  const g = renderHook(() => useGame(library)).result;
  act(() => g.current.startFromCode(CODE, undefined, vs));
  finish(g, ["right", "right", "left"]);
  render(<Ending lib={library} state={g.current.state!} fold={g.current.lastFold} challenge={g.current.challenge} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => cleanup());

describe("links", () => {
  it("carry the deck the run was dealt from, and none for a run no one deck dealt", () => {
    const s = beginRun(library, 4242, "right");
    const url = new URL(shareLink(s, "https://rcjlabs.github.io/Rule-or-Drool/"));
    expect(url.searchParams.get("deck")).toBe(deckStamp(library));
    // The run code itself is what it always was, so an older version still opens the link.
    expect(url.searchParams.get("run")).toBe(encodeRunCode(runCodeOf(s)));
    const { deck: _deck, ...unstamped } = s;
    expect(new URL(shareLink(unstamped, "https://x.test/")).searchParams.has("deck")).toBe(false);
  });

  it("say “the same deck” only when the link names this one", () => {
    const code = encodeRunCode(CODE);
    for (const [query, body] of [
      [`&deck=${deckStamp(library)}`, STRINGS.share.offerBody],
      [`&deck=${OTHER}`, STRINGS.share.offerOtherDeck],
      ["", STRINGS.share.offerMaybe],
      ["&deck=not-a-deck", STRINGS.share.offerMaybe],
    ] as const) {
      window.history.replaceState({}, "", `/?run=${code}${query}`);
      render(<App />);
      expect(screen.getByText(body)).toBeTruthy();
      cleanup();
    }
  });
});

describe("a saved run", () => {
  it("from another deck says so, and plays on with no stamp, since no one deck dealt it", () => {
    saveRun({ ...beginRun(library, 77, "left"), deck: OTHER });
    render(<App />);
    expect(screen.getByText(STRINGS.ui.savedUpdated)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(STRINGS.ui.continueRun) }));
    const saved = JSON.parse(localStorage.getItem("rod.run")!).state as GameState;
    expect(saved.seed).toBe(77);
    expect(saved.deck).toBeUndefined();
  });

  it("from this deck says nothing about decks", () => {
    saveRun(beginRun(library, 77, "left"));
    render(<App />);
    expect(screen.queryByText(STRINGS.ui.savedUpdated)).toBeNull();
    expect(screen.getByRole("button", { name: new RegExp(STRINGS.ui.continueRun) })).toBeTruthy();
  });

  it("naming a card this version lacks is refused with a sentence, never a blank page", () => {
    const gone = { ...beginRun(library, 77, "left"), current: "card_from_a_later_version" };
    expect(missingContent(library, gone)).toEqual(["card_from_a_later_version"]);
    expect(missingContent(library, beginRun(library, 77, "left"))).toEqual([]);
    saveRun(gone);
    render(<App />);
    expect(screen.getByText(STRINGS.ui.savedGone)).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(STRINGS.ui.continueRun) })).toBeNull();
  });

  it("keeps the deck of the run someone sent, beside its result", () => {
    const vs: RunResult = { history: null, ending: "riots", cards: 40, sides: null, deck: OTHER };
    saveRun(beginRun(library, 77, "left"), null, vs);
    expect(loadRunChallenge(library)?.deck).toBe(OTHER);
    saveRun(beginRun(library, 77, "left"), null, { ...vs, deck: undefined });
    expect(loadRunChallenge(library)?.deck).toBeUndefined();
  });
});

describe("the end of a run someone sent", () => {
  it("compares the two only when their run was dealt from this deck", () => {
    const result = sent();
    endAgainst({ ...result, deck: deckStamp(library) });
    expect(document.querySelector(".versus-verdict")).toBeTruthy();
    expect(document.querySelector(".versus-note")).toBeNull();
  });

  it("sets a run from another deck beside yours, and says why it is not compared", () => {
    endAgainst({ ...sent(), deck: OTHER });
    expect(document.querySelector(".versus-verdict")).toBeNull();
    expect(screen.getByText(STRINGS.vs.otherDeck)).toBeTruthy();
    expect(document.querySelector(".versus-table")).toBeTruthy();
  });

  it("draws no verdict from a run it cannot deal again, when the link named no deck", () => {
    const result = sent();
    endAgainst({ ...result, sides: result.sides!.map((s) => (s === "left" ? "right" : "left")) });
    expect(document.querySelector(".versus-verdict")).toBeNull();
    expect(screen.getByText(STRINGS.vs.unreplayed)).toBeTruthy();
  });
});

describe("the other road", () => {
  it("says why it is not offered after a run the game was updated during", () => {
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.startFromCode(CODE));
    finish(g);
    const done = g.current.state!;
    // What a run continued across an update looks like at its end: no stamp, and a record of
    // choices this deck does not deal again.
    const { deck: _deck, ...crossed } = { ...done, flags: [...done.flags, "dealt_by_another_deck"] };
    render(<Ending lib={library} state={crossed} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
    expect(screen.getByText(STRINGS.road.updated)).toBeTruthy();
    cleanup();
    render(<Ending lib={library} state={done} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
    expect(screen.queryByText(STRINGS.road.updated)).toBeNull();
  });
});

describe("the daily log", () => {
  it("keeps the deck each day was dealt from, and drops one that is not a deck", () => {
    const deck = deckStamp(library);
    saveMeta({
      ...emptyMeta(),
      dailies: [
        { day: "2026-09-21", history: null, ending: "riots", cards: 40, deck },
        { day: "2026-09-22", history: null, ending: "riots", cards: 41, deck: "<b>" },
      ],
    });
    const [a, b] = loadMeta().dailies;
    expect(a?.deck).toBe(deck);
    expect(b?.deck).toBeUndefined();
  });
});
