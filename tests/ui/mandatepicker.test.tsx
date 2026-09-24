// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STRINGS } from "../../src/content/strings";
import { MANDATES } from "../../src/engine/mandates";
import { App } from "../../src/ui/App";
import { MandatePicker } from "../../src/ui/MandatePicker";

/**
 * Your promise, as an inline drop-down: the one chosen, and the others only when it is
 * opened, each with what it costs, so the menu is not five cards long on a phone.
 */

function Picker() {
  const [value, setValue] = useState<string | null>(null);
  return <MandatePicker value={value} onChange={setValue} />;
}

const current = () => document.querySelector(".mandate-current")!;

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
    expect(JSON.parse(localStorage.getItem("rod.run")!).state.mandate).toBe(m.id);
  });
});
