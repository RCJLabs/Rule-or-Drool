// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { decodeRunCode, encodeRunCode, historyOf, runCodeOf } from "../../src/meta";
import { App } from "../../src/ui/App";
import { shareLink, shareText } from "../../src/ui/share";

afterEach(() => cleanup());

const finished = (patch: Partial<GameState> = {}): GameState => ({
  ...newRun(library, 4242, { ...rollSetup(library, 4242, "right", []), mandate: null }),
  cardCount: 105,
  era: 3,
  flags: ["seawall", "housing_built", "orbit_reached", "habit_skim"],
  over: { endingId: "finale_ascent", epilogueKey: "ascent:right:3" },
  ...patch,
});

describe("what goes into the group chat", () => {
  it("leads with the history, gives the facts and the way in, in four lines", () => {
    const s = finished();
    const h = historyOf(s, "ascent");
    const text = shareText(s, h, "Orbit", "https://example.test/?run=1.x.R.-.-.-");
    const lines = text.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain(`“${h.title}”`);
    expect(lines[1]).toBe("The Ledger · 105 cards · Orbit");
    // The biggest things left behind, most history-making first.
    expect(lines[2]).toBe("Left behind: Orbit was reached; the seawall stands; the housing was built.");
    expect(lines[3]).toBe("Play the same run: https://example.test/?run=1.x.R.-.-.-");
  });

  it("leads a daily with its number, so a group can compare without sending links", () => {
    const s = finished();
    const h = historyOf(s, "ascent");
    expect(shareText(s, h, "Orbit", "l", "2026-09-22").split("\n")[0]).toBe(`Rule or Drool #2 — “${h.title}”`);
    expect(shareText(s, h, "Orbit", "l").split("\n")[0]).toBe(`Rule or Drool — “${h.title}”`);
    // A clock that has lost its place gives a day with no number, and the line says nothing of one.
    expect(shareText(s, h, "Orbit", "l", "1970-01-01").split("\n")[0]).toBe(`Rule or Drool — “${h.title}”`);
  });

  it("links to the run's setup, not its seed", () => {
    const s = finished();
    const link = shareLink(s, "https://rcjlabs.github.io/Rule-or-Drool/");
    const code = new URL(link).searchParams.get("run")!;
    expect(code).toBe(encodeRunCode(runCodeOf(s)));
    expect(decodeRunCode(library, code)).toMatchObject({ ok: true, code: { seed: 4242, align: "right" } });
  });
});

describe("opening a link someone sent", () => {
  beforeEach(() => localStorage.clear());

  it("offers their run and starts exactly it when asked", () => {
    const code = { seed: 77, align: "right" as const, modifiers: rollSetup(library, 77, "right", ["u_dissident"]).modifiers!, unlocked: ["u_dissident"], mandate: null };
    window.history.replaceState({}, "", `/?debug=1&run=${encodeRunCode(code)}`);
    render(<App />);
    expect(screen.getByRole("heading", { name: STRINGS.share.offerTitle })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: STRINGS.share.offerPlay }));
    // Their side and their setup, and the link answered so a reload does not offer it again.
    expect(document.querySelector(".frame")!.getAttribute("data-align")).toBe("right");
    const saved = JSON.parse(localStorage.getItem("rod.run")!).state;
    expect(saved.seed).toBe(77);
    expect(saved.modifiers).toEqual(code.modifiers);
    expect(saved.unlocked).toEqual(["u_dissident"]);
    expect(window.location.search).not.toContain("run=");
  });

  it("says so when the link cannot be reproduced, instead of starting something else", () => {
    window.history.replaceState({}, "", "/?run=1.abc.L.crisis_meteor.-.-");
    render(<App />);
    expect(screen.getByText(STRINGS.share.offerBroken)).toBeTruthy();
    expect(screen.queryByRole("button", { name: STRINGS.share.offerPlay })).toBeNull();
  });
});
