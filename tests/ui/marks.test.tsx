// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { buildLibrary } from "../../src/engine/library";
import { content } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { LOST_OFFICE_FLAG } from "../../src/engine/opposition";
import { sideEnds } from "../../src/engine/preview";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { fxDeltas, newRun, rollSetup } from "../../src/engine/state";
import type { Card, GameState, MeterKey, Side } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { lib, start, table } from "../helpers";

/**
 * A side that ends the run is marked (BACKLOG-11 phase 68): under its label as it is peeked, on its
 * button, and in the words a screen reader hears; and a vote whose loss ends the run says so. The
 * eyes bot, which decides from what the table shows, took such a side in 40 of 2,000 runs.
 */

afterEach(cleanup);
const noop = () => {};
const cfg = library.config;

/** A left-side run with this card on the table after `played` cards, and these meters. */
function on(card: Card, meters: Partial<GameState["meters"]> = {}, patch: Partial<GameState> = {}, played = 10): GameState {
  const s = newRun(library, 7, { align: card.align === "right" ? "right" : "left" });
  return {
    ...s,
    cardCount: played,
    nextElectionAt: 1000,
    current: card.id,
    meters: { ...s.meters, base: 50, backers: 50, public: 50, money: 50, order: 50, inst: 50, ...meters },
    ...patch,
  };
}

/** An ordinary era-one card, and a side of it that moves this meter at least this far while the other does not move it at all. */
function moving(meter: MeterKey, by: number): { card: Card; side: Side } {
  for (const card of library.content.cards) {
    if (card.type !== "event" || card.align !== "any" || !card.eras.includes(1) || card.opposition || card.campaign || card.appoints) continue;
    for (const side of ["left", "right"] as const) {
      const other = side === "left" ? "right" : "left";
      if (card[side].ending || card[other].ending || card[side].poach || card[side].fireSpeaker) continue;
      const d = fxDeltas(card[side].fx)[meter] ?? 0;
      if ((by < 0 ? d <= by : d >= by) && !(fxDeltas(card[other].fx)[meter] ?? 0)) return { card, side };
    }
  }
  throw new Error(`no card moves ${meter} by ${by} on one side only`);
}

describe("which side ends the run", () => {
  it("is the side that takes a meter over its edge, and not the other", () => {
    const { card, side } = moving("money", -3);
    const s = on(card, { money: 2 });
    expect(sideEnds(library, s, card, side)).toBe(cfg.meterEndings.money.low);
    expect(sideEnds(library, s, card, side === "left" ? "right" : "left")).toBeNull();
  });

  it("is the side the era's own pressure finishes once it is played, where the choice leaves a meter at the edge", () => {
    const l = lib({ eraRules: [{ passive: { money: -5 }, passiveEvery: 1 }] });
    const s = table(start(l, { cardCount: 10, meters: { ...start(l).meters, money: 3 } }), "f01");
    expect(sideEnds(l, s, l.cards.get("f01")!, "left")).toBe("bankruptcy");
  });

  it("is the honest side of a vote whose loss ends the run, and not a first lost vote, which only sends the run out", () => {
    const vote = library.content.cards.find((c) => c.type === "election" && c.align === "any" && !c.opposition && !c.rivalStands && !c.cond)!;
    const honest: Side = vote.left.honest ? "left" : "right";
    const cheat: Side = honest === "left" ? "right" : "left";
    const losing = { base: 20, backers: 20, public: 20 };
    const second = on(vote, losing, { flags: [LOST_OFFICE_FLAG] }, 60);
    expect(sideEnds(library, second, vote, honest)).not.toBeNull();
    expect(sideEnds(library, second, vote, cheat)).toBeNull();
    expect(sideEnds(library, on(vote, losing, {}, 25), vote, honest)).toBeNull();
  });

  it("is a side whose own words end the reign", () => {
    // A story's last step, most often.
    const card = library.content.cards.find((c) => c.type !== "election" && (c.left.ending || c.right.ending) && !(c.left.ending && c.right.ending))!;
    const side: Side = card.left.ending ? "left" : "right";
    expect(sideEnds(library, on(card), card, side)).toBe(card[side].ending);
  });

  it("is never a finale, which is the run seen through", () => {
    const { eraLength, eraCount } = cfg;
    const card = library.content.cards.find((c) => c.type === "event" && c.align === "any" && c.eras.includes(eraCount) && !c.left.ending && !c.right.ending && !c.cond)!;
    const last = on(card, {}, { era: eraCount }, eraLength * eraCount - 1);
    expect(resolve(library, last, card.id, "left").over?.endingId.startsWith(cfg.finalePrefix)).toBe(true);
    expect(sideEnds(library, last, card, "left")).toBeNull();
  });

  it("is never the coup's roll, which is dice the player is not shown", () => {
    const certain = buildLibrary(content, { coupBase: 1 });
    const card = certain.content.cards.find((c) => c.type === "event" && c.align === "any" && c.eras.includes(1) && !c.left.ending && !c.right.ending && !c.cond)!;
    const s = { ...on(card), flags: [...on(card).flags, cfg.electionsAbolishedFlag], nextElectionAt: 11 };
    expect(resolve(certain, s, card.id, "left").over?.endingId).toBe(cfg.coupEnding);
    expect(sideEnds(certain, s, card, "left")).toBeNull();
  });
});

describe("the eyes bot, which reads the mark", () => {
  it("never takes a marked side while the other is not marked", () => {
    let marked = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s: GameState = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        const side = BOTS.eyes(makeContext(library, s, card, rng, { danger: 25 }));
        const other: Side = side === "left" ? "right" : "left";
        const mine = sideEnds(library, s, card, side);
        if (sideEnds(library, s, card, other) === null && mine !== null) expect.fail(`seed ${seed}: took ${card.id} ${side}, marked ${mine}, with the other clear`);
        if (mine || sideEnds(library, s, card, other)) marked++;
        s = resolve(library, s, card.id, side);
      }
    }
    expect(marked).toBeGreaterThan(100);
  });
});

describe("the mark on the play screen", () => {
  const show = (state: GameState, showChoices = true) =>
    render(
      <Play lib={library} state={state} transition={null} onChoose={noop} onDismissTransition={noop} debug={false} settings={{ ...DEFAULT_SETTINGS, showChoices }} onSettings={noop} onCabinet={noop} onTaught={noop} />,
    );

  it("marks the side's label and button, and says it to a screen reader, and only on that side", () => {
    const { card, side } = moving("money", -3);
    const other: Side = side === "left" ? "right" : "left";
    const { container } = show({ ...on(card, { money: 2 }), currentFrom: "deck" });
    const labels = [...container.querySelectorAll(".card-label")];
    const at = side === "left" ? 0 : 1;
    expect(labels[at]!.getAttribute("data-ends")).toBe("true");
    expect(labels[at]!.textContent).toContain(STRINGS.ui.endsRule);
    expect(labels[1 - at]!.textContent).not.toContain(STRINGS.ui.endsRule);
    const button = container.querySelector(`.choice[data-side="${side}"]`)!;
    expect(button.getAttribute("data-ends")).toBe("true");
    expect(container.querySelector(`.choice[data-side="${other}"]`)!.hasAttribute("data-ends")).toBe(false);
    const described = document.getElementById(button.getAttribute("aria-describedby")!)!.textContent!;
    expect(described.endsWith(STRINGS.speech.endsRule)).toBe(true);
    const otherDescribed = document.getElementById(container.querySelector(`.choice[data-side="${other}"]`)!.getAttribute("aria-describedby")!)!.textContent!;
    expect(otherDescribed).not.toContain(STRINGS.speech.endsRule);
  });

  it("says on a vote that losing it ends the run, where it does, and not the first time", () => {
    const vote = library.content.cards.find((c) => c.type === "election" && c.align === "any" && !c.opposition && !c.rivalStands && !c.cond)!;
    const losing = { base: 20, backers: 20, public: 20 };
    const { container } = show({ ...on(vote, losing, { flags: [LOST_OFFICE_FLAG] }, 60), currentFrom: "election" });
    expect(container.querySelector(".count-line")!.textContent).toBe(STRINGS.countEnds);
    cleanup();
    const first = show({ ...on(vote, losing, {}, 25), currentFrom: "election" });
    expect(first.container.querySelector(".count-line")!.textContent).not.toBe(STRINGS.countEnds);
  });
});
