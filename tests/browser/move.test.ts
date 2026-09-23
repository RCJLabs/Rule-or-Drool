import type { Browser, Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { STRINGS } from "../../src/content/strings";
import { playedProfile } from "../ui/profile";
import { close, contrast, launch, misfits, open, target } from "./harness";

/**
 * Moving progress between two addresses (BACKLOG-5 phase 33), as two browser profiles that
 * share nothing: a forty-run profile copied out of one and brought into the other has to
 * arrive exactly as it left.
 */

const m = STRINGS.move;
const veteran = playedProfile(40);
const storedMeta = (page: Page) => page.evaluate(`JSON.parse(localStorage.getItem("rod.meta"))`);

async function openMove(page: Page): Promise<void> {
  await page.getByRole("button", { name: STRINGS.ui.settings, exact: true }).click();
  await page.getByRole("button", { name: m.open }).click();
  await page.getByRole("dialog", { name: m.title }).waitFor();
}

describe.skipIf(!target)("moving progress, in a browser", () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await launch();
  });
  afterAll(async () => {
    await browser?.close();
  });

  it("carries a forty-run profile from one address to another exactly", async () => {
    const from = await open(browser);
    await from.evaluate(`localStorage.setItem("rod.meta", ${JSON.stringify(JSON.stringify(veteran))})`);
    await from.reload();
    await openMove(from);
    await from.getByRole("button", { name: m.copyCode }).click();
    const code = await from.getByRole("textbox", { name: m.codeLabel }).inputValue();
    expect(code.startsWith("RD1.")).toBe(true);
    await close(from);

    // A phone, and a profile that has played two runs of its own.
    const to = await open(browser, { width: 360, height: 640 });
    await openMove(to);
    await to.getByRole("textbox", { name: m.pasteLabel }).fill(code);
    await to.getByRole("button", { name: m.read }).click();
    await to.getByRole("button", { name: m.replace }).waitFor();
    // Asking first is a screen of its own, and it has to read and fit like the others.
    expect(await contrast(to, "moving progress")).toEqual([]);
    expect(await misfits(to, "moving progress", { mayScroll: true })).toEqual([]);
    expect(await to.getByRole("row", { name: new RegExp(`^${m.runs}`) }).textContent()).toBe(`${m.runs}040`);

    await to.getByRole("button", { name: m.replace }).click();
    await to.getByText(m.done).waitFor();
    await to.reload();
    expect(await storedMeta(to)).toEqual(veteran);
    await close(to);
  });

  it("takes the same code in a link", async () => {
    const from = await open(browser);
    await from.evaluate(`localStorage.setItem("rod.meta", ${JSON.stringify(JSON.stringify(veteran))})`);
    await from.reload();
    await openMove(from);
    await from.getByRole("button", { name: m.copyCode }).click();
    const code = await from.getByRole("textbox", { name: m.codeLabel }).inputValue();
    const url = new URL(from.url());
    await close(from);

    const to = await open(browser);
    await to.goto(`${url.origin}${url.pathname}?debug=1#progress=${code}`);
    await to.getByRole("button", { name: m.replace }).click();
    await to.getByText(m.done).waitFor();
    await to.getByRole("button", { name: STRINGS.ui.close }).click();
    expect(new URL(to.url()).hash).toBe("");
    expect(await storedMeta(to)).toEqual(veteran);
    await close(to);
  });
});
