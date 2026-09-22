import type { Browser } from "playwright-core";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Band } from "../../src/engine/types";
import { WorldAfter } from "../../src/ui/WorldAfter";
import { MOTIFS, SLOT_X, WIDTH, type Motif, type Slot, type World } from "../../src/ui/world";
import { launch, PROBES, target } from "./harness";

/**
 * Slots are six units apart, so keeping every landmark within two of its own slot leaves at
 * least two units between any two neighbours, in any picture a run can compose.
 */
const TOLERANCE = 2;
const BANDS: Band[] = ["ascent", "muddle", "decay"];
const LEVELS = [0, 0.5, 1];

describe.skipIf(!target)("the world after, as drawn", () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await launch();
  });
  afterAll(async () => {
    await browser?.close();
  });

  it("stands every landmark inside the place it was given, in every place it may take", async () => {
    // Every landmark in every slot it may take, alone, in every direction and depth. A
    // composed picture is only ever these side by side, so this covers all of them.
    const cases = new Map<string, { motif: Motif; slot: Slot }>();
    for (const { motif, slots } of Object.values(MOTIFS)) {
      for (const slot of slots) for (const band of BANDS) for (const level of LEVELS) cases.set(`${motif}|${slot}|${band}|${level}`, { motif, slot });
    }
    const html = [...cases.keys()]
      .map((key) => {
        const [motif, slot, band, level] = key.split("|") as [Motif, Slot, Band, string];
        const world: World = { band, level: Number(level), align: "left", placed: [{ motif, slot, flag: "" }], buildings: [], flagged: [], description: "" };
        return `<div data-case="${key}" style="width:400px;height:240px">${renderToStaticMarkup(<WorldAfter world={world} title="" />)}</div>`;
      })
      .join("");

    const page = await browser.newPage();
    await page.setContent(`<!doctype html><body style="margin:0">${html}</body>`);
    await page.addScriptTag({ content: PROBES });
    const found = (await page.evaluate("window.__audit.landmarks()")) as {
      key: string;
      boxes: { motif: string; box: { left: number; right: number } | null }[];
    }[];
    await page.close();

    expect(found).toHaveLength(cases.size);
    const problems: string[] = [];
    for (const { key, boxes } of found) {
      const { motif, slot } = cases.get(key)!;
      const box = boxes.find((b) => b.motif === motif)?.box;
      if (!box) {
        problems.push(`${key}: nothing solid was drawn`);
        continue;
      }
      const span = `${box.left.toFixed(1)}..${box.right.toFixed(1)}`;
      if (box.left < 0 || box.right > WIDTH) problems.push(`${key}: ${span} runs off the picture`);
      const place = SLOT_X[slot];
      if (place && (box.left < place[0] - TOLERANCE || box.right > place[0] + place[1] + TOLERANCE)) {
        problems.push(`${key}: ${span} leaves its slot, ${place[0]}..${place[0] + place[1]}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
