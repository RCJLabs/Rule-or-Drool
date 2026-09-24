// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign } from "../../src/engine/types";
import { emptyMeta, encodeRunCode, foldRun, historyOf, HISTORIES, runCodeOf, type MetaState } from "../../src/meta";
import { BOTS, makeContext } from "../../src/sim";
import { App } from "../../src/ui/App";
import { Codex } from "../../src/ui/Codex";
import { Ending } from "../../src/ui/Ending";
import { EraTransition } from "../../src/ui/EraTransition";
import { Setup } from "../../src/ui/Setup";
import { runFacts } from "../../src/ui/share";
import { useGame } from "../../src/ui/useGame";

/**
 * The long reign (BACKLOG-5 phase 39) in the game: offered once a finale has opened it, said
 * plainly where the direction is set, and ended in the long view.
 */

const LONG = library.config.longEraCount;
const noop = () => {};

/** A profile that has seen a finale, and so may take a long reign. */
function veteran(): MetaState {
  const finale: GameState = { ...newRun(library, 1, { align: "left" }), cardCount: 105, era: 3, over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" } };
  return foldRun(library, emptyMeta(), finale).meta;
}

/** A mixed bot's long reign played to its finale, from the first seed that gets there. */
function longFinale(align: PlayerAlign = "left"): GameState {
  for (let seed = 1; seed <= 50; seed++) {
    const rng = makeRng(seed ^ 0x5bd1e995);
    let s = draw(library, newRun(library, seed, { ...rollSetup(library, seed, align, []), eraCount: LONG }));
    while (!s.over) {
      const card = getCard(library, s.current!);
      s = draw(library, resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 }))));
    }
    if (s.over.endingId.startsWith(library.config.longFinalePrefix)) return s;
  }
  throw new Error("fifty long reigns and not one reached a long finale");
}

const menu = (meta: MetaState, onStart = noop as (...a: unknown[]) => void) =>
  render(<Setup lib={library} saved={null} meta={meta} onStart={onStart} onDaily={noop} onContinue={noop} onCodex={noop} onSettings={noop} />);

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => cleanup());

describe("choosing the long reign", () => {
  it("is not offered before a finale, and is once one has opened it", () => {
    menu(emptyMeta());
    expect(screen.queryByRole("group", { name: STRINGS.reign.legend })).toBeNull();
    cleanup();
    const started: unknown[][] = [];
    menu(veteran(), (...a) => started.push(a));
    const reign = screen.getByRole("group", { name: STRINGS.reign.legend });
    // The ordinary game stays the default; the long one is a choice.
    expect(within(reign).getByRole("button", { name: new RegExp(STRINGS.reign.ordinary) }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[0]![3]).toBeUndefined();
    fireEvent.click(within(reign).getByRole("button", { name: new RegExp(STRINGS.reign.long) }));
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[1]![3]).toBe(LONG);
  });

  it("starts a run of five eras, which a reload keeps", () => {
    const first = renderHook(() => useGame(library));
    act(() => first.result.current.start(2024, "left", null, LONG));
    expect(first.result.current.state!.eraCount).toBe(LONG);
    act(() => first.result.current.exitToMenu());
    first.unmount();
    const g = renderHook(() => useGame(library)).result;
    expect(g.current.saved!.eraCount).toBe(LONG);
    render(<Setup lib={library} saved={g.current.saved} meta={veteran()} onStart={noop} onDaily={noop} onContinue={noop} onCodex={noop} onSettings={noop} />);
    expect(screen.getByRole("button", { name: new RegExp(`${STRINGS.ui.continueRun}.*${STRINGS.reign.short}`) })).toBeTruthy();
  });

  it("offers a long reign someone sent as one, whatever this profile has opened", () => {
    const run = longFinale();
    window.history.replaceState({}, "", `/?run=${encodeRunCode(runCodeOf(run))}`);
    render(<App />);
    const offer = screen.getByRole("region", { name: STRINGS.share.offerTitle });
    expect(within(offer).getByText(STRINGS.reign.offer)).toBeTruthy();
  });
});

describe("the fourth era", () => {
  const at = (era: number): GameState => ({ ...newRun(library, 3, { align: "left", eraCount: LONG }), era, bandLocked: era > library.config.bandLockAfterEra });
  const jump = (era: number) => render(<EraTransition lib={library} state={at(era)} era={era} reduceMotion onContinue={noop} />);

  it("says that the direction is set now, and says it only there", () => {
    const { container } = jump(4);
    expect(container.querySelector(".era-locked")!.textContent).toBe(STRINGS.reign.locked);
    // Said to a screen reader too: it is part of what the panel describes.
    expect(container.querySelector(".era-jump")!.getAttribute("aria-describedby")).toContain("era-locked");
    expect(screen.getByRole("heading", { name: STRINGS.eras[3]!.name })).toBeTruthy();
    cleanup();
    for (const era of [2, 3, 5]) {
      expect(jump(era).container.querySelector(".era-locked"), `era ${era}`).toBeNull();
      cleanup();
    }
  });

  it("announces the new eras' own rules", () => {
    for (const era of [4, 5]) {
      expect(jump(era).container.querySelector("#era-rule")!.textContent).toBe(STRINGS.eraRules[era - 1]);
      cleanup();
    }
  });
});

describe("the end of a long reign", () => {
  it("ends in its own finale, named from the long view, in a world five centuries on", () => {
    const run = longFinale();
    const fold = foldRun(library, veteran(), run);
    const { container } = render(<Ending lib={library} state={run} fold={fold} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    const band = exitBand(library, run);
    const history = historyOf(run, band);
    expect(history.key.endsWith(":long")).toBe(true);
    expect(screen.getByRole("heading", { name: history.title })).toBeTruthy();
    expect(HISTORIES[history.signature]!.long[band]).toBe(history.title);
    expect(screen.getAllByText(library.endings.get(run.over!.endingId)!.title).length).toBeGreaterThan(0);
    expect(container.textContent).toContain(STRINGS.world.when[LONG - 1]!);
    expect(runFacts(run, "x")).toContain(STRINGS.reign.short);
  });

  it("says a first finale has opened it, and the codex says what opens it", () => {
    const finale: GameState = { ...newRun(library, 1, { align: "left" }), cardCount: 105, era: 3, over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" } };
    const fold = foldRun(library, emptyMeta(), finale);
    render(<Ending lib={library} state={finale} fold={fold} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(screen.getByText(`${STRINGS.ui.unlocked}: ${STRINGS.reign.opened}`)).toBeTruthy();
    cleanup();
    render(<Codex lib={library} meta={emptyMeta()} onBack={noop} onSettings={noop} open="objectives" />);
    expect(screen.getByText(STRINGS.reign.opens)).toBeTruthy();
    // An ordinary run's facts say nothing of a reign.
    expect(runFacts(finale, "x")).not.toContain(STRINGS.reign.short);
  });
});
