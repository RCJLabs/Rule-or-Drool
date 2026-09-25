// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { encodeRunCode } from "../../src/meta";
import { parseRecord } from "../../src/playtest/parse";
import { toFile, type Measure, type RecordedRun } from "../../src/playtest/record";
import { App } from "../../src/ui/App";
import { loadOpen, loadRecorded, MAX_RECORDED_RUNS, RECORD_FILE_NAME, sendRecord } from "../../src/ui/playtest";
import { DEFAULT_SETTINGS, migrateSettings } from "../../src/ui/settings";
import { SettingsMenu } from "../../src/ui/SettingsMenu";
import { useGame } from "../../src/ui/useGame";
import { SETTINGS_VERSION } from "../../src/version";

const T: Measure = { ms: 1200, looked: [0, 300] };
const stored = () => Object.keys(localStorage).filter((k) => k.startsWith("rod.playtest"));
type Game = { current: ReturnType<typeof useGame> };

const game = (): Game => renderHook(() => useGame(library)).result;
const turnOn = (g: Game) => act(() => g.current.setSettings({ ...g.current.settings, keepRecord: true }));
const play = (g: Game, n: number) => {
  for (let i = 0; i < n; i++) {
    if (g.current.transition !== null) act(() => g.current.dismissTransition());
    act(() => g.current.choose(i % 2 ? "left" : "right", T));
  }
};
/** Play on until the run is over, however long that takes. */
const finish = (g: Game) => {
  for (let i = 0; i < 400 && g.current.state && !g.current.state.over; i++) play(g, 1);
  expect(g.current.state?.over).toBeTruthy();
};

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the playtest record", () => {
  it("is off unless the player turns it on, and records nothing while it is", () => {
    expect(DEFAULT_SETTINGS.keepRecord).toBe(false);
    // Settings saved before the record existed load with it off.
    expect(migrateSettings({ v: 3, showChoices: true }).keepRecord).toBe(false);
    const g = game();
    act(() => g.current.start(101, "left"));
    finish(g);
    expect(stored()).toEqual([]);
    expect(g.current.record).toEqual({ runs: 0, full: false });
  });

  it("starts with the next run, records it card by card, and keeps it when it ends", () => {
    const g = game();
    act(() => g.current.start(102, "right"));
    turnOn(g);
    play(g, 2);
    // Turned on mid-run: this run is not the one recorded, since its start was not seen.
    expect(loadOpen()).toBeNull();

    act(() => g.current.start(103, "left"));
    play(g, 3);
    const open = loadOpen()!;
    expect(open).toMatchObject({ kind: "own", run: 1, game: expect.stringMatching(/^\d+\.\d+\.\d+$/), end: null });
    expect(open.code).toBe(encodeRunCode({ seed: 103, align: "left", modifiers: g.current.state!.modifiers, unlocked: [], mandates: [] }));
    expect(open.cards.map((c) => [c.side, c.ms, c.looked])).toEqual([
      ["right", 1200, [0, 300]],
      ["left", 1200, [0, 300]],
      ["right", 1200, [0, 300]],
    ]);

    finish(g);
    const runs = loadRecorded();
    // The run left for this one had cards, but was never recorded; only this one was.
    expect(runs).toHaveLength(1);
    expect(runs[0]!.end).toMatchObject({ ending: g.current.state!.over!.endingId, cards: g.current.state!.cardCount });
    expect(runs[0]!.cards).toHaveLength(g.current.state!.cardCount);
    expect(loadOpen()).toBeNull();
    expect(g.current.record.runs).toBe(1);
  });

  it("keeps a run left for another as unfinished, and marks a card that was left and come back to", () => {
    const g = game();
    turnOn(g);
    act(() => g.current.start(104, "left"));
    play(g, 3);
    act(() => g.current.exitToMenu());
    act(() => g.current.continueSaved());
    play(g, 2);
    const cards = loadOpen()!.cards;
    expect(cards.map((c) => c.resumed ?? false)).toEqual([false, false, false, true, false]);

    act(() => g.current.start(105, "right"));
    expect(loadRecorded()).toMatchObject([{ end: null, cards: { length: 5 } }]);
    expect(loadOpen()!.cards).toHaveLength(0);
  });

  it("says when a run was the daily or came from a code someone sent", () => {
    const g = game();
    turnOn(g);
    act(() => g.current.startDaily("left"));
    expect(loadOpen()!.kind).toBe("daily");
    act(() => g.current.startFromCode({ seed: 9, align: "right", modifiers: [], unlocked: [], mandates: [] }));
    expect(loadOpen()!.kind).toBe("shared");
  });

  it("stops recording when turned off, and keeps what was already recorded until it is deleted", () => {
    const g = game();
    turnOn(g);
    act(() => g.current.start(106, "left"));
    finish(g);
    act(() => g.current.start(107, "left"));
    play(g, 2);
    act(() => g.current.setSettings({ ...g.current.settings, keepRecord: false }));
    expect(loadOpen()).toBeNull();
    play(g, 2);
    expect(loadOpen()).toBeNull();
    expect(loadRecorded()).toHaveLength(1);

    act(() => g.current.deleteRecord());
    expect(stored()).toEqual([]);
    expect(g.current.record.runs).toBe(0);
  });

  it("goes with everything else when progress is erased", () => {
    const g = game();
    turnOn(g);
    act(() => g.current.start(108, "left"));
    finish(g);
    act(() => g.current.start(109, "left"));
    play(g, 1);
    expect(stored().sort()).toEqual(["rod.playtest", "rod.playtest.open"]);
    act(() => g.current.eraseProgress());
    expect(stored()).toEqual([]);
    expect(g.current.record.runs).toBe(0);
  });

  it("stops taking runs when full, rather than dropping the first ones", () => {
    const first: RecordedRun = { game: "0.43.0", code: "1.1.L.-.-.-", kind: "own", run: 1, end: null, cards: [] };
    localStorage.setItem("rod.playtest", JSON.stringify(toFile(Array.from({ length: MAX_RECORDED_RUNS }, (_, i) => ({ ...first, run: i + 1 })))));
    const g = game();
    expect(g.current.record).toEqual({ runs: MAX_RECORDED_RUNS, full: true });
    turnOn(g);
    act(() => g.current.start(110, "left"));
    play(g, 2);
    expect(loadOpen()).toBeNull();
    expect(loadRecorded()[0]!.run).toBe(1);
  });
});

describe("the clock on a card, in the game", () => {
  const begin = (reduceMotion = true) => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    localStorage.setItem("rod.settings", JSON.stringify({ v: SETTINGS_VERSION, keepRecord: true, reduceMotion }));
    window.history.replaceState({}, "", "/");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /the Ledger/ }));
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
  };
  const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
  const key = (k: string) => fireEvent.keyDown(window, { key: k });

  it("counts the time the card is up and each side's preview, to the moment of choosing", () => {
    // With the card's flight left in: the choice is made when the key goes down, not when
    // the card has finished leaving 260ms later.
    begin(false);
    wait(3000);
    key("ArrowRight");
    wait(1000);
    key("ArrowRight");
    wait(300);
    expect(loadOpen()!.cards[0]).toMatchObject({ side: "right", ms: 4000, looked: [0, 1000] });
  });

  it("stops while the settings are open and while the page is hidden", () => {
    begin();
    wait(500);
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.settings }));
    wait(60_000);
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.close }));
    wait(700);

    let hidden = true;
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
    document.dispatchEvent(new Event("visibilitychange"));
    wait(600_000);
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    wait(300);
    key("ArrowLeft");
    key("ArrowLeft");
    wait(10);
    expect(loadOpen()!.cards[0]).toMatchObject({ side: "left", ms: 1500 });
    delete (document as { visibilityState?: string }).visibilityState;
  });
});

describe("the record in the settings", () => {
  const open = (over: Partial<Parameters<typeof SettingsMenu>[0]> = {}) => {
    const onSendRecord = vi.fn(async () => "shared" as const);
    const onDeleteRecord = vi.fn();
    render(
      <SettingsMenu
        settings={DEFAULT_SETTINGS}
        onChange={vi.fn()}
        onClose={vi.fn()}
        onEraseProgress={vi.fn()}
        onHowItWorks={vi.fn()}
        record={{ runs: 0, full: false }}
        onSendRecord={onSendRecord}
        onDeleteRecord={onDeleteRecord}
        {...over}
      />,
    );
    return { onSendRecord, onDeleteRecord };
  };

  it("says nothing about a record while it is off and empty, and says it is waiting once on", () => {
    open();
    expect(screen.queryByText(STRINGS.playtest.none)).toBeNull();
    expect(screen.queryByRole("button", { name: STRINGS.playtest.send })).toBeNull();
    cleanup();
    open({ settings: { ...DEFAULT_SETTINGS, keepRecord: true } });
    expect(screen.getByText(STRINGS.playtest.none)).toBeTruthy();
  });

  it("sends the record when asked, and deletes it only on a second tap", async () => {
    // Off, with runs kept from before: turning it off never hides what was recorded.
    const { onSendRecord, onDeleteRecord } = open({ record: { runs: 3, full: false } });
    expect(screen.getByText("3 runs recorded.")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: STRINGS.playtest.send })));
    expect(onSendRecord).toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe(STRINGS.playtest.shared);

    fireEvent.click(screen.getByRole("button", { name: STRINGS.playtest.delete }));
    expect(onDeleteRecord).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: STRINGS.playtest.deleteConfirm }));
    expect(onDeleteRecord).toHaveBeenCalled();
  });

  it("says when the record is full", () => {
    open({ settings: { ...DEFAULT_SETTINGS, keepRecord: true }, record: { runs: MAX_RECORDED_RUNS, full: true } });
    expect(screen.getByText(STRINGS.playtest.full.replace("{n}", String(MAX_RECORDED_RUNS)))).toBeTruthy();
  });
});

describe("sending the record", () => {
  const run: RecordedRun = { game: "0.43.0", code: "1.1.L.-.-.-", kind: "own", run: 1, end: null, cards: [] };

  it("hands the share sheet a plain-text file that reads back as a record", async () => {
    const share = vi.fn(async (_: ShareData) => {});
    Object.assign(navigator, { share, canShare: () => true });
    expect(await sendRecord([run, { ...run, run: 2 }])).toBe("shared");
    const data = share.mock.calls[0]![0];
    const file = data.files![0]!;
    expect(file.name).toBe(RECORD_FILE_NAME);
    expect(file.type).toBe("text/plain");
    const parsed = parseRecord(await file.text());
    expect(parsed.ok && parsed.file.runs).toHaveLength(2);
    expect(data.text).toContain("2 runs");
  });

  it("reports a share the player backed out of as that, not as a failure", async () => {
    Object.assign(navigator, { share: vi.fn(async () => Promise.reject(Object.assign(new Error("no"), { name: "AbortError" }))), canShare: () => true });
    expect(await sendRecord([run])).toBe("cancelled");
  });

  it("saves the file where there is no share sheet", async () => {
    Object.assign(navigator, { share: undefined, canShare: undefined });
    const url = vi.fn(() => "blob:record");
    Object.assign(URL, { createObjectURL: url, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe(RECORD_FILE_NAME);
    });
    expect(await sendRecord([run])).toBe("saved");
    expect(click).toHaveBeenCalled();
  });
});
