// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim";
import { CardView } from "../../src/ui/CardView";
import { Ending } from "../../src/ui/Ending";
import { Play } from "../../src/ui/Play";
import { billsOf, firstSentence, receiptLine, receiptOf, receiptSpoken } from "../../src/ui/receipt";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { shapeOf } from "../../src/ui/shape";

/**
 * The bill's receipt on the screen (BACKLOG-13 phase 80): a card that came back names the choice
 * that sent it, under its speaker and aloud, and the end screen lists what came back.
 */

const noop = () => {};

/** An informed run from this seed, stopped at its first card that came back, and played to its end. */
function run(seed: number): { bill: GameState; end: GameState } {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s = newRun(library, seed, rollSetup(library, seed, "left", []));
  let bill: GameState | null = null;
  while (!s.over) {
    s = draw(library, s);
    if (!bill && s.currentFrom === "queue") bill = s;
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS.informed(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return { bill: bill!, end: s };
}
const { bill, end } = run(80_001);

afterEach(() => cleanup());

describe("a card that came back", () => {
  it("names the choice that sent it, by its card and as its button said it", () => {
    const receipt = receiptOf(library, bill)!;
    const [id, side] = bill.choices![bill.sentBy! - 1]!;
    expect(receipt).toEqual({ n: bill.sentBy, label: getCard(library, id)[side].label });
    expect(receiptLine(receipt)).toBe(`Sent by card ${receipt.n}: “${receipt.label}”`);
  });

  it("says so under its speaker, and aloud as it lands, in place of only saying it came back", () => {
    const view = render(
      <Play
        lib={library}
        state={bill}
        transition={null}
        onChoose={noop}
        onDismissTransition={noop}
        debug={false}
        settings={DEFAULT_SETTINGS}
        onSettings={noop}
        onCabinet={noop}
        onTaught={noop}
      />,
    );
    const receipt = receiptOf(library, bill)!;
    const line = view.container.querySelector(".card .receipt")!;
    expect(line.textContent).toBe(receiptLine(receipt));
    // Read once, from the card's own words for a screen reader, not twice.
    expect(line.getAttribute("aria-hidden")).toBe("true");
    expect(view.container.querySelector(".card .sr-only")!.textContent).toBe(receiptSpoken(receipt));
    const said = view.container.querySelector('[aria-live="polite"]')!.textContent!;
    expect(said).toContain(receiptSpoken(receipt));
    expect(said).not.toContain(STRINGS.ui.cameBack);
  });

  it("is only a card that came back: nothing is said of the sender on any other card", () => {
    const card = getCard(library, bill.current!);
    const view = (from: "queue" | "deck" | "habit", receipt: { n: number; label: string } | null) =>
      render(
        <CardView
          card={card}
          text="text"
          speakerName="Someone"
          roleLabel="Role"
          advisorId=""
          seed={1}
          from={from}
          receipt={receipt}
          peek={null}
          leaving={null}
          onDrag={noop}
          onCommit={noop}
        />,
      ).container;
    expect(view("deck", { n: 3, label: "Label" }).querySelector(".receipt")).toBeNull();
    cleanup();
    expect(view("habit", { n: 3, label: "Label" }).querySelector(".sr-only")!.textContent).toBe(STRINGS.ui.aHabit);
    cleanup();
    // One sent before the queue kept its senders still says it came back.
    const old = view("queue", null);
    expect(old.querySelector(".receipt")).toBeNull();
    expect(old.querySelector(".sr-only")!.textContent).toBe(STRINGS.ui.cameBack);
  });
});

describe("the end screen", () => {
  const show = (state: GameState) =>
    render(<Ending lib={library} state={state} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} today="2026-09-27" />).container;

  it("lists, folded under how it went, every choice that came back and how its card began", () => {
    const bills = billsOf(library, end, shapeOf(library, end)!);
    expect(bills.length).toBeGreaterThan(1);
    const folded = show(end).querySelector(".timeline details.came-back")! as HTMLDetailsElement;
    expect(folded.open).toBe(false);
    const summary = folded.querySelector("summary")!;
    expect(summary.textContent).toBe(STRINGS.receipt.many.replace("{n}", String(bills.length)));
    fireEvent.click(summary);
    const items = within(folded).getAllByRole("listitem");
    expect(items.map((li) => li.querySelector("b")!.textContent)).toEqual(
      bills.map((b) => STRINGS.receipt.sent.replace("{n}", String(b.sent.n)).replace("{label}", b.sent.label)),
    );
    expect(items[0]!.querySelector("p")!.textContent).toBe(STRINGS.receipt.back.replace("{n}", String(bills[0]!.at)).replace("{text}", bills[0]!.text));
  });

  it("has them in the order they came, each after the choice that sent it", () => {
    const bills = billsOf(library, end, shapeOf(library, end)!);
    expect(bills.map((b) => b.at)).toEqual([...bills.map((b) => b.at)].sort((a, b) => a - b));
    for (const b of bills) expect(b.sent.n).toBeLessThan(b.at);
  });

  it("lists nothing for a run that cannot be dealt again, or one where nothing came back", () => {
    expect(show({ ...end, choices: null }).querySelector(".came-back")).toBeNull();
    cleanup();
    const quiet = { ...newRun(library, 3, { align: "left" }), over: { endingId: "riots", epilogueKey: "decay:left:1" } } as GameState;
    expect(billsOf(library, quiet, [])).toEqual([]);
  });

  it("gives one card's first sentence, which is what a list of them has room for", () => {
    expect(firstSentence("It did not rain. The taps run for two hours a day.")).toBe("It did not rain.");
    expect(firstSentence("The year is up.")).toBe("The year is up.");
    expect(firstSentence("No full stop at all")).toBe("No full stop at all");
    expect(firstSentence("Who asked? Nobody did.")).toBe("Who asked?");
  });
});
