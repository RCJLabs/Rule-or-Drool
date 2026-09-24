// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import type { GameState, Side } from "../../src/engine/types";
import { asides, clearAsides, clearMeta, dropAside, emptyMeta, markAside, saveMeta } from "../../src/meta";
import { resetStorageReport, writeFailures } from "../../src/meta/storage";
import { openRun, type Measure } from "../../src/playtest/record";
import { App } from "../../src/ui/App";
import { CrashGuard } from "../../src/ui/Crash";
import { beginRun } from "../../src/ui/flow";
import { appendRecorded, clearRecorded, saveOpen } from "../../src/ui/playtest";
import { clearRun, markHintSeen, saveRun } from "../../src/ui/save";
import { DEFAULT_SETTINGS, saveSettings } from "../../src/ui/settings";
import { useGame } from "../../src/ui/useGame";
import { APP_VERSION, META_SAVE_VERSION } from "../../src/version";
import { playedProfile } from "./profile";

/**
 * Nothing lost without a word (BACKLOG-8 phase 50). Every write the game makes can fail: the
 * browser's storage fills up, is blocked, or is gone. Each save used to swallow that where it
 * happened. These tests make the storage refuse, and hold the game to telling the player.
 */

const n = STRINGS.notice;
const c = STRINGS.crash;
const T: Measure = { ms: 1000, looked: [0, 0] };
type Game = { current: ReturnType<typeof useGame> };

/** Storage that takes nothing more, as a full or blocked one does: every write throws. */
function refuseWrites(only?: string) {
  const full = () => new DOMException("The quota has been exceeded.", "QuotaExceededError");
  const setItem = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
    if (only && key !== only) return setItem.call(this, key, value);
    throw full();
  });
  if (!only) {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw full();
    });
  }
}

function finish(g: Game, sides: readonly Side[] = []) {
  for (let i = 0; i < 400 && g.current.state && !g.current.state.over; i++) {
    if (g.current.transition !== null) act(() => g.current.dismissTransition());
    act(() => g.current.choose(sides[i] ?? (i % 3 ? "right" : "left"), T));
  }
  expect(g.current.state?.over).toBeTruthy();
}

const stored = () => localStorage.getItem("rod.meta");

beforeEach(() => {
  localStorage.clear();
  resetStorageReport();
  window.history.replaceState({}, "", "/");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Every source file under a folder. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sources(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("every write", () => {
  it("goes through the one place that reports a failure", () => {
    const direct = sources("src").filter((f) => f !== join("src", "meta", "storage.ts") && /localStorage\s*\.\s*(setItem|removeItem|clear)\b/.test(readFileSync(f, "utf8")));
    expect(direct, "write through writeKey or removeKey in src/meta/storage.ts").toEqual([]);
  });

  it("reports a write the storage refuses, and throws none", () => {
    const run = beginRun(library, 7, "left");
    const open = openRun(run, { kind: "own", run: 1, game: APP_VERSION });
    localStorage.setItem("rod.meta.aside", JSON.stringify([{ at: 1, reason: "unreadable", raw: "{" }]));
    const writes: [string, () => unknown][] = [
      ["the profile", () => saveMeta(emptyMeta())],
      ["erasing the profile", () => clearMeta()],
      ["the run", () => saveRun(run)],
      ["clearing the run", () => clearRun()],
      ["the first-run hint", () => markHintSeen()],
      ["the settings", () => saveSettings(DEFAULT_SETTINGS)],
      ["a run added to the playtest record", () => appendRecorded({ ...open, end: null })],
      ["the run being recorded", () => saveOpen(open)],
      ["letting the run being recorded go", () => saveOpen(null)],
      ["deleting the playtest record", () => clearRecorded()],
      ["telling of a profile set aside", () => markAside(1, "told")],
      ["letting a profile set aside go", () => dropAside(1)],
      ["erasing the profiles set aside", () => clearAsides()],
    ];
    refuseWrites();
    for (const [what, write] of writes) {
      const before = writeFailures();
      expect(write, what).not.toThrow();
      expect(writeFailures(), what).toBeGreaterThan(before);
    }
  });
});

describe("a failed save", () => {
  it("is told once, with the way out: Move my progress", async () => {
    render(<App />);
    refuseWrites();
    fireEvent.click(screen.getByRole("button", { name: /the Ledger/ }));
    fireEvent.click(screen.getByRole("button", { name: "Take office" }));
    const notice = await screen.findByRole("alertdialog", { name: n.storageTitle });
    expect(within(notice).getByText(n.storage)).toBeTruthy();
    fireEvent.click(within(notice).getByRole("button", { name: STRINGS.ui.gotIt }));
    // Leaving to the menu saves the run again, and fails again. The player has been told.
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.settings }));
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.exitToMenu }));
    await act(async () => {});
    expect(writeFailures()).toBeGreaterThan(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("opens Move my progress from the notice, which still hands on what the session holds", async () => {
    render(<App />);
    refuseWrites();
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.settings }));
    fireEvent.click(screen.getByRole("checkbox", { name: /^Sound/ }));
    const notice = await screen.findByRole("alertdialog", { name: n.storageTitle });
    fireEvent.click(within(notice).getByRole("button", { name: STRINGS.move.open }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("dialog", { name: STRINGS.move.title })).toBeTruthy();
  });
});

describe("a profile this version cannot read", () => {
  it("is set aside, told once, and never written over", () => {
    localStorage.setItem("rod.meta", "{not json");
    let g = renderHook(() => useGame(library)).result;
    expect(g.current.notice).toMatchObject({ kind: "setAside", aside: { reason: "unreadable", raw: "{not json" } });
    expect(g.current.meta.runs).toBe(0);
    act(() => g.current.dismissNotice());
    // Loaded again before anything is saved: the same profile, set aside once, told once.
    cleanup();
    g = renderHook(() => useGame(library)).result;
    expect(g.current.notice).toBeNull();
    act(() => g.current.start(99, "left"));
    finish(g);
    expect(JSON.parse(stored()!).runs).toBe(1);
    expect(asides().map((a) => [a.reason, a.raw])).toEqual([["unreadable", "{not json"]]);
  });

  it("from a newer version says so", () => {
    localStorage.setItem("rod.meta", JSON.stringify({ ...playedProfile(3), v: META_SAVE_VERSION + 1 }));
    render(<App />);
    const notice = screen.getByRole("alertdialog", { name: n.asideTitle });
    expect(within(notice).getByText(n.asideNewer)).toBeTruthy();
    expect(asides()[0]?.reason).toBe("newer");
  });

  it("that cannot be set aside either is left as it was, and the game says it is not saving", async () => {
    localStorage.setItem("rod.meta", "{not json");
    refuseWrites("rod.meta.aside");
    const g = renderHook(() => useGame(library)).result;
    await waitFor(() => expect(g.current.notice?.kind).toBe("storage"));
    act(() => g.current.start(99, "left"));
    finish(g);
    expect(stored()).toBe("{not json");
  });

  it("comes back, once this version can read it, beside what is here and only when asked", async () => {
    const at = Date.UTC(2026, 8, 20);
    localStorage.setItem("rod.meta.aside", JSON.stringify([{ at, reason: "newer", raw: JSON.stringify(playedProfile(12)), told: true }]));
    saveMeta(playedProfile(1));
    saveSettings({ ...DEFAULT_SETTINGS, reduceMotion: true });
    render(<App />);
    const notice = screen.getByRole("alertdialog", { name: n.backTitle });
    expect(within(notice).getByText(n.back.replace("{day}", "2026-09-20"))).toBeTruthy();
    fireEvent.click(within(notice).getByRole("button", { name: STRINGS.move.open }));
    const move = screen.getByRole("dialog", { name: STRINGS.move.title });
    expect(within(move).getByText(STRINGS.move.asideNewer.replace("{day}", "2026-09-20"))).toBeTruthy();
    await act(async () => fireEvent.click(within(move).getByRole("button", { name: STRINGS.move.asideRead })));
    await waitFor(() => expect(within(move).queryByRole("table")).toBeTruthy());
    expect(within(move).getAllByRole("row").map((r) => r.textContent)).toContain(`${STRINGS.move.runs}112`);
    expect(JSON.parse(stored()!).runs).toBe(1);
    fireEvent.click(within(move).getByRole("button", { name: STRINGS.move.replace }));
    expect(JSON.parse(stored()!).runs).toBe(12);
    expect(asides()).toEqual([]);
    // It carried the settings here, so they are as they were.
    expect(JSON.parse(localStorage.getItem("rod.settings")!).reduceMotion).toBe(true);
  });

  it("is let go quietly when it is the stored profile again, never saved over", () => {
    const raw = JSON.stringify(playedProfile(2));
    localStorage.setItem("rod.meta", raw);
    localStorage.setItem("rod.meta.aside", JSON.stringify([{ at: 1, reason: "newer", raw, told: true }]));
    const g = renderHook(() => useGame(library)).result;
    expect(g.current.notice).toBeNull();
    expect(g.current.meta.runs).toBe(2);
    expect(asides()).toEqual([]);
  });

  it("goes when the player erases everything", () => {
    localStorage.setItem("rod.meta", "{not json");
    const g = renderHook(() => useGame(library)).result;
    expect(g.current.asides).toHaveLength(1);
    act(() => g.current.eraseProgress());
    expect(asides()).toEqual([]);
    expect(g.current.asides).toEqual([]);
    expect(stored()).toBeNull();
  });
});

describe("asking the browser to keep the game's storage", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "storage", { value: undefined, configurable: true });
  });

  function storageApi(persisted: boolean) {
    const api = { persist: vi.fn(async () => true), persisted: vi.fn(async () => persisted) };
    Object.defineProperty(navigator, "storage", { value: api, configurable: true });
    return api;
  }

  it("happens once there is progress to lose, and once a page", async () => {
    const api = storageApi(false);
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.start(5, "left"));
    expect(api.persisted).not.toHaveBeenCalled();
    finish(g);
    await waitFor(() => expect(api.persist).toHaveBeenCalledTimes(1));
    act(() => g.current.reset());
    act(() => g.current.start(6, "right"));
    finish(g);
    await act(async () => {});
    expect(api.persist).toHaveBeenCalledTimes(1);
  });

  it("does not happen when the browser keeps it already", async () => {
    const api = storageApi(true);
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.start(5, "left"));
    finish(g);
    await waitFor(() => expect(api.persisted).toHaveBeenCalledTimes(1));
    expect(api.persist).not.toHaveBeenCalled();
  });
});

describe("a screen that throws", () => {
  beforeEach(() => {
    // React reports every error a boundary catches; these are on purpose.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("leaves a sentence and a way back to the menu, never a blank page", () => {
    let broken = true;
    function Screen() {
      if (broken) throw new Error("drawing failed");
      return <p>drawn again</p>;
    }
    render(
      <CrashGuard>
        <Screen />
      </CrashGuard>,
    );
    expect(screen.getByRole("heading", { name: c.title })).toBeTruthy();
    expect(screen.getByText(c.detail.replace("{version}", APP_VERSION).replace("{error}", "drawing failed"))).toBeTruthy();
    // No run in progress, so none to leave.
    expect(screen.queryByRole("button", { name: c.leave })).toBeNull();
    broken = false;
    fireEvent.click(screen.getByRole("button", { name: c.menu }));
    expect(screen.getByText("drawn again")).toBeTruthy();
  });

  it("lets the player leave a saved run that breaks the game, and keeps everything else", () => {
    saveMeta(playedProfile(2));
    saveRun({ ...beginRun(library, 77, "left"), activeArcs: null as unknown as GameState["activeArcs"] });
    render(
      <CrashGuard>
        <App />
      </CrashGuard>,
    );
    // The menu reads the saved run to offer it, and breaks.
    expect(screen.getByRole("heading", { name: c.title })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: c.menu }));
    // Back to the menu breaks again, since the run is still saved; leaving it is the way out.
    fireEvent.click(screen.getByRole("button", { name: c.leave }));
    expect(localStorage.getItem("rod.run")).toBeNull();
    expect(screen.getByRole("heading", { name: STRINGS.title })).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(STRINGS.ui.continueRun) })).toBeNull();
    expect(JSON.parse(stored()!).runs).toBe(2);
  });

  it("catches a game action that throws, as well as a screen", () => {
    saveRun({ ...beginRun(library, 77, "left"), activeArcs: null as unknown as GameState["activeArcs"] });
    const g = renderHook(() => useGame(library)).result;
    // Continuing reads the run, and throws in the click. Before, the button did nothing, every
    // time. Now the game throws it again as it draws, where the error screen catches it.
    expect(() => act(() => g.current.continueSaved())).toThrow(/activeArcs/);
  });

  it("lets a choice stand when the sound that follows it throws", () => {
    saveRun({ ...beginRun(library, 77, "left"), stats: null as unknown as GameState["stats"] });
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.continueSaved());
    const before = g.current.state!.cardCount;
    // The cue reads the run's election count, which this one lacks.
    act(() => g.current.choose("left", T));
    expect(g.current.state!.cardCount).toBe(before + 1);
  });
});
