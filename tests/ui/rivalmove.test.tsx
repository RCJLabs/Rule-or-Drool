// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rivalPressure, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { BOTS, makeContext, noisy } from "../../src/sim";
import { Cabinet } from "../../src/ui/Cabinet";
import { Play } from "../../src/ui/Play";
import { isRivalMove, rivalMove, rivalMoveLine, rivalReport } from "../../src/ui/rival";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";

/**
 * The rival's next move (BACKLOG-14 phase 90): the first of their moves among the deck's next
 * cards, read with them a little stronger than they are; a ring on the cabinet's button, the move
 * in words in the cabinet and on the button for a screen reader, and said once as it comes up.
 */

afterEach(cleanup);
const noop = () => {};

/** A person-like run's states, each with its card on the table. */
function onTable(seed: number): GameState[] {
  const bot = noisy(BOTS.eyes, 0.2);
  const rng = makeRng(seed ^ 0x2545f491);
  let s = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
  const out: GameState[] = [];
  while (!s.over) {
    s = draw(library, s);
    out.push(s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return out;
}
const runs = [3, 11, 17, 42, 2024].map(onTable);
const line = (s: GameState) => {
  const m = rivalMove(library, s);
  return m ? rivalMoveLine(library, s, m) : null;
};

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
const gear = () => document.querySelector<HTMLButtonElement>(`button[aria-label^="${STRINGS.cabinet.title}"]`)!;
const heard = () => document.querySelector("footer .sr-only[aria-live]")?.textContent ?? "";

/** The first card of these runs on which a move comes up, the card before it showing none, and nothing that threatens the office. */
function comingUp(): [GameState, GameState] {
  for (const run of runs) {
    for (let i = 1; i < run.length; i++) {
      const [a, b] = [run[i - 1]!, run[i]!];
      if (!b.opposition && line(b) && !line(a) && !rivalReport(library, b).alert) return [a, b];
    }
  }
  throw new Error("no move came up in these runs");
}

describe("the rival's next move", () => {
  it("is one of their moves the deal can bring, not yet met, and nothing while they are a backbencher or out of office", () => {
    let shown = 0;
    for (const run of runs) {
      for (const s of run) {
        const m = rivalMove(library, s);
        if (!m) continue;
        shown++;
        expect(isRivalMove(m)).toBe(true);
        expect(s.seen).not.toContain(m.id);
      }
      // A run begins with the rival a backbencher, and none of their moves in reach.
      expect(run.slice(0, 5).every((s) => rivalPressure(library, s) > 40 || rivalMove(library, s) === null)).toBe(true);
    }
    expect(shown).toBeGreaterThan(10);
    const s = runs[0]![40]!;
    expect(rivalMove(library, { ...s, rivalStanding: 90, opposition: { since: s.cardCount, returnAt: null } })).toBeNull();
  });

  it("is shown on the card before most of the moves that come", () => {
    let came = 0;
    let warned = 0;
    for (const run of runs) {
      for (let i = 1; i < run.length; i++) {
        const s = run[i]!;
        if (s.currentFrom !== "deck" || !isRivalMove(getCard(library, s.current!))) continue;
        came++;
        if (rivalMove(library, run[i - 1]!)?.id === s.current) warned++;
      }
    }
    expect(came).toBeGreaterThan(5);
    expect(warned / came).toBeGreaterThan(0.7);
  });

  it("has words of its own for every move, naming the rival and a seat they court, and no number", () => {
    const s = runs[0]![40]!;
    const rival = library.advisorsById.get(s.cabinet[library.config.rivalRole]!)!.name;
    const moves = [...library.cards.values()].filter(isRivalMove);
    expect(moves.length).toBeGreaterThan(25);
    for (const card of moves) {
      const courting = !!(card.left.poach || card.right.poach);
      if (!courting) expect(STRINGS.rival.moves[card.id], card.id).toBeDefined();
      const said = rivalMoveLine(library, s, card);
      expect(said.startsWith(rival), card.id).toBe(true);
      expect(said).not.toMatch(/[{}\d]/);
      if (courting) expect(said).toBe(STRINGS.rival.courting.replace("{rival}", rival).replace("{role}", STRINGS.roles[card.speaker]!));
    }
    // Every line is for a move the deal can bring.
    for (const id of Object.keys(STRINGS.rival.moves)) expect(isRivalMove(library.cards.get(id)!), id).toBe(true);
  });
});

describe("on the play screen", () => {
  it("rings the cabinet's button and says the move on it, and is said once as it comes up", () => {
    const [before, after] = comingUp();
    const { rerender } = render(play(before));
    expect(gear().classList.contains("moving")).toBe(false);
    rerender(play(after));
    expect(gear().classList.contains("moving")).toBe(true);
    expect(gear().classList.contains("flagged")).toBe(false);
    expect(gear().getAttribute("aria-label")).toBe(`${STRINGS.cabinet.title} — ${line(after)}`);
    expect(heard()).toContain(line(after)!);
  });

  it("is not said again while the same move stays in view", () => {
    for (const run of runs) {
      for (let i = 1; i < run.length; i++) {
        const [a, b] = [run[i - 1]!, run[i]!];
        if (!line(a) || line(a) !== line(b) || a.era !== b.era) continue;
        const { rerender } = render(play(a));
        rerender(play(b));
        expect(heard()).not.toContain(line(b)!);
        return;
      }
    }
    throw new Error("no move stayed in view in these runs");
  });

  it("gives way to a threat to the office, which keeps its dot, and is said after it", () => {
    const [, after] = comingUp();
    // Strong enough that a lost vote is theirs by name.
    const strong = { ...after, rivalStanding: 80 };
    const alert = rivalReport(library, strong).alert!;
    expect(alert).toBeTruthy();
    render(play(strong));
    expect(gear().classList.contains("flagged")).toBe(true);
    expect(gear().classList.contains("moving")).toBe(false);
    const said = line(strong);
    expect(gear().getAttribute("aria-label")).toBe(`${STRINGS.cabinet.title} — ${said ? `${alert} ${said}` : alert}`);
  });

  it("says nothing on the button while no move is near", () => {
    const quiet = runs[0]![2]!;
    expect(line(quiet)).toBeNull();
    render(play(quiet));
    expect(gear().className).toBe("gear");
    expect(gear().getAttribute("aria-label")).toBe(STRINGS.cabinet.title);
  });
});

describe("in the cabinet", () => {
  it("says what the rival is doing under their standing, and nothing when no move is near", () => {
    const [before, after] = comingUp();
    render(<Cabinet lib={library} state={after} onClose={noop} />);
    expect(document.querySelector(".cabinet-note.rival .rival-move")?.textContent).toBe(line(after));
    cleanup();
    render(<Cabinet lib={library} state={before} onClose={noop} />);
    expect(document.querySelector(".rival-move")).toBeNull();
  });
});
