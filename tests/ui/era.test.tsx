// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { historyOf } from "../../src/meta/histories";
import { EraTransition } from "../../src/ui/EraTransition";
import { PAPERS } from "../../src/ui/paper";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const base = () => newRun(library, 3, rollSetup(library, 3, "left", []));
const at = (over: Partial<GameState>): GameState => ({ ...base(), ...over });

const show = (state: GameState, reduceMotion = true) =>
  render(<EraTransition lib={library} state={state} era={2} reduceMotion={reduceMotion} onContinue={() => {}} />);

/**
 * The era boundary (BACKLOG-3 phase 25). Where it lands on screen is checked in a browser; what
 * it says is checked here. What the era did is its front page (BACKLOG-13 phase 82).
 */
describe("the era boundary prints the era's front page", () => {
  // Era 1's cards are 1 to 35: what was set on them is its news at the door into era 2.
  const news = (over: Partial<GameState> = {}): GameState =>
    at({
      band: "muddle",
      flags: ["schools_starved", "seawall", "took_the_skim", "cheated_election", "east_talks"],
      flagSince: { schools_starved: 10, seawall: 30, took_the_skim: 12, cheated_election: 25 },
      ...over,
    });
  const rival = (s: GameState) => library.advisorsById.get(s.cabinet[library.config.rivalRole]!)!.name;

  it("leads with the era's biggest decision, and names the others after it", () => {
    const { container } = show(news());
    expect(container.querySelector(".paper")!.getAttribute("data-paper")).toBe("muddle");
    expect(container.querySelector(".paper-name")!.textContent).toBe(PAPERS.papers.muddle.name);
    // The seawall comes first in history's order, whichever came first in the era.
    expect(container.querySelector(".paper-headline")!.textContent).toBe(PAPERS.headlines.seawall!.muddle);
    const inside = container.querySelector(".paper-inside")!.textContent!;
    expect(inside).toContain("the schools were starved");
    expect(inside).toContain("the skim was taken");
    // A vote is the strap's to tell, and an arc's bookkeeping is nobody's.
    expect(inside).not.toMatch(/counted twice|east_talks/);
  });

  it("is printed by the paper of the direction the country is going", () => {
    for (const band of ["ascent", "decay"] as const) {
      const { container } = show(news({ band }));
      expect(container.querySelector(".paper")!.getAttribute("data-paper")).toBe(band);
      expect(container.querySelector(".paper-name")!.textContent).toBe(PAPERS.papers[band].name);
      expect(container.querySelector(".paper-headline")!.textContent).toBe(PAPERS.headlines.seawall![band]);
      cleanup();
    }
  });

  it("leads an era that decided nothing with the paper's own line, and lists nothing under it", () => {
    const { container } = show(at({ band: "ascent", flags: ["east_talks"] }));
    expect(PAPERS.quiet.ascent).toContain(container.querySelector(".paper-headline")!.textContent);
    expect(container.querySelector(".paper-inside")).toBeNull();
  });

  it("says what the reign is being called so far, and quotes the rival by name", () => {
    const s = news();
    const { container } = show(s);
    expect(container.querySelector(".paper-called")!.textContent).toBe(PAPERS.called.muddle.replace("{name}", historyOf(s, "muddle").title));
    expect(container.querySelector(".paper-rival")!.textContent).toContain(rival(s));
  });

  it("leaves the era's other decisions out when the door has a crisis's rule, the week's goal or the long reign's lock to say as well", () => {
    // The end screen tells them all; a crowded door keeps its headline, vote, rival and name.
    const crisis = show(news({ modifiers: ["crisis_blackouts", "trait_orator", "flaw_vain"] }));
    expect(crisis.container.querySelector(".era-bend")).not.toBeNull();
    expect(crisis.container.querySelector(".paper-inside")).toBeNull();
    expect(crisis.container.querySelector(".paper-headline")!.textContent).toBe(PAPERS.headlines.seawall!.muddle);
    cleanup();
    const goal = render(<EraTransition lib={library} state={news()} era={2} reduceMotion onContinue={() => {}} goal="Reach the Ascent finale." />);
    expect(goal.container.querySelector(".paper-inside")).toBeNull();
    expect(goal.container.querySelector(".paper-called")).not.toBeNull();
  });

  it("is read out on arriving, as the rest of the door is", () => {
    show(news());
    const described = screen.getByRole("dialog").getAttribute("aria-describedby")!.split(" ");
    expect(described).toContain("era-paper");
    expect(document.getElementById("era-paper")!.textContent).toContain(PAPERS.headlines.seawall!.muddle);
  });

  it("goes out as a few words and a link into the same run, with the picture where the browser draws one", async () => {
    // This test's browser draws no pictures, so the words go out alone, as they do when a render fails.
    const sent: ShareData[] = [];
    Object.defineProperty(navigator, "share", { value: async (data: ShareData) => void sent.push(data), configurable: true });
    try {
      show(news());
      fireEvent.click(screen.getByRole("button", { name: STRINGS.paper.share }));
      await waitFor(() => expect(sent).toHaveLength(1));
      const text = sent[0]!.text!;
      expect(text).toContain(PAPERS.papers.muddle.name);
      expect(text).toContain(PAPERS.headlines.seawall!.muddle);
      expect(text).toContain("?run=");
      await waitFor(() => expect(screen.getByRole("status").textContent).toBe(STRINGS.paper.shared));
      // Continue is still where the focus went on arriving.
      expect(screen.getByRole("button", { name: STRINGS.ui.continueEra })).toBeTruthy();
    } finally {
      Reflect.deleteProperty(navigator, "share");
    }
  });

  it("counts what is still owed, and gets the singular right", () => {
    const one = show(at({ queue: [{ id: "x", dueAt: 40 }] }));
    expect(one.container.querySelector(".era-owed")!.textContent).toBe(STRINGS.ui.owedOne);
    cleanup();
    const three = show(at({ queue: [1, 2, 3].map((n) => ({ id: `x${n}`, dueAt: 40 })) }));
    expect(three.container.querySelector(".era-owed")!.textContent).toBe("3 decisions are still owed.");
    cleanup();
    expect(show(at({ queue: [] })).container.querySelector(".era-owed")).toBeNull();
  });

  it("is the frame rather than a card on top of it", () => {
    // The point of the phase: the look changes here, so this may not be an .overlay.
    const { container } = show(at({}));
    expect(container.querySelector(".era-jump")).not.toBeNull();
    expect(container.querySelector(".overlay")).toBeNull();
    expect(container.querySelector(".overlay-card")).toBeNull();
  });

  it("arrives in three beats, and in none when the player asked for less movement", () => {
    vi.useFakeTimers();
    const { container } = show(at({ flags: ["seawall"], queue: [{ id: "x", dueAt: 40 }] }), false);
    const beat = () => container.querySelector(".era-jump")!.getAttribute("data-beat");
    expect(beat()).toBe("0");
    act(() => void vi.advanceTimersByTime(500));
    expect(beat()).toBe("1");
    act(() => void vi.advanceTimersByTime(1200));
    expect(beat()).toBe("3");
    cleanup();
    show(at({}), true);
    expect(screen.getByRole("dialog").getAttribute("data-beat")).toBe("3");
  });
});

describe("the era boundary says what a crisis does to the era", () => {
  // The grid a run inherited is still failing twenty years on (BACKLOG-5 phase 35).
  const bent = STRINGS.bends["crisis_blackouts:2"]!;
  const blackouts = (era: number) => ({ ...at({ modifiers: ["crisis_blackouts", "trait_orator", "flaw_vain"] }), era });

  it("says it beside the era's own rule, in the era it bends", () => {
    const { container } = show(blackouts(2));
    const rules = [...container.querySelectorAll(".era-rule")].map((p) => p.textContent);
    expect(rules).toEqual([STRINGS.eraRules[1], bent]);
    // Part of what a screen reader hears on arriving, as the era's rule is.
    const described = screen.getByRole("dialog").getAttribute("aria-describedby")!.split(" ");
    expect(described).toContain(container.querySelector(".era-bend")!.id);
  });

  it("says nothing of it for another era, or for a run that did not inherit it", () => {
    const third = render(<EraTransition lib={library} state={{ ...blackouts(3) }} era={3} reduceMotion onContinue={() => {}} />);
    expect(third.container.querySelector(".era-bend")).toBeNull();
    cleanup();
    const other = show(at({ modifiers: ["crisis_war", "trait_orator", "flaw_vain"] }));
    expect(other.container.querySelector(".era-bend")).toBeNull();
  });
});
