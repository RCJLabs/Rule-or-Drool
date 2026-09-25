// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { exitBand } from "../../src/engine/state";
import type { GameState, Side } from "../../src/engine/types";
import { dailySeed, encodeRunCode, encodeRunResult, historyOf, resultOf, runCodeOf, theirRun, type RunCode, type RunResult } from "../../src/meta";
import type { Measure } from "../../src/playtest/record";
import { App } from "../../src/ui/App";
import { Ending } from "../../src/ui/Ending";
import { dailyCode } from "../../src/ui/flow";
import { useGame } from "../../src/ui/useGame";

/**
 * Challenge a friend (BACKLOG-5 phase 37), in the game: the offer says what the sender got, the
 * end puts their run beside yours with both pictures, and the comparison survives the run being
 * left and taken up again.
 */

const T: Measure = { ms: 1000, looked: [0, 0] };
type Game = { current: ReturnType<typeof useGame> };
const noop = () => {};

/** Play on to the end, a side a card: the given sides, then alternating. */
function finish(g: Game, sides: readonly Side[] = []) {
  for (let i = 0; i < 400 && g.current.state && !g.current.state.over; i++) {
    if (g.current.transition !== null) act(() => g.current.dismissTransition());
    act(() => g.current.choose(sides[i] ?? (i % 3 ? "right" : "left"), T));
  }
  expect(g.current.state?.over).toBeTruthy();
}

/** A run someone played to its end from `code`, and what it came to. */
function sent(code: RunCode, sides?: Side[]): { run: GameState; result: RunResult } {
  const g = renderHook(() => useGame(library)).result;
  act(() => g.current.startFromCode(code));
  finish(g, sides ?? []);
  const run = g.current.state!;
  cleanup();
  localStorage.clear();
  return { run, result: resultOf(library, run)! };
}

const CODE: RunCode = { seed: 2024, align: "left", modifiers: [], unlocked: [], mandates: [] };

function ended(g: Game) {
  render(<Ending lib={library} state={g.current.state!} fold={g.current.lastFold} challenge={g.current.challenge} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the offer", () => {
  it("says what the sender got: the name history gave their run, and how it ended", () => {
    const { run, result } = sent(CODE, ["right", "right", "left"]);
    window.history.replaceState({}, "", `/?run=${encodeRunCode(CODE)}&vs=${encodeRunResult(result)}`);
    render(<App />);
    const offer = screen.getByRole("region", { name: STRINGS.share.offerTitle });
    const title = historyOf(run, exitBand(library, run)).title;
    expect(within(offer).getByText(`They left ${title}.`)).toBeTruthy();
    expect(within(offer).getByText(`${library.endings.get(run.over!.endingId)!.title}, after ${run.cardCount} cards.`)).toBeTruthy();
  });

  it("is as it was for a link that says nothing of how it went", () => {
    window.history.replaceState({}, "", `/?run=${encodeRunCode(CODE)}`);
    render(<App />);
    const offer = screen.getByRole("region", { name: STRINGS.share.offerTitle });
    expect(within(offer).queryByText(/^They left/)).toBeNull();
    expect(within(offer).getByRole("button", { name: STRINGS.share.offerPlay })).toBeTruthy();
  });
});

describe("the end of their run", () => {
  it("puts their run beside yours, both pictures, and says how they differ", () => {
    const { run: theirs, result } = sent(CODE, Array<Side>(12).fill("right"));
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.playShared(CODE, result));
    finish(g, Array<Side>(12).fill("left"));
    ended(g);
    const roads = document.querySelector(".roads")!;
    expect(roads.querySelectorAll(".world-frame svg")).toHaveLength(2);
    const theirTitle = historyOf(theirs, exitBand(library, theirs)).title;
    const mine = historyOf(g.current.state!, exitBand(library, g.current.state!));
    expect([...roads.querySelectorAll(".road-caption")].map((c) => c.textContent)).toEqual([`${STRINGS.vs.theirs} ${theirTitle}`, `${STRINGS.vs.yours} ${mine.title}`]);
    const table = within(screen.getByRole("region", { name: STRINGS.vs.title })).getByRole("table");
    const row = (label: string) => within(table).getByRole("row", { name: new RegExp(`^${label}`) }).textContent;
    expect(row(STRINGS.vs.history)).toBe(`${STRINGS.vs.history}${theirTitle}${mine.title}`);
    expect(row(STRINGS.vs.cards)).toBe(`${STRINGS.vs.cards}${theirs.cardCount}${g.current.state!.cardCount}`);
    expect(screen.queryByText(STRINGS.vs.unreplayed)).toBeNull();
  });

  it("says so when you both left the same history", () => {
    const { result } = sent(CODE);
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.playShared(CODE, result));
    finish(g, result.sides!);
    ended(g);
    const title = historyOf(g.current.state!, exitBand(library, g.current.state!)).title;
    expect(screen.getByText(STRINGS.vs.bothLeft.replace("{history}", title))).toBeTruthy();
  });

  it("compares by what their link says when their run cannot be dealt again here", () => {
    const { result } = sent(CODE);
    // As if played on a version that dealt differently: the sides no longer end where they say.
    const other: RunResult = { ...result, sides: result.sides!.map((s): Side => (s === "left" ? "right" : "left")) };
    expect(theirRun(library, CODE, other)).toBeNull();
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.playShared(CODE, other));
    finish(g);
    ended(g);
    expect(screen.getByText(STRINGS.vs.unreplayed)).toBeTruthy();
    expect(document.querySelector(".roads")).toBeNull();
    const table = within(screen.getByRole("region", { name: STRINGS.vs.title })).getByRole("table");
    expect(within(table).getByRole("row", { name: new RegExp(`^${STRINGS.vs.cards}`) }).textContent).toBe(`${STRINGS.vs.cards}${result.cards}${g.current.state!.cardCount}`);
  });

  it("still compares after the run was left and taken up again", () => {
    const { result } = sent(CODE);
    const first = renderHook(() => useGame(library));
    act(() => first.result.current.playShared(CODE, result));
    for (let i = 0; i < 4; i++) act(() => first.result.current.choose("left", T));
    first.unmount();
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.continueSaved());
    expect(g.current.challenge).toEqual(result);
    finish(g);
    expect(g.current.challenge).toEqual(result);
  });

  it("does not compare a second road taken from it: that end already shows two", () => {
    const { result } = sent(CODE);
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.playShared(CODE, result));
    finish(g);
    const k = g.current.state!.choices!.length - 2;
    act(() => g.current.takeOtherRoad(k));
    expect(g.current.challenge).toBeNull();
  });

  it("shares a link that says how your run went, for whoever you send it to", async () => {
    const { result } = sent(CODE);
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.playShared(CODE, result));
    finish(g);
    const writeText = vi.fn(async (_: string) => {});
    Object.assign(navigator, { clipboard: { writeText } });
    ended(g);
    fireEvent.click(screen.getByRole("button", { name: STRINGS.share.button }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const link = new URL(writeText.mock.calls[0]![0].split("\n").at(-1)!.split(" ").at(-1)!);
    expect(link.searchParams.get("run")).toBe(encodeRunCode(runCodeOf(g.current.state!)));
    expect(link.searchParams.get("vs")).toBe(encodeRunResult(resultOf(library, g.current.state!)!));
  });
});

describe("today's daily, sent by someone who played it", () => {
  const TODAY = "2026-09-23";

  it("counts as today's daily for whoever plays it, and the offer says so", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
    const code = dailyCode(library, dailySeed(TODAY), "right", []);
    const { result } = sent(code);
    window.history.replaceState({}, "", `/?run=${encodeRunCode(code)}&vs=${encodeRunResult(result)}`);
    render(<App />);
    expect(screen.getByText(STRINGS.share.offerDaily.replace("{n}", "3"))).toBeTruthy();
    cleanup();
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.playShared(code, result));
    finish(g);
    expect(g.current.meta.dailies.map((d) => d.day)).toEqual([TODAY]);
  });

  it("is not today's daily when it was yesterday's", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
    const code = dailyCode(library, dailySeed("2026-09-22"), "right", []);
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.playShared(code, null));
    finish(g);
    expect(g.current.meta.dailies).toEqual([]);
  });
});
