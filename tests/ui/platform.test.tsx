// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { MANDATES_BY_ID } from "../../src/engine/mandates";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { emptyMeta, foldRun } from "../../src/meta";
import { Codex } from "../../src/ui/Codex";
import { Ending } from "../../src/ui/Ending";
import { Play } from "../../src/ui/Play";
import { timeline } from "../../src/ui/record";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";

/**
 * A run on two promises, a platform (BACKLOG-10 phase 62), on the screen: a line for each in the
 * run, the floor it keeps drawn on its meters while it holds, and each kept or broken at the end.
 */

const noop = () => {};
const title = (id: string) => MANDATES_BY_ID.get(id)!.title;

/** A run on the table under these promises, with any of them broken at these cards. */
function under(mandates: string[], broken: Record<string, number> = {}, patch: Partial<GameState> = {}): GameState {
  const s = newRun(library, 7, { align: "left", mandates });
  return { ...s, mandatesBroken: broken, current: library.content.cards[0]!.id, currentFrom: "deck", ...patch };
}
const play = (state: GameState) =>
  render(<Play lib={library} state={state} transition={null} onChoose={noop} onDismissTransition={noop} debug={false} settings={DEFAULT_SETTINGS} onSettings={noop} onCabinet={noop} onTaught={noop} />);
/** A finished run: the finale, reached at card 105. */
const finished = (state: GameState): GameState => ({
  ...state,
  current: null,
  era: 3,
  cardCount: 105,
  over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" },
});

afterEach(() => cleanup());

describe("a platform in the run", () => {
  it("shares one line between the two, by their short names, each saying which way it is going", () => {
    play(under(["m_broad", "m_press"], { m_press: 9 }));
    expect(document.querySelectorAll(".mandate-badge")).toHaveLength(1);
    const ones = [...document.querySelectorAll(".mandate-badge.pair .mandate-one")];
    expect(ones.map((b) => b.querySelector("b")!.textContent)).toEqual(["m_broad", "m_press"].map((id) => MANDATES_BY_ID.get(id)!.short));
    expect(ones.map((b) => b.classList.contains("broken"))).toEqual([false, true]);
    // A screen reader hears the state the mark and the strike show.
    expect(ones[0]!.querySelector(".sr-only")!.textContent).toBe(STRINGS.ui.mandateHolding);
    expect(ones[1]!.querySelector(".sr-only")!.textContent).toBe(STRINGS.ui.mandateBroken);
  });

  it("gives one promise its whole title and its state, as before", () => {
    play(under(["m_press"]));
    const badge = document.querySelector(".mandate-badge")!;
    expect(badge.classList.contains("pair")).toBe(false);
    expect(badge.querySelector("b")!.textContent).toBe(title("m_press"));
    expect(badge.textContent).toContain(STRINGS.ui.mandateHolding);
  });

  it("draws the line a held floor keeps each of its meters above, and stops when it breaks", () => {
    play(under(["m_broad", "m_reserve"]));
    const lined = () => [...document.querySelectorAll(".meter")].filter((m) => m.querySelector(".meter-floor")).map((m) => m.getAttribute("aria-label")!);
    // The three blocs and the treasury; each says so to a screen reader too.
    expect(lined()).toHaveLength(4);
    for (const label of lined()) expect(label).toContain(STRINGS.speech.promisedFloor);
    cleanup();
    play(under(["m_broad", "m_reserve"], { m_broad: 12 }));
    expect(lined()).toHaveLength(1);
    cleanup();
    play(under([]));
    expect(lined()).toHaveLength(0);
  });
});

describe("a platform at the end", () => {
  it("says of each promise whether it was kept, and when the other was broken", () => {
    const run = finished(under(["m_loyal", "m_fair"], { m_fair: 44 }));
    render(<Ending lib={library} state={run} fold={foldRun(library, emptyMeta(), run)} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    const results = [...document.querySelectorAll(".mandate-result")];
    expect(results.map((r) => r.querySelector("b")!.textContent)).toEqual([title("m_loyal"), title("m_fair")]);
    expect(results[0]!.classList.contains("kept")).toBe(true);
    expect(results[0]!.textContent).toContain(STRINGS.ui.mandateKept);
    expect(results[1]!.classList.contains("broken")).toBe(true);
    expect(results[1]!.textContent).toContain(`${STRINGS.ui.mandateBrokenAt} 44`);
  });

  it("names the one it broke in the timeline, and a run on one says it the way it always did", () => {
    const two = timeline(library, finished(under(["m_loyal", "m_fair"], { m_fair: 44 })), "The end");
    expect(two.filter((m) => m.kind === "promise").map((m) => [m.at, m.text])).toEqual([[44, STRINGS.timeline.brokeOf.replace("{promise}", title("m_fair"))]]);
    const one = timeline(library, finished(under(["m_fair"], { m_fair: 44 })), "The end");
    expect(one.filter((m) => m.kind === "promise").map((m) => m.text)).toEqual([STRINGS.timeline.broke]);
  });

  it("lists each promise of a run in the codex's history", () => {
    const run = finished(under(["m_loyal", "m_fair"], { m_fair: 44 }));
    const meta = foldRun(library, emptyMeta(), run).meta;
    render(<Codex lib={library} meta={meta} onBack={noop} onSettings={noop} open="runs" />);
    const row = document.querySelector(".codex-history li")!;
    const marks = [...row.querySelectorAll("em.kept, em.broken")];
    expect(marks.map((m) => m.className)).toEqual(["kept", "broken"]);
    expect(marks[0]!.textContent).toContain(title("m_loyal"));
    expect(marks[1]!.textContent).toContain(title("m_fair"));
    // And the promises section counts each on its own.
    cleanup();
    render(<Codex lib={library} meta={meta} onBack={noop} onSettings={noop} open="promises" />);
    expect(screen.getByText(title("m_loyal")).parentElement!.textContent).toContain("kept 1, broken 0");
    expect(screen.getByText(title("m_fair")).parentElement!.textContent).toContain("kept 0, broken 1");
  });
});
