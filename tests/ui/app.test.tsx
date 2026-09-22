// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
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

  it("opens the codex, which hides unseen endings until they are found", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Codex 0\// }));
    expect(screen.getByRole("heading", { name: "Codex" })).toBeTruthy();
    // Nothing discovered yet, so every ending entry is locked.
    expect(document.querySelectorAll(".codex-list li.found")).toHaveLength(0);
    expect(document.querySelectorAll(".codex-list li.locked").length).toBeGreaterThan(20);
    expect(screen.queryByText("The Streets Decide")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Rule or Drool" })).toBeTruthy();
  });

  it("records a finished run in the codex and offers a daily run", () => {
    vi.useFakeTimers();
    render(<App />);
    expect(screen.getByRole("button", { name: "Daily run" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Take office" }));
    // Drive the run into a meter extreme so it ends quickly.
    for (let i = 0; i < 400 && !document.querySelector(".ending"); i++) {
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      if (document.querySelector(".overlay")) fireEvent.click(document.querySelector(".overlay button")!);
    }
    expect(document.querySelector(".ending")).not.toBeNull();
    const meta = JSON.parse(localStorage.getItem("rod.meta")!);
    expect(meta.runs).toBe(1);
    expect(Object.keys(meta.endings)).toHaveLength(1);
    expect(meta.objectives.obj_first_run).toBe(1);
  });

  it("nudges drift with [ and ] in debug mode and themes the frame", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Take office" }));
    for (let i = 0; i < 6; i++) fireEvent.keyDown(window, { key: "[" });
    expect(document.querySelector(".frame")!.getAttribute("data-theme")).toBe("decay3");
    expect(document.querySelectorAll(".sponsor")).toHaveLength(1);
    // Deep Decay is a livestream now, with the chat and the alerts on (phase 18).
    expect(document.querySelector(".stream-chat")).not.toBeNull();
    expect(document.querySelector(".stream-alert")).not.toBeNull();
    expect(document.querySelector(".holo")).toBeNull();
    for (let i = 0; i < 12; i++) fireEvent.keyDown(window, { key: "]" });
    expect(document.querySelector(".frame")!.getAttribute("data-theme")).toBe("ascent3");
    expect(document.querySelector(".sponsor")).toBeNull();
    expect(document.querySelector(".stream")).toBeNull();
    expect(document.querySelectorAll(".holo-pane")).toHaveLength(2);
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

describe("App: the cabinet", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => cleanup());

  it("opens from a run and names the people in it", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Take office" }));
    fireEvent.click(screen.getByRole("button", { name: "Your cabinet" }));
    const dialog = screen.getByRole("dialog", { name: "Your cabinet" });
    expect(dialog).toBeTruthy();
    // Every non-rival role is represented.
    for (const role of library.roles) {
      if (role === library.config.rivalRole) continue;
      expect(within(dialog).getAllByText(STRINGS.roles[role]!, { exact: false }).length, role).toBeGreaterThan(0);
    }
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Your cabinet" })).toBeNull();
  });

  it("names the speaker's trait on the card it scales", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Take office" }));
    // Whoever is speaking, their trait is stated where it is changing the numbers.
    const tags = document.querySelectorAll(".speaker-trait");
    expect(tags.length).toBe(1);
    expect(tags[0]!.textContent!.length).toBeGreaterThan(0);
  });
});

describe("App: the settings menu", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => cleanup());

  it("opens from the menu screen, with nothing to leave", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Leave to the main menu/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();
  });

  it("offers leaving once a run is under way, and the menu then offers it back", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Take office" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: /Leave to the main menu/ }));
    expect(screen.getByRole("button", { name: /Continue saved run/ })).toBeTruthy();
  });
});

describe("Ending", () => {
  afterEach(() => cleanup());

  it("shows the ending, the epilogue by exit band and the seed", () => {
    // The key names the player's own side, so the closing paragraph is the Ledger's
    // future rather than a shared one (BACKLOG item 3).
    const s = { ...newRun(library, 77, { align: "right" }), drift: 40, cardCount: 12, over: { endingId: "riots", epilogueKey: "ascent:right:1" } };
    render(<Ending lib={library} state={s} fold={null} onPlayAgain={() => {}} onCodex={() => {}} onSettings={() => {}} />);
    expect(screen.getByRole("heading", { name: "The Streets Decide" })).toBeTruthy();
    expect(screen.getByText("Ascent")).toBeTruthy();
    expect(screen.getByText(/The donors complained, and stayed\./)).toBeTruthy();
    expect(screen.getByText("77")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play again" })).toBeTruthy();
  });
});
