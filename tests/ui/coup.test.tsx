// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { LOST_OFFICE_FLAG } from "../../src/engine/opposition";
import { checkElection, coupDue, coupOdds, coupRisk, resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { hasFlag, newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim";
import { Cabinet } from "../../src/ui/Cabinet";
import { coupBand, coupLine, HIGH_OVER, LOW_UP_TO, type CoupBand } from "../../src/ui/coup";
import { Play } from "../../src/ui/Play";
import { rivalReport } from "../../src/ui/rival";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { LESSONS_BY_ID, lessonFor } from "../../src/ui/teach";

/**
 * Once the vote is abolished, the card it would have fallen due after says the risk of the coup
 * rolled in its place, as a vote says its count; and the cabinet speaks of that coup, not of
 * ballots, and of the office the rival holds when you are out of it (BACKLOG-11 phase 69).
 */

afterEach(cleanup);
const noop = () => {};
const cfg = library.config;
const ordinary = library.content.cards.find((c) => c.type === "event" && c.align === "any" && !c.cond && c.eras.includes(1) && !c.left.ending && !c.right.ending)!;
const line = (band: CoupBand) => STRINGS.coup.line.replace("{band}", STRINGS.coup.bands[band]);

/** An ordinary card on the table with the vote abolished, the coup rolled once it is played. */
function slot(meters: Partial<GameState["meters"]> = {}, patch: Partial<GameState> = {}): GameState {
  const s = newRun(library, 7, { align: "left" });
  return {
    ...s,
    cardCount: 24,
    nextElectionAt: 25,
    current: ordinary.id,
    currentFrom: "deck",
    drift: 0,
    rivalStanding: cfg.rivalStart,
    flags: [...s.flags, cfg.electionsAbolishedFlag],
    meters: { ...s.meters, base: 50, backers: 50, public: 50, money: 50, order: 50, inst: 50, ...meters },
    ...patch,
  };
}
/** The same run with the state short of half: a moderate risk, and a high one. */
const moderate = () => slot({ order: 40, inst: 45 });
const high = () => slot({ order: 30, inst: 30 });

const show = (state: GameState) =>
  render(<Play lib={library} state={state} transition={null} onChoose={noop} onDismissTransition={noop} debug={false} settings={DEFAULT_SETTINGS} onSettings={noop} onCabinet={noop} onTaught={noop} />);

describe("the risk of a coup, in words", () => {
  it("is low to one in ten or so, high from one in three, and never a number", () => {
    const bands = [0, cfg.coupBase, LOW_UP_TO, LOW_UP_TO + 0.001, HIGH_OVER, HIGH_OVER + 0.001, 1].map(coupBand);
    expect(bands).toEqual(["low", "low", "low", "moderate", "moderate", "high", "high"]);
    for (const band of ["low", "moderate", "high"] as const) expect(line(band)).not.toMatch(/\d/);
  });

  it("is no longer than the longest count, so it fits where a count does", () => {
    const longest = Math.max(...Object.values(STRINGS.count).map((t) => t.length));
    for (const band of ["low", "moderate", "high"] as const) expect(line(band).length).toBeLessThanOrEqual(longest);
  });
});

describe("the line on the card", () => {
  it("is on the card the roll comes after, and on no other", () => {
    expect(coupLine(library, slot())).toEqual({ band: "low", text: line("low") });
    expect(coupLine(library, moderate())?.band).toBe("moderate");
    expect(coupLine(library, high())?.band).toBe("high");
    // A card early, with the vote in place, and on a run already over.
    expect(coupLine(library, slot({}, { cardCount: 23 }))).toBeNull();
    expect(coupLine(library, { ...slot(), flags: slot().flags.filter((f) => f !== cfg.electionsAbolishedFlag) })).toBeNull();
    expect(coupDue(library, { ...slot(), over: { endingId: "bankruptcy", epilogueKey: "decay:left:1" } })).toBe(false);
  });

  it("reads the odds the roll is made at, the roll's own pull on drift included", () => {
    for (const s of [slot(), moderate(), high(), slot({}, { drift: -40, rivalStanding: 55 }), slot({}, { drift: 40 })]) {
      // The roll on the run as it stands, as if the card on the table had changed nothing.
      const rolled = checkElection(library, { ...s, current: null, cardCount: s.cardCount + 1 });
      expect(coupRisk(library, rolled)).toBeCloseTo(coupOdds(library, s), 10);
    }
    // Every roll pulls drift toward the self-serving, and the rival gains from how far it goes.
    expect(coupOdds(library, slot())).toBeGreaterThan(coupRisk(library, slot()));
  });

  it("agrees with the roll at every card of 300 long reigns the greedy bot plays, wherever the card leaves the vote as it found it", () => {
    let rolls = 0;
    let lines = 0;
    for (let i = 0; i < 300; i++) {
      const seed = 69_000 + i;
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s: GameState = newRun(library, seed, { ...rollSetup(library, seed, i % 2 ? "left" : "right", []), eraCount: cfg.longEraCount });
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        const after = resolve(library, s, card.id, BOTS.greedy(makeContext(library, s, card, rng, { danger: 25 })));
        // A roll moves the vote's clock on, as nothing else on an ordinary card does mid-era. A run
        // the card itself ends never reaches its roll.
        const rolled = card.type !== "election" && after.era === s.era && after.nextElectionAt !== s.nextElectionAt;
        const endedFirst = !!after.over && after.over.endingId !== cfg.coupEnding;
        const shown = !!coupLine(library, s);
        if (hasFlag(s, cfg.electionsAbolishedFlag) === hasFlag(after, cfg.electionsAbolishedFlag) && !endedFirst) {
          expect(shown, `seed ${seed}, card ${s.cardCount}: ${card.id}`).toBe(rolled);
        }
        if (rolled) rolls++;
        if (shown) lines++;
        s = after;
      }
    }
    expect(rolls).toBeGreaterThan(15);
    expect(lines).toBeGreaterThanOrEqual(rolls);
  }, 60_000);
});

describe("the line on the play screen", () => {
  it("says the risk under the card's text, where a vote's count would be, and out loud after it", () => {
    const { container } = show(high());
    const said = container.querySelector(".card .coup-line")!;
    expect(said.textContent).toBe(line("high"));
    expect(said.getAttribute("data-band")).toBe("high");
    expect(said.closest("[aria-hidden='true']")).toBeNull();
    const text = container.querySelector(".card .card-text")!;
    expect(text.compareDocumentPosition(said) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector(".count-line")).toBeNull();
    const heard = document.querySelector("[aria-live='polite']")!.textContent ?? "";
    expect(heard).toContain(`${line("high")}.`);
  });

  it("says nothing of a coup a card early, or with the vote in place", () => {
    show(slot({ order: 30, inst: 30 }, { cardCount: 23 }));
    expect(document.querySelector(".coup-line")).toBeNull();
    cleanup();
    show({ ...high(), flags: high().flags.filter((f) => f !== cfg.electionsAbolishedFlag) });
    expect(document.querySelector(".coup-line")).toBeNull();
  });

  it("is taught once the vote is gone, before the first roll: what the line will say, and what moves it", () => {
    const lesson = LESSONS_BY_ID.get("coup")!;
    const early = slot({}, { cardCount: 10 });
    expect(lessonFor(library, early, [])?.id).toBe("coup");
    expect(lessonFor(library, early, ["coup"])).toBeNull();
    expect(lessonFor(library, { ...early, flags: early.flags.filter((f) => f !== cfg.electionsAbolishedFlag) }, [])).toBeNull();
    for (const meter of [STRINGS.meters.order, STRINGS.meters.inst]) expect(lesson.body("")).toContain(meter);
    // No longer than the first lesson, which the fit audits put on the longest cards.
    expect(lesson.body("").length).toBeLessThanOrEqual(LESSONS_BY_ID.get("meters")!.body("").length);
  });

  it("keeps every lesson off the card the roll comes after, which needs the room for its line", () => {
    // Untaught, and on a card whose own moment it is: the first lesson, and the one for a bloc walking out.
    expect(lessonFor(library, slot({}, { cardCount: 0, nextElectionAt: 1 }), [])).toBeNull();
    expect(lessonFor(library, slot({ base: 20 }), ["coup"])).toBeNull();
    expect(lessonFor(library, slot({ base: 20 }, { cardCount: 10 }), ["coup"])?.id).toBe("bloc");
  });
});

describe("the rival, once the vote is abolished", () => {
  it("speaks of the coup rolled in the ballot's place, never of a ballot", () => {
    for (const s of [slot(), moderate(), high(), slot({}, { rivalStanding: 75 })]) {
      const r = rivalReport(library, s);
      const band = coupLine(library, s)!.band;
      expect(r.cost.startsWith(STRINGS.rival.abolished.cost.replace("{band}", STRINGS.coup.bands[band]))).toBe(true);
      for (const ballot of [STRINGS.rival.takingNone, STRINGS.rival.wouldWin, STRINGS.rival.costs.behind, STRINGS.rival.taking.split("{n}")[0]!]) {
        expect(r.cost).not.toContain(ballot);
      }
    }
  });

  it("says their standing adds to it once they are off the bottom rung", () => {
    expect(rivalReport(library, slot()).cost).not.toContain(STRINGS.rival.abolished.adds);
    expect(rivalReport(library, slot({}, { rivalStanding: 50 })).cost).toContain(STRINGS.rival.abolished.adds);
  });

  it("flags the cabinet when the risk is high, and not for a ballot there is no longer any losing", () => {
    expect(rivalReport(library, high()).alert).toBe(STRINGS.rival.abolished.alert);
    expect(rivalReport(library, moderate()).alert).toBeNull();
    // Somebody, who would take a lost vote by name: but no vote is left to lose, and the risk is moderate.
    const somebody = slot({}, { rivalStanding: cfg.rivalWinsAt });
    expect(rivalReport(library, somebody)).toMatchObject({ somebody: true, alert: null });
    const { container } = show(somebody);
    const gear = container.querySelector(`button[aria-label^="${STRINGS.cabinet.title}"]`)!;
    expect(gear.getAttribute("aria-label")).toBe(STRINGS.cabinet.title);
    expect(gear.classList.contains("flagged")).toBe(false);
    cleanup();
    const flagged = show(high()).container.querySelector(`button[aria-label^="${STRINGS.cabinet.title}"]`)!;
    expect(flagged.getAttribute("aria-label")).toBe(`${STRINGS.cabinet.title} — ${STRINGS.rival.abolished.alert}`);
    expect(flagged.classList.contains("flagged")).toBe(true);
  });

  it("is said in the cabinet", () => {
    render(<Cabinet lib={library} state={high()} onClose={noop} />);
    expect(document.querySelector(".rival-cost")!.textContent).toContain(STRINGS.rival.abolished.cost.replace("{band}", STRINGS.coup.bands.high));
  });
});

describe("the rival, out of office", () => {
  /** Out of office since the vote on card 26, with the vote to win it back on the era's last card. */
  function out(bloc: number, returnAt: number | null = 34): GameState {
    const s = newRun(library, 7, { align: "left" });
    return {
      ...s,
      cardCount: 28,
      nextElectionAt: 60,
      drift: 0,
      flags: [...s.flags, LOST_OFFICE_FLAG],
      opposition: { since: 26, returnAt },
      meters: { ...s.meters, base: bloc, backers: bloc, public: bloc },
    };
  }

  it("holds the office, and what counts is the vote to win it back", () => {
    const winning = rivalReport(library, out(70));
    expect(winning).toMatchObject({ state: STRINGS.rival.out.state, cost: STRINGS.rival.out.win, alert: null });
    const losing = rivalReport(library, out(20));
    expect(losing).toMatchObject({ state: STRINGS.rival.out.state, cost: STRINGS.rival.out.lose, alert: STRINGS.rival.out.alert });
    // In the run's last era there is no vote to win it back.
    expect(rivalReport(library, out(20, null))).toMatchObject({ cost: STRINGS.rival.out.none, alert: null });
    for (const r of [winning, losing]) expect(r.cost).not.toContain(STRINGS.rival.takingNone);
  });

  it("is said in the cabinet, and on the button that opens it when the way back would be lost", () => {
    render(<Cabinet lib={library} state={out(20)} onClose={noop} />);
    expect(document.querySelector(".rival-state")!.textContent).toBe(STRINGS.rival.out.state);
    expect(document.querySelector(".rival-cost")!.textContent).toBe(STRINGS.rival.out.lose);
    cleanup();
    const card = library.oppositionCards.find((c) => c.align === "any" && !c.cond)!;
    const gear = show({ ...out(20), current: card.id, currentFrom: "opposition" }).container.querySelector(`button[aria-label^="${STRINGS.cabinet.title}"]`)!;
    expect(gear.getAttribute("aria-label")).toBe(`${STRINGS.cabinet.title} — ${STRINGS.rival.out.alert}`);
  });
});
