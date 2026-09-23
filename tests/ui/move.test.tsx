// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STRINGS } from "../../src/content/strings";
import { emptyMeta, saveMeta } from "../../src/meta";
import { App } from "../../src/ui/App";
import { progressCode, progressJson } from "../../src/ui/progress";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { META_SAVE_VERSION, SETTINGS_VERSION } from "../../src/version";
import { playedProfile } from "./profile";

const m = STRINGS.move;
const veteran = playedProfile(12);
const storedRuns = () => JSON.parse(localStorage.getItem("rod.meta") ?? "{}").runs ?? 0;

function openMove() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: STRINGS.ui.settings }));
  fireEvent.click(screen.getByRole("button", { name: m.open }));
  return screen.getByRole("dialog", { name: m.title });
}

/** Paste, read, and wait for the answer: decompressing a code is a stream, and takes a turn. */
async function bring(dialog: HTMLElement, text: string) {
  fireEvent.change(within(dialog).getByRole("textbox", { name: m.pasteLabel }), { target: { value: text } });
  await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: m.read })));
  await waitFor(() => expect(within(dialog).queryByRole("table") ?? within(dialog).queryByRole("alert")).toBeTruthy());
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Settings › Move my progress", () => {
  it("copies this profile as a code, and shows the code for copying by hand", async () => {
    saveMeta(veteran);
    const writeText = vi.fn(async (_: string) => {});
    Object.assign(navigator, { clipboard: { writeText } });
    const dialog = openMove();
    await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: m.copyCode })));
    const shown = ((await within(dialog).findByRole("textbox", { name: m.codeLabel })) as HTMLTextAreaElement).value;
    expect(shown.startsWith("RD1.")).toBe(true);
    expect(writeText).toHaveBeenCalledWith(shown);
    expect(await within(dialog).findByText(m.copied)).toBeTruthy();
  });

  it("shows what is here beside what is coming, and replaces nothing until asked", async () => {
    saveMeta(playedProfile(2));
    const code = await progressCode(veteran, { ...DEFAULT_SETTINGS, reduceMotion: true });
    const dialog = openMove();
    await bring(dialog, code);
    const rows = within(dialog).getAllByRole("row").map((r) => r.textContent);
    expect(rows).toContain(`${m.runs}212`);
    expect(within(dialog).getByText(m.replaces)).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: m.keep }));
    expect(storedRuns()).toBe(2);

    await bring(dialog, code);
    fireEvent.click(within(dialog).getByRole("button", { name: m.replace }));
    expect(storedRuns()).toBe(12);
    expect(within(dialog).getByText(m.done)).toBeTruthy();
    // The settings came too, and are in force at once.
    expect(document.documentElement.hasAttribute("data-reduce-motion")).toBe(true);
  });

  it("warns when what is coming has fewer runs than what is here", async () => {
    saveMeta(veteran);
    const dialog = openMove();
    await bring(dialog, await progressCode(emptyMeta(), DEFAULT_SETTINGS));
    expect(within(dialog).getByText(m.fewer)).toBeTruthy();
  });

  it("refuses progress from a newer version with a message, and changes nothing", async () => {
    saveMeta(playedProfile(2));
    const e = JSON.parse(progressJson(veteran, DEFAULT_SETTINGS));
    e.meta.v = META_SAVE_VERSION + 1;
    e.settings.v = SETTINGS_VERSION;
    e.game = "0.99.0";
    const dialog = openMove();
    await bring(dialog, JSON.stringify(e));
    expect(within(dialog).getByRole("alert").textContent).toBe(m.newer.replace("{version}", "0.99.0"));
    expect(within(dialog).queryByRole("button", { name: m.replace })).toBeNull();
    expect(storedRuns()).toBe(2);
  });

  it("reads a saved file", async () => {
    const dialog = openMove();
    const input = dialog.querySelector<HTMLInputElement>("input[type=file]")!;
    const file = new File([progressJson(veteran, DEFAULT_SETTINGS)], "rule-or-drool-progress.txt", { type: "text/plain" });
    await act(async () => fireEvent.change(input, { target: { files: [file] } }));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: m.replace })).toBeTruthy());
  });

  it("opens from a link with the code in it, and forgets the link once answered", async () => {
    const code = await progressCode(veteran, DEFAULT_SETTINGS);
    window.history.replaceState({}, "", `/#progress=${code}`);
    render(<App />);
    const dialog = screen.getByRole("dialog", { name: m.title });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: m.replace })).toBeTruthy());
    expect(storedRuns()).toBe(0);
    fireEvent.click(within(dialog).getByRole("button", { name: STRINGS.ui.close }));
    expect(screen.queryByRole("dialog", { name: m.title })).toBeNull();
    expect(window.location.hash).toBe("");
  });
});
