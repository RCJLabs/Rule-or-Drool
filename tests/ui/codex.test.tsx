// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { LEGACIES, codexProgress, emptyMeta, saveMeta } from "../../src/meta";
import { App } from "../../src/ui/App";
import { Codex } from "../../src/ui/Codex";
import { playedProfile } from "./profile";

/**
 * The codex as an index (after v0.61.1): four groups of sections, each a row saying how much
 * of it is found, opened one at a time where it stands. It was eleven sections on one screen,
 * thirty phone screens long for a player forty runs in.
 */

const c = STRINGS.codex;
const veteran = playedProfile(40);
const noop = () => {};
const row = (title: string) => screen.getByRole("button", { name: new RegExp(`^${title}`) });
const opened = () => [...document.querySelectorAll(".codex-row[aria-expanded='true'] .codex-row-title")].map((e) => e.textContent);

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => cleanup());

describe("the codex", () => {
  it("opens as an index: every section a row with how much of it is found, none of them open", () => {
    render(<Codex lib={library} meta={veteran} onBack={noop} onSettings={noop} />);
    const p = codexProgress(library, veteran);
    expect([...document.querySelectorAll(".codex-group h2")].map((h) => h.textContent)).toEqual(Object.values(c.groups));
    const counts = Object.fromEntries([...document.querySelectorAll(".codex-row")].map((r) => [r.querySelector(".codex-row-title")!.textContent, r.querySelector(".codex-row-count")!.textContent]));
    expect(Object.keys(counts)).toHaveLength(11);
    expect(counts[c.endings]).toBe(`${p.endingsSeen}/${p.endingsTotal}`);
    expect(counts[c.histories]).toBe(`${p.historiesSeen}/${p.historiesTotal}`);
    expect(counts[c.legacies]).toBe(`${p.legaciesSeen}/${p.legaciesTotal}`);
    expect(counts[c.history]).toBe(String(veteran.runs));
    expect(opened()).toEqual([]);
    expect(document.querySelector(".codex-panel")).toBeNull();
  });

  it("opens one section at a time, where it stands, and closes it again", () => {
    render(<Codex lib={library} meta={veteran} onBack={noop} onSettings={noop} />);
    fireEvent.click(row(c.endings));
    expect(opened()).toEqual([c.endings]);
    const panel = document.getElementById(row(c.endings).getAttribute("aria-controls")!)!;
    expect(within(panel).getAllByRole("listitem").length).toBeGreaterThan(0);
    fireEvent.click(row(c.legacies));
    expect(opened()).toEqual([c.legacies]);
    fireEvent.click(row(c.legacies));
    expect(opened()).toEqual([]);
  });

  it("names what is found and counts the rest, rather than a row of dots for each", () => {
    const meta = { ...emptyMeta(), legacies: { [Object.keys(LEGACIES)[0]!]: 2 } };
    render(<Codex lib={library} meta={meta} onBack={noop} onSettings={noop} open="legacies" />);
    const panel = document.querySelector("[data-section='legacies'] .codex-panel")!;
    expect(within(panel as HTMLElement).getAllByRole("listitem").map((li) => li.textContent)).toEqual([`${Object.values(LEGACIES)[0]}left behind 2 times`]);
    expect(within(panel as HTMLElement).getByText(c.moreNotFound.replace("{n}", String(Object.keys(LEGACIES).length - 1)))).toBeTruthy();
    expect(panel.querySelector("li.locked")).toBeNull();
  });

  it("keeps the section open when the player leaves the codex and comes back", () => {
    saveMeta(veteran);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${STRINGS.ui.codex}`) }));
    fireEvent.click(row(c.stories));
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.back }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${STRINGS.ui.codex}`) }));
    expect(opened()).toEqual([c.stories]);
  });
});
