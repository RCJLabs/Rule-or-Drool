// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { contractsFor, emptyMeta, foldRun, saveMeta, weekStart, type MetaState } from "../../src/meta";
import { App } from "../../src/ui/App";
import { Codex } from "../../src/ui/Codex";
import { Ending } from "../../src/ui/Ending";
import { Setup } from "../../src/ui/Setup";

/**
 * Weekly contracts on the screen (BACKLOG-10 phase 60): the codex's section for the week, the
 * menu's line once a profile plays full reigns, and the end screen's line for one kept.
 */

const k = STRINGS.contracts;
const noop = () => {};
const WEEK = 5;
const TODAY = weekStart(WEEK);
/** A profile that has seen a run through, so it plays full reigns and has contracts. */
const veteran = (patch: Partial<MetaState> = {}): MetaState => ({ ...emptyMeta(), runs: 3, endings: { finale_muddle: 1 }, ...patch });

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => cleanup());

describe("the codex's contracts", () => {
  it("lists the week's three by tier, says which are kept, and counts weeks in a row", () => {
    const [easy] = contractsFor(WEEK);
    const meta = veteran({ contracts: [{ week: WEEK - 1, kept: ["clean"] }, { week: WEEK, kept: [easy!.id] }] });
    render(<Codex lib={library} meta={meta} onBack={noop} onSettings={noop} today={TODAY} open="contracts" />);
    const row = screen.getByRole("button", { name: new RegExp(`^${k.title}`) });
    expect(row.querySelector(".codex-row-count")!.textContent).toBe("1/3");
    const panel = document.querySelector("[data-section='contracts'] .codex-panel") as HTMLElement;
    expect(within(panel).getByRole("heading", { name: k.heading.replace("{n}", String(WEEK)) })).toBeTruthy();
    const items = [...panel.querySelectorAll(".codex-list li")];
    expect(items.map((li) => li.querySelector("span")!.textContent)).toEqual(contractsFor(WEEK).map((c) => c.text));
    expect(items.map((li) => li.classList.contains("found"))).toEqual([true, false, false]);
    expect(within(panel).getByText(k.streakThis.replace("{n}", "2"))).toBeTruthy();
    expect(within(panel).getByText(k.lastWeek.replace("{n}", "1"))).toBeTruthy();
  });
});

describe("the menu's contracts", () => {
  const menu = (meta: MetaState, onContracts = noop) =>
    render(<Setup lib={library} saved={null} meta={meta} onStart={noop} onDaily={noop} onContinue={noop} onCodex={noop} onContracts={onContracts} onSettings={noop} today={TODAY} />);

  it("says how many of the week's are kept, and opens them", () => {
    let opened = 0;
    menu(veteran({ contracts: [{ week: WEEK, kept: [contractsFor(WEEK)[1]!.id] }] }), () => opened++);
    fireEvent.click(screen.getByRole("button", { name: k.menu.replace("{n}", "1") }));
    expect(opened).toBe(1);
  });

  it("waits until a profile has seen a run through, since a first term keeps none", () => {
    menu(emptyMeta());
    expect(screen.queryByRole("button", { name: new RegExp(k.menu.replace("{n}", "\\d")) })).toBeNull();
  });

  it("opens the codex at this week's contracts in the game", () => {
    saveMeta(veteran());
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(k.menu.replace("{n}", "\\d")) }));
    expect(document.querySelector(".codex-row[aria-expanded='true'] .codex-row-title")!.textContent).toBe(k.title);
  });
});

describe("the end of a run that keeps one", () => {
  it("says so with what else it earned", () => {
    const run: GameState = { ...newRun(library, 7, { align: "left" }), cardCount: 20, over: { endingId: "riots", epilogueKey: "muddle:left:1" } };
    const fold = { ...foldRun(library, veteran(), run), newContracts: ["saint"] };
    render(<Ending lib={library} state={run} fold={fold} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(screen.getByText(k.earned.replace("{text}", k.saint))).toBeTruthy();
  });
});
