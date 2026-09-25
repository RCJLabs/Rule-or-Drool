// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { emptyMeta, foldRun, type MetaState } from "../../src/meta";
import { Ending } from "../../src/ui/Ending";
import { Setup } from "../../src/ui/Setup";
import { runFacts } from "../../src/ui/share";

/**
 * A first term (BACKLOG-10 phase 59) on the screen: offered on the menu until a profile has seen
 * a run through, and said plainly at its end.
 */

const cfg = library.config;
const FIRST = cfg.firstTermEras;
const noop = () => {};
const r = STRINGS.reign;

const ended = (endingId: string, cards: number, eraCount?: number): GameState => ({
  ...newRun(library, 1, { align: "left", ...(eraCount === undefined ? {} : { eraCount }) }),
  cardCount: cards,
  over: { endingId, epilogueKey: "muddle:left:1" },
});
const after = (...runs: GameState[]): MetaState => runs.reduce((m, run) => foldRun(library, m, run).meta, emptyMeta());

const menu = (meta: MetaState, onStart: (...a: unknown[]) => void = noop, saved: GameState | null = null) =>
  render(<Setup lib={library} saved={saved} meta={meta} onStart={onStart} onDaily={noop} onContinue={noop} onCodex={noop} onSettings={noop} />);
const choice = (name: string) => within(screen.getByRole("group", { name: r.legend })).getByRole("button", { name: new RegExp(name) });

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => cleanup());

describe("the menu of a profile that has not seen a run through", () => {
  it("starts a first term unless the player picks three eras", () => {
    const started: unknown[][] = [];
    menu(emptyMeta(), (...a) => started.push(a));
    expect(choice(r.first).getAttribute("aria-pressed")).toBe("true");
    expect(choice(r.ordinary).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[0]![3]).toBe(FIRST);
    fireEvent.click(choice(r.ordinary));
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[1]![3]).toBeUndefined();
  });

  it("keeps offering it after runs lost early, and stops once one is seen through", () => {
    menu(after(ended("riots", 20, FIRST)));
    expect(choice(r.first).getAttribute("aria-pressed")).toBe("true");
    cleanup();
    const started: unknown[][] = [];
    menu(after(ended("riots", 20, FIRST), ended(`${cfg.firstTermPrefix}muddle`, 35, FIRST)), (...a) => started.push(a));
    expect(screen.queryByRole("button", { name: new RegExp(r.first) })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[0]![3]).toBeUndefined();
  });

  it("starts no first term once a profile moved in on the menu has seen a run through", () => {
    const started: unknown[][] = [];
    const veteran = after(ended(`${cfg.finalePrefix}muddle`, 105));
    const { rerender } = menu(emptyMeta(), (...a) => started.push(a));
    rerender(<Setup lib={library} saved={null} meta={veteran} onStart={(...a: unknown[]) => started.push(a)} onDaily={noop} onContinue={noop} onCodex={noop} onSettings={noop} />);
    // The long reign is open now, and the choice is the ordinary game's, not a first term.
    expect(choice(r.ordinary).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[0]![3]).toBeUndefined();
  });

  it("says a saved first term is one on the way back into it", () => {
    const saved = { ...newRun(library, 3, { align: "left", eraCount: FIRST }), cardCount: 12, current: null };
    menu(emptyMeta(), noop, saved);
    expect(screen.getByRole("button", { name: new RegExp(`${STRINGS.ui.continueRun}.*${r.firstShort}`) })).toBeTruthy();
  });
});

describe("the end of a first term", () => {
  it("says what comes next, with the record of the term, and adds nothing to the codex's endings", () => {
    const run = ended(`${cfg.firstTermPrefix}ascent`, 35, FIRST);
    const fold = foldRun(library, emptyMeta(), run);
    const { container } = render(<Ending lib={library} state={run} fold={fold} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(screen.getByText(r.afterFirst)).toBeTruthy();
    expect(container.querySelector(".record")).not.toBeNull();
    expect(screen.queryByText("A new ending for the codex.")).toBeNull();
    expect(runFacts(run, "A Good Start")).toContain(` · ${r.firstShort} · `);
  });

  it("does not say it after a first term lost early, or after an ordinary reign", () => {
    for (const run of [ended("riots", 20, FIRST), ended(`${cfg.finalePrefix}muddle`, 105)]) {
      render(<Ending lib={library} state={run} fold={foldRun(library, emptyMeta(), run)} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
      expect(screen.queryByText(r.afterFirst)).toBeNull();
      cleanup();
    }
  });
});
