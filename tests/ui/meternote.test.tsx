// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { newRun } from "../../src/engine/state";
import type { GameState, Meters } from "../../src/engine/types";
import { MetersBar, RESTLESS_BELOW } from "../../src/ui/Meters";
import { themeFor } from "../../src/ui/theme";

/** The note under the meters marks the header it is in, which gives it room (BACKLOG-13 phase 95). */

afterEach(() => cleanup());

const run = (meters: Partial<Meters>): GameState => {
  const s = draw(library, newRun(library, 11, { align: "right" }));
  return { ...s, meters: { ...s.meters, base: 50, backers: 50, public: 50, money: 50, order: 50, inst: 50, ...meters } };
};
const bar = (state: GameState) =>
  render(
    <MetersBar lib={library} state={state} meters={state.meters} preview={null} theme={themeFor(state.drift)} align={state.align} />,
  ).container.querySelector("header")!;

describe("the note under the meters", () => {
  it("marks the header when it names the nearest end", () => {
    const header = bar(run({ money: 5 }));
    expect(header.classList.contains("noted")).toBe(true);
    expect(header.querySelector(".near-note")!.textContent).toBe(
      `${STRINGS.ui.nearEnding} ${library.endings.get(library.config.meterEndings.money.low)!.title}`,
    );
  });

  it("marks the header when it names a restless bloc", () => {
    const header = bar(run({ public: RESTLESS_BELOW - 1 }));
    expect(header.classList.contains("noted")).toBe(true);
    expect(header.querySelector(".restless-note")!.textContent).toBe(`${STRINGS.blocNames.right.public} ${STRINGS.blocRestless.public}`);
  });

  it("leaves the header as it was when there is nothing to say", () => {
    const header = bar(run({}));
    expect(header.className).toBe("meters");
    expect(header.querySelector(".near-note, .restless-note")).toBeNull();
  });
});
