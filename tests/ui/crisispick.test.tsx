// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { crisisOf, crisisOffer, newRun, pickCrisis, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign } from "../../src/engine/types";
import { emptyMeta, foldRun, historyOf, saveMeta, type MetaState } from "../../src/meta";
import { App } from "../../src/ui/App";
import { Chronicle } from "../../src/ui/Chronicle";
import { loadRun } from "../../src/ui/save";
import { choseLine } from "../../src/ui/setup";
import { shareText } from "../../src/ui/share";

/**
 * Pick your trouble (BACKLOG-13 phase 84): a fresh run of the player's own, past its first term,
 * takes on one of two crises; the chronicle and the share text say which, and which it passed over.
 */

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(cleanup);

const name = (id: string) => STRINGS.modifiers[id]!.name;
/** Past its first term: a finale seen, and a run behind it to take over from. */
const veteran = (): MetaState => {
  const run: GameState = {
    ...newRun(library, 21, rollSetup(library, 21, "left", [])),
    cardCount: 105,
    era: 3,
    over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" },
  };
  return foldRun(library, emptyMeta(), run).meta;
};
/** The offer the menu is showing, read from its seed and side. */
const shown = (align: PlayerAlign = "left") => crisisOffer(library, Number((document.querySelector(".seed input") as HTMLInputElement).value), align)!;
const choices = () => [...document.querySelectorAll(".crisis-pick .mandate-choice")] as HTMLButtonElement[];

describe("picking the crisis", () => {
  it("offers the crisis dealt and one more, the first taken until the player takes the other", () => {
    saveMeta(veteran());
    render(<App />);
    const offer = shown();
    expect(document.querySelector(".crisis-pick legend")!.textContent).toBe(STRINGS.crisisPick.legend);
    expect(choices().map((b) => b.querySelector("b")!.textContent)).toEqual(offer.map(name));
    expect(choices().map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    // The crisis is picked above, so the summary under it says only the trait and the flaw.
    const labels = [...document.querySelectorAll(".setup-summary dt")].map((dt) => dt.textContent);
    expect(labels).toEqual([STRINGS.setupLabels.trait, STRINGS.setupLabels.flaw]);
    fireEvent.click(choices()[1]!);
    expect(choices().map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true"]);
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    const run = loadRun()!;
    expect(crisisOf(library, run.modifiers)).toBe(offer[1]);
    expect(run.passedOver).toBe(offer[0]);
    // The trait and the flaw are the ones the seed dealt.
    const dealt = rollSetup(library, run.seed, "left", run.unlocked).modifiers!;
    expect(run.modifiers.filter((m) => m !== offer[1])).toEqual(dealt.filter((m) => m !== offer[0]));
  });

  it("starts a new seed's offer at the crisis dealt, even when it offers the one taken before", () => {
    saveMeta(veteran());
    render(<App />);
    const input = document.querySelector(".seed input") as HTMLInputElement;
    const offer = shown();
    fireEvent.click(choices()[1]!);
    // Another seed that offers the crisis just taken, second: it is not taken there until pressed.
    let next = 1;
    while (next === Number(input.value) || crisisOffer(library, next, "left")![1] !== offer[1]) next++;
    fireEvent.change(input, { target: { value: String(next) } });
    expect(choices().map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    expect(choices()[0]!.querySelector("b")!.textContent).toBe(name(crisisOffer(library, next, "left")![0]));
    // The other side is offered the same two, and keeps the pick.
    fireEvent.click(choices()[1]!);
    const [left, right] = [...document.querySelectorAll(".align .align-choice")] as HTMLButtonElement[];
    fireEvent.click(left!.getAttribute("aria-pressed") === "true" ? right! : left!);
    expect(shown(left!.getAttribute("aria-pressed") === "true" ? "left" : "right")).toEqual(crisisOffer(library, next, "left"));
    expect(choices().map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true"]);
  });

  it("keeps the first when the player takes nothing, and the run remembers the other", () => {
    saveMeta(veteran());
    render(<App />);
    const offer = shown();
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(crisisOf(library, loadRun()!.modifiers)).toBe(offer[0]);
    expect(loadRun()!.passedOver).toBe(offer[1]);
  });

  it("is not offered in a first term, nor when taking over, nor by the daily", () => {
    render(<App />);
    expect(document.querySelector(".crisis-pick")).toBeNull();
    expect([...document.querySelectorAll(".setup-summary dt")].map((dt) => dt.textContent)).toContain(STRINGS.setupLabels.crisis);
    cleanup();
    localStorage.clear();
    saveMeta(veteran());
    render(<App />);
    expect(document.querySelector(".crisis-pick")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(STRINGS.dynasty.takeOver) }));
    expect(document.querySelector(".crisis-pick")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    const took = loadRun()!;
    expect(took.inherited).not.toBeNull();
    expect(took.passedOver).toBeUndefined();
    expect(took.modifiers).toEqual(rollSetup(library, took.seed, took.align, took.unlocked).modifiers);
    cleanup();
    localStorage.clear();
    saveMeta(veteran());
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Daily / }));
    expect(loadRun()!.passedOver).toBeUndefined();
  });
});

describe("a run that picked its crisis", () => {
  const offer = crisisOffer(library, 33, "right")!;
  const picked = (): GameState => ({
    ...newRun(library, 33, pickCrisis(rollSetup(library, 33, "right", []), offer, offer[1])),
    cardCount: 70,
    era: 2,
    over: { endingId: "bankruptcy", epilogueKey: "decay:right:2" },
  });

  it("says in the chronicle which crisis it took, and which it passed over", () => {
    const meta = foldRun(library, veteran(), picked()).meta;
    expect(meta.chronicle.at(-1)!.crisis).toEqual({ chose: offer[1], over: offer[0] });
    // A reign offered no pick says nothing of one.
    expect(meta.chronicle[0]!.crisis).toBeUndefined();
    render(<Chronicle lib={library} meta={meta} />);
    expect(document.querySelector(".codex-crisis")!.textContent).toBe(choseLine(offer[1], offer[0]));
    expect(choseLine(offer[1], offer[0])).toBe(
      `Chose ${name(offer[1]).replace(/^./, (c) => c.toLowerCase())} over ${name(offer[0]).replace(/^./, (c) => c.toLowerCase())}`,
    );
  });

  it("says so in its share text", () => {
    const s = picked();
    const lines = shareText(s, historyOf(s, "decay"), "Bankruptcy", "l").split("\n");
    expect(lines).toContain(`${choseLine(offer[1], offer[0])}.`);
    const plain = { ...s, passedOver: undefined };
    expect(shareText(plain, historyOf(plain, "decay"), "Bankruptcy", "l")).not.toContain("Chose ");
  });
});
