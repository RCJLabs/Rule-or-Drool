import type { Browser } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { STRINGS } from "../../src/content/strings";
import { choose, close, contrast, launch, misfits, playOut, startRun, target } from "./harness";

/**
 * The other road in the built game (BACKLOG-5 phase 34): a run played to its end, gone back
 * into from its end screen, left and resumed, played out again, and the two roads shown side
 * by side on the smallest phone.
 */
describe.skipIf(!target)("the other road, in a browser", () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await launch();
  });
  afterAll(async () => {
    await browser?.close();
  });

  it("goes back into a finished run, survives a reload, and ends showing both roads", async () => {
    const page = await startRun(browser, "left", { width: 360, height: 640 });
    await playOut(page);
    const firstTitle = await page.locator(".history-title").textContent();
    const back = page.locator(".road-back").first();
    expect(await back.textContent()).toMatch(/^Choose “.+” instead$/);
    await back.click();

    // The other road's first card says where it left the first. (This seed's other side does
    // not end the run on the spot; if content ever makes it, this fails rather than skipping.)
    await page.waitForSelector(".card, .era-jump");
    if (await page.locator(".era-jump").count()) {
      await page.getByRole("button", { name: STRINGS.ui.continueEra }).click();
      await page.waitForSelector(".card");
    }
    expect(await page.locator(".road-note").textContent()).toMatch(/^The other road: at card \d+ you chose “.+” this time\.$/);
    await choose(page, "right");

    // Left and come back to: the save holds the first road inside the second.
    await page.reload();
    await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
    await page.waitForSelector(".card, .era-jump");
    expect(await page.locator(".road-mark").count()).toBe(1);
    await playOut(page);

    const captions = await page.locator(".road-caption").allTextContents();
    expect(captions).toHaveLength(2);
    expect(captions[0]).toBe(`${STRINGS.road.first} ${firstTitle}`);
    expect(await page.locator(".roads .world-frame svg").count()).toBe(2);
    expect(await page.locator(".road-back").count()).toBe(0);
    expect(await contrast(page, "two roads")).toEqual([]);
    expect(await misfits(page, "two roads", { mayScroll: true })).toEqual([]);
    if (process.env.ROAD_SHOT) await page.screenshot({ path: process.env.ROAD_SHOT, fullPage: false });
    await close(page);
  });
});
