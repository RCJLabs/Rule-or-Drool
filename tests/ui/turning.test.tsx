// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { BOTS, makeContext, noisy } from "../../src/sim";
import { pickTurningPoints, turningPoints } from "../../src/sim/turning";
import { Ending } from "../../src/ui/Ending";
import { turningCount, turningOutcome } from "../../src/ui/turning";

/**
 * Where it turned, on the end screen (BACKLOG-14 phase 88): worked out after the screen shows,
 * the decisions that set the most in motion listed with their other roads.
 */

afterEach(cleanup);
const noop = () => {};

function played(seed: number, eraCount?: number): GameState {
  const bot = noisy(BOTS.eyes, 0.2);
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s = newRun(library, seed, { ...rollSetup(library, seed, seed % 2 ? "left" : "right", []), ...(eraCount ? { eraCount } : {}) });
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

/** The first run, of those played from these seeds, whose turning points pass the test. */
function find(
  seeds: readonly number[],
  eraCount: number | undefined,
  test: (all: ReturnType<typeof turningPoints> & object, run: GameState) => boolean,
): GameState {
  for (const seed of seeds) {
    const run = played(seed, eraCount);
    const all = turningPoints(library, run);
    if (all && test(all, run)) return run;
  }
  throw new Error("no run from these seeds would do");
}

const status = () => document.querySelector(".turning-count")?.textContent;
const done = () => waitFor(() => expect(status()).not.toBe(STRINGS.turning.working), { timeout: 30_000 });

describe("where it turned", () => {
  const run = find([3, 8, 21, 34, 55], undefined, (all, r) => pickTurningPoints(all, r, library).length >= 2 && all.length > 3);
  const all = turningPoints(library, run)!;
  const shown = pickTurningPoints(all, run, library);

  it("is worked out after the screen shows, then lists the decisions that set the most in motion, each with its other road", async () => {
    const onTakeOtherRoad = vi.fn();
    render(<Ending lib={library} state={run} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={onTakeOtherRoad} />);
    // The screen is there at once; the section says it is working.
    expect(document.querySelector(".history-title")).not.toBeNull();
    expect(status()).toBe(STRINGS.turning.working);
    await done();
    expect(status()).toBe(turningCount({ status: "done", all, shown }));
    expect(status()).toBe(STRINGS.turning.many.replace("{n}", String(all.length)));
    expect(document.querySelector(".turning-most")?.textContent).toBe(STRINGS.turning.most.replace("{n}", ["", "one", "two", "three"][shown.length]!));
    const items = [...document.querySelectorAll(".turning li")];
    expect(items).toHaveLength(shown.length);
    items.forEach((li, i) => {
      const p = shown[i]!;
      expect(li.querySelector("b")?.textContent).toBe(`Card ${p.k + 1}`);
      expect(li.querySelector("p")?.textContent).toBe(STRINGS.turning.chose.replace("{label}", p.chose).replace("{outcome}", turningOutcome(library, run, p)));
      expect(li.querySelector("button")?.textContent).toBe(STRINGS.road.choose.replace("{label}", p.other));
    });
    fireEvent.click(items[1]!.querySelector("button")!);
    expect(onTakeOtherRoad).toHaveBeenCalledWith(shown[1]!.k);
    expect(document.querySelector(".turning-how")?.textContent).toBe(STRINGS.turning.how);
  });

  it("says so when no decision would have ended it otherwise", async () => {
    const calm = find([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], library.config.firstTermEras, (a) => a.length === 0);
    render(<Ending lib={library} state={calm} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
    await done();
    expect(status()).toBe(STRINGS.turning.none);
    expect(document.querySelector(".turning li")).toBeNull();
  });

  it("says a run was close when every decision that would have tipped it did so by its own weight", async () => {
    const close = find(
      Array.from({ length: 40 }, (_, i) => i + 1),
      library.config.firstTermEras,
      (a, r) => a.length > 0 && pickTurningPoints(a, r, library).length === 0,
    );
    const n = turningPoints(library, close)!.length;
    render(<Ending lib={library} state={close} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
    await done();
    expect(status()).toBe(n === 1 ? STRINGS.turning.closeOne : STRINGS.turning.close.replace("{n}", String(n)));
    expect(document.querySelector(".turning li")).toBeNull();
  });

  it("is not looked for on the other road, which does not branch again, nor in a run that cannot be retraced", () => {
    render(
      <Ending
        lib={library}
        state={{ ...run, road: { first: run, at: 3 } }}
        fold={null}
        onPlayAgain={noop}
        onCodex={noop}
        onSettings={noop}
        onTakeOtherRoad={noop}
      />,
    );
    expect(document.querySelector(".turning")).toBeNull();
    cleanup();
    render(<Ending lib={library} state={{ ...run, choices: null }} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
    expect(document.querySelector(".turning")).toBeNull();
  });
});
