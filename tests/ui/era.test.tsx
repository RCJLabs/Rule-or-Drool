// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { EraTransition } from "../../src/ui/EraTransition";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const base = () => newRun(library, 3, rollSetup(library, 3, "left", []));
const at = (over: Partial<GameState>): GameState => ({ ...base(), ...over });

const show = (state: GameState, reduceMotion = true) =>
  render(<EraTransition lib={library} state={state} era={2} reduceMotion={reduceMotion} onContinue={() => {}} />);

/**
 * The era boundary (BACKLOG-3 phase 25). Where it lands on screen is checked in a browser;
 * what it says is checked here. Measured over 11,762 crossings, none arrives empty-handed —
 * a competent run carries 3.9 legacies into era 2 — so the empty case is the rare one and
 * still has to read properly.
 */
describe("the era boundary says what carried over", () => {
  it("names the country's legacies and counts the rest", () => {
    const { container } = show(at({ flags: ["cheated_election", "schools_starved", "seawall", "housing_built", "took_the_skim", "east_talks"] }));
    const named = [...container.querySelectorAll(".era-carried li")].map((li) => li.textContent);
    expect(named).toHaveLength(4);
    expect(named).toContain("An election was counted twice");
    // `east_talks` is an arc's bookkeeping, not a legacy, and must not be listed.
    expect(named.join(" ")).not.toContain("east_talks");
    expect(container.querySelector(".era-more")!.textContent).toBe("and 1 more");
  });

  it("says nothing about legacies when there are none, rather than an empty heading", () => {
    const { container } = show(at({ flags: ["east_talks"] }));
    expect(container.querySelector(".era-carried")).toBeNull();
  });

  it("counts what is still owed, and gets the singular right", () => {
    const one = show(at({ queue: [{ id: "x", dueAt: 40 }] }));
    expect(one.container.querySelector(".era-owed")!.textContent).toBe(STRINGS.ui.owedOne);
    cleanup();
    const three = show(at({ queue: [1, 2, 3].map((n) => ({ id: `x${n}`, dueAt: 40 })) }));
    expect(three.container.querySelector(".era-owed")!.textContent).toBe("3 decisions are still owed.");
    cleanup();
    expect(show(at({ queue: [] })).container.querySelector(".era-owed")).toBeNull();
  });

  it("is the frame rather than a card on top of it", () => {
    // The point of the phase: the look changes here, so this may not be an .overlay.
    const { container } = show(at({}));
    expect(container.querySelector(".era-jump")).not.toBeNull();
    expect(container.querySelector(".overlay")).toBeNull();
    expect(container.querySelector(".overlay-card")).toBeNull();
  });

  it("arrives in three beats, and in none when the player asked for less movement", () => {
    vi.useFakeTimers();
    const { container } = show(at({ flags: ["seawall"], queue: [{ id: "x", dueAt: 40 }] }), false);
    const beat = () => container.querySelector(".era-jump")!.getAttribute("data-beat");
    expect(beat()).toBe("0");
    act(() => void vi.advanceTimersByTime(500));
    expect(beat()).toBe("1");
    act(() => void vi.advanceTimersByTime(1200));
    expect(beat()).toBe("3");
    cleanup();
    show(at({}), true);
    expect(screen.getByRole("dialog").getAttribute("data-beat")).toBe("3");
  });
});
