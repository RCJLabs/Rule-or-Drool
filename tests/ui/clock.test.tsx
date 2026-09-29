// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { CLOCK } from "../../src/engine/danger";
import { draw } from "../../src/engine/draw";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { emptyMeta, encodeRunCode, foldRun, historyOf, runCodeOf, type MetaState } from "../../src/meta";
import { App } from "../../src/ui/App";
import { causeLine, endCause } from "../../src/ui/cause";
import { OPENS } from "../../src/ui/clock";
import { MetersBar } from "../../src/ui/Meters";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { Setup } from "../../src/ui/Setup";
import { shareText } from "../../src/ui/share";
import { lessonFor } from "../../src/ui/teach";
import { themeFor } from "../../src/ui/theme";
import { useGame } from "../../src/ui/useGame";

/** On the clock in the game (BACKLOG-13 phase 93): offered, started, drawn, said, taught and told. */

const noop = () => {};

/** A profile whose run ended on the Ascent, which opens the clock. */
function ascended(): MetaState {
  const run: GameState = {
    ...newRun(library, 1, { align: "left" }),
    cardCount: 105,
    era: 3,
    drift: 60,
    band: "ascent",
    bandLocked: true,
    over: { endingId: "finale_ascent", epilogueKey: "ascent:left:3" },
  };
  return foldRun(library, emptyMeta(), run).meta;
}

/** A run on the clock with Money in danger at its bottom and three decisions left to lift it. */
function counting(left = 3): GameState {
  const s = draw(library, newRun(library, 11, { align: "left", clock: CLOCK }));
  return { ...s, meters: { ...s.meters, money: 8 }, dangerLeft: { money: left } };
}

const menu = (meta: MetaState, onStart = noop as (...a: unknown[]) => void) =>
  render(<Setup lib={library} saved={null} meta={meta} onStart={onStart} onDaily={noop} onContinue={noop} onCodex={noop} onSettings={noop} />);

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => cleanup());

describe("choosing the clock", () => {
  it("is offered once a run has ended on the Ascent, as a warning by default, and starts either term on it", () => {
    menu(emptyMeta());
    expect(screen.queryByRole("group", { name: STRINGS.clock.legend })).toBeNull();
    cleanup();
    const started: unknown[][] = [];
    menu(ascended(), (...a) => started.push(a));
    const danger = screen.getByRole("group", { name: STRINGS.clock.legend });
    expect(
      within(danger)
        .getByRole("button", { name: new RegExp(STRINGS.clock.ordinary) })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[0]![7]).toBeUndefined();
    fireEvent.click(within(danger).getByRole("button", { name: new RegExp(STRINGS.clock.title) }));
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[1]![7]).toBe(CLOCK);
    fireEvent.click(screen.getByRole("button", { name: STRINGS.reign.shortStart }));
    expect(started[2]![3]).toBe(library.config.firstTermEras);
    expect(started[2]![7]).toBe(CLOCK);
    // The blurb says how many decisions, and that the top ends a rule only at the edge.
    expect(danger.textContent).toContain(STRINGS.clock.blurb.replace("{n}", String(CLOCK)));
  });

  it("starts a run on the clock, which a reload keeps and the menu names", () => {
    const first = renderHook(() => useGame(library));
    act(() => first.result.current.start(2024, "left", [], undefined, null, null, null, CLOCK));
    expect(first.result.current.state!.clock).toBe(CLOCK);
    act(() => first.result.current.exitToMenu());
    first.unmount();
    const g = renderHook(() => useGame(library)).result;
    expect(g.current.saved!.clock).toBe(CLOCK);
    render(<Setup lib={library} saved={g.current.saved} meta={ascended()} onStart={noop} onDaily={noop} onContinue={noop} onCodex={noop} onSettings={noop} />);
    expect(screen.getByRole("button", { name: new RegExp(`${STRINGS.ui.continueRun}.*${STRINGS.clock.short}`) })).toBeTruthy();
  });

  it("offers a run on the clock someone sent as one", () => {
    const run = newRun(library, 5, { align: "right", clock: CLOCK });
    window.history.replaceState({}, "", `/?run=${encodeRunCode(runCodeOf(run))}`);
    render(<App />);
    const offer = screen.getByRole("region", { name: STRINGS.share.offerTitle });
    expect(within(offer).getByText(STRINGS.clock.offer.replace("{n}", String(CLOCK)))).toBeTruthy();
  });
});

describe("a meter on the clock", () => {
  const bar = (state: GameState) =>
    render(<MetersBar lib={library} state={state} meters={state.meters} preview={null} theme={themeFor(state.drift)} align={state.align} />);

  it("has a pip for each decision of the clock under it, filled for those left, and says how many", () => {
    bar(counting(3));
    const rows = document.querySelectorAll(".meter-clock");
    // A row under every meter of a run on the clock, so the card does not move when one fills.
    expect(rows).toHaveLength(6);
    const money = [...document.querySelectorAll(".meter")].find((m) => m.getAttribute("aria-label")?.startsWith("Money"))!;
    expect(money.querySelectorAll(".meter-clock i")).toHaveLength(CLOCK);
    expect(money.querySelectorAll(".meter-clock i.left")).toHaveLength(3);
    expect(money.getAttribute("aria-label")).toContain("3 decisions left");
    expect([...rows].filter((r) => r.children.length > 0)).toHaveLength(1);
    cleanup();
    bar(counting(1));
    expect(document.querySelector(".meter[aria-label^='Money']")!.getAttribute("aria-label")).toContain(STRINGS.clock.leftOne);
  });

  it("draws no row in a run not on the clock", () => {
    const plain = draw(library, newRun(library, 11, { align: "left" }));
    bar({ ...plain, meters: { ...plain.meters, money: 8 } });
    expect(document.querySelectorAll(".meter-clock")).toHaveLength(0);
  });

  it("is said with each card, and taught the first time one counts down", () => {
    const state = counting(3);
    render(
      <Play
        lib={library}
        state={state}
        transition={null}
        onChoose={noop}
        onDismissTransition={noop}
        debug={false}
        settings={DEFAULT_SETTINGS}
        onSettings={noop}
        onCabinet={noop}
        onTaught={noop}
      />,
    );
    const heard = document.querySelector("footer .sr-only[aria-live]")?.textContent ?? "";
    expect(heard).toContain(STRINGS.clock.spoken.replace("{meter}", "Money").replace("{left}", "3 decisions left"));
    // A player the clock is opened to has had the lessons of a run's first cards.
    const taught = ["meters", "hidden"];
    expect(lessonFor(library, state, taught)?.id).toBe("clock");
    expect(lessonFor(library, { ...state, dangerLeft: {} }, taught)?.id).not.toBe("clock");
  });
});

describe("the end of a run on the clock", () => {
  it("says the clock ended it, and the share says it was on the clock", () => {
    const over: GameState = { ...counting(0), current: null, over: { endingId: library.config.meterEndings.money.low, epilogueKey: "muddle:left:1" } };
    const cause = endCause(library, over, null);
    expect(cause).toEqual({ kind: "clock", meter: "money", decisions: CLOCK });
    expect(causeLine(library, over, cause)).toBe(STRINGS.clock.cause.replace("{meter}", STRINGS.cause.names.money).replace("{n}", String(CLOCK)));
    const text = shareText(over, historyOf(over, "muddle"), "The ending", "https://example.test/");
    expect(text).toContain(`${STRINGS.clock.share}.`);
    expect(shareText({ ...over, clock: undefined }, historyOf(over, "muddle"), "The ending", "https://example.test/")).not.toContain(STRINGS.clock.share);
  });

  it("is opened by the objective of a run ending on the Ascent, and says so", () => {
    expect(OPENS.on_the_clock.opens).toBe(STRINGS.clock.opens);
    expect(Object.keys(ascended().objectives)).toContain("obj_reach_ascent");
  });
});
