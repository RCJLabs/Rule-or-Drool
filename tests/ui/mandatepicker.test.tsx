// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STRINGS } from "../../src/content/strings";
import { INCOMPATIBLE, MANDATES, MANDATES_BY_ID, compatible } from "../../src/engine/mandates";
import { App } from "../../src/ui/App";
import { MandatePicker } from "../../src/ui/MandatePicker";

/**
 * Your promise, as an inline drop-down: the one chosen, and the others only when it is
 * opened, each with what it costs, so the menu is not five cards long on a phone.
 */

let chosen: string[] = [];
function Picker() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MandatePicker
      value={value}
      onChange={(ids) => {
        chosen = ids;
        setValue(ids);
      }}
    />
  );
}

const current = () => document.querySelector(".mandate-current")!;
const pickers = () => [...document.querySelectorAll(".mandate-current")];
/** Open the n-th drop-down and take the option with this title. */
function pick(n: number, title: string) {
  fireEvent.click(pickers()[n]!);
  const list = document.getElementById(pickers()[n]!.getAttribute("aria-controls")!)!;
  fireEvent.click(within(list).getByRole("button", { name: new RegExp(title) }));
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => cleanup());

describe("your promise", () => {
  it("shows the promise chosen, and no other until it is opened", () => {
    render(<Picker />);
    expect(current().getAttribute("aria-expanded")).toBe("false");
    expect(current().textContent).toContain(STRINGS.ui.mandateNone);
    for (const m of MANDATES) expect(screen.queryByText(m.title)).toBeNull();
  });

  it("opens in place with every other promise and what it costs", () => {
    render(<Picker />);
    fireEvent.click(current());
    expect(current().getAttribute("aria-expanded")).toBe("true");
    const list = document.getElementById(current().getAttribute("aria-controls")!)!;
    for (const m of MANDATES) {
      const option = within(list).getByRole("button", { name: new RegExp(m.title) });
      expect(option.textContent).toContain(m.cost);
    }
    expect(within(list).getByText(STRINGS.ui.mandateHint)).toBeTruthy();
    // The one chosen is not offered twice.
    expect(within(list).queryByText(STRINGS.ui.mandateNone)).toBeNull();
  });

  it("closes on a choice, shows it with its cost, and gives the focus back", () => {
    render(<Picker />);
    const m = MANDATES[1]!;
    fireEvent.click(current());
    fireEvent.click(screen.getByRole("button", { name: new RegExp(m.title) }));
    expect(current().getAttribute("aria-expanded")).toBe("false");
    expect(current().textContent).toContain(m.title);
    expect(current().textContent).toContain(m.cost);
    expect(document.activeElement).toBe(current());
    // And back to none, which is offered once something else is chosen.
    fireEvent.click(current());
    fireEvent.click(screen.getByRole("button", { name: new RegExp(STRINGS.ui.mandateNone) }));
    expect(current().textContent).toContain(STRINGS.ui.mandateNone);
  });

  it("closes on Escape, choosing nothing", () => {
    render(<Picker />);
    fireEvent.click(current());
    fireEvent.keyDown(screen.getByRole("button", { name: new RegExp(MANDATES[0]!.title) }), { key: "Escape" });
    expect(current().getAttribute("aria-expanded")).toBe("false");
    expect(current().textContent).toContain(STRINGS.ui.mandateNone);
    expect(document.activeElement).toBe(current());
  });

  it("is the promise the run is taken on", () => {
    const m = MANDATES[2]!;
    render(<App />);
    fireEvent.click(current());
    fireEvent.click(screen.getByRole("button", { name: new RegExp(m.title) }));
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(JSON.parse(localStorage.getItem("rod.run")!).state.mandates).toEqual([m.id]);
  });
});

/** A platform: a second promise beside the first (BACKLOG-10 phase 62). */
describe("a second promise", () => {
  beforeEach(() => {
    chosen = [];
  });

  it("is asked for only once a first is made, and goes with it", () => {
    render(<Picker />);
    expect(pickers()).toHaveLength(1);
    expect(screen.queryByText(STRINGS.ui.mandateSecond)).toBeNull();
    pick(0, MANDATES_BY_ID.get("m_broad")!.title);
    expect(pickers()).toHaveLength(2);
    expect(screen.getByText(STRINGS.ui.mandateSecond)).toBeTruthy();
    expect(pickers()[1]!.textContent).toContain(STRINGS.ui.mandateOnlyOne);
    pick(1, MANDATES_BY_ID.get("m_loyal")!.title);
    expect(chosen).toEqual(["m_broad", "m_loyal"]);
    // Promising nothing takes the second with it.
    pick(0, STRINGS.ui.mandateNone);
    expect(chosen).toEqual([]);
    expect(pickers()).toHaveLength(1);
  });

  it("offers only what can stand beside the first, each with what it costs", () => {
    const [a, b] = INCOMPATIBLE[0]!;
    render(<Picker />);
    pick(0, MANDATES_BY_ID.get(a)!.title);
    fireEvent.click(pickers()[1]!);
    const list = document.getElementById(pickers()[1]!.getAttribute("aria-controls")!)!;
    for (const m of MANDATES) {
      const offered = within(list).queryByRole("button", { name: new RegExp(m.title) });
      expect(!!offered, m.id).toBe(compatible(a, m.id));
      if (offered) expect(offered.textContent).toContain(m.cost);
    }
    expect(within(list).queryByRole("button", { name: new RegExp(MANDATES_BY_ID.get(b)!.title) })).toBeNull();
    expect(within(list).getByText(STRINGS.ui.mandateSecondHint)).toBeTruthy();
  });

  it("lets go of a second that cannot stand beside a new first, and keeps one that can", () => {
    const [a, b] = INCOMPATIBLE[0]!;
    const other = MANDATES.find((m) => compatible(m.id, a) && compatible(m.id, b))!.id;
    render(<Picker />);
    pick(0, MANDATES_BY_ID.get(other)!.title);
    pick(1, MANDATES_BY_ID.get(b)!.title);
    expect(chosen).toEqual([other, b]);
    pick(0, MANDATES_BY_ID.get(a)!.title);
    expect(chosen).toEqual([a]);
    expect(pickers()[1]!.textContent).toContain(STRINGS.ui.mandateOnlyOne);
    pick(1, MANDATES_BY_ID.get(other)!.title);
    const next = MANDATES.find((m) => m.id !== a && m.id !== other && compatible(m.id, other))!.id;
    pick(0, MANDATES_BY_ID.get(next)!.title);
    expect(chosen).toEqual([next, other]);
    // Back to just the one.
    pick(1, STRINGS.ui.mandateOnlyOne);
    expect(chosen).toEqual([next]);
  });

  it("is a platform the run is taken on, in the catalog's order", () => {
    render(<App />);
    pick(0, MANDATES_BY_ID.get("m_loyal")!.title);
    pick(1, MANDATES_BY_ID.get("m_broad")!.title);
    fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.start }));
    expect(JSON.parse(localStorage.getItem("rod.run")!).state.mandates).toEqual(["m_broad", "m_loyal"]);
  });
});
