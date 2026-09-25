// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { advisorPool, newRun } from "../../src/engine/state";
import type { GameState, Inheritance } from "../../src/engine/types";
import { LEGACIES, emptyMeta, foldRun, historyTitle, saveMeta, type MetaState, type RunRecord } from "../../src/meta";
import { App } from "../../src/ui/App";
import { Codex } from "../../src/ui/Codex";
import { Ending } from "../../src/ui/Ending";
import { Setup } from "../../src/ui/Setup";
import { lineName } from "../../src/ui/dynasty";
import { timeline } from "../../src/ui/record";

/**
 * A line of runs on the screen (BACKLOG-10 phase 63): the choice to take over, beside a fresh
 * start, with what it hands on said before it is made; and what a run that took over is at the end.
 */

const d = STRINGS.dynasty;
const noop = () => {};
const cfg = library.config;
const rival = advisorPool(library, cfg.rivalRole, "right")[0]!;
const last = (patch: Partial<RunRecord> = {}): RunRecord => ({
  align: "right",
  cards: 105,
  era: 3,
  endingId: "finale_decay",
  band: "decay",
  rival: rival.id,
  legacies: ["media_captured", "seawall", "habit_skim"],
  history: null,
  mandates: [],
  ...patch,
});
/** A profile past its first term, with this run behind it. */
const veteran = (r: RunRecord = last()): MetaState => ({ ...emptyMeta(), runs: 4, endings: { finale_decay: 2 }, history: [r] });
const menu = (meta: MetaState, onStart: (...a: unknown[]) => void = noop, onDaily: (...a: unknown[]) => void = noop) =>
  render(<Setup lib={library} saved={null} meta={meta} onStart={onStart} onDaily={onDaily} onContinue={noop} onCodex={noop} onSettings={noop} />);
const takeOverButton = () => screen.getByRole("button", { name: new RegExp(d.takeOver) });
const sideButton = (a: "left" | "right") => [...document.querySelectorAll<HTMLButtonElement>(".align-choice")].find((b) => b.textContent!.includes(STRINGS.parties[a]))!;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => cleanup());

describe("taking over, on the menu", () => {
  it("is offered beside a fresh start, and says what it hands on before it is chosen", () => {
    menu(veteran());
    expect(screen.getByRole("button", { name: new RegExp(d.fresh) }).getAttribute("aria-pressed")).toBe("true");
    const option = takeOverButton();
    expect(option.getAttribute("aria-pressed")).toBe("false");
    expect(option.textContent).toContain(STRINGS.parties.right);
    expect(option.textContent).toContain(d.lean.decay);
    // What is still in force, in history's order, and never the reign's own habits.
    expect(option.textContent).toContain(LEGACIES.seawall);
    expect(option.textContent).toContain(LEGACIES.media_captured);
    expect(option.textContent).not.toContain(LEGACIES.habit_skim);
    expect(option.textContent).toContain(d.rival.replace("{rival}", rival.name));
  });

  it("is not offered to a profile still on its first term, or with no run behind it", () => {
    menu({ ...emptyMeta(), history: [last()] });
    expect(screen.queryByRole("button", { name: new RegExp(d.takeOver) })).toBeNull();
    cleanup();
    menu({ ...emptyMeta(), runs: 1, endings: { finale_decay: 1 } });
    expect(screen.queryByRole("button", { name: new RegExp(d.takeOver) })).toBeNull();
  });

  it("takes the same side, drops a promise the country already breaks, and starts the run on the inheritance", () => {
    let started: unknown[] = [];
    menu(veteran(), (...a) => (started = a));
    // A promise first, on the other side; taking over takes the last run's side and lets it go.
    fireEvent.click(sideButton("left"));
    fireEvent.click(document.querySelector(".mandate-current")!);
    fireEvent.click(screen.getByRole("button", { name: /The papers print what they like/ }));
    fireEvent.click(takeOverButton());
    expect(sideButton("right").getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector(".mandate-current")!.textContent).toContain(STRINGS.ui.mandateNone);
    // And it is not offered while the country's press already answers to the office.
    fireEvent.click(document.querySelector(".mandate-current")!);
    const list = document.getElementById(document.querySelector(".mandate-current")!.getAttribute("aria-controls")!)!;
    expect(within(list).queryByRole("button", { name: /The papers print what they like/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    const inheritance = started[4] as Inheritance;
    expect(started[1]).toBe("right");
    expect(inheritance).toMatchObject({ band: "decay", line: 2, rival: rival.id });
    expect(inheritance.legacies).toEqual(expect.arrayContaining(["seawall", "media_captured"]));
  });

  it("goes back to a fresh start if the other side is chosen, and keeps the daily fresh", () => {
    let started: unknown[] = [];
    let daily: unknown[] = [];
    menu(veteran(), (...a) => (started = a), (...a) => (daily = a));
    fireEvent.click(takeOverButton());
    fireEvent.click(screen.getByRole("button", { name: /Daily|daily/ }));
    expect(daily).toHaveLength(2);
    fireEvent.click(sideButton("left"));
    expect(takeOverButton().getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(started[4]).toBeNull();
  });

  it("starts, in the game, on the card that hands the country over", () => {
    saveMeta(veteran());
    render(<App />);
    fireEvent.click(takeOverButton());
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    const saved = JSON.parse(localStorage.getItem("rod.run")!).state as GameState;
    expect(saved.inherited).toMatchObject({ band: "decay", line: 2 });
    expect(saved.current).toBe(`${cfg.handoverPrefix}decay`);
  });
});

describe("a run that took over, at the end", () => {
  const inh: Inheritance = { band: "ascent", line: 3, legacies: ["seawall"], rival: null, rivalStanding: 33 };
  const ended = (): GameState => ({
    ...newRun(library, 7, { align: "left", inheritance: inh }),
    era: 3,
    cardCount: 105,
    over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" },
  });

  it("says which of its line it was, and what it took over", () => {
    const run = ended();
    render(<Ending lib={library} state={run} fold={foldRun(library, emptyMeta(), run)} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    const note = document.querySelector(".line-note")!;
    expect(note.textContent).toContain(lineName(3));
    expect(note.textContent).toContain(d.lean.ascent);
    expect(note.textContent).toContain(LEGACIES.seawall);
    expect(timeline(library, run, "The end")[0]!.text.startsWith(STRINGS.timeline.tookOver.replace("{party}", STRINGS.parties.left))).toBe(true);
  });

  it("does not list what it took over as what it left behind (BACKLOG-11 phase 66)", () => {
    const run = ended();
    expect(run.flags).toContain("seawall");
    render(<Ending lib={library} state={run} fold={foldRun(library, emptyMeta(), run)} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".line-note")!.textContent).toContain(LEGACIES.seawall);
    expect(document.querySelector(".became-also")?.textContent ?? "").not.toContain(LEGACIES.seawall);
    expect(document.querySelector(".became")!.textContent).not.toContain(LEGACIES.seawall);
  });

  it("is marked in the codex's history, and a fresh start is not", () => {
    const meta = foldRun(library, foldRun(library, emptyMeta(), { ...ended(), inherited: null }).meta, ended()).meta;
    render(<Codex lib={library} meta={meta} onBack={noop} onSettings={noop} open="runs" />);
    const rows = [...document.querySelectorAll(".codex-history li")];
    expect(rows[0]!.querySelector(".codex-line")!.textContent).toBe(lineName(3));
    expect(rows[1]!.querySelector(".codex-line")).toBeNull();
  });

  it("names the line in order", () => {
    expect(lineName(1)).toBe("");
    expect(lineName(2)).toBe(d.line.replace("{ordinal}", "Second"));
    expect(lineName(12)).toBe(d.line.replace("{ordinal}", d.ordinalMany.replace("{n}", "12")));
    expect(historyTitle).toBeTypeOf("function");
  });
});
