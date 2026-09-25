// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { applyChoice, electionBar, resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { Card, GameState, Side } from "../../src/engine/types";
import { BOT_NAMES, BOTS, makeContext } from "../../src/sim";
import { countBand, countLine, EASY_BY, NARROW_WITHIN, type CountBand } from "../../src/ui/count";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";

/**
 * An election card says how an honest count goes (BACKLOG-9 phase 53): won or lost, and roughly
 * by how much. Won or lost has to be what the vote then does, every time.
 */

const WINS: readonly CountBand[] = ["easy", "win", "narrowWin"];
const honestSide = (card: Card): Side => (card.left.honest ? "left" : "right");
/**
 * The vote alone, before anything after it can end the run: an honest side that loses ends it,
 * or, the first time, puts the run out of office (BACKLOG-10 phase 55).
 */
const lost = (s: GameState, card: Card): boolean => {
  const after = applyChoice(library, s, card, honestSide(card));
  return !!after.over || (!!after.opposition && !s.opposition);
};

const rig = getCard(library, "e_rig");
const at = (bloc: number, rivalStanding: number, card: Card = rig): GameState => {
  const s = newRun(library, 11, { align: "left" });
  return { ...s, current: card.id, currentFrom: "election", drift: 0, rivalStanding, meters: { ...s.meters, base: bloc, backers: bloc, public: bloc } };
};

const noop = () => {};
const show = (state: GameState) =>
  render(<Play lib={library} state={state} transition={null} onChoose={noop} onDismissTransition={noop} debug={false} settings={DEFAULT_SETTINGS} onSettings={noop} onCabinet={noop} onTaught={noop} />);

afterEach(() => cleanup());

describe("the line on an election card", () => {
  it("agrees with what the vote does, at every election four bots meet in 200 runs each", () => {
    const seen = new Set<CountBand>();
    let votes = 0;
    for (const bot of BOT_NAMES) {
      for (let i = 0; i < 200; i++) {
        const seed = 53_000 + i;
        const rng = makeRng(seed ^ 0x5bd1e995);
        let s = newRun(library, seed, rollSetup(library, seed, i % 2 ? "left" : "right", []));
        while (!s.over) {
          s = draw(library, s);
          const card = getCard(library, s.current!);
          const line = countLine(library, s, card);
          if (card.type === "election") {
            const wins = !lost(s, card);
            expect(line, `${bot} ${seed} ${card.id}`).toMatchObject({ wins, text: STRINGS.count[line!.band] });
            expect(WINS.includes(line!.band), `${bot} ${seed} ${card.id}: ${line!.band}`).toBe(wins);
            seen.add(line!.band);
            votes++;
          } else {
            expect(line).toBeNull();
          }
          s = resolve(library, s, card.id, BOTS[bot](makeContext(library, s, card, rng, { danger: 25 })));
        }
      }
    }
    expect(votes).toBeGreaterThan(1000);
    expect([...seen].sort()).toEqual(["easy", "loss", "narrowLoss", "narrowWin", "win"]);
  }, 60_000);

  it("puts the bar itself on the winning side, as the vote does, and a fraction under it on the losing", () => {
    // Nobody pulling on the bar: it is the threshold, and a coalition exactly on it wins.
    const bar = library.config.electionMoodThreshold;
    const level = at(bar, library.config.rivalStart);
    expect(electionBar(library, level)).toBe(bar);
    expect(countLine(library, level, rig)).toMatchObject({ band: "narrowWin", wins: true });
    expect(lost(level, rig)).toBe(false);
    // A rival five points over where they start lifts it by a fraction, and the same coalition
    // no longer clears it.
    const pulled = at(bar, library.config.rivalStart + 5);
    expect(electionBar(library, pulled)).toBeCloseTo(bar + 5 * library.config.rivalElectionPull);
    expect(countLine(library, pulled, rig)).toMatchObject({ band: "narrowLoss", wins: false });
    expect(lost(pulled, rig)).toBe(true);
  });

  it("bands by the margin, and takes won or lost from the count and never from the margin", () => {
    const b = (wins: boolean, margin: number) => countBand({ wins, margin });
    expect([b(true, 0), b(true, NARROW_WITHIN - 0.01), b(true, NARROW_WITHIN), b(true, EASY_BY - 0.01), b(true, EASY_BY), b(true, 60)]).toEqual([
      "narrowWin",
      "narrowWin",
      "win",
      "win",
      "easy",
      "easy",
    ]);
    expect([b(false, -0.3), b(false, 0.01 - NARROW_WITHIN), b(false, -NARROW_WITHIN), b(false, -40)]).toEqual(["narrowLoss", "narrowLoss", "loss", "loss"]);
    expect(b(false, 0)).toBe("narrowLoss");
  });

  it("is in words, never a number", () => {
    for (const text of Object.values(STRINGS.count)) expect(text).not.toMatch(/\d/);
  });

  it("is on every election card, whichever side is the honest one, and on nothing else", () => {
    const elections = library.content.cards.filter((c) => c.type === "election");
    expect(elections.length).toBeGreaterThan(10);
    for (const card of elections) {
      expect([card.left.honest, card.right.honest].filter(Boolean), card.id).toHaveLength(1);
      expect(countLine(library, at(60, 0, card), card), card.id).toMatchObject({ band: "easy", wins: true });
    }
    const ordinary = library.content.cards.find((c) => c.type === "event")!;
    expect(countLine(library, at(60, 0), ordinary)).toBeNull();
  });
});

describe("an election on the table", () => {
  it("says how an honest count goes under its text, and out loud after it", () => {
    const { container } = show(at(library.config.electionMoodThreshold - 2, library.config.rivalStart));
    const line = container.querySelector(".card .count-line")!;
    expect(line.textContent).toBe(STRINGS.count.narrowLoss);
    expect(line.getAttribute("data-band")).toBe("narrowLoss");
    expect(line.closest("[aria-hidden='true']")).toBeNull();
    // After the prose, in the card and in what is said.
    const text = container.querySelector(".card .card-text")!;
    expect(text.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const said = document.querySelector("[aria-live='polite']")!.textContent ?? "";
    expect(said).toContain(`${STRINGS.count.narrowLoss}.`);
    expect(said.indexOf(STRINGS.count.narrowLoss)).toBeGreaterThan(said.indexOf("Election year."));
  });

  it("says nothing of a count on a card that is not a vote", () => {
    const ordinary = library.content.cards.find((c) => c.type === "event" && !c.cond && c.eras.includes(1) && c.align !== "right")!;
    show({ ...at(library.config.electionMoodThreshold - 2, library.config.rivalStart), current: ordinary.id, currentFrom: "deck" });
    expect(document.querySelector(".count-line")).toBeNull();
    for (const text of Object.values(STRINGS.count)) expect(document.querySelector("[aria-live='polite']")!.textContent).not.toContain(text);
  });
});
