// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { library } from "../../src/content";
import { useGame } from "../../src/ui/useGame";
import { loadRun } from "../../src/ui/save";
import type { Measure } from "../../src/playtest/record";

/** What the card's clock would have said: these tests are about the run, not the timing. */
const T: Measure = { ms: 1000, looked: [0, 0] };

describe("leaving a run and coming back", () => {
  beforeEach(() => localStorage.clear());

  it("keeps the run, offers it from the menu, and resumes it where it was", () => {
    const { result } = renderHook(() => useGame(library));
    act(() => result.current.start(99, "left"));
    act(() => result.current.choose("left", T));
    act(() => result.current.choose("right", T));
    const cards = result.current.state!.cardCount;
    expect(result.current.screen).toBe("play");
    expect(cards).toBe(2);

    act(() => result.current.exitToMenu());
    expect(result.current.screen).toBe("setup");
    expect(result.current.saved?.cardCount).toBe(cards);
    // And it is on disk, not only in memory, so closing the tab is the same thing.
    expect(loadRun()?.cardCount).toBe(cards);

    act(() => result.current.continueSaved());
    expect(result.current.screen).toBe("play");
    expect(result.current.state!.cardCount).toBe(cards);
    expect(result.current.state!.seed).toBe(99);
  });

  it("erasing progress clears the run, the codex and the menu's offer", () => {
    const { result } = renderHook(() => useGame(library));
    act(() => result.current.start(7, "right"));
    act(() => result.current.choose("left", T));
    act(() => result.current.exitToMenu());
    expect(result.current.saved).not.toBeNull();

    act(() => result.current.eraseProgress());
    expect(result.current.saved).toBeNull();
    expect(result.current.state).toBeNull();
    expect(result.current.meta.runs).toBe(0);
    expect(loadRun()).toBeNull();
  });

  it("remembers a setting across a fresh session", () => {
    const first = renderHook(() => useGame(library));
    act(() => first.result.current.setSettings({ ...first.result.current.settings, plainText: true }));
    first.unmount();
    const second = renderHook(() => useGame(library));
    expect(second.result.current.settings.plainText).toBe(true);
  });
});
