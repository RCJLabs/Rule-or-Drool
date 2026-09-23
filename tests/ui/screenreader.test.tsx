// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { withNames } from "../../src/engine/endings";
import { getCard } from "../../src/engine/library";
import { exitBand, newRun } from "../../src/engine/state";
import { historyOf } from "../../src/meta";
import { App } from "../../src/ui/App";
import { CardView } from "../../src/ui/CardView";
import { Ending } from "../../src/ui/Ending";
import { EraTransition } from "../../src/ui/EraTransition";
import { SETTINGS_VERSION } from "../../src/version";

/**
 * The run as a screen reader meets it (BACKLOG-5 phase 30). Before this there was nothing to
 * press: the only way to choose was to drag the card, and TalkBack takes a one-finger drag
 * for exploring the screen.
 */

const cardNow = () => getCard(library, document.querySelector(".card")!.getAttribute("data-card")!);
const live = () => document.querySelector("[aria-live='polite']")!.textContent ?? "";
const described = (el: HTMLElement) =>
  (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");

/**
 * A seed whose first card names its speaker through a placeholder ("{advisor} wants the
 * court's budget…"), which the screen and the reader both fill in. The menu deals a random
 * seed, and an assertion on the raw text failed for the 9.5% of first cards that open with
 * one, so the run is pinned.
 */
const SEED = 21;

function startRun(settings: Record<string, unknown> = {}) {
  localStorage.setItem("rod.settings", JSON.stringify({ v: SETTINGS_VERSION, reduceMotion: true, ...settings }));
  render(<App />);
  fireEvent.change(screen.getByRole("spinbutton", { name: new RegExp(STRINGS.ui.seed) }), { target: { value: String(SEED) } });
  fireEvent.click(screen.getByRole("button", { name: "Take office" }));
}

describe("a screen reader can play", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("has a button for each choice, named by it and saying what it moves", () => {
    startRun();
    const card = cardNow();
    const left = screen.getByRole("button", { name: card.left.label });
    const right = screen.getByRole("button", { name: card.right.label });
    expect(described(left)).toMatch(/^Moves /);
    expect(described(right)).toMatch(/^Moves /);
    // Never the number or the direction: the dots give neither.
    expect(described(left) + described(right)).not.toMatch(/\d|\bup\b|\bdown\b/);
  });

  it("plays a card from a button, and says the next one aloud", () => {
    startRun();
    const first = cardNow();
    const state = JSON.parse(localStorage.getItem("rod.run")!).state;
    expect(state.seed).toBe(SEED);
    expect(first.text).toContain("{");
    expect(live()).toContain(STRINGS.speech.choicesHint);
    // The card as the screen shows it, names filled in: never a placeholder read out.
    expect(live()).toContain(withNames(library, state, first.text, first.speaker));
    expect(live()).not.toMatch(/[{}]/);
    fireEvent.click(screen.getByRole("button", { name: first.right.label }));
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const next = cardNow();
    expect(document.querySelector(".card")!.getAttribute("data-card")).toBe(next.id);
    expect(JSON.parse(localStorage.getItem("rod.run")!).state.cardCount).toBe(1);
    // The new card, said aloud, without the hint a second time.
    expect(live()).not.toContain(STRINGS.speech.choicesHint);
    expect(screen.getByRole("button", { name: next.left.label })).toBeTruthy();
  });

  it("lets Enter on another control do only that, even with a side peeked", () => {
    // A side peeked, then Enter on the teaching note's button: it dismissed the note and
    // played the card as well, one press doing two things (checked in Chromium on v0.41.0).
    startRun();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    const gotIt = screen.getByRole("button", { name: STRINGS.ui.gotIt });
    gotIt.focus();
    fireEvent.keyDown(gotIt, { key: "Enter" });
    fireEvent.click(gotIt);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(JSON.parse(localStorage.getItem("rod.run")!).state.cardCount).toBe(0);
  });

  it("gives each meter's level in words, never the number the screen hides", () => {
    startRun();
    const meters = [...document.querySelectorAll(".meter[role='img']")];
    expect(meters).toHaveLength(6);
    for (const m of meters) expect(m.getAttribute("aria-label")).not.toMatch(/\d/);
  });

  it("keeps the buttons out of sight unless the player asks for them", () => {
    startRun();
    expect(document.querySelector(".choices")!.classList.contains("choices-hidden")).toBe(true);
    cleanup();
    localStorage.clear();
    startRun({ showChoices: true });
    expect(document.querySelector(".choices")!.classList.contains("choices-hidden")).toBe(false);
  });

  it("reads the mangled text of late Decay as it was written", () => {
    // Late Decay misspells the card on screen. A screen reader gets the text as written,
    // and the misspelt copy is hidden from it rather than read out as well.
    const card = library.content.cards[0]!;
    render(
      <CardView
        card={card}
        text="Teh pension fund is short."
        spokenText="The pension fund is short."
        speakerName="Odalys Brenn"
        roleLabel="Treasurer"
        advisorId=""
        seed={1}
        peek={null}
        leaving={null}
        onDrag={() => {}}
        onCommit={() => {}}
      />,
    );
    const shown = document.querySelector(".card-text")!;
    expect(shown.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("The pension fund is short.").className).toBe("sr-only");
    // And the card is a group named by whoever is speaking.
    expect(screen.getByRole("group", { name: "Odalys Brenn" })).toBeTruthy();
  });
});

describe("focus follows the screen", () => {
  afterEach(() => cleanup());

  it("describes an era boundary to whoever lands on its Continue button", () => {
    const state = { ...newRun(library, 7, { align: "left" }), era: 2, cardCount: 35 };
    render(<EraTransition lib={library} state={state} era={2} reduceMotion onContinue={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: STRINGS.eras[1]!.name });
    expect(described(dialog)).toContain(STRINGS.eras[1]!.jump);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: STRINGS.ui.continueEra }));
  });

  it("lands on the history's name when a run ends", () => {
    const s = {
      ...newRun(library, 11, { align: "right" }),
      cardCount: 105,
      era: 3,
      flags: ["seawall"],
      over: { endingId: "finale_ascent", epilogueKey: "ascent:right:3" },
    };
    render(<Ending lib={library} state={s} fold={null} onPlayAgain={() => {}} onCodex={() => {}} onSettings={() => {}} />);
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1, name: historyOf(s, exitBand(library, s)).title }));
  });
});
