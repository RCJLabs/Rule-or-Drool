import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Browser, Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { STRINGS } from "../../src/content/strings";
import { parseRecord } from "../../src/playtest/parse";
import { choose, close, codeFor, contrast, launch, misfits, open, SEED, startRun, target } from "./harness";

/**
 * The playtest record in the built game (BACKLOG-5 phase 31), end to end: a run played with
 * the record on, sent from the settings, read back and reported by the same command the
 * owner runs on what testers send. This machine's Chromium has no share sheet, so sending
 * saves the file, which is the path a desktop browser takes.
 */

const recordKeys = (page: Page) => page.evaluate("Object.keys(localStorage).filter((k) => k.startsWith('rod.playtest'))") as Promise<string[]>;

/** Play the run out the way a keyboard player would, through each era, to its end. */
async function playOut(page: Page): Promise<void> {
  for (let i = 0; i < 400; i++) {
    if (await page.locator(".history-title").count()) return;
    if (await page.locator(".era-jump").count()) {
      await page.getByRole("button", { name: STRINGS.ui.continueEra }).click();
      await page.waitForSelector(".card");
      continue;
    }
    await choose(page, i % 3 === 0 ? "left" : "right");
  }
  throw new Error("four hundred cards and the run never ended");
}

describe.skipIf(!target)("the playtest record, in a browser", () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await launch();
  });
  afterAll(async () => {
    await browser?.close();
  });

  it("keeps nothing for a player who has not turned it on", async () => {
    const page = await startRun(browser, "left");
    for (let i = 0; i < 4; i++) await choose(page, i % 2 ? "left" : "right");
    expect(await recordKeys(page)).toEqual([]);
    await page.getByRole("button", { name: STRINGS.ui.settings, exact: true }).click();
    expect(await page.getByRole("checkbox", { name: new RegExp(STRINGS.playtest.title) }).isChecked()).toBe(false);
    expect(await page.getByRole("button", { name: STRINGS.playtest.send }).count()).toBe(0);
    await close(page);
  });

  it("records a run, sends it as a file, and the file reads back and reports", async () => {
    const page = await startRun(browser, "left", { settings: { keepRecord: true } });
    await playOut(page);
    await page.getByRole("button", { name: STRINGS.ui.settings, exact: true }).click();
    await page.getByText(STRINGS.playtest.countOne).waitFor();
    // The record's lines in the menu are held to the same contrast as everything else.
    expect(await contrast(page, "settings with a record")).toEqual([]);

    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: STRINGS.playtest.send }).click()]);
    await page.getByText(STRINGS.playtest.saved).waitFor();
    expect(download.suggestedFilename()).toBe("rule-or-drool-record.txt");
    const dir = mkdtempSync(join(tmpdir(), "playtests-"));
    try {
      const path = join(dir, download.suggestedFilename());
      await download.saveAs(path);
      const parsed = parseRecord(readFileSync(path, "utf8"));
      if (!parsed.ok) throw new Error(parsed.errors.join("\n"));
      const [run, ...more] = parsed.file.runs;
      expect(more).toEqual([]);
      expect(run).toMatchObject({ kind: "shared", code: codeFor(SEED, "left"), run: 1 });
      expect(run!.end).not.toBeNull();
      expect(run!.cards).toHaveLength(run!.end!.cards);
      // Every card was on screen for a while, and the keyboard peek before each choice is a
      // look at the side taken, so the chosen side's preview was up on nearly every one.
      expect(run!.cards.every((c) => c.ms > 0)).toBe(true);
      const lookedAtTaken = run!.cards.filter((c) => c.looked[c.side === "left" ? 0 : 1] > 0).length;
      expect(lookedAtTaken / run!.cards.length).toBeGreaterThan(0.9);

      const report = spawnSync(process.execPath, ["--import", "tsx", "scripts/playtests.ts", dir], { encoding: "utf8" });
      expect(report.stderr).toBe("");
      expect(report.status).toBe(0);
      expect(report.stdout).toContain("1 file, 1 player, 1 run (1 shared)");
      expect(report.stdout).toMatch(/^people\s+1\s/m);
      expect(report.stdout).toMatch(/^mixed bot\s+1\s/m);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    await close(page);
  });

  it("fits the settings with a record in them on a small phone", async () => {
    const page = await open(browser, { width: 360, height: 640, settings: { keepRecord: true } });
    await page.evaluate(`localStorage.setItem("rod.playtest", JSON.stringify({ format: "rule-or-drool-playtest", v: 1, meters: [], runs: Array.from({ length: 12 }, (_, i) => ({ run: i + 1, cards: [] })) }))`);
    await page.reload();
    await page.getByRole("button", { name: STRINGS.ui.settings, exact: true }).click();
    await page.getByText(STRINGS.playtest.count.replace("{n}", "12")).waitFor();
    expect(await misfits(page, "settings with a record", { mayScroll: true })).toEqual([]);
    expect(await contrast(page, "settings with a record, 360px")).toEqual([]);
    await close(page);
  });
});
