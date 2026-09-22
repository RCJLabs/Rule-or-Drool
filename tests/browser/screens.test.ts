import type { Browser } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { STRINGS } from "../../src/content/strings";
import { MANDATES } from "../../src/engine/mandates";
import { clipped, close, codeFor, contrast, endRun, LATE, launch, lookOf, LOOKS, misfits, open, playToBoundary, SEED, startRun, target, toLook } from "./harness";

/**
 * The game as a player's browser draws it: every screen read for contrast in every look it
 * can wear, and the run checked for fit on the phones people have. These began as one-off
 * scripts, and each caught something no unit test could see — the last of them a primary
 * button whose white text sat on paper at 1.02:1.
 *
 * Every run starts from a run code, so the same cards are dealt every time and a failure
 * reproduces. Fit is therefore checked against the cards this seed deals, not the longest
 * card in the deck.
 */

const LONGEST_MANDATE = MANDATES.reduce((a, b) => (b.title.length > a.title.length ? b : a));

describe.skipIf(!target)("in a browser", () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await launch();
  });
  afterAll(async () => {
    await browser?.close();
  });

  describe("every text is readable", () => {
    it("on the menus of a new profile", async () => {
      const page = await open(browser);
      const failures = await contrast(page, "setup");
      await page.getByRole("button", { name: new RegExp(`^${STRINGS.ui.codex}`) }).click();
      await page.waitForSelector(".codex");
      failures.push(...(await contrast(page, "codex")));
      await page.getByRole("button", { name: STRINGS.ui.back }).click();
      await page.getByRole("button", { name: STRINGS.ui.settings, exact: true }).click();
      failures.push(...(await contrast(page, "settings")));
      await page.getByRole("button", { name: STRINGS.ui.howItWorks }).click();
      failures.push(...(await contrast(page, "how this works")));
      await close(page);
      expect(failures).toEqual([]);
    });

    for (const party of ["left", "right"] as const) {
      for (const readable of [false, true]) {
        it(`on a run for ${STRINGS.parties[party]}, plain screen ${readable ? "on" : "off"}, in all seven looks`, async () => {
          const page = await startRun(browser, party, { settings: { readable } });
          const failures: string[] = [];
          for (const look of LOOKS) {
            await toLook(page, look);
            failures.push(...(await contrast(page, look)));
          }
          await close(page);
          expect(failures).toEqual([]);
        });
      }
    }

    it("in the cabinet, rival and all, in each direction", async () => {
      const failures: string[] = [];
      for (const look of ["muddle", "decay3", "ascent3"]) {
        const page = await startRun(browser, "left");
        await toLook(page, look);
        await page.getByRole("button", { name: new RegExp(`^${STRINGS.cabinet.title}`) }).click();
        await page.waitForSelector(".cabinet-note.rival");
        failures.push(...(await contrast(page, `cabinet in ${look}`)));
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    it("at an era boundary, arriving in each direction", async () => {
      const failures: string[] = [];
      for (const [direction, lean] of [["muddle", null], ["decay", "["], ["ascent", "]"]] as const) {
        const page = await startRun(browser, "left");
        await playToBoundary(page, lean);
        failures.push(...(await contrast(page, `boundary leaning ${direction}, in ${await lookOf(page)}`)));
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    it("on the offer of a run someone sent, and on a link that is broken", async () => {
      const failures: string[] = [];
      const links = [
        ["a good link", codeFor(SEED, "left", LONGEST_MANDATE.id)],
        ["a broken link", "1.4svgv.L.crisis_meteor.-.-"],
      ] as const;
      for (const [label, code] of links) {
        const page = await open(browser, { width: 360, height: 640, query: `run=${code}` });
        await page.waitForSelector(".shared-run");
        failures.push(...(await contrast(page, label)));
        failures.push(...(await misfits(page, label, { mayScroll: true })));
        await close(page);
      }
      expect(failures).toEqual([]);
    });
  });

  describe("the end of a run", () => {
    for (const band of ["ascent", "decay", "muddle"] as const) {
      it(`reads, and fits a phone's width, after a run that went to ${band}`, async () => {
        const failures: string[] = [];
        for (const width of [390, 360]) {
          const page = await startRun(browser, "left", { width, height: 800 });
          await endRun(page, LATE[band]);
          failures.push(...(await contrast(page, `${band} at ${width}px`)));
          failures.push(...(await misfits(page, `${band} at ${width}px`, { mayScroll: true })));
          if (width === 390) {
            // The codex with something in it, which a new profile's codex never has.
            await page.getByRole("button", { name: STRINGS.ui.codex, exact: true }).click();
            await page.waitForSelector(".codex");
            failures.push(...(await contrast(page, `codex after a ${band} run`)));
          }
          await close(page);
        }
        expect(failures).toEqual([]);
      });
    }
  });

  describe("a run fits the screen", () => {
    const PHONES: [number, number, string][] = [
      [360, 640, "small Android"],
      [390, 844, "iPhone 14"],
      [412, 915, "Pixel"],
      [412, 732, "Samsung with the browser bars showing"],
      [360, 780, "Galaxy A"],
      [430, 932, "iPhone Pro Max"],
      [768, 1024, "tablet"],
    ];
    it.each(PHONES)("at %i×%i (%s), in each direction, without scrolling or cutting anything off", async (width, height) => {
      // The fullest footer a run has: the longest mandate's badge and a teaching note.
      const page = await startRun(browser, "left", { width, height, mandate: LONGEST_MANDATE.id });
      const failures: string[] = [];
      for (const look of ["muddle", "decay3", "ascent3"]) {
        await toLook(page, look);
        failures.push(...(await misfits(page, look)));
      }
      await close(page);
      expect(failures).toEqual([]);
    });

    it("at an era boundary on the short phones", async () => {
      const failures: string[] = [];
      for (const [width, height] of [[360, 640], [412, 732]] as const) {
        const page = await startRun(browser, "left", { width, height });
        await playToBoundary(page, null);
        const panel = (await page.evaluate("(() => { const j = document.querySelector('.era-jump'); return j.scrollHeight - j.clientHeight; })()")) as number;
        if (panel > 0) failures.push(`${width}×${height}: the era panel scrolls by ${panel}px`);
        failures.push(...(await misfits(page, `${width}×${height}`)));
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    /**
     * Meter names cut short with an ellipsis at 360px, as found when this audit was first
     * run (v0.40.0). A slot is 54px wide; the decay looks set the names in bold capitals and
     * the ascent looks space them out. In Roboto, which is what Android draws them in, the
     * worst is "Institutions" at 12px too long and four more miss by a pixel or less; in
     * DejaVu Sans, the font of the machine this was written on, all fifteen below do.
     * Shortening them is a writing and design decision, so they are listed rather than
     * fixed here. The list is a ceiling: a name cut short that is not on it fails, and one
     * that starts fitting does not, because text width depends on the fonts a machine has.
     * Take a fixed one off.
     */
    const SHORTENED: Record<string, string[]> = {
      muddle: ["Institutions"],
      decay1: ["Movement", "Institutions"],
      decay2: ["The Money", "Everyone", "Gov Stuff"],
      decay3: ["THE MONEY", "EVERYONE!!", "THE SYSTEM"],
      ascent1: ["Movement", "Institutions"],
      ascent2: ["Movement", "Institutions"],
      ascent3: ["Movement", "Institutions"],
    };
    it("cuts no meter name short at 360px beyond the known ones, for either party", async () => {
      const found: Record<string, Set<string>> = Object.fromEntries(LOOKS.map((look) => [look, new Set<string>()]));
      for (const party of ["left", "right"] as const) {
        const page = await startRun(browser, party, { width: 360, height: 780 });
        for (const look of LOOKS) {
          await toLook(page, look);
          for (const c of await clipped(page)) if (c.ellipsis) found[look]!.add(c.text);
        }
        await close(page);
      }
      const unexpected = LOOKS.flatMap((look) => [...found[look]!].filter((name) => !SHORTENED[look]?.includes(name)).map((name) => `${look}: "${name}" is cut short`));
      expect(unexpected).toEqual([]);
    });
  });
});
