// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { reckonedLegacy } from "../../src/engine/reckoning";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { LEGACIES } from "../../src/meta/legacies";
import { BOTS, makeContext } from "../../src/sim";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";

/** The reckoning on the play screen (BACKLOG-13 phase 92): titled, opening on the legacy, and said so. */

afterEach(cleanup);
const noop = () => {};

/** The card before a run's reckoning, and the reckoning on the table. */
function reckoning(): [GameState, GameState] {
  for (let seed = 1; seed <= 20; seed++) {
    const rng = makeRng(seed);
    let s = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
    let before: GameState | null = null;
    while (!s.over) {
      s = draw(library, s);
      if (s.currentFrom === "reckoning" && before) return [before, s];
      before = s;
      const card = getCard(library, s.current!);
      s = resolve(library, s, card.id, BOTS.informed(makeContext(library, s, card, rng, { danger: 25 })));
    }
  }
  throw new Error("no reckoning in these runs");
}

const play = (state: GameState) => (
  <Play
    lib={library}
    state={state}
    transition={null}
    onChoose={noop}
    onDismissTransition={noop}
    debug={false}
    settings={DEFAULT_SETTINGS}
    onSettings={noop}
    onCabinet={noop}
    onTaught={noop}
  />
);

describe("a reckoning on the play screen", () => {
  it("is titled, opens on what the reign will be remembered for, and says both aloud", () => {
    const [before, on] = reckoning();
    const label = LEGACIES[reckonedLegacy(library, on)!]!;
    const { rerender } = render(play(before));
    rerender(play(on));
    expect([...document.querySelectorAll(".question-title")].map((p) => p.textContent)).toEqual([STRINGS.reckoning.title]);
    expect(document.querySelector(".card")?.textContent).toContain(`${label}.`);
    expect(document.querySelector(".card")?.textContent).not.toContain("{legacy}");
    const heard = document.querySelector("footer .sr-only[aria-live]")?.textContent ?? "";
    expect(heard).toContain(`${STRINGS.reckoning.title}.`);
    expect(heard).toContain(`${label}.`);
  });

  it("is not titled on any other card", () => {
    const [before] = reckoning();
    render(play(before));
    expect([...document.querySelectorAll(".question-title")].map((p) => p.textContent)).not.toContain(STRINGS.reckoning.title);
  });
});
