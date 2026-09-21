// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import { App } from "../../src/ui/App";
import { CardView, commitThreshold } from "../../src/ui/CardView";
import { Ending } from "../../src/ui/Ending";
import { getCard } from "../../src/engine/library";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?debug=1");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("starts a run from the setup screen and advances with the keyboard", () => {
    vi.useFakeTimers();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Rule or Drool" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /the Ledger/ }));
    fireEvent.click(screen.getByRole("button", { name: "Take office" }));

    const card = document.querySelector(".card");
    expect(card).not.toBeNull();
    const firstId = card!.getAttribute("data-card");
    expect(document.querySelector(".debug")!.textContent).toContain("card #0");

    // Peek shows the label of that side only, then a second press commits.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    const labels = document.querySelectorAll<HTMLElement>(".card-label");
    expect(labels[1]!.style.opacity).not.toBe("0");
    expect(labels[0]!.style.opacity).toBe("0");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(document.querySelector(".debug")!.textContent).toContain("card #1");
    expect(document.querySelector(".card")!.getAttribute("data-card")).not.toBe(firstId);

    // The run is saved as it goes.
    expect(localStorage.getItem("rod.run")).toContain('"cardCount":1');
  });

  it("offers to continue a saved run", () => {
    const s = newRun(library, 9, { align: "left" });
    localStorage.setItem("rod.run", JSON.stringify({ v: 1, state: { ...s, cardCount: 4, era: 1 } }));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Continue saved run/ }));
    expect(document.querySelector(".debug")!.textContent).toContain("card #4");
  });

  it("nudges drift with [ and ] in debug mode and themes the frame", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Take office" }));
    for (let i = 0; i < 6; i++) fireEvent.keyDown(window, { key: "[" });
    expect(document.querySelector(".frame")!.getAttribute("data-theme")).toBe("decay3");
    expect(document.querySelectorAll(".sponsor")).toHaveLength(1);
    expect(document.querySelector(".ticker")).not.toBeNull();
    for (let i = 0; i < 12; i++) fireEvent.keyDown(window, { key: "]" });
    expect(document.querySelector(".frame")!.getAttribute("data-theme")).toBe("ascent3");
    expect(document.querySelector(".sponsor")).toBeNull();
  });
});

describe("CardView", () => {
  afterEach(() => cleanup());

  it("commits a drag past the threshold and springs back otherwise", () => {
    const card = getCard(library, "a02_press_briefing");
    const onCommit = vi.fn();
    const onDrag = vi.fn();
    render(<CardView card={card} text={card.text} speakerName="Pim" roleLabel="Spin" advisorId="adv_larkwood" seed={1} peek={null} leaving={null} onDrag={onDrag} onCommit={onCommit} />);
    const el = document.querySelector<HTMLElement>(".card")!;
    const t = commitThreshold(0);
    expect(t).toBe(72);

    fireEvent.pointerDown(el, { clientX: 200, pointerId: 1, pointerType: "touch" });
    fireEvent.pointerMove(el, { clientX: 200 - t / 2, pointerId: 1 });
    expect(onDrag).toHaveBeenLastCalledWith("left");
    fireEvent.pointerUp(el, { clientX: 200 - t / 2, pointerId: 1 });
    expect(onCommit).not.toHaveBeenCalled();
    expect(onDrag).toHaveBeenLastCalledWith(null);

    fireEvent.pointerDown(el, { clientX: 200, pointerId: 2, pointerType: "touch" });
    fireEvent.pointerMove(el, { clientX: 200 + t + 5, pointerId: 2 });
    fireEvent.pointerUp(el, { clientX: 200 + t + 5, pointerId: 2 });
    expect(onCommit).toHaveBeenCalledWith("right");
  });
});

describe("Ending", () => {
  afterEach(() => cleanup());

  it("shows the ending, the epilogue by exit band and the seed", () => {
    const s = { ...newRun(library, 77, { align: "right" }), drift: 40, cardCount: 12, over: { endingId: "riots", epilogueKey: "ascent:any:1" } };
    render(<Ending lib={library} state={s} onPlayAgain={() => {}} />);
    expect(screen.getByRole("heading", { name: "The Streets Decide" })).toBeTruthy();
    expect(screen.getByText("Ascent")).toBeTruthy();
    expect(screen.getByText("77")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play again" })).toBeTruthy();
  });
});
