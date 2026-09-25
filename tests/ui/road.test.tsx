// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { exitBand, newRun, rollSetup } from "../../src/engine/state";
import { otherSide, replayTo } from "../../src/engine/replay";
import { resolve } from "../../src/engine/resolve";
import type { GameState } from "../../src/engine/types";
import { historyOf } from "../../src/meta";
import type { Measure } from "../../src/playtest/record";
import { Codex } from "../../src/ui/Codex";
import { Ending } from "../../src/ui/Ending";
import { Play } from "../../src/ui/Play";
import { migrateRun } from "../../src/ui/save";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { useGame } from "../../src/ui/useGame";

const T: Measure = { ms: 1000, looked: [0, 0] };
type Game = { current: ReturnType<typeof useGame> };

/** Play on to the end, a side a card, the way a player who alternates would. */
function finish(g: Game) {
  for (let i = 0; i < 400 && g.current.state && !g.current.state.over; i++) {
    if (g.current.transition !== null) act(() => g.current.dismissTransition());
    act(() => g.current.choose(i % 3 ? "right" : "left", T));
  }
  expect(g.current.state?.over).toBeTruthy();
}

/** The card a run's defining decision was made on, as the end screen offers it. */
function decisionCard(s: GameState): number {
  const c = historyOf(s, exitBand(library, s)).consequences.find((x) => x.at !== null && x.at > 0);
  if (!c) throw new Error("this run carries no dated decision");
  return c.at! - 1;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("taking the other road", () => {
  it("goes back to the card, takes the other side, and plays on with the first road kept", () => {
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.start(2024, "left"));
    finish(g);
    const first = g.current.state!;
    const k = decisionCard(first);

    act(() => g.current.takeOtherRoad(k));
    const second = g.current.state!;
    expect(second.road).toEqual({ first, at: k });
    // The same run up to that card, and the other side on it.
    expect(second.choices!.slice(0, k)).toEqual(first.choices!.slice(0, k));
    expect(second.choices![k]).toEqual([first.choices![k]![0], otherSide(first.choices![k]![1])]);
    expect(second.cardCount).toBe(k + 1);

    finish(g);
    expect(g.current.meta.runs).toBe(2);
    expect(g.current.meta.history[0]).toMatchObject({ road: true });
    expect(g.current.meta.history[1]!.road).toBeUndefined();
    // A second road does not branch again.
    const ended = g.current.state!;
    act(() => g.current.takeOtherRoad(0));
    expect(g.current.state).toBe(ended);
  });

  it("ends the second road at once when the other side is itself an ending, and folds it", () => {
    // Measured: in 9.0% of the ways back a competent run offers, the other side ends the run
    // on the spot. The second road is then over before it starts, and still counts.
    for (let seed = 1; seed <= 300; seed++) {
      localStorage.clear();
      const g = renderHook(() => useGame(library)).result;
      act(() => g.current.start(seed, "left"));
      finish(g);
      const first = g.current.state!;
      const ks = historyOf(first, exitBand(library, first)).consequences.filter((c) => c.at !== null && c.at > 0).map((c) => c.at! - 1);
      const k = ks.find((k) => {
        const back = replayTo(library, first, k)!;
        return resolve(library, back, back.current!, otherSide(first.choices![k]![1])).over;
      });
      if (k === undefined) continue;
      act(() => g.current.takeOtherRoad(k));
      expect(g.current.state!.over).toBeTruthy();
      expect(g.current.state!.road?.at).toBe(k);
      expect(g.current.screen).toBe("over");
      expect(g.current.meta.runs).toBe(2);
      expect(g.current.meta.history[0]).toMatchObject({ road: true });
      return;
    }
    throw new Error("no way back in 300 runs ends the run at once");
  });

  it("never counts a second road as the daily", () => {
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.startDaily("left"));
    finish(g);
    const dailies = g.current.meta.dailies;
    expect(dailies).toHaveLength(1);
    act(() => g.current.takeOtherRoad(decisionCard(g.current.state!)));
    finish(g);
    expect(g.current.meta.dailies).toEqual(dailies);
    expect(g.current.meta.runs).toBe(2);
  });
});

describe("the end screen", () => {
  function ended(seed = 2024): GameState {
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.start(seed, "left"));
    finish(g);
    return g.current.state!;
  }
  const noop = () => {};

  it("offers the other side of each decision that made the run", () => {
    const s = ended();
    const onTakeOtherRoad = vi.fn();
    render(<Ending lib={library} state={s} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={onTakeOtherRoad} />);
    const k = decisionCard(s);
    const [cardId, side] = s.choices![k]!;
    const label = library.cards.get(cardId)![otherSide(side)].label;
    fireEvent.click(screen.getAllByRole("button", { name: STRINGS.road.choose.replace("{label}", label) })[0]!);
    expect(onTakeOtherRoad).toHaveBeenCalledWith(k);
  });

  it("offers nothing for a run it cannot retrace", () => {
    const s = ended();
    render(<Ending lib={library} state={{ ...s, choices: null }} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
    expect(document.querySelector(".road-back")).toBeNull();
  });

  it("offers nothing for a run begun before an update that deals it differently", () => {
    // A third advisor in each role changed the cabinet a seed deals (BACKLOG-5 phase 35). A
    // run saved before that and finished after it holds a record the update no longer deals:
    // sometimes a different card, sometimes the same cards under different people. Either
    // way a way back would lead into a run that never happened, so none is offered.
    const s = ended();
    const offered = (state: GameState) => {
      const { unmount } = render(<Ending lib={library} state={state} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
      const n = document.querySelectorAll(".road-back").length;
      unmount();
      return n;
    };
    expect(offered(s)).toBeGreaterThan(0);
    const k = Math.floor(s.cardCount / 2);
    expect(offered({ ...s, choices: s.choices!.map((c, i) => (i === k ? (["not_a_card", c[1]] as typeof c) : c)) })).toBe(0);
    const [role, id] = Object.entries(s.cabinet).find(([r]) => r !== library.config.rivalRole)!;
    const someoneElse = [...library.advisorsById.values()].find((a) => a.role === role && a.id !== id)!;
    expect(offered({ ...s, cabinet: { ...s.cabinet, [role]: someoneElse.id } })).toBe(0);
  });

  it("shows both roads at the end of the second: each name and each world", () => {
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.start(2024, "left"));
    finish(g);
    const first = g.current.state!;
    const k = decisionCard(first);
    act(() => g.current.takeOtherRoad(k));
    finish(g);
    const second = g.current.state!;
    render(<Ending lib={library} state={second} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
    const captions = [...document.querySelectorAll(".road-caption")].map((c) => c.textContent);
    expect(captions).toEqual([
      `${STRINGS.road.first} ${historyOf(first, exitBand(library, first)).title}`,
      `${STRINGS.road.second} ${historyOf(second, exitBand(library, second)).title}`,
    ]);
    expect(document.querySelectorAll(".roads .world-frame svg")).toHaveLength(2);
    expect(document.querySelector(".roads-parted")!.textContent).toContain(`card ${k + 1}`);
    expect(document.querySelector(".road-back")).toBeNull();
  });
});

describe("the other road, elsewhere", () => {
  it("says on its first card where it left the first", () => {
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.start(2024, "left"));
    finish(g);
    const k = decisionCard(g.current.state!);
    act(() => g.current.takeOtherRoad(k));
    if (g.current.transition !== null) act(() => g.current.dismissTransition());
    const s = g.current.state!;
    render(
      <Play lib={library} state={s} transition={null} onChoose={() => {}} onDismissTransition={() => {}} debug={false} settings={DEFAULT_SETTINGS} onSettings={() => {}} onCabinet={() => {}} onTaught={() => {}} />,
    );
    const [cardId, side] = s.choices![k]!;
    expect(document.querySelector(".road-note")!.textContent).toBe(
      STRINGS.road.note.replace("{n}", String(k + 1)).replace("{label}", library.cards.get(cardId)![side].label),
    );
    expect(document.querySelector(".road-mark")!.textContent).toContain(STRINGS.road.mark);
  });

  it("marks a second road in the codex", () => {
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.start(2024, "left"));
    finish(g);
    act(() => g.current.takeOtherRoad(decisionCard(g.current.state!)));
    finish(g);
    render(<Codex lib={library} meta={g.current.meta} onBack={() => {}} onSettings={() => {}} open="runs" />);
    expect(document.querySelectorAll(".codex-road")).toHaveLength(1);
  });

  it("brings a run saved before choices were kept forward, with no record to go back into", () => {
    const v9 = newRun(library, 5, { ...rollSetup(library, 5, "left", []), mandates: [] }) as Partial<GameState>;
    delete v9.choices;
    delete v9.road;
    const s = migrateRun(9, v9 as GameState)!;
    expect(s.choices).toBeNull();
    expect(s.road).toBeNull();
  });
});
