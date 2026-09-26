// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { exitBand, newRun } from "../../src/engine/state";
import { SCENARIO_WEEKS, emptyMeta, historyOfRun, keepsContract, type MetaState, type ScenarioTry } from "../../src/meta";
import type { Measure } from "../../src/playtest/record";
import { Codex } from "../../src/ui/Codex";
import { Ending } from "../../src/ui/Ending";
import { EraTransition } from "../../src/ui/EraTransition";
import { dailyCode } from "../../src/ui/flow";
import { goalOf } from "../../src/ui/Scenario";
import { Setup } from "../../src/ui/Setup";
import { shareText } from "../../src/ui/share";
import { useGame } from "../../src/ui/useGame";

/**
 * The week's scenario on the screen (BACKLOG-12 phase 78): offered on the menu past the first term,
 * set out in the codex with the one try, said at each era's door, and told at the end.
 */

const TODAY = "2026-09-23";
const W = SCENARIO_WEEKS[0]!;
const w = STRINGS.scenario;
const T: Measure = { ms: 1000, looked: [0, 0] };
const noop = () => {};
const result = (met: boolean) => ({ met, cards: 105, ending: "finale_muddle", history: "x" });
const veteran = (scenarios: ScenarioTry[] = []): MetaState => ({ ...emptyMeta(), runs: 1, endings: { finale_muddle: 1 }, scenarios });
const named = (s: string) => s.replace("{n}", String(W.week));
type Game = { current: ReturnType<typeof useGame> };

function finish(g: Game) {
  for (let i = 0; i < 400 && g.current.state && !g.current.state.over; i++) {
    if (g.current.transition !== null) act(() => g.current.dismissTransition());
    act(() => g.current.choose(i % 3 ? "right" : "left", T));
  }
  expect(g.current.state?.over).toBeTruthy();
}

const menu = (meta: MetaState, more: Partial<Parameters<typeof Setup>[0]> = {}) =>
  render(
    <Setup
      lib={library}
      saved={null}
      meta={meta}
      onStart={noop}
      onDaily={noop}
      onContinue={noop}
      onCodex={noop}
      onSettings={noop}
      onContracts={noop}
      onScenario={noop}
      today={TODAY}
      {...more}
    />,
  );
const codex = (meta: MetaState, more: Partial<Parameters<typeof Codex>[0]> = {}) => {
  render(<Codex lib={library} meta={meta} onBack={noop} onSettings={noop} today={TODAY} open="scenario" {...more} />);
  return document.querySelector<HTMLElement>(".codex-panel .scenario")!;
};

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the week's scenario on the menu", () => {
  it("is offered by its week to a profile past its first term, and opens the week", () => {
    const opened: number[] = [];
    menu(veteran(), { onScenario: () => opened.push(1) });
    fireEvent.click(screen.getByRole("button", { name: named(w.menu) }));
    expect(opened).toEqual([1]);
    cleanup();
    menu(emptyMeta());
    expect(screen.queryByRole("button", { name: new RegExp(named(w.menu)) })).toBeNull();
  });

  it("says how the week's one try went", () => {
    for (const [tries, label] of [
      [[{ week: 1, result: result(true) }], w.menuMet],
      [[{ week: 1, result: result(false) }], w.menuMissed],
      [[{ week: 1 }], w.menuLeft],
    ] as const) {
      menu(veteran([...tries]));
      expect(screen.getByRole("button", { name: named(label) })).toBeTruthy();
      cleanup();
    }
  });

  it("says a try left for later is under way, on the way back into it", () => {
    const saved = { ...newRun(library, W.seed, { align: W.align, mandates: W.mandates }), cardCount: 12, current: null };
    menu(veteran([{ week: 1 }]), { saved, savedScenario: { week: 1 } });
    expect(screen.getByRole("button", { name: named(w.menuUnderWay) })).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(`${STRINGS.ui.continueRun}.*${named(w.heading)}`) })).toBeTruthy();
  });
});

describe("the week's scenario in the codex", () => {
  it("sets out the goal, the side, the promise and the setup, and starts on a press", () => {
    const started: number[] = [];
    const section = codex(veteran(), { onStartScenario: () => started.push(1) });
    expect(within(section).getByRole("heading", { name: named(w.heading) })).toBeTruthy();
    expect(section.querySelector(".scenario-goal")!.textContent).toBe(`${w.goal} ${goalOf(W)}`);
    expect(section.querySelector(".scenario-side")!.textContent).toContain(STRINGS.parties[W.align]);
    expect(section.textContent).toContain(w.intro);
    fireEvent.click(within(section).getByRole("button", { name: w.start }));
    expect(started).toEqual([1]);
  });

  it("offers no second try: says it is under way, left, or how it went", () => {
    expect(codex(veteran([{ week: 1 }]), { scenarioUnderWay: true, onStartScenario: noop }).querySelector(".scenario-state")!.textContent).toBe(w.underWay);
    expect(screen.queryByRole("button", { name: w.start })).toBeNull();
    cleanup();
    expect(codex(veteran([{ week: 1 }]), { onStartScenario: noop }).querySelector(".scenario-state")!.textContent).toBe(w.left);
    cleanup();
    const done = codex(veteran([{ week: 1, result: result(true) }]), { onStartScenario: noop }).querySelector(".scenario-state")!;
    expect(done.textContent).toContain(`✓ ${w.met}`);
    expect(done.textContent).toContain(w.result.replace("{cards}", "105").replace("{ending}", library.endings.get("finale_muddle")!.title));
  });

  it("lists how the weeks before went, the latest first, with their goals", () => {
    render(
      <Codex
        lib={library}
        meta={veteran([{ week: 1, result: result(true) }, { week: 2 }])}
        onBack={noop}
        onSettings={noop}
        today="2026-10-07"
        open="scenario"
      />,
    );
    const items = [...document.querySelectorAll(".scenario .codex-list li")];
    expect(items.map((li) => li.querySelector("b")!.textContent)).toEqual([w.heading.replace("{n}", "2"), `✓ ${w.heading.replace("{n}", "1")}`]);
    expect(items[1]!.textContent).toContain(goalOf(W));
    expect(items.map((li) => li.querySelector("em")!.textContent)).toEqual([w.unfinished, w.met]);
  });
});

describe("the week's try, played", () => {
  const today = () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  };

  it("is the week's run for everyone, spends the try as it starts, and counts once it ends", () => {
    today();
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.startScenario());
    expect(g.current.meta.scenarios).toEqual([{ week: 1 }]);
    expect(g.current.state).toMatchObject({ seed: W.seed, align: W.align, mandates: W.mandates });
    expect(g.current.playingScenario).toEqual({ week: 1 });
    finish(g);
    const run = g.current.state!;
    const fold = g.current.lastFold!;
    expect(fold.scenario?.result.met).toBe(keepsContract(W.goal, run, exitBand(library, run)));
    expect(g.current.meta.scenarios).toEqual([{ week: 1, result: fold.scenario!.result }]);
    // The week is spent: pressing again deals nothing.
    act(() => g.current.startScenario());
    expect(g.current.state).toBe(run);
    render(<Ending lib={library} state={run} fold={fold} onPlayAgain={noop} onCodex={noop} onSettings={noop} today={TODAY} />);
    const mark = document.querySelector(".scenario-mark")!;
    expect(mark.querySelector("b")!.textContent).toBe(`${named(w.ended)} · ${fold.scenario!.result.met ? `✓ ${w.met}` : w.missed}`);
    expect(mark.querySelector("span")!.textContent).toBe(goalOf(W));
  });

  it("still counts when it was left in one tab and finished in another", () => {
    today();
    const first = renderHook(() => useGame(library));
    act(() => first.result.current.startScenario());
    for (let i = 0; i < 5; i++) act(() => first.result.current.choose("left", T));
    first.unmount();
    const g = renderHook(() => useGame(library)).result;
    expect(g.current.savedScenario).toEqual({ week: 1 });
    act(() => g.current.continueSaved());
    expect(g.current.playingScenario).toEqual({ week: 1 });
    finish(g);
    expect(g.current.lastFold?.scenario?.week).toBe(1);
  });

  it("is spent when it is left for another run", () => {
    today();
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.startScenario());
    act(() => g.current.choose("left", T));
    act(() => g.current.start(2024, "left"));
    expect(g.current.playingScenario).toBeNull();
    act(() => g.current.startScenario());
    expect(g.current.state!.seed).toBe(2024);
    finish(g);
    expect(g.current.lastFold?.scenario).toBeNull();
    expect(g.current.meta.scenarios).toEqual([{ week: 1 }]);
  });
});

describe("a link to the week's scenario", () => {
  const code = () => dailyCode(library, W.seed, W.align, W.mandates);

  it("is offered as the week's one try, or as one that will not count once it was tried", () => {
    menu(veteran(), { shared: { ok: true, code: code() } });
    expect(screen.getByText(named(w.offer))).toBeTruthy();
    cleanup();
    menu(veteran([{ week: 1 }]), { shared: { ok: true, code: code() } });
    expect(screen.getByText(named(w.offerTried))).toBeTruthy();
  });

  it("is played as the try when the week has not been tried, and as someone's run after", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
    localStorage.setItem("rod.meta", JSON.stringify(veteran()));
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.playShared(code()));
    expect(g.current.meta.scenarios).toEqual([{ week: 1 }]);
    expect(g.current.playingScenario).toEqual({ week: 1 });
    act(() => g.current.playShared(code()));
    expect(g.current.playingScenario).toBeNull();
    expect(g.current.meta.scenarios).toEqual([{ week: 1 }]);
  });
});

describe("the week's goal, said", () => {
  it("at each era's door, where the play screen has no room for it", () => {
    const state = newRun(library, W.seed, { align: W.align, mandates: W.mandates });
    render(<EraTransition lib={library} state={{ ...state, era: 2 }} era={2} reduceMotion onContinue={noop} goal={goalOf(W)} />);
    const goal = document.getElementById("era-goal")!;
    expect(goal.textContent).toBe(`${w.goal} ${goalOf(W)}`);
    expect(screen.getByRole("dialog").getAttribute("aria-describedby")).toContain("era-goal");
  });

  it("in the words a share sends, with whether it was met", () => {
    const run = {
      ...newRun(library, W.seed, { align: W.align, mandates: W.mandates }),
      cardCount: 105,
      over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" },
    };
    const history = historyOfRun(library, run, "muddle");
    const text = shareText(run, history, "An ending", "https://example.test/", undefined, { week: 1, met: true, goal: goalOf(W) }).split("\n");
    expect(text[0]).toBe(`${STRINGS.title}, ${named(w.share)} — “${history.title}”`);
    expect(text[1]).toBe(w.shareMet.replace("{goal}", goalOf(W)));
    expect(shareText(run, history, "An ending", "https://example.test/", undefined, { week: 1, met: false, goal: goalOf(W) }).split("\n")[1]).toBe(
      w.shareMissed.replace("{goal}", goalOf(W)),
    );
  });
});
