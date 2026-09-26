// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { otherSide, replayTo } from "../../src/engine/replay";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { exitBand, exitDrift, newRun, rollSetup } from "../../src/engine/state";
import { METER_KEYS, type GameState, type Meters, type PlayerAlign } from "../../src/engine/types";
import { BOTS, makeContext, type BotName } from "../../src/sim";
import { Ending } from "../../src/ui/Ending";
import type { Moment } from "../../src/ui/record";
import { eraEnds, eraOfCard, inDangerAt, levelAt, readoutAt, shapeOf, type ShapePoint } from "../../src/ui/shape";
import { ShapeChart } from "../../src/ui/ShapeChart";
import { meterName } from "../../src/ui/speech";

/**
 * The shape of a run on the end screen (BACKLOG-12 phase 74): the run dealt again from its record
 * card by card, drawn as a line for each meter and one for the direction, and read in words.
 */

afterEach(cleanup);
const noop = () => {};
const cfg = library.config;
const w = STRINGS.shape;

/** A run a bot plays from this seed to its end, dealt as a player's would be. */
function played(seed: number, bot: BotName = "mixed", eraCount?: number): GameState {
  const rng = makeRng(seed ^ 0x5bd1e995);
  const setup = rollSetup(library, seed, seed % 2 ? "left" : "right", []);
  let s: GameState = newRun(library, seed, eraCount ? { ...setup, eraCount } : setup);
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS[bot](makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

/** A made-up run of n cards, every meter at half unless `at` says otherwise, for drawing. */
function made(n: number, at: (card: number) => Omit<Partial<ShapePoint>, "meters"> & { meters?: Partial<Meters> } = () => ({})): ShapePoint[] {
  return Array.from({ length: n + 1 }, (_, card) => {
    const { meters, ...rest } = at(card);
    return {
      card,
      era: eraOfCard(library, card),
      meters: { ...(Object.fromEntries(METER_KEYS.map((k) => [k, 50])) as Meters), ...meters },
      drift: 0,
      band: "muddle",
      out: false,
      ...rest,
    };
  });
}

const chart = (points: ShapePoint[], moments: Moment[] = [], align: PlayerAlign = "left") =>
  render(<ShapeChart lib={library} align={align} points={points} moments={moments} />);

/** A line with its card and era named and its moments' cards taken out: anything left that is a digit is a meter's number. */
const numbersIn = (line: string) =>
  line
    .replace(/^(Card \d+|As dealt), era \d+/, "")
    .replace(/Card \d+: /g, "")
    .match(/\d/g) ?? [];

describe("the shape of a run", () => {
  it("is the run dealt again from its record: a point a card, from as dealt to how it ended", () => {
    for (const [seed, bot] of [
      [1, "mixed"],
      [2, "informed"],
      [3, "greedy"],
      [4, "random"],
      [5, "eyes"],
    ] as const) {
      const s = played(seed, bot);
      const points = shapeOf(library, s)!;
      expect(points, `seed ${seed}, ${bot}`).toHaveLength(s.cardCount + 1);
      let t = replayTo(library, s, 0)!;
      expect(points[0]!.meters).toEqual(t.meters);
      // Each card in the era it was played in, and each point where that card left the run.
      for (let i = 0; i < s.cardCount; i++) {
        expect(points[i + 1]!.era, `card ${i + 1}`).toBe(t.era);
        const [card, side] = s.choices![i]!;
        const after = resolve(library, t, card, side);
        expect(points[i + 1]!.meters).toEqual(after.meters);
        t = draw(library, after);
      }
      const last = points[s.cardCount]!;
      expect(last.meters).toEqual(s.meters);
      expect(last.drift).toBe(exitDrift(library, s));
      expect(last.band).toBe(exitBand(library, s));
      expect(last.out).toBe(!!s.opposition);
    }
  });

  it("has no shape when the record does not deal the run: unfinished, unkept, or parted from", () => {
    const s = played(6);
    expect(shapeOf(library, s)).not.toBeNull();
    expect(shapeOf(library, { ...s, over: null })).toBeNull();
    expect(shapeOf(library, { ...s, choices: null })).toBeNull();
    expect(shapeOf(library, { ...s, choices: s.choices!.slice(0, -1) })).toBeNull();
    // One side taken the other way: a different card comes, or the run ends somewhere else.
    const choices = s.choices!.map(([card, side], i) => [card, i === 10 ? otherSide(side) : side] as [string, typeof side]);
    expect(shapeOf(library, { ...s, choices })).toBeNull();
  });

  it("holds a long reign's direction inside the band it locked, as its end is drawn", () => {
    let held = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const s = played(seed, "informed", cfg.longEraCount);
      const points = shapeOf(library, s)!;
      const lockedFrom = cfg.eraLength * cfg.bandLockAfterEra + 1;
      for (const p of points.slice(lockedFrom)) {
        expect(p.band, `seed ${seed}, card ${p.card}`).toBe(s.band);
        if (s.band === "ascent") expect(p.drift).toBeGreaterThanOrEqual(cfg.bandAscentAt);
        if (s.band === "decay") expect(p.drift).toBeLessThanOrEqual(cfg.bandDecayAt);
      }
      // Whether drift itself left the band after the lock, which is what holding it is for.
      let t = replayTo(library, s, 0)!;
      for (const [i, [card, side]] of s.choices!.entries()) {
        const after = resolve(library, t, card, side);
        if (after.drift !== points[i + 1]!.drift) held++;
        t = draw(library, after);
      }
    }
    expect(held).toBeGreaterThan(0);
  });

  it("reads a card in words, never a meter's number, in the run's own names for its groups", () => {
    for (const seed of [7, 8]) {
      const s = played(seed);
      const points = shapeOf(library, s)!;
      for (const p of points) {
        const line = readoutAt(p, s.align);
        expect(numbersIn(line), line).toEqual([]);
        for (const k of METER_KEYS) expect(line).toContain(`${meterName(k, s.align)} ${levelAt(k, p)}`);
      }
      expect(readoutAt(points[0]!, s.align).startsWith(`${w.start.replace("{era}", "1")}:`)).toBe(true);
      expect(readoutAt(points[40]!, s.align).startsWith(`${w.at.replace("{n}", "40").replace("{era}", "2")}:`)).toBe(true);
    }
    const out = made(3, (card) => ({ out: card === 2 }));
    expect(readoutAt(out[2]!, "left")).toContain(`, ${w.out}:`);
    expect(readoutAt(out[1]!, "left")).not.toContain(w.out);
  });

  it("says where each era left the run, and where the run ended", () => {
    const cards = (n: number) => eraEnds(library, made(n)).map((p) => p.card);
    expect(cards(105)).toEqual([35, 70, 105]);
    expect(cards(175)).toEqual([35, 70, 105, 140, 175]);
    expect(cards(53)).toEqual([35, 53]);
    expect(cards(70)).toEqual([35, 70]);
    expect(cards(32)).toEqual([32]);
    expect(cards(35)).toEqual([35]);
  });
});

describe("the chart", () => {
  it("draws each meter and the direction, the eras and the run's decisions", () => {
    const s = played(9);
    const points = shapeOf(library, s)!;
    const moments: Moment[] = [
      { at: 12, kind: "decision", text: "Something was decided" },
      { at: 50, kind: "promise", text: "A promise was broken" },
      { at: 35, kind: "era", text: "Twenty years on" },
    ];
    chart(points, moments, s.align);
    const rows = [...document.querySelectorAll(".shape-row[data-meter]")];
    expect(rows.map((r) => r.querySelector(".shape-label")!.textContent)).toEqual(METER_KEYS.map((k) => meterName(k, s.align)));
    expect(document.querySelector(".shape-direction")).not.toBeNull();
    for (const line of document.querySelectorAll(".shape-line:not(.shape-line-danger)")) {
      expect(line.getAttribute("points")!.split(" ")).toHaveLength(points.length);
    }
    // An era is a hairline across each plot, and named under them.
    expect(document.querySelectorAll(".shape-era")).toHaveLength((s.era - 1) * (METER_KEYS.length + 1));
    expect([...document.querySelectorAll(".shape-era-name")].map((e) => e.textContent)).toEqual(
      Array.from({ length: s.era }, (_, i) => w.era.replace("{n}", String(i + 1))),
    );
    // Decisions and broken promises are dots; an era's change is its hairline, not a dot.
    expect(document.querySelectorAll(".shape-moment")).toHaveLength(2);
    // Nothing on it is a number but an era's.
    expect(document.querySelector(".shape-chart")!.textContent!.replace(/Era \d+/g, "")).not.toMatch(/\d/);
  });

  it("is a slider read in words: the keys a slider answers to move it along the run", () => {
    const points = made(105);
    chart(points);
    const slider = screen.getByRole("slider");
    const readout = () => document.querySelector(".shape-readout")!.textContent;
    const at = () => Number(slider.getAttribute("aria-valuenow"));
    expect(slider.getAttribute("aria-valuetext")).toBe(w.hint);
    expect(readout()).toBe(w.hint);
    expect(slider.getAttribute("aria-valuemax")).toBe("105");
    fireEvent.keyDown(slider, { key: "End" });
    expect(at()).toBe(105);
    expect(slider.getAttribute("aria-valuetext")).toBe(readoutAt(points[105]!, "left"));
    expect(readout()).toBe(slider.getAttribute("aria-valuetext"));
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(at()).toBe(105);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(at()).toBe(0);
    expect(slider.getAttribute("aria-valuetext")).toBe(readoutAt(points[0]!, "left"));
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(at()).toBe(0);
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "ArrowUp" });
    expect(at()).toBe(2);
    fireEvent.keyDown(slider, { key: "ArrowRight", shiftKey: true });
    expect(at()).toBe(7);
    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(at()).toBe(17);
    fireEvent.keyDown(slider, { key: "PageDown" });
    fireEvent.keyDown(slider, { key: "ArrowDown" });
    expect(at()).toBe(6);
    // The cursor stands where it is read.
    expect((document.querySelector(".shape-cursor") as HTMLElement).style.left).toBe(`${((6 / 105) * 100).toFixed(2)}%`);
  });

  it("reads the card under a touch or a drag", () => {
    const points = made(100);
    chart(points);
    const slider = screen.getByRole("slider");
    const plot = document.querySelector(".shape-over") as HTMLElement;
    plot.getBoundingClientRect = () => ({ left: 100, width: 200, top: 0, height: 300, right: 300, bottom: 300, x: 100, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(slider, { clientX: 200, pointerId: 1, pointerType: "touch", buttons: 1 });
    expect(slider.getAttribute("aria-valuenow")).toBe("50");
    fireEvent.pointerMove(slider, { clientX: 250, pointerId: 1, pointerType: "touch", buttons: 1 });
    expect(slider.getAttribute("aria-valuenow")).toBe("75");
    // Past either end is the end.
    fireEvent.pointerMove(slider, { clientX: 20, pointerId: 1, pointerType: "touch", buttons: 1 });
    expect(slider.getAttribute("aria-valuenow")).toBe("0");
    // A finger lifted reads nothing new as it passes; a mouse reads as it moves.
    fireEvent.pointerMove(slider, { clientX: 300, pointerId: 1, pointerType: "touch", buttons: 0 });
    expect(slider.getAttribute("aria-valuenow")).toBe("0");
    fireEvent.pointerMove(slider, { clientX: 300, pointerId: 2, pointerType: "mouse", buttons: 0 });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");
  });

  it("names a decision or a broken promise near the card being read", () => {
    const moments: Moment[] = [
      { at: 40, kind: "decision", text: "The port was leased" },
      { at: 44, kind: "promise", text: "The tax promise was broken" },
    ];
    chart(made(105), moments);
    const slider = screen.getByRole("slider");
    const said = () => slider.getAttribute("aria-valuetext")!;
    const decision = w.moment.replace("{n}", "40").replace("{text}", "The port was leased");
    const promise = w.moment.replace("{n}", "44").replace("{text}", "The tax promise was broken");
    fireEvent.keyDown(slider, { key: "Home" });
    for (let i = 0; i < 37; i++) fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(said()).not.toContain(decision);
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(said().endsWith(` ${decision}`)).toBe(true);
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(said().endsWith(` ${decision} ${promise}`)).toBe(true);
    expect(numbersIn(said())).toEqual([]);
  });

  it("turns a meter's line the danger colour while it was in danger, and bands the state's dangers only in office", () => {
    // Money falls into danger for cards 20-25; out of office for 60-70, where it falls again.
    const points = made(105, (card) => ({
      meters: { money: (card >= 20 && card <= 25) || (card >= 60 && card <= 70) ? 8 : 50, base: card === 90 ? 5 : 50 },
      out: card >= 60 && card <= 70,
    }));
    chart(points);
    const money = document.querySelector('[data-meter="money"]')!;
    const runs = [...money.querySelectorAll(".shape-line-danger")].map((l) =>
      l
        .getAttribute("points")!
        .split(" ")
        .map((xy) => Number(xy.split(",")[0])),
    );
    // From the card before it went in, so the way in shows; out of office it was not in danger.
    expect(runs).toEqual([[19, 20, 21, 22, 23, 24, 25]]);
    expect(inDangerAt("money", points[65]!)).toBe(false);
    // A group is in danger at the bottom whoever holds the office.
    const base = [...document.querySelectorAll('[data-meter="base"] .shape-line-danger')].map((l) => l.getAttribute("points")!.split(" ").length);
    expect(base).toEqual([2]);
    // The state's bands stop while out of office: two stretches in office, two bands each.
    expect(money.querySelectorAll(".shape-danger")).toHaveLength(4);
    expect(document.querySelectorAll('[data-meter="base"] .shape-danger')).toHaveLength(1);
    const spans = [...money.querySelectorAll(".shape-danger")].map((r) => [
      Number(r.getAttribute("x")),
      Number(r.getAttribute("x")) + Number(r.getAttribute("width")),
    ]);
    expect(spans).toEqual([
      [0, 59.5],
      [0, 59.5],
      [70.5, 105],
      [70.5, 105],
    ]);
  });

  it("shows the table: where each era left each meter and the direction, in words, and goes back", () => {
    const points = made(105, (card) => ({
      meters: { money: card === 70 ? 10 : 50, inst: card === 105 ? 90 : 50 },
      drift: card >= 35 ? 30 : 0,
      band: card >= 35 ? "ascent" : "muddle",
    }));
    chart(points);
    fireEvent.click(screen.getByRole("button", { name: w.table }));
    expect(screen.queryByRole("slider")).toBeNull();
    const table = screen.getByRole("table", { name: w.caption });
    expect([...table.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual(["Era 1", "Era 2", "Era 3"]);
    const row = (name: string) => [...table.querySelectorAll("tbody tr")].find((tr) => tr.querySelector("th")!.textContent === name)!;
    expect([...row("Money").querySelectorAll("td")].map((td) => td.textContent)).toEqual([
      STRINGS.speech.levels.half,
      STRINGS.speech.levels.tooLow,
      STRINGS.speech.levels.half,
    ]);
    expect(row("Money").querySelector("td[data-danger]")?.textContent).toBe(STRINGS.speech.levels.tooLow);
    expect([...row("State").querySelectorAll("td")].map((td) => td.textContent)).toEqual([
      STRINGS.speech.levels.half,
      STRINGS.speech.levels.half,
      STRINGS.speech.levels.tooHigh,
    ]);
    expect([...row(w.direction).querySelectorAll("td")].map((td) => td.textContent)).toEqual([
      STRINGS.bands.ascent,
      STRINGS.bands.ascent,
      STRINGS.bands.ascent,
    ]);
    expect(table.querySelectorAll("tbody tr")).toHaveLength(METER_KEYS.length + 1);
    expect(table.textContent!.replace(/Era \d+/g, "")).not.toMatch(/\d/);
    fireEvent.click(screen.getByRole("button", { name: w.chart }));
    expect(screen.getByRole("slider")).not.toBeNull();
  });

  it("says the table's last column is the end only for a run that stopped inside an era", () => {
    chart(made(53));
    fireEvent.click(screen.getByRole("button", { name: w.table }));
    expect([...document.querySelectorAll(".shape-table thead th")].map((th) => th.textContent)).toEqual(["Era 1", w.end.replace("{n}", "2")]);
  });
});

describe("on the end screen", () => {
  it("is drawn under how it went for a run its record deals again, which is offered a way back", () => {
    const s = played(10);
    render(<Ending lib={library} state={s} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
    const shape = document.querySelector(".timeline .shape");
    expect(shape).not.toBeNull();
    // Above the moments, not after them.
    expect(shape!.nextElementSibling?.tagName).toBe("OL");
    expect(screen.getByRole("slider", { name: w.label })).not.toBeNull();
    // The same replay says a way back into the run goes back into this one.
    expect(document.querySelectorAll(".road-back").length).toBeGreaterThan(0);
  });

  it("is left out, with the way back, for a run its record does not deal", () => {
    const s = played(10);
    const choices = s.choices!.map(([card, side], i) => [card, i === 3 ? otherSide(side) : side] as [string, typeof side]);
    for (const state of [
      { ...s, choices: null },
      { ...s, choices },
    ]) {
      render(<Ending lib={library} state={state} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={noop} />);
      expect(document.querySelector(".shape")).toBeNull();
      expect(document.querySelector(".road-back")).toBeNull();
      cleanup();
    }
  });
});
