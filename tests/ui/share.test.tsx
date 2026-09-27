// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { decodeRunCode, encodeRunCode, historyOf, runCodeOf } from "../../src/meta";
import { App } from "../../src/ui/App";
import { eraOfCard, DRIFT_REACH } from "../../src/ui/shape";
import { CARD_H, CARD_W, STRIP_BOX, STRIP_H, pageText, shareLink, shareText, stripOf, wrapLines, type CardShape } from "../../src/ui/share";

afterEach(() => cleanup());

const finished = (patch: Partial<GameState> = {}): GameState => ({
  ...newRun(library, 4242, { ...rollSetup(library, 4242, "right", []), mandates: [] }),
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
    const code = { seed: 77, align: "right" as const, modifiers: rollSetup(library, 77, "right", ["u_dissident"]).modifiers!, unlocked: ["u_dissident"], mandates: [] };
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

/**
 * The strip under the card's picture (BACKLOG-12 phase 75): the run's direction as the end screen
 * draws it, in the card's own pixels. The canvas it is drawn on is a browser's; its geometry is here.
 */
describe("the strip on the card", () => {
  const cfg = library.config;
  const shapeOfDrifts = (drifts: number[]): CardShape => ({
    points: drifts.map((drift, card) => ({ card, era: eraOfCard(library, card), meters: newRun(library, 1, { align: "left" }).meters, drift, band: "muddle", out: false })),
    eraLength: cfg.eraLength,
    bandAscentAt: cfg.bandAscentAt,
    bandDecayAt: cfg.bandDecayAt,
  });
  const box = STRIP_BOX;

  it("sits in a band of its own under the picture, inside the card's margins", () => {
    expect(box.y).toBeGreaterThanOrEqual(CARD_H);
    expect(box.y + box.h).toBeLessThanOrEqual(CARD_H + STRIP_H);
    expect(box.x + box.w).toBeLessThanOrEqual(CARD_W - 56);
  });

  it("runs the line from the first card to the last, its middle at no drift and its edges at the chart's reach", () => {
    const drifts = Array.from({ length: 106 }, (_, card) => (card === 50 ? DRIFT_REACH + 40 : card === 60 ? -DRIFT_REACH - 40 : card === 70 ? 30 : 0));
    const strip = stripOf(shapeOfDrifts(drifts), box);
    expect(strip.line).toHaveLength(106);
    expect(strip.line[0]![0]).toBe(box.x);
    expect(strip.line[105]![0]).toBe(box.x + box.w);
    expect(strip.line[0]![1]).toBe(strip.middle);
    expect(strip.middle).toBe(box.y + box.h / 2);
    // Drift past the reach is drawn at the edge, as the end screen's row draws it.
    expect(strip.line[50]![1]).toBe(box.y);
    expect(strip.line[60]![1]).toBe(box.y + box.h);
    // Up is the Ascent's way.
    expect(strip.line[70]![1]).toBeLessThan(strip.middle);
    for (const [x, y] of strip.line) {
      expect(x).toBeGreaterThanOrEqual(box.x);
      expect(x).toBeLessThanOrEqual(box.x + box.w);
      expect(y).toBeGreaterThanOrEqual(box.y);
      expect(y).toBeLessThanOrEqual(box.y + box.h);
    }
  });

  it("washes each side from its band line to the edge, where the chart washes it", () => {
    const strip = stripOf(shapeOfDrifts([0, 0]), box);
    const y = (drift: number) => box.y + ((DRIFT_REACH - drift) / (2 * DRIFT_REACH)) * box.h;
    expect(strip.up).toEqual({ top: box.y, bottom: y(cfg.bandAscentAt) });
    expect(strip.down).toEqual({ top: y(cfg.bandDecayAt), bottom: box.y + box.h });
    expect(strip.up.bottom).toBeLessThan(strip.middle);
    expect(strip.down.top).toBeGreaterThan(strip.middle);
  });

  it("marks each era after the first where it began, and nothing at the run's end", () => {
    const eras = (cards: number) => stripOf(shapeOfDrifts(Array(cards + 1).fill(0)), box).eras;
    const at = (card: number, cards: number) => box.x + (card / cards) * box.w;
    expect(eras(105)).toEqual([at(35, 105), at(70, 105)]);
    expect(eras(175)).toEqual([35, 70, 105, 140].map((c) => at(c, 175)));
    expect(eras(53)).toEqual([at(35, 53)]);
    expect(eras(70)).toEqual([at(35, 70)]);
    expect(eras(32)).toEqual([]);
  });
});

/** The era's front page as it goes out (BACKLOG-13 phase 82). */
describe("a front page's picture and words", () => {
  // A font whose every letter is ten pixels wide, which is all the line breaking needs to know.
  const ctx = { measureText: (text: string) => ({ width: text.length * 10 }) } as unknown as CanvasRenderingContext2D;

  it("breaks a headline at the words, into lines no wider than the page", () => {
    const lines = wrapLines(ctx, "The office welcomes new grateful citizens", 160);
    expect(lines).toEqual(["The office", "welcomes new", "grateful", "citizens"]);
    for (const line of lines) expect(line.length * 10).toBeLessThanOrEqual(160);
    // A word too long for a line gets a line to itself rather than being cut.
    expect(wrapLines(ctx, "A Commissionership", 100)).toEqual(["A", "Commissionership"]);
    expect(wrapLines(ctx, "", 100)).toEqual([]);
  });

  it("goes out as the paper, the era, its headline and what the reign is called, and the way in", () => {
    const text = pageText(
      { band: "muddle", paper: "The Daily Fuss", motto: "Bigger letters than ever", when: "Twenty years on", headline: "Rent frozen! Landlords melt!", inside: null, strap: null, rival: null, called: "Everyone’s calling it “The Fair Rents”!" },
      "https://example.test/?run=abc",
    );
    expect(text.split("\n")).toEqual([
      `${STRINGS.title} — The Daily Fuss, twenty years on: “Rent frozen! Landlords melt!”`,
      "Everyone’s calling it “The Fair Rents”!",
      `${STRINGS.share.play} https://example.test/?run=abc`,
    ]);
  });
});
