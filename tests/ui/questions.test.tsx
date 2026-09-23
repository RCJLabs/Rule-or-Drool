// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";

/**
 * A question (BACKLOG-6 phase 40) says it is one, so a player knows this is the big decision,
 * and every step after it carries the same title, so the thread can be followed between the
 * other cards of a run.
 */

const noop = () => {};
const on = (card: string, arc: string | null = null): GameState => ({
  ...newRun(library, 11, { align: "left" }),
  current: card,
  currentFrom: arc ? "arc" : "deck",
  activeArcs: arc ? [{ id: arc, nextCard: card }] : [],
});
const show = (state: GameState) =>
  render(<Play lib={library} state={state} transition={null} onChoose={noop} onDismissTransition={noop} debug={false} settings={DEFAULT_SETTINGS} onSettings={noop} onCabinet={noop} onTaught={noop} />);

afterEach(() => cleanup());

describe("a question on the table", () => {
  it("says it is the question, and which", () => {
    const { container } = show(on("q_treaty_l_q", "q_treaty_l"));
    const title = container.querySelector(".question-title")!;
    expect(title.textContent).toBe(`${STRINGS.questions.asking}: ${STRINGS.questions.titles.treaty}`);
    expect(title.hasAttribute("data-asking")).toBe(true);
    expect(container.querySelector(".card")!.classList.contains("card-question")).toBe(true);
    // Said to a screen reader as well: it is text inside the card, not decoration.
    expect(title.closest("[aria-hidden='true']")).toBeNull();
    expect(container.querySelector(".card")!.textContent).toContain(STRINGS.questions.titles.treaty);
  });

  it("says so out loud as well, before the card", () => {
    // A screen reader hears the card through the live region, not by reading the card.
    show(on("q_treaty_l_q", "q_treaty_l"));
    const said = document.querySelector("[aria-live='polite']")!.textContent ?? "";
    const title = `${STRINGS.questions.asking}: ${STRINGS.questions.titles.treaty}.`;
    expect(said).toContain(title);
    expect(said.indexOf(title)).toBeLessThan(said.indexOf("Our oldest ally"));
    cleanup();
    show(on("q_papers_l_b", "q_papers_l"));
    expect(document.querySelector("[aria-live='polite']")!.textContent).toContain(`${STRINGS.questions.titles.papers}.`);
  });

  it("carries the same title on the steps after it, without calling them the question", () => {
    const { container } = show(on("q_papers_l_b", "q_papers_l"));
    const title = container.querySelector(".question-title")!;
    expect(title.textContent).toBe(STRINGS.questions.titles.papers);
    expect(title.hasAttribute("data-asking")).toBe(false);
  });

  it("titles nothing that is not a question", () => {
    const story = library.content.arcs.find((a) => a.question === undefined)!;
    const ordinary = library.content.cards.find((c) => c.type === "event" && !c.cond && c.eras.includes(1) && c.align !== "right")!;
    for (const state of [on(story.cards[0]!, story.id), on(ordinary.id)]) {
      const { container } = show(state);
      expect(container.querySelector(".question-title")).toBeNull();
      expect(container.querySelector(".card")!.classList.contains("card-question")).toBe(false);
      cleanup();
    }
  });
});
