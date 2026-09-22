import type { Browser, Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { MANDATES } from "../../src/engine/mandates";
import { rollSetup } from "../../src/engine/state";
import { METER_KEYS, type PlayerAlign } from "../../src/engine/types";
import { encodeRunCode } from "../../src/meta";
import { choose, clipped, close, contrast, launch, lookOf, LOOKS, misfits, open, target, toLook, type OpenOptions } from "./harness";

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

const SEED = 8065615;
const LONGEST_MANDATE = MANDATES.reduce((a, b) => (b.title.length > a.title.length ? b : a));
const { eraLength, eraCount } = library.config;

const codeFor = (align: PlayerAlign, mandate: string | null = null) =>
  encodeRunCode({ seed: SEED, align, modifiers: rollSetup(library, SEED, align, []).modifiers ?? [], unlocked: [], mandate });

/** A new player's run, started the way a shared link starts one. */
async function startRun(browser: Browser, align: PlayerAlign, opts: OpenOptions & { mandate?: string } = {}): Promise<Page> {
  const page = await open(browser, { ...opts, query: `run=${codeFor(align, opts.mandate ?? null)}` });
  await page.getByRole("button", { name: STRINGS.share.offerPlay }).click();
  await page.waitForSelector(".card");
  return page;
}

/** Play until the first era ends, leaning the run toward a direction on the way. */
async function playToBoundary(page: Page, lean: "[" | "]" | null): Promise<void> {
  for (let i = 0; i < eraLength * eraCount; i++) {
    if (await page.locator(".era-jump").count()) return;
    if (!(await page.locator(".card").count())) throw new Error(`the run ended at card ${i}, before its first era did`);
    await choose(page, i % 3 === 0 ? "left" : "right");
    if (lean && i % 2 === 0) await page.keyboard.press(lean);
  }
  throw new Error("a whole run's worth of cards and no era boundary");
}

/**
 * The end of a run in a given direction, without playing 105 cards to get there: play a few
 * so there is a save, rewrite it to the last card of the last era carrying these decisions,
 * and play that card.
 */
interface Late {
  drift: number;
  flags: string[];
  since: Record<string, number>;
}
const LATE: Record<"ascent" | "decay" | "muddle", Late> = {
  ascent: {
    drift: 58,
    flags: ["ring_started", "housing_built", "seawall", "cheated_election", "habit_skim"],
    since: { housing_built: 18, seawall: 44, ring_started: 81, cheated_election: 25, habit_skim: 9 },
  },
  decay: {
    drift: -58,
    flags: ["elections_abolished", "general_unleashed", "feed_captured", "water_rationed", "took_the_skim", "habit_skim"],
    since: { took_the_skim: 7, feed_captured: 31, general_unleashed: 52, elections_abolished: 77, water_rationed: 90, habit_skim: 12 },
  },
  muddle: {
    drift: 4,
    flags: ["schools_starved", "media_captured", "cheated_election", "habit_bend", "habit_skim"],
    since: { habit_skim: 5, schools_starved: 23, media_captured: 60, cheated_election: 25, habit_bend: 33 },
  },
};

async function endRun(page: Page, late: Late): Promise<void> {
  for (let i = 0; i < 4; i++) await choose(page, "right");
  const patch = {
    cardCount: eraLength * eraCount - 1,
    era: eraCount,
    drift: late.drift,
    meters: Object.fromEntries(METER_KEYS.map((k) => [k, 55])),
  };
  await page.evaluate(`(() => {
    const raw = JSON.parse(localStorage.getItem("rod.run"));
    Object.assign(raw.state, ${JSON.stringify(patch)});
    raw.state.flags = [...new Set([...raw.state.flags, ...${JSON.stringify(late.flags)}])];
    raw.state.flagSince = { ...raw.state.flagSince, ...${JSON.stringify(late.since)} };
    raw.state.stats = { ...raw.state.stats, electionsHonest: 1, electionsCheated: 2 };
    localStorage.setItem("rod.run", JSON.stringify(raw));
  })()`);
  await page.reload();
  await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
  await page.waitForSelector(".card");
  await choose(page, "right");
  await page.waitForSelector(".history-title");
}

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
        ["a good link", codeFor("left", LONGEST_MANDATE.id)],
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
     * Meter names that do not fit their slot at 360px and are cut short with an ellipsis,
     * as found when this audit was first run (v0.40.0). The decay looks set the names in
     * bold capitals and the ascent looks space them out, and a slot is 54px wide: at the
     * worst, "Institutions" in capitals needs 78. Shortening them is a writing and design
     * decision, so they are listed rather than fixed here. The list is a ceiling: a name cut
     * short that is not on it fails. One that starts fitting does not, because text width
     * depends on the fonts a machine has, so take it off the list when it is fixed.
     */
    const SHORTENED: Record<string, string[]> = {
      muddle: [],
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
