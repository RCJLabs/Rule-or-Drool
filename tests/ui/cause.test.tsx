// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { survivedTo } from "../../src/engine/endings";
import { getCard } from "../../src/engine/library";
import { LOST_OFFICE_FLAG } from "../../src/engine/opposition";
import { coupRisk, resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { fxDeltas, newRun, rollSetup } from "../../src/engine/state";
import type { Card, GameState, MeterKey, Side } from "../../src/engine/types";
import { emptyMeta, foldRun } from "../../src/meta";
import { BOTS, makeContext } from "../../src/sim";
import { causeLine, endCause, oddsWord } from "../../src/ui/cause";
import { Ending } from "../../src/ui/Ending";
import { lib, start, table } from "../helpers";

/**
 * Why a run ended, on the end screen (BACKLOG-11 phase 67): the meter and where it stood, the
 * card and the side taken, the count the card called, or the odds of the coup. Read back from
 * the run's last choice and the run as it stood with that card on the table.
 */

afterEach(cleanup);
const noop = () => {};
const cfg = library.config;

/** A run with this card on the table after `played` cards, a record of choices to match, and these meters. */
function before(card: Card, meters: Partial<GameState["meters"]>, patch: Partial<GameState> = {}, played = 10): GameState {
  const s = newRun(library, 7, { align: card.align === "right" ? "right" : "left" });
  return {
    ...s,
    cardCount: played,
    nextElectionAt: 1000,
    current: card.id,
    choices: Array.from({ length: played }, () => ["filler", "left"] as [string, Side]),
    meters: { ...s.meters, base: 50, backers: 50, public: 50, money: 50, order: 50, inst: 50, ...meters },
    ...patch,
  };
}

/** The first side of an ordinary era-one card that moves this meter at least this far. */
function moving(meter: MeterKey, by: number): { card: Card; side: Side } {
  for (const card of library.content.cards) {
    if (card.type !== "event" || card.align !== "any" || !card.eras.includes(1) || card.opposition || card.campaign) continue;
    for (const side of ["left", "right"] as const) {
      const d = fxDeltas(card[side].fx)[meter] ?? 0;
      if (card[side].ending || card[side].poach || card[side].fireSpeaker) continue;
      if (by < 0 ? d <= by : d >= by) return { card, side };
    }
  }
  throw new Error(`no card moves ${meter} by ${by}`);
}

describe("why a run ended", () => {
  it("says nothing for a run seen through", () => {
    const done = { ...newRun(library, 3, { align: "left" }), over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" } };
    expect(endCause(library, done)).toBeNull();
    expect(causeLine(library, done)).toBeNull();
  });

  it("names the meter, where it stood, and the side that took the last of it", () => {
    const { card, side } = moving("money", -3);
    const at = before(card, { money: 2 });
    const end = resolve(library, at, card.id, side);
    expect(end.over?.endingId).toBe(cfg.meterEndings.money.low);
    expect(endCause(library, end, at)).toMatchObject({ kind: "meter", meter: "money", edge: "low", byEra: false });
    expect(causeLine(library, end, endCause(library, end, at))).toBe(
      STRINGS.cause.byChoice.state.low.replace("{meter}", "Money").replace("{level}", STRINGS.cause.levels.edge).replace("{label}", card[side].label),
    );
  });

  it("names a bloc as the party calls it, and takes a plural verb for it", () => {
    const { card, side } = moving("public", -3);
    const at = before(card, { public: 2 });
    const end = resolve(library, at, card.id, side);
    expect(end.over?.endingId).toBe(cfg.meterEndings.public.low);
    expect(causeLine(library, end, endCause(library, end, at))).toBe(
      `${STRINGS.cause.bloc.replace("{name}", STRINGS.blocNames.left.public)} were ${STRINGS.cause.levels.edge} when you chose “${card[side].label}”, and that was the last of them.`,
    );
  });

  it("explains an ending for a meter that goes too high, which nothing else does", () => {
    const { card, side } = moving("order", 3);
    const at = before(card, { order: 98 });
    const end = resolve(library, at, card.id, side);
    expect(end.over?.endingId).toBe(cfg.meterEndings.order.high);
    const line = causeLine(library, end, endCause(library, end, at))!;
    expect(line).toContain("over the top");
    expect(line.endsWith(STRINGS.cause.high.order)).toBe(true);
  });

  it("says when the side taken left the meter short, and the era's own pressure took the rest", () => {
    const l = lib({ eraRules: [{ passive: { money: -5 }, passiveEvery: 1 }] });
    const at = table(start(l, { cardCount: 10, meters: { ...start(l).meters, money: 3 }, choices: Array.from({ length: 10 }, () => ["f01", "left"] as [string, Side]) }), "f01");
    const end = resolve(l, at, "f01", "left");
    expect(end.over?.endingId).toBe("bankruptcy");
    const cause = endCause(l, end, at);
    expect(cause).toMatchObject({ kind: "meter", byEra: true, chosen: 3 });
    expect(causeLine(l, end, cause)).toBe(STRINGS.cause.byEra.state.low.replace("{meter}", "Money").replace("{level}", STRINGS.cause.levels.edge).replace("{label}", "L"));
  });

  it("puts a vote down to the count only where losing it ended the run", () => {
    const vote = library.content.cards.find((c) => c.type === "election" && c.align === "any" && !c.opposition && !c.rivalStands && !c.cond)!;
    const honest: Side = vote.left.honest ? "left" : "right";
    const low = { base: 20, backers: 20, public: 20 };
    // A second lost vote: the office was lost once already.
    const second = before(vote, low, { era: 2, cardCount: 60, flags: [LOST_OFFICE_FLAG] }, 60);
    const lost = resolve(library, second, vote.id, honest);
    expect(lost.over).not.toBeNull();
    expect(endCause(library, lost, second)).toMatchObject({ kind: "count", second: true, returnVote: false });
    expect(causeLine(library, lost, endCause(library, lost, second))).toBe(STRINGS.cause.count.second.replace("{label}", vote[honest].label).replace("{lost}", STRINGS.cause.lost.plain));
    // The way back into office, lost.
    const back = library.returnVotes.find((c) => c.align === "any")!;
    const out = before(back, low, { flags: [LOST_OFFICE_FLAG], opposition: { since: 26, returnAt: 34 } }, 34);
    const backSide: Side = back.left.honest ? "left" : "right";
    const gone = resolve(library, out, back.id, backSide);
    expect(endCause(library, gone, out)).toMatchObject({ kind: "count", returnVote: true });
    // The first lost vote only sends the run out: it ends when a bloc empties on the same card, and that is what it says.
    const drains = library.content.cards.find(
      (c) => c.type === "election" && !c.cond && !c.opposition && !c.rivalStands && (["left", "right"] as const).some((s) => c[s].honest && (fxDeltas(c[s].fx).backers ?? 0) < 0),
    )!;
    expect(drains, "a vote whose honest side costs a bloc").toBeDefined();
    const side: Side = drains.left.honest ? "left" : "right";
    const first = before(drains, { ...low, backers: 1 }, {}, 25);
    const end = resolve(library, first, drains.id, side);
    expect(end.flags).toContain(LOST_OFFICE_FLAG);
    expect(end.over?.endingId).toBe(cfg.meterEndings.backers.low);
    expect(endCause(library, end, first)).toMatchObject({ kind: "meter", meter: "backers" });
  });

  it("says an ending the side took outright was chosen", () => {
    const card = library.content.cards.find((c) => c.type !== "election" && (c.left.ending || c.right.ending))!;
    const side: Side = card.left.ending ? "left" : "right";
    const at = before(card, {});
    const end = resolve(library, at, card.id, side);
    expect(end.over?.endingId).toBe(card[side].ending);
    expect(causeLine(library, end, endCause(library, end, at))).toBe(STRINGS.cause.choice.replace("{label}", card[side].label));
  });

  it("gives a coup the odds it was rolled at, which nothing on the card caused", () => {
    const s = newRun(library, 5, { align: "right" });
    const coup = { ...s, flags: [...s.flags, cfg.electionsAbolishedFlag], meters: { ...s.meters, order: 30, inst: 30 }, over: { endingId: cfg.coupEnding, epilogueKey: "decay:right:1" } };
    const cause = endCause(library, coup);
    expect(cause).toEqual({ kind: "coup", risk: coupRisk(library, coup) });
    expect(causeLine(library, coup)).toBe(STRINGS.cause.coup.replace("{odds}", oddsWord(coupRisk(library, coup))));
  });

  it("rounds the odds to words, from one in twenty to all but certain", () => {
    expect(oddsWord(0.05)).toBe("about one in twenty");
    expect(oddsWord(0.2)).toBe("about one in five");
    expect(oddsWord(0.5)).toBe("about even");
    expect(oddsWord(1)).toBe("all but certain");
  });

  it("says a cult was every bloc at the top at once", () => {
    const s = newRun(library, 5, { align: "left" });
    const cult = { ...s, meters: { ...s.meters, base: 95, backers: 95, public: 95 }, over: { endingId: cfg.cultEnding, epilogueKey: "muddle:left:1" } };
    expect(causeLine(library, cult)).toBe(STRINGS.cause.cult);
  });

  it("still names the meter for a run that kept no record of its choices", () => {
    const s = newRun(library, 5, { align: "left" });
    const broke = { ...s, choices: null, meters: { ...s.meters, money: 0 }, over: { endingId: "bankruptcy", epilogueKey: "decay:left:1" } };
    expect(causeLine(library, broke)).toBe(STRINGS.cause.bare.low.replace("{meter}", "Money"));
  });

  it("explains every run a player dealt cuts short, naming the side they took last", () => {
    let cut = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s: GameState = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        s = resolve(library, s, card.id, BOTS.random(makeContext(library, s, card, rng, { danger: 25 })));
      }
      if (survivedTo(cfg, s.over!.endingId)) continue;
      cut++;
      const cause = endCause(library, s);
      const line = causeLine(library, s, cause);
      expect(line, `seed ${seed}: ${s.over!.endingId}`).toBeTruthy();
      const [id, side] = s.choices![s.cardCount - 1]!;
      if (cause && "card" in cause && cause.card && cause.kind !== "cult") expect(line).toContain(`“${getCard(library, id)[side].label}”`);
    }
    expect(cut).toBeGreaterThan(100);
  });
});

describe("why a run ended, on the end screen", () => {
  it("is said under the ending for a run cut short, and not for one seen through", () => {
    const { card, side } = moving("money", -3);
    const at = before(card, { money: 2 });
    const end = resolve(library, at, card.id, side);
    // The hand-built run cannot be replayed, so the screen says what its last state holds.
    render(<Ending lib={library} state={end} fold={foldRun(library, emptyMeta(), end)} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".ending-cause")?.textContent).toBe(causeLine(library, end));
    cleanup();
    const done = { ...newRun(library, 3, { align: "left" }), cardCount: 105, era: 3, over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" } };
    render(<Ending lib={library} state={done} fold={foldRun(library, emptyMeta(), done)} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".ending-cause")).toBeNull();
  });
});
