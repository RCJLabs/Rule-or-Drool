// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { candidatesFor, newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { LESSONS_BY_ID } from "../../src/ui/teach";

/**
 * An appointment on the table (BACKLOG-10 phase 61): the two people named in the card and on the
 * side that appoints each, and a lesson the first time.
 */

const cfg = library.config;
const noop = () => {};

/** The first card of era 2, an appointment, dealt. */
function atEraTwo(): GameState {
  const s = newRun(library, 12, { align: "right" });
  return draw(library, { ...s, era: 2, cardCount: cfg.eraLength, nextElectionAt: cfg.eraLength + cfg.electionInterval });
}

const show = (state: GameState, taught: string[] = []) =>
  render(
    <Play
      lib={library}
      state={state}
      transition={null}
      onChoose={noop}
      onDismissTransition={noop}
      debug={false}
      settings={{ ...DEFAULT_SETTINGS, showChoices: true, taught }}
      onSettings={noop}
      onCabinet={noop}
      onTaught={noop}
    />,
  );

afterEach(() => cleanup());

describe("an appointment on the table", () => {
  it("names both people in the card and on the side that appoints each", () => {
    const s = atEraTwo();
    const card = getCard(library, s.current!);
    const [first, second] = candidatesFor(library, s, card.appoints!)!;
    const { container } = show(s, ["meters", "hidden", "appoint"]);
    expect(container.querySelector(".card")!.textContent).toContain(first.name);
    expect(container.querySelector(".card")!.textContent).toContain(second.name);
    const buttons = [...container.querySelectorAll("button.choice")].map((b) => b.textContent);
    expect(buttons).toEqual([`Appoint ${first.name}`, `Appoint ${second.name}`]);
    expect(container.textContent).not.toMatch(/\{(first|second)/);
  });

  it("teaches what an appointment is, the first time", () => {
    show(atEraTwo(), ["meters", "hidden"]);
    expect(screen.getByText(LESSONS_BY_ID.get("appoint")!.title)).toBeTruthy();
  });
});
