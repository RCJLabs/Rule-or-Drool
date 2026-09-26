import { readFileSync } from "node:fs";
import type { Browser, Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { deckStamp } from "../../src/engine/deck";
import { MANDATES, compatible } from "../../src/engine/mandates";
import { advisorPool, rollSetup } from "../../src/engine/state";
import { encodeRunResult, resultOf } from "../../src/meta/challenge";
import { decodeRunCode, encodeRunCode } from "../../src/meta/runcode";
import { draw } from "../../src/engine/draw";
import { resolve } from "../../src/engine/resolve";
import { newRun } from "../../src/engine/state";
import { BLOC_KEYS, type Card, type PlayerAlign } from "../../src/engine/types";
import { causeLine, endCause } from "../../src/ui/cause";
import { setupOf } from "../../src/meta/runcode";
import { endingSides, withinReach } from "../../src/meta/clues";
import { ALL_HISTORY_KEYS, HISTORIES, HISTORY_ORDER, historyTitle, toldByEnding } from "../../src/meta/histories";
import { collectsEnding } from "../../src/meta/objectives";
import { inheritable } from "../../src/meta/dynasty";
import { LEGACIES } from "../../src/meta/legacies";
import { emptyMeta } from "../../src/meta/state";
import { fitPlacements, longestSeats, shownText } from "../fit";
import { choose, clipped, close, codeFor, contrast, endRun, LATE, launch, lookOf, LOOKS, misfits, open, overCard, playFrom, playToBoundary, rewriteRun, SEED, startRun, startRunAt, target, toLook } from "./harness";

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
/**
 * The fullest header a run has: a platform of two, sharing a line by their short names, so the
 * widest pair of those (BACKLOG-10 phase 62).
 */
const LONGEST_SHORT = MANDATES.reduce((a, b) => (b.short.length > a.short.length ? b : a));
const FULLEST_PLATFORM = [LONGEST_SHORT.id, MANDATES.filter((m) => compatible(LONGEST_SHORT.id, m.id)).reduce((a, b) => (b.short.length > a.short.length ? b : a)).id];

/**
 * The codex read for contrast section by section. It is an index that opens one section at a
 * time, so each is opened in turn: the index alone would leave every list unread.
 */
async function codexContrast(page: Page, label: string): Promise<string[]> {
  const failures = await contrast(page, `${label}, index`);
  const rows = page.locator(".codex-row");
  for (let i = 0; i < (await rows.count()); i++) {
    const name = (await rows.nth(i).locator(".codex-row-title").textContent()) ?? String(i);
    await rows.nth(i).click();
    await page.waitForSelector(".codex-panel");
    failures.push(...(await contrast(page, `${label}, ${name}`)));
  }
  return failures;
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
      // The footer names the deck, the one src/content/deck.json holds (BACKLOG-8 phase 49).
      expect(await page.locator("footer.version").textContent()).toContain(STRINGS.ui.deck.replace("{stamp}", deckStamp(library)));
      const failures = await contrast(page, "setup");
      // Your promise is a drop-down: the other promises, and what they cost, only once opened.
      await page.locator(".mandate-current").click();
      await page.waitForSelector(".mandate-list");
      failures.push(...(await contrast(page, "setup, with the promises open")));
      await page.getByRole("button", { name: new RegExp(`^${STRINGS.ui.codex}`) }).click();
      await page.waitForSelector(".codex");
      failures.push(...(await codexContrast(page, "codex")));
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
          // The choice buttons drawn, so they are read in every look as well.
          const page = await startRun(browser, party, { settings: { readable, showChoices: !readable } });
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

    it("on the menu, with a saved run from another deck and with one this version cannot go on with", async () => {
      const page = await startRun(browser, "left", { width: 360, height: 640 });
      const failures: string[] = [];
      for (const [label, change] of [
        ["another deck", `raw.state.deck = "zzzzzzzz";`],
        ["a card this version lacks", `raw.state.current = "card_from_a_later_version";`],
      ] as const) {
        await rewriteRun(page, change);
        await page.reload();
        await page.waitForSelector(".saved-note");
        failures.push(...(await contrast(page, label)));
        failures.push(...(await misfits(page, label, { mayScroll: true })));
      }
      await close(page);
      expect(failures).toEqual([]);
    });

    it("on the promise drop-down, open, on the smallest phone", async () => {
      const page = await open(browser, { width: 360, height: 640 });
      await page.locator(".mandate-current").click();
      await page.waitForSelector(".mandate-list");
      // The menu scrolls on a phone this small, open or shut; nothing may run off the side.
      const failures = [...(await contrast(page, "promises open, 360×640")), ...(await misfits(page, "promises open, 360×640", { mayScroll: true }))];
      await close(page);
      expect(failures).toEqual([]);
    });

    // Nothing lost without a word (BACKLOG-8 phase 50): what the player is told when a save
    // fails or a profile cannot be read, and the screen a broken run leaves, on the smallest
    // phone.
    it("on a profile set aside, in Move my progress, and on a save that fails mid-run", async () => {
      const page = await startRun(browser, "left", { width: 360, height: 640 });
      const failures: string[] = [];
      await page.evaluate(`localStorage.setItem("rod.meta", "{not json")`);
      await page.reload();
      await page.waitForSelector(".notice");
      failures.push(...(await contrast(page, "a profile set aside")));
      // Over the menu, which scrolls on a phone this small whatever is over it.
      failures.push(...(await misfits(page, "a profile set aside", { mayScroll: true })));
      await page.getByRole("button", { name: STRINGS.move.open }).click();
      await page.waitForSelector(".move-asides");
      failures.push(...(await contrast(page, "Move my progress, with a profile set aside")));
      failures.push(...(await misfits(page, "Move my progress, with a profile set aside", { mayScroll: true })));
      await page.getByRole("button", { name: STRINGS.ui.close }).click();
      await page.getByRole("button", { name: new RegExp(STRINGS.ui.continueRun) }).click();
      await page.waitForSelector(".card");
      // Storage that takes nothing more: the next card's save fails, and the run says so.
      await page.evaluate(`Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); }`);
      await choose(page, "right");
      await page.waitForSelector(".notice");
      failures.push(...(await contrast(page, "a save that failed mid-run")));
      failures.push(...(await misfits(page, "a save that failed mid-run")));
      await close(page);
      expect(failures).toEqual([]);
    });

    it("on the screen a broken saved run leaves, which lets the run go", async () => {
      const page = await startRun(browser, "left", { width: 360, height: 640 });
      await rewriteRun(page, `raw.state.activeArcs = null;`);
      await page.reload();
      await page.waitForSelector(".crash");
      const failures = [...(await contrast(page, "the error screen")), ...(await misfits(page, "the error screen"))];
      await page.getByRole("button", { name: STRINGS.crash.leave }).click();
      await page.waitForSelector(".frame");
      expect(await page.getByRole("button", { name: new RegExp(STRINGS.ui.continueRun) }).count()).toBe(0);
      await close(page);
      expect(failures).toEqual([]);
    });

    it("on the offer of a run someone sent, and on a link that is broken", async () => {
      const failures: string[] = [];
      const links = [
        ["a good link", codeFor(SEED, "left", FULLEST_PLATFORM)],
        // The longest of the offer's three sentences (BACKLOG-8 phase 49).
        ["a link from another deck", `${codeFor(SEED, "left", FULLEST_PLATFORM)}&deck=zzzzzzzz`],
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

  /**
   * Their run and yours (BACKLOG-5 phase 37): a link that says how the sender's run went,
   * offered, played and ended in each direction, with both worlds drawn on the smallest phone.
   * Their run is played here, to its end, from the same code the link carries.
   */
  describe("their run and yours", () => {
    it("offers a run with how it went, and ends with both, readable at 360px in each direction", async () => {
      const code = codeFor(SEED, "left");
      const decoded = decodeRunCode(library, code);
      if (!decoded.ok) throw new Error("the audit's own code does not decode");
      let theirs = draw(library, newRun(library, SEED, setupOf(decoded.code)));
      for (let i = 0; !theirs.over && i < 400; i++) theirs = draw(library, resolve(library, theirs, theirs.current!, i % 3 ? "right" : "left"));
      const vs = encodeRunResult(resultOf(library, theirs)!);
      const failures: string[] = [];
      for (const band of ["ascent", "decay", "muddle"] as const) {
        const page = await open(browser, { width: 360, height: 640, query: `run=${code}&vs=${vs}` });
        if (band === "ascent") {
          await page.getByText(/^They left /).waitFor();
          failures.push(...(await contrast(page, "the offer of their run")));
          failures.push(...(await misfits(page, "the offer of their run", { mayScroll: true })));
        }
        await page.getByRole("button", { name: STRINGS.share.offerPlay }).click();
        await page.waitForSelector(".card");
        // Ending the run reloads the page in the middle of it, so the comparison has to have
        // been saved with the run to be there at the end.
        await endRun(page, LATE[band]);
        const drawn = await page.locator(".roads .world-frame svg").count();
        if (drawn !== 2) failures.push(`${band}: ${drawn} worlds drawn, not theirs beside yours`);
        if (!(await page.isVisible(".versus-table"))) failures.push(`${band}: no comparison`);
        failures.push(...(await contrast(page, `their run and yours, ending ${band}`)));
        failures.push(...(await misfits(page, `their run and yours, ending ${band}`, { mayScroll: true })));
        await close(page);
      }
      expect(failures).toEqual([]);
    });
  });

  /**
   * The long reign (BACKLOG-5 phase 39): offered on the menu once a finale has opened it, told
   * at its fourth era that the direction is set, and ended five centuries on, in each direction.
   */
  describe("the long reign", () => {
    it("is chosen on the menu, locks at its fourth era and ends five centuries on, readable at 360px in each direction", async () => {
      const { eraLength, eraCount, longEraCount, longFinalePrefix } = library.config;
      const meta = { ...emptyMeta(), runs: 1, endings: { finale_muddle: 1 }, objectives: { obj_first_run: 1, obj_finale: 1 } };
      const failures: string[] = [];
      for (const band of ["ascent", "decay", "muddle"] as const) {
        const page = await open(browser, { width: 360, height: 640 });
        await page.evaluate(`localStorage.setItem("rod.meta", ${JSON.stringify(JSON.stringify(meta))})`);
        await page.reload();
        await page.getByRole("button", { name: new RegExp(`^${STRINGS.reign.long}`) }).click();
        if (band === "ascent") {
          failures.push(...(await contrast(page, "the menu with the long reign chosen")));
          failures.push(...(await misfits(page, "the menu with the long reign chosen", { mayScroll: true })));
        }
        await page.getByLabel(STRINGS.ui.seed).fill(String(SEED));
        await page.getByRole("button", { name: STRINGS.ui.start, exact: true }).click();
        await page.waitForSelector(".card");
        // The last card of the third era, then the jump into the fourth, where the band locks.
        await playFrom(page, LATE[band], { cardCount: eraLength * eraCount - 1, era: eraCount });
        await page.waitForSelector(".era-jump");
        if (!(await page.isVisible(".era-locked"))) failures.push(`${band}: the fourth era does not say the direction is set`);
        failures.push(...(await contrast(page, `the jump to two centuries on, in ${band}`)));
        failures.push(...(await misfits(page, `the jump to two centuries on, in ${band}`, { mayScroll: true })));
        await page.getByRole("button", { name: STRINGS.ui.continueEra }).click();
        await page.waitForSelector(".card");
        // Then the last card of the fifth, and its finale.
        await playFrom(page, LATE[band], { cardCount: eraLength * longEraCount - 1, era: longEraCount, band });
        await page.waitForSelector(".history-title");
        const finale = library.endings.get(`${longFinalePrefix}${band}`)!.title;
        if (!(await page.getByText(finale).first().isVisible())) failures.push(`${band}: did not end in ${finale}`);
        failures.push(...(await contrast(page, `the long reign's end in ${band}`)));
        failures.push(...(await misfits(page, `the long reign's end in ${band}`, { mayScroll: true })));
        await close(page);
      }
      expect(failures).toEqual([]);
    });
  });

  /**
   * The questions (BACKLOG-6 phase 40). A question's card carries a title, and so does every
   * step after it: one more line on the card. So the longest card each side can be asked is
   * read in all seven looks on the smallest phone.
   */
  describe("a question", () => {
    it("is titled, and fits and reads in all seven looks at 360px, for each side", async () => {
      const failures: string[] = [];
      for (const party of ["left", "right"] as const) {
        const steps = library.content.arcs
          .filter((a) => a.question && (a.align === party || a.align === "any"))
          .flatMap((a) => a.cards.map((id) => ({ arc: a.id, id, length: library.cards.get(id)!.text.length })));
        const longest = steps.sort((x, y) => y.length - x.length)[0]!;
        const page = await startRun(browser, party, { width: 360, height: 640 });
        for (let i = 0; i < 3; i++) await choose(page, "right");
        // Put that card on the table, as the step of its question it is, and take the run up again.
        await rewriteRun(
          page,
          `raw.state.current = ${JSON.stringify(longest.id)};
          raw.state.currentFrom = "arc";
          raw.state.activeArcs = [...raw.state.activeArcs, { id: ${JSON.stringify(longest.arc)}, nextCard: ${JSON.stringify(longest.id)} }];`,
        );
        await page.reload();
        await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
        await page.waitForSelector(".question-title");
        for (const look of LOOKS) {
          await toLook(page, look);
          failures.push(...(await contrast(page, `${party}'s longest question card in ${look}`)));
          failures.push(...(await misfits(page, `${party}'s longest question card in ${look}`)));
        }
        await close(page);
      }
      expect(failures).toEqual([]);
    });
  });

  /**
   * The month of dailies (BACKLOG-5 phase 38). It is drawn at the end of a daily in whatever
   * look the run ended in, so it is read in each of the seven. The clock is fixed, because
   * the daily is dealt from the date. Ending a run reloads the page in the middle of it, so
   * each of these is also a daily left and taken up again, which must still count as one.
   */
  describe("the daily, day by day", () => {
    const AT = "2026-09-23T12:00:00Z";
    // The drift a run ends on, and whose decisions it carries. Decay's own decisions take
    // another 16 off at the finale, which would carry the first two decay looks past theirs.
    const ENDS: [look: string, drift: number, way: "ascent" | "decay" | "muddle"][] = [
      ["muddle", 0, "muddle"],
      ["decay1", -13, "muddle"],
      ["decay2", -26, "muddle"],
      ["decay3", -58, "decay"],
      ["ascent1", 13, "ascent"],
      ["ascent2", 27, "ascent"],
      ["ascent3", 58, "ascent"],
    ];

    it("reads its month at the end of a daily, in all seven looks, on the smallest phone", async () => {
      const failures: string[] = [];
      for (const [look, drift, way] of ENDS) {
        const page = await open(browser, { width: 360, height: 640, at: AT });
        await page.getByRole("button", { name: "Daily #3", exact: true }).click();
        await page.waitForSelector(".card");
        await endRun(page, { ...LATE[way], drift });
        if ((await lookOf(page)) !== look) failures.push(`meant to end in ${look}, ended in ${await lookOf(page)}`);
        if (!(await page.isVisible(".daily-month"))) failures.push(`${look}: the daily was not counted, so its month is not shown`);
        failures.push(...(await contrast(page, `the daily's end in ${look}`)));
        failures.push(...(await misfits(page, `the daily's end in ${look}`, { mayScroll: true })));
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    it("reads on the menu and in the codex with a month in it, plain screen on and off", async () => {
      // Three weeks in: the first three dailies, then an October with days missed, a streak
      // running and today's still to play.
      const day = (d: string, ending = "riots") => ({ day: d, history: "habit_skim:decay:left", ending, cards: 61 });
      const dailies = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-10-01", "2026-10-02", "2026-10-04", "2026-10-12", "2026-10-13"];
      const meta = { ...emptyMeta(), runs: 8, dailies: dailies.map((d, i) => day(d, ["riots", "finale_muddle", "abandoned_backers"][i % 3])) };
      const failures: string[] = [];
      for (const readable of [false, true]) {
        const page = await open(browser, { width: 360, height: 640, at: "2026-10-14T12:00:00Z", settings: { readable } });
        await page.evaluate(`localStorage.setItem("rod.meta", ${JSON.stringify(JSON.stringify(meta))})`);
        await page.reload();
        await page.waitForSelector(".menu-streak");
        const label = `plain screen ${readable ? "on" : "off"}`;
        failures.push(...(await contrast(page, `menu, ${label}`)));
        failures.push(...(await misfits(page, `menu, ${label}`, { mayScroll: true })));
        await page.getByRole("button", { name: new RegExp(`^${STRINGS.ui.codex}`) }).click();
        await page.getByRole("button", { name: new RegExp(`^${STRINGS.daily.title}`) }).click();
        await page.waitForSelector(".codex .daily-month");
        failures.push(...(await contrast(page, `codex, ${label}`)));
        failures.push(...(await misfits(page, `codex, ${label}`, { mayScroll: true })));
        await page.getByRole("button", { name: STRINGS.daily.earlier }).click();
        await page.getByRole("heading", { name: "September 2026" }).waitFor();
        failures.push(...(await contrast(page, `codex, September, ${label}`)));
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    // The menu's codex button leads with the histories (BACKLOG-10 phase 58), a longer label
    // than the count it replaced, here beside the daily's longest. The codex gives its clues:
    // a near miss named with one, and a few rumoured.
    it("offers taking over at its fullest on the smallest phone, and hands the country over on a card that fits", async () => {
      // The longest the choice gets (BACKLOG-10 phase 63): the longest history the last run could
      // be named, the two longest legacies a country can hand on, and the longest rival's name.
      const title = (k: string) => historyTitle(k) ?? "";
      const history = ALL_HISTORY_KEYS.filter((k) => k.endsWith(":decay:right")).reduce((a, b) => (title(b).length > title(a).length ? b : a));
      const legacies = Object.keys(LEGACIES).filter(inheritable).sort((a, b) => LEGACIES[b]!.length - LEGACIES[a]!.length);
      const rival = advisorPool(library, library.config.rivalRole, "right").reduce((a, b) => (b.name.length > a.name.length ? b : a));
      // Two that stand in history's order, so both are the ones handed on.
      const handed = HISTORY_ORDER.filter((f) => legacies.slice(0, 12).includes(f)).slice(0, 2);
      const meta = {
        ...emptyMeta(),
        runs: 5,
        endings: { finale_decay: 1 },
        history: [{ align: "right", cards: 105, era: 3, endingId: "finale_decay", band: "decay", rival: rival.id, legacies: handed, history, mandates: [], rivalStanding: 60 }],
      };
      const failures: string[] = [];
      const page = await open(browser, { width: 360, height: 640 });
      await page.evaluate(`localStorage.setItem("rod.meta", ${JSON.stringify(JSON.stringify(meta))})`);
      await page.reload();
      const take = page.getByRole("button", { name: new RegExp(STRINGS.dynasty.takeOver) });
      await take.waitFor();
      await take.click();
      expect(await take.getAttribute("aria-pressed")).toBe("true");
      failures.push(...(await contrast(page, "the menu, taking over")), ...(await misfits(page, "the menu, taking over", { mayScroll: true })));
      await page.getByRole("button", { name: STRINGS.ui.start }).click();
      await page.waitForSelector(`.card[data-card="${library.config.handoverPrefix}decay"]`);
      for (const look of ["decay1", "decay2"]) {
        await toLook(page, look);
        failures.push(...(await misfits(page, `the handover, ${look}`)));
      }
      await close(page);
      expect(failures).toEqual([]);
    });

    it("fits the menu's buttons at their longest, and reads the codex's clues, on the smallest phone", async () => {
      const today = "2026-12-30"; // Daily #101, played
      // Clues given and kept, among them endings only one party can reach, which say so
      // (BACKLOG-11 phase 71).
      const base = { ...emptyMeta(), runs: 700, endings: { finale_muddle: 1, first_term_muddle: 1 }, nearMissed: ["riots"] };
      const unfound = [...library.endings.keys()].filter((id) => collectsEnding(id) && !(id in base.endings) && id !== "riots" && withinReach(library, base, id));
      const oneSided = unfound.filter((id) => endingSides(library, id).length === 1).slice(0, 3);
      const heard = [...oneSided, ...unfound.filter((id) => !oneSided.includes(id)).slice(0, 12)];
      const meta = {
        ...base,
        heard,
        // A finale seen, so the menu shows the week's contracts too (BACKLOG-10 phase 60).
        histories: Object.fromEntries(ALL_HISTORY_KEYS.map((k) => [k, 1])),
        dailies: [{ day: today, history: "habit_skim:decay:left", ending: "finale_muddle", cards: 61 }],
      };
      const failures: string[] = [];
      const page = await open(browser, { width: 360, height: 640, at: `${today}T12:00:00Z` });
      await page.evaluate(`localStorage.setItem("rod.meta", ${JSON.stringify(JSON.stringify(meta))})`);
      await page.reload();
      const codex = page.getByRole("button", { name: STRINGS.ui.codexHistories.replace("{n}", String(ALL_HISTORY_KEYS.length)) });
      await codex.waitFor();
      failures.push(...(await contrast(page, "the menu")), ...(await misfits(page, "the menu", { mayScroll: true })));
      const row = (await page.evaluate(`[...document.querySelectorAll(".meta-row button")].map((b) => {
        const r = b.getBoundingClientRect();
        return [b.textContent, Math.round(r.left), Math.round(r.right), b.scrollWidth > b.clientWidth];
      })`)) as [string, number, number, boolean][];
      expect(row.map(([text]) => text)).toContain(STRINGS.ui.dailyDone.replace("{n}", "101"));
      expect(row.map(([text]) => text)).toContain(STRINGS.contracts.menu.replace("{n}", "0"));
      for (const [text, left, right, cut] of row) {
        if (left < 0 || right > 360) failures.push(`the menu: "${text}" runs off the screen, ${left} to ${right}`);
        if (cut) failures.push(`the menu: "${text}" is cut short`);
      }
      await codex.click();
      // The endings in their three kinds, each with the clues kept for it.
      for (const kind of ["finished", "chosen", "fallen"] as const) {
        await page.getByRole("button", { name: new RegExp(`^${STRINGS.codex.kinds[kind]}`) }).click();
        await page.waitForSelector(`[data-section="${kind}"] .codex-panel`);
        failures.push(...(await contrast(page, `the codex's ${kind} endings`)), ...(await misfits(page, `the codex's ${kind} endings`, { mayScroll: true })));
      }
      if (!(await page.locator(".codex-list li.rumour em").count())) {
        await page.getByRole("button", { name: new RegExp(`^${STRINGS.codex.kinds.chosen}`) }).click();
      }
      if (!(await page.locator(".codex-list li.rumour em").count())) failures.push("no clue says which party can reach it");
      await close(page);
      expect(failures).toEqual([]);
    });
  });

  /**
   * A key pressed the moment the next card lands (BACKLOG-5 phase 37). The key listener was
   * re-attached a moment after the new card was on the page, and a press in that moment went
   * to the old one, which still took the last card for leaving and dropped it. No person
   * presses that fast, but the audits do, and one hung on it in CI waiting for a peek.
   */
  describe("the keyboard", () => {
    it("hears a key pressed the moment the next card lands", async () => {
      const page = await startRun(browser, "left");
      const heard: boolean[] = [];
      for (let i = 0; i < 3; i++) {
        await page.evaluate(`(() => {
          const stage = document.querySelector(".card").parentElement;
          window.__pressed = false;
          new MutationObserver((list, obs) => {
            for (const m of list) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains("card")) {
              obs.disconnect();
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
              window.__pressed = true;
            }
          }).observe(stage, { childList: true, subtree: true });
        })()`);
        await choose(page, "left");
        await page.waitForSelector(".card-labels[aria-hidden='false']", { timeout: 2000 }).catch(() => null);
        heard.push((await page.evaluate("window.__pressed")) === true && (await page.locator(".card-labels[aria-hidden='false']").count()) > 0);
        await page.keyboard.press("Escape");
      }
      expect(heard).toEqual([true, true, true]);
      await close(page);
    });
  });

  describe("a screen reader can play", () => {
    it("finds a named control for every action, and plays a card from its button", async () => {
      const page = await startRun(browser, "left");
      const failures: string[] = [];
      // Everything a screen reader can press or be sent to, named.
      const unnamed = (await page.evaluate(`[...document.querySelectorAll("button, [role=button], a[href], input, select, textarea")]
        .filter((e) => !e.closest("[aria-hidden=true]"))
        .filter((e) => !((e.getAttribute("aria-label") || e.textContent || "").trim()))
        .map((e) => e.outerHTML.slice(0, 80))`)) as string[];
      failures.push(...unnamed.map((h) => `unnamed control: ${h}`));
      const labels = (await page.evaluate("[...document.querySelectorAll('.choice')].map((b) => b.textContent)")) as string[];
      if (labels.length !== 2) failures.push(`expected two choice buttons, found ${labels.length}`);
      const said = () => page.evaluate("document.querySelector(\"[aria-live='polite']\").textContent") as Promise<string>;
      const before = await said();
      if (!before.trim()) failures.push("nothing was said when the first card landed");
      // Pressed the way TalkBack presses it: a click, with nothing to drag.
      await page.locator(".choice").nth(1).dispatchEvent("click");
      await page.waitForFunction(`document.querySelector("[aria-live='polite']").textContent !== ${JSON.stringify(before)}`);
      const next = (await page.evaluate("document.querySelector('.card-text').textContent")) as string;
      if (!(await said()).includes(next.slice(0, 16))) failures.push("the next card was not said aloud");
      const meters = (await page.evaluate("[...document.querySelectorAll('.meter[role=img]')].map((m) => m.getAttribute('aria-label'))")) as string[];
      for (const m of meters) if (/\d/.test(m)) failures.push(`a meter says its number: "${m}"`);
      await close(page);
      expect(failures).toEqual([]);
    });

    it("draws the hidden buttons for a keyboard player who tabs to them, peeking that side", async () => {
      const page = await startRun(browser, "left");
      await page.keyboard.press("Tab");
      const state = (await page.evaluate(`(() => {
        const row = document.querySelector(".choices");
        const focused = document.activeElement;
        return {
          focusedChoice: focused?.classList.contains("choice") ? focused.getAttribute("data-side") : null,
          rowHeight: Math.round(row.getBoundingClientRect().height),
          peeking: document.querySelector(".card-labels").getAttribute("aria-hidden") === "false",
        };
      })()`)) as { focusedChoice: string | null; rowHeight: number; peeking: boolean };
      await close(page);
      expect(state).toEqual({ focusedChoice: "left", rowHeight: expect.any(Number), peeking: true });
      expect(state.rowHeight).toBeGreaterThan(30);
    });
  });

  /** A seed whose run, the left side taken on every card, goes over the top of a meter within 40 cards. */
  function cutShort(): { seed: number; align: PlayerAlign; cards: number; line: string } {
    for (let seed = 1; seed < 500; seed++) {
      for (const align of ["left", "right"] as const) {
        const decoded = decodeRunCode(library, codeFor(seed, align));
        if (!decoded.ok) continue;
        let s = draw(library, newRun(library, seed, setupOf(decoded.code)));
        while (!s.over && s.cardCount < 40) s = draw(library, resolve(library, s, s.current!, "left"));
        const cause = s.over ? endCause(library, s) : null;
        if (cause?.kind === "meter" && cause.edge === "high") return { seed, align, cards: s.cardCount, line: causeLine(library, s, cause)! };
      }
    }
    throw new Error("no seed goes over the top in 40 cards of the left side");
  }

  /** A seed whose run, one side taken on every card, ends a story within 30 cards, the story having left a legacy. */
  function storyEnd(): { seed: number; align: PlayerAlign; side: "left" | "right"; cards: number; ending: string; told: string[] } {
    for (let seed = 1; seed < 500; seed++) {
      for (const align of ["left", "right"] as const) {
        const decoded = decodeRunCode(library, codeFor(seed, align));
        if (!decoded.ok) continue;
        for (const side of ["left", "right"] as const) {
          let s = draw(library, newRun(library, seed, setupOf(decoded.code)));
          while (!s.over && s.cardCount < 30) s = draw(library, resolve(library, s, s.current!, side));
          const told = s.over ? [...toldByEnding(library, s)].filter((f) => HISTORIES[f]) : [];
          if (told.length) return { seed, align, side, cards: s.cardCount, ending: s.over!.endingId, told };
        }
      }
    }
    throw new Error("no seed ends a story that left a legacy within 30 cards of one side");
  }

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
            failures.push(...(await codexContrast(page, `codex after a ${band} run`)));
          }
          await close(page);
        }
        expect(failures).toEqual([]);
      });
    }

    // Why it ended (BACKLOG-11 phase 67): a run cut short says so under the ending, in words. The
    // longest line is a meter over the top with what that means, found by taking the left side
    // of every card, which fills the state until it stops, and played here to that same end.
    it("says why a run cut short ended, and reads and fits the smallest phone", async () => {
      const cut = cutShort();
      const page = await startRunAt(browser, target!.url, cut.seed, cut.align, { width: 360, height: 640 });
      for (let i = 0; i < cut.cards; i++) await choose(page, "left");
      await page.waitForSelector(".ending-cause");
      const failures: string[] = [];
      const said = await page.textContent(".ending-cause");
      if (said !== cut.line) failures.push(`said "${said}", not "${cut.line}"`);
      failures.push(...(await contrast(page, "a run cut short")));
      failures.push(...(await misfits(page, "a run cut short", { mayScroll: true })));
      await close(page);
      expect(failures).toEqual([]);
    });

    // A story's end (BACKLOG-11 phase 72): told as a reign cut short, and what it told is not
    // followed up again, so the road back from it is offered under the ending instead.
    it("offers the road back from what a story's end told, under it, and reads and fits the smallest phone", async () => {
      const story = storyEnd();
      const page = await startRunAt(browser, target!.url, story.seed, story.align, { width: 360, height: 640 });
      for (let i = 0; i < story.cards; i++) await choose(page, story.side);
      await page.waitForSelector(".history-title");
      const failures: string[] = [];
      const kicker = (await page.textContent(".kicker")) ?? "";
      if (!kicker.startsWith(`${STRINGS.ui.cutShort.replace("{n}", String(story.cards))} · `)) failures.push(`the line over the name says "${kicker}"`);
      if (!(await page.locator(".ending-roads .road-back").count())) failures.push("no road back from what the ending told");
      const became = (await page.locator(".became").textContent().catch(() => "")) ?? "";
      for (const f of story.told) if (LEGACIES[f] && became.includes(LEGACIES[f]!)) failures.push(`"${LEGACIES[f]}" is followed up under the ending that told it`);
      failures.push(...(await contrast(page, `${story.ending}'s end`)));
      failures.push(...(await misfits(page, `${story.ending}'s end`, { mayScroll: true })));
      await close(page);
      expect(failures).toEqual([]);
    });

    // A long reign locked in one band whose drift went the other way (BACKLOG-11 phase 72): its
    // end was drawn in drift's look, a gold city in a Decay frame.
    it("ends a long reign in its locked band's look wherever drift went, and reads and fits the smallest phone", async () => {
      const { eraLength, longEraCount } = library.config;
      const meta = { ...emptyMeta(), runs: 1, endings: { finale_muddle: 1 }, objectives: { obj_first_run: 1, obj_finale: 1 } };
      const page = await open(browser, { width: 360, height: 640 });
      await page.evaluate(`localStorage.setItem("rod.meta", ${JSON.stringify(JSON.stringify(meta))})`);
      await page.reload();
      await page.getByRole("button", { name: new RegExp(`^${STRINGS.reign.long}`) }).click();
      await page.getByLabel(STRINGS.ui.seed).fill(String(SEED));
      await page.getByRole("button", { name: STRINGS.ui.start, exact: true }).click();
      await page.waitForSelector(".card");
      // Locked in the Ascent at its fourth era, and ended with drift deep in the Decay.
      await playFrom(page, LATE.decay, { cardCount: eraLength * longEraCount - 1, era: longEraCount, band: "ascent" });
      await page.waitForSelector(".history-title");
      const failures: string[] = [];
      const look = await page.locator(".frame").first().getAttribute("data-theme");
      if (!look?.startsWith("ascent")) failures.push(`an Ascent reign ended in the ${look} look`);
      failures.push(...(await contrast(page, "a long reign's Ascent end, drift in the Decay")));
      failures.push(...(await misfits(page, "a long reign's Ascent end, drift in the Decay", { mayScroll: true })));
      await close(page);
      expect(failures).toEqual([]);
    });

    // A run seen through out of office (BACKLOG-11 phase 70): the finale said nothing of it, played
    // the sound of a run that kept the office, and flew the party's own flags over the picture.
    it("says a run was seen through from the opposition benches, flies the rival's flags, and reads and fits the smallest phone", async () => {
      const failures: string[] = [];
      const { eraLength, eraCount, electionInterval } = library.config;
      const last = eraLength * eraCount - 1;
      for (const party of ["left", "right"] as const) {
        const page = await startRun(browser, party, { width: 360, height: 640 });
        for (let i = 0; i < 4; i++) await choose(page, "right");
        await rewriteRun(
          page,
          `Object.assign(raw.state, ${JSON.stringify({ cardCount: last, era: eraCount, nextElectionAt: last + electionInterval, opposition: { since: last - 8, returnAt: null } })});
          for (const k of Object.keys(raw.state.meters)) raw.state.meters[k] = 55;
          raw.state.flags = [...new Set([...raw.state.flags, "lost_office"])];`,
        );
        await page.reload();
        await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
        await page.waitForSelector(".card");
        await choose(page, "right");
        await page.waitForSelector(".ending-cause");
        const label = `seen through out of office, ${party}`;
        const said = (await page.textContent(".ending-cause")) ?? "";
        if (!said.endsWith("you saw it from the opposition benches.")) failures.push(`${label}: says "${said}"`);
        const rival = party === "left" ? "right" : "left";
        if (!(await page.locator(`.world-after [data-flag="${rival}"]`).count())) failures.push(`${label}: the picture does not fly the rival's flags`);
        if (await page.locator(`.world-after [data-flag="${party}"]`).count()) failures.push(`${label}: the picture flies the party's own flags`);
        failures.push(...(await contrast(page, label)));
        failures.push(...(await misfits(page, label, { mayScroll: true })));
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    // A first term (BACKLOG-10 phase 59): what a new profile's menu starts, ended in a line that
    // says what comes next.
    it("reads, and fits the smallest phone, at the end of a first term started from a new profile's menu", async () => {
      const failures: string[] = [];
      for (const band of ["ascent", "decay"] as const) {
        const page = await open(browser, { width: 360, height: 640 });
        const first = page.getByRole("button", { name: new RegExp(STRINGS.reign.first) });
        if ((await first.getAttribute("aria-pressed")) !== "true") failures.push("a new profile's menu does not start a first term");
        await page.locator(".seed input").fill(String(SEED));
        await page.getByRole("button", { name: STRINGS.ui.start }).click();
        await page.waitForSelector(".card");
        await playFrom(page, LATE[band], { cardCount: library.config.eraLength - 1, era: 1 });
        await page.waitForSelector(".first-term-after");
        failures.push(...(await contrast(page, `a first term's end, ${band}`)));
        failures.push(...(await misfits(page, `a first term's end, ${band}`, { mayScroll: true })));
        await close(page);
      }
      expect(failures).toEqual([]);
    });
  });

  describe("a run fits the screen", () => {
    it("is measured in Roboto, the font an Android phone draws the game in", async () => {
      // Every fit here is only true in the font it was measured in. The game asks for the
      // system font, and Chromium is pointed at Roboto for it (roboto.ts); if that stopped
      // working, this machine's DejaVu Sans, a fifth wider, would come back without a word.
      // The same file loaded as a web font has to lay the same text out to the same width.
      const page = await open(browser);
      const font = readFileSync(new URL("./fonts/Roboto-400.ttf", import.meta.url)).toString("base64");
      await page.addStyleTag({ content: `@font-face { font-family: "Audit Roboto"; src: url(data:font/ttf;base64,${font}); }` });
      const widths = (await page.evaluate(`(async () => {
        await document.fonts.load('100px "Audit Roboto"');
        const width = (family) => {
          const s = document.createElement("span");
          s.style.cssText = "position: absolute; white-space: nowrap; font-size: 100px; font-weight: 400; font-family: " + family;
          s.textContent = "Institutions of the State";
          document.body.append(s);
          const w = s.getBoundingClientRect().width;
          s.remove();
          return w;
        };
        return { system: width("system-ui"), roboto: width('"Audit Roboto"'), fallback: width("monospace") };
      })()`)) as { system: number; roboto: number; fallback: number };
      expect(widths.roboto).not.toBeCloseTo(widths.fallback, 0);
      expect(widths.system).toBeCloseTo(widths.roboto, 1);
      await close(page);
    });

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
      // The fullest footer a run has: a platform's two badges and a teaching note.
      const page = await startRun(browser, "left", { width, height, mandates: FULLEST_PLATFORM });
      const failures: string[] = [];
      for (const look of ["muddle", "decay3", "ascent3"]) {
        await toLook(page, look);
        failures.push(...(await misfits(page, look)));
        for (const c of await overCard(page)) failures.push(`${look}: .${c} is over the card`);
      }
      await close(page);
      expect(failures).toEqual([]);
    });

    it("on a laptop (1280×720), with the party and the menus beside the card, in each direction", async () => {
      // A shared link is often opened on a laptop. The game stays a phone-width column, and
      // the row under the card used to put the party chip and the menus at the window's edges.
      const page = await startRun(browser, "left", { width: 1280, height: 720, mandates: FULLEST_PLATFORM });
      const failures: string[] = [];
      for (const look of ["muddle", "decay3", "ascent3"]) {
        await toLook(page, look);
        failures.push(...(await misfits(page, `laptop, ${look}`)));
        for (const c of await overCard(page)) failures.push(`laptop, ${look}: .${c} is over the card`);
        const gap = (await page.evaluate(`(() => {
          const card = document.querySelector(".card").getBoundingClientRect();
          const party = document.querySelector(".party").getBoundingClientRect();
          const tools = document.querySelector(".office-tools").getBoundingClientRect();
          return { left: card.left - party.left, right: tools.right - card.right };
        })()`)) as { left: number; right: number };
        if (gap.left > 60 || gap.right > 60) failures.push(`laptop, ${look}: the chip is ${gap.left}px and the menus ${gap.right}px out from the card`);
      }
      await close(page);

      const menu = await open(browser, { width: 1280, height: 720 });
      failures.push(...(await misfits(menu, "laptop, the menu", { mayScroll: true })));
      await menu.getByRole("button", { name: new RegExp(`^${STRINGS.ui.codex}`) }).click();
      await menu.waitForSelector(".codex");
      failures.push(...(await misfits(menu, "laptop, the codex", { mayScroll: true })));
      await close(menu);
      const ended = await startRun(browser, "left", { width: 1280, height: 720 });
      await endRun(ended, LATE.decay);
      failures.push(...(await misfits(ended, "laptop, the end of a run", { mayScroll: true })));
      await close(ended);
      expect(failures).toEqual([]);
    });

    it("on a phone held sideways (844×390), asks for it upright, and every other screen still works", async () => {
      // The installed app is locked upright; a browser tab is not. Sideways the card was
      // 101px tall with the speaker's name over the text, so a run asks to be turned.
      const failures: string[] = [];
      const page = await startRun(browser, "left", { width: 844, height: 390, touch: true });
      for (const look of ["muddle", "decay3", "ascent3"]) {
        await toLook(page, look);
        const notice = (await page.evaluate(`(() => {
          const n = document.querySelector(".upright");
          const r = n.getBoundingClientRect();
          const fits = [...n.children].every((c) => { const b = c.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight; });
          return { shown: getComputedStyle(n).display !== "none", covers: r.left <= 0 && r.top <= 0 && r.right >= innerWidth && r.bottom >= innerHeight, fits };
        })()`)) as { shown: boolean; covers: boolean; fits: boolean };
        if (!notice.shown || !notice.covers || !notice.fits) failures.push(`sideways, ${look}: the notice is ${JSON.stringify(notice)}`);
        failures.push(...(await contrast(page, `sideways, ${look}`)));
      }
      // Turned upright again, the run is where it was and the notice is gone.
      await page.setViewportSize({ width: 390, height: 844 });
      if ((await page.evaluate(`getComputedStyle(document.querySelector(".upright")).display`)) !== "none") failures.push("upright again: the notice stayed");
      failures.push(...(await misfits(page, "turned upright again")));
      await close(page);

      // The menus, the codex and the end of a run are pages that scroll, and work sideways.
      const menu = await open(browser, { width: 844, height: 390, touch: true });
      failures.push(...(await misfits(menu, "sideways, the menu", { mayScroll: true })));
      await menu.getByRole("button", { name: new RegExp(`^${STRINGS.ui.codex}`) }).click();
      await menu.waitForSelector(".codex");
      failures.push(...(await misfits(menu, "sideways, the codex", { mayScroll: true })));
      await close(menu);
      const ended = await startRun(browser, "left", { width: 844, height: 390, touch: true });
      await endRun(ended, LATE.ascent);
      failures.push(...(await misfits(ended, "sideways, the end of a run", { mayScroll: true })));
      await close(ended);
      expect(failures).toEqual([]);
    });

    it("at 360×640 with the choice buttons drawn, in each direction", async () => {
      const page = await startRun(browser, "left", { width: 360, height: 640, mandates: FULLEST_PLATFORM, settings: { showChoices: true } });
      const failures: string[] = [];
      for (const look of ["muddle", "decay3", "ascent3"]) {
        await toLook(page, look);
        failures.push(...(await misfits(page, `buttons drawn, ${look}`)));
      }
      await close(page);
      expect(failures).toEqual([]);
    });

    it("keeps a promise's line to one line at its widest, at 360×640: the longest title broken, and a platform's two", async () => {
      // One promise shows its whole title and its state, widest once broken. A platform's two
      // share a line by their short names, because a second line took up to 16px off the longest
      // cards here (BACKLOG-10 phase 62).
      const failures: string[] = [];
      const cases: [string, string[], string[]][] = [
        ["the longest promise, broken", [LONGEST_MANDATE.id], [LONGEST_MANDATE.id]],
        ["the widest platform, one of it broken", FULLEST_PLATFORM, [FULLEST_PLATFORM[0]!]],
      ];
      for (const [label, ids, broken] of cases) {
        const page = await startRun(browser, "left", { width: 360, height: 640, mandates: ids, settings: { showChoices: true } });
        await rewriteRun(page, `raw.state.mandatesBroken = ${JSON.stringify(Object.fromEntries(broken.map((id) => [id, 1])))};`);
        await page.reload();
        await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
        await page.waitForSelector(".mandate-badge");
        const { height, size, over } = await page.locator(".mandate-badge").evaluate((el) => ({
          height: el.getBoundingClientRect().height,
          size: parseFloat(getComputedStyle(el).fontSize),
          over: el.scrollWidth - el.clientWidth,
        }));
        if (height > size * 2) failures.push(`${label}: the promise's line is ${height}px tall, more than one line`);
        if (over > 0) failures.push(`${label}: the promise's line runs ${over}px past its width`);
        for (const look of ["muddle", "decay3"]) {
          await toLook(page, look);
          failures.push(...(await misfits(page, `${label}, ${look}`)));
        }
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    /**
     * The smallest phone, and the first height past each line the stylesheet draws: past 700px
     * the text and the speaker are full size again; from 740px the country is drawn under the
     * card, at its shortest; past 800px Decay 3 gets its second alert back, and from 860px the
     * Ascent its airy spacing. Only 360×640 was audited, and between those lines the longest
     * cards lost 2-86px in Decay 3 and Ascent 3 (BACKLOG-10 phase 64).
     */
    const LONGEST_AT: [number, number][] = [
      [360, 640],
      [360, 701],
      [360, 740],
      [360, 801],
      [360, 860],
    ];
    it.each(LONGEST_AT)("with the longest card of every kind on the table, at %i×%i with the buttons drawn, in all seven looks", async (width, height) => {
      // The audit reads the cards its seed deals, and the seed never dealt a long one on a
      // short phone: the deck's forty longest cards all ran 2-10px past the card there, with
      // the buttons, a promise and the first lesson drawn (BACKLOG-6 phase 44). So each side's
      // longest cards are put on the table. Since BACKLOG-8 phase 51 that is the longest of
      // every kind, not only events: a question draws a title line, an election a double
      // border, and a card with a name is as long as the name in the seat, so the seats hold
      // the longest names they can (tests/fit.ts).
      const failures: string[] = [];
      const smallest = width === 360 && height === 640;
      // An election carries a line on how an honest count goes (BACKLOG-9 phase 53), and it is
      // put on the table at its longest: a coalition a point or two under the bar, which is a
      // narrow loss in every look, since a look moves the bar by under three points. The line
      // for a loss that ends the run is shorter (BACKLOG-11 phase 68), and has its own audit.
      const longestCount = Object.values(STRINGS.count).reduce((a, b) => (b.length > a.length ? b : a));
      expect(STRINGS.countEnds.length).toBeLessThanOrEqual(longestCount.length);
      // A campaign card says where the same count stands, at its longest too (BACKLOG-10 phase 56).
      const longestStanding = Object.values(STRINGS.standing).reduce((a, b) => (b.length > a.length ? b : a));
      const counted = (kind: string) => kind === "election" || kind === "campaign";
      // Once the vote is abolished, any card but a vote can be the one the coup is rolled after,
      // and it carries a line where the count would be (BACKLOG-11 phase 69). That card draws no
      // lesson, which is the room the line takes: with the first lesson drawn as well, the
      // longest cards lost 2-30px of their text. So every such card is staged twice, as it was
      // and with the line at its longest: a moderate risk, which the State and Order a little
      // short of half make in every look once the rival has no standing to add to it (the looks
      // are reached by moving drift, which the rival gains from).
      const longestCoup = STRINGS.coup.line.replace("{band}", Object.values(STRINGS.coup.bands).reduce((a, b) => (b.length > a.length ? b : a)));
      expect(longestCoup).toBe(STRINGS.coup.line.replace("{band}", STRINGS.coup.bands.moderate));
      const couped = (kind: string, card: Card) => card.type !== "election" && kind !== "campaign" && kind !== "appointment";
      const abolished = JSON.stringify(library.config.electionsAbolishedFlag);
      for (const party of ["left", "right"] as const) {
        const page = await startRun(browser, party, { width, height, mandates: FULLEST_PLATFORM, settings: { showChoices: true } });
        for (const { kind, card, arc, seats, text } of fitPlacements(library, party)) {
          for (const coup of couped(kind, card) ? [false, true] : [false]) {
            await rewriteRun(
              page,
              `raw.state.current = ${JSON.stringify(card.id)};
              raw.state.currentFrom = ${JSON.stringify(arc ? "arc" : kind === "election" || kind === "campaign" ? kind : "deck")};
              ${arc ? `raw.state.activeArcs = [...raw.state.activeArcs.filter((a) => a.id !== ${JSON.stringify(arc)}), { id: ${JSON.stringify(arc)}, nextCard: ${JSON.stringify(card.id)} }];` : ""}
              ${counted(kind) ? `for (const b of ${JSON.stringify(BLOC_KEYS)}) raw.state.meters[b] = ${library.config.electionMoodThreshold - 1};` : ""}
              ${
                coup
                  ? `raw.state.flags = [...new Set([...raw.state.flags, ${abolished}])];
                     raw.state.nextElectionAt = raw.state.cardCount + 1;
                     raw.state.rivalStanding = 0;
                     raw.state.meters.order = 45;
                     raw.state.meters.inst = 45;`
                  : `raw.state.flags = raw.state.flags.filter((f) => f !== ${abolished});
                     raw.state.nextElectionAt = raw.state.cardCount + ${library.config.electionInterval};`
              }
              Object.assign(raw.state.cabinet, ${JSON.stringify(seats)});`,
            );
            await page.reload();
            await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
            await page.waitForSelector(`.card[data-card="${card.id}"]`);
            // The card as the table shows it, the names in the seats filled in.
            const shown = await page.locator(`.card[data-card="${card.id}"] .card-text`).first().textContent();
            if (shown !== text) failures.push(`${party}, ${card.id}: shows "${shown}", not "${text}"`);
            for (const look of LOOKS) {
              await toLook(page, look);
              const label = `${width}×${height}, ${party}, ${kind} ${card.id}${coup ? " with the coup's line" : ""} in ${look}`;
              failures.push(...(await misfits(page, label)));
              if (!counted(kind) && !coup) continue;
              // The longest line, on one line, and as readable as the prose above it.
              const line = page.locator(coup ? ".card .coup-line" : ".card .count-line");
              if (!(await line.count())) {
                failures.push(`${label}: the card carries no line`);
                continue;
              }
              const said = await line.textContent();
              const longest = coup ? longestCoup : kind === "campaign" ? longestStanding : longestCount;
              if (said !== longest) failures.push(`${label}: the line says "${said}", not the longest, "${longest}"`);
              const lines = await line.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
              if (lines !== 1) failures.push(`${label}: the line takes ${lines} lines`);
              if (coup && (await page.locator(".teach").count())) failures.push(`${label}: a lesson is drawn with the line`);
              // Colour does not change with the height, so it is read once, on the smallest phone.
              if (smallest) failures.push(...(await contrast(page, label)));
            }
          }
        }
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    // A side that ends the run is marked (BACKLOG-11 phase 68): ringed on its button, and under its
    // label as it is peeked; and the vote says a loss would be the last. Staged on each side's
    // longest vote, the office lost once already, with the buttons drawn on the smallest phone.
    it("marks a side that ends the run, and the vote whose loss would, readable and fitting in all seven looks at 360×640", async () => {
      const failures: string[] = [];
      for (const party of ["left", "right"] as const) {
        const vote = fitPlacements(library, party).find((p) => p.kind === "election")!;
        const page = await startRun(browser, party, { width: 360, height: 640, mandates: FULLEST_PLATFORM, settings: { showChoices: true } });
        await rewriteRun(
          page,
          `raw.state.current = ${JSON.stringify(vote.card.id)};
          raw.state.currentFrom = "election";
          for (const b of ${JSON.stringify(BLOC_KEYS)}) raw.state.meters[b] = ${library.config.electionMoodThreshold - 1};
          raw.state.flags = [...new Set([...raw.state.flags, "lost_office"])];
          Object.assign(raw.state.cabinet, ${JSON.stringify(vote.seats)});`,
        );
        await page.reload();
        await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
        await page.waitForSelector(`.card[data-card="${vote.card.id}"]`);
        const honest = vote.card.left.honest ? "left" : "right";
        for (const look of LOOKS) {
          await toLook(page, look);
          const label = `${party}, ${vote.card.id} in ${look}`;
          const line = page.locator(".card .count-line");
          if ((await line.textContent()) !== STRINGS.countEnds) failures.push(`${label}: the count says "${await line.textContent()}"`);
          const lines = await line.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
          if (lines !== 1) failures.push(`${label}: the count takes ${lines} lines`);
          if (!(await page.locator(`.choice[data-side="${honest}"][data-ends]`).count())) failures.push(`${label}: the honest button is not marked`);
          failures.push(...(await misfits(page, label)));
          failures.push(...(await contrast(page, label)));
        }
        // Under the label as it is peeked, drawn as it is at the moment of committing, in full.
        for (const look of LOOKS) {
          await toLook(page, look);
          await page.keyboard.press(honest === "left" ? "ArrowLeft" : "ArrowRight");
          await page.waitForSelector(".card-labels[aria-hidden='false']");
          await page.evaluate(`document.querySelectorAll(".card-label[data-ends]").forEach((el) => { el.style.opacity = "1"; })`);
          const label = `${party}, ${vote.card.id} peeked in ${look}`;
          const mark = await page.locator(".card-label[data-ends] .ends-mark").textContent();
          if (mark !== STRINGS.ui.endsRule) failures.push(`${label}: the mark says "${mark}"`);
          failures.push(...(await misfits(page, label)));
          failures.push(...(await contrast(page, label)));
          await page.keyboard.press("Escape");
        }
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    it("draws the country under the card from 740px tall, clear of the card and the footer, with every landmark in view", async () => {
      // BACKLOG-10 phase 64. The strip takes its height from the card, so it is drawn only where
      // the longest cards can spare it (the audit above), and at 360px wide it shows only the
      // middle of its world: every landmark has to stand there.
      const failures: string[] = [];
      const strip = (page: Page) =>
        page.evaluate(`(() => {
          const el = document.querySelector(".frame > .country");
          const cs = el && getComputedStyle(el);
          if (!el || cs.display === "none") return null;
          const r = (e) => { const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, h: b.height }; };
          return { box: r(el), card: r(document.querySelector(".card")), status: r(document.querySelector(".status")), marks: [...el.querySelectorAll("[data-motif]")].map((g) => ({ motif: g.getAttribute("data-motif"), ...r(g) })) };
        })()`) as Promise<{ box: Box; card: Box; status: Box; marks: (Box & { motif: string })[] } | null>;
      type Box = { top: number; bottom: number; left: number; right: number; h: number };
      for (const [width, height, want] of [[360, 739, 0], [1280, 720, 0], [360, 740, 36], [360, 760, 56], [390, 844, 64], [412, 915, 64]] as const) {
        const page = await startRun(browser, "left", { width, height, mandates: FULLEST_PLATFORM, settings: { showChoices: true } });
        const got = await strip(page);
        if (!want) {
          if (got) failures.push(`${width}×${height}: the country is drawn, ${got.box.h}px tall, with no room for it`);
          await close(page);
          continue;
        }
        if (!got || Math.abs(got.box.h - want) > 0.5) failures.push(`${width}×${height}: the country is ${got?.box.h ?? "not drawn"}, not ${want}px tall`);
        // Every landmark, in every part of the world, at once: two runs' worth, each at the cap.
        for (const flags of [
          ["ring_started", "carbon_priced", "went_to_war", "seawall", "elections_abolished", "universal_care"],
          ["elections_abolished", "purge_begun", "universal_care", "media_captured", "took_the_skim", "moonshot_funded"],
        ]) {
          await rewriteRun(page, `raw.state.flags = [...new Set([...raw.state.flags, ...${JSON.stringify(flags)}])];`);
          await page.reload();
          await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
          await page.waitForSelector(".frame > .country [data-motif]");
          for (const look of LOOKS) {
            await toLook(page, look);
            const s = (await strip(page))!;
            const label = `${width}×${height}, ${look}`;
            if (s.box.top < s.card.bottom - 0.5) failures.push(`${label}: the country starts ${s.card.bottom - s.box.top}px up the card`);
            if (s.box.bottom > s.status.top + 0.5) failures.push(`${label}: the country runs ${s.box.bottom - s.status.top}px into the footer`);
            // The ring and the seawall run the length of the world, and are meant to leave it.
            for (const m of s.marks.filter((m) => !["ring", "seawall", "levee"].includes(m.motif))) {
              if (m.left < s.box.left - 0.5 || m.right > s.box.right + 0.5) failures.push(`${label}: ${m.motif} is cut off at the strip's side, ${m.left}..${m.right} in ${s.box.left}..${s.box.right}`);
            }
            failures.push(...(await misfits(page, label)));
          }
          // Only the first run's landmarks are cleared for the second: each run is its own.
          await rewriteRun(page, `raw.state.flags = raw.state.flags.filter((f) => !${JSON.stringify(flags)}.includes(f));`);
        }
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    it("out of office, at 360×640 with the buttons drawn, in all seven looks", async () => {
      // BACKLOG-10 phase 55. Out of office the footer is at its fullest: the party chip says so,
      // the first card out carries a note, and a promise and a lesson are there too. Each side's
      // longest opposition card goes on the table as that first card, and its longest return
      // vote as the era's last, with the count line under it.
      const failures: string[] = [];
      for (const party of ["left", "right"] as const) {
        const theirs = (c: Card) => c.align === "any" || c.align === party;
        const longest = (cards: readonly Card[]) => [...cards].filter(theirs).sort((a, b) => shownText(library, b, party).length - shownText(library, a, party).length)[0]!;
        const page = await startRun(browser, party, { width: 360, height: 640, mandates: FULLEST_PLATFORM, settings: { showChoices: true } });
        for (const [card, played, from] of [[longest(library.oppositionCards), 26, "opposition"], [longest(library.returnVotes), library.config.eraLength - 1, "election"]] as const) {
          await rewriteRun(
            page,
            `raw.state.current = ${JSON.stringify(card.id)};
            raw.state.currentFrom = ${JSON.stringify(from)};
            raw.state.era = 1;
            raw.state.cardCount = ${played};
            raw.state.opposition = { since: 26, returnAt: ${library.config.eraLength - 1} };
            raw.state.flags = [...new Set([...raw.state.flags, "lost_office"])];
            Object.assign(raw.state.cabinet, ${JSON.stringify(longestSeats(library, card, party))});`,
          );
          await page.reload();
          await page.getByRole("button", { name: STRINGS.ui.continueRun }).click();
          await page.waitForSelector(`.card[data-card="${card.id}"]`);
          const chip = await page.locator(".party").textContent();
          if (chip !== STRINGS.opposition.chip.replace("{party}", STRINGS.parties[party])) failures.push(`${party}, ${card.id}: the chip says "${chip}"`);
          if (played === 26 && !(await page.isVisible(".opposition-note"))) failures.push(`${party}, ${card.id}: no note on the first card out`);
          for (const look of LOOKS) {
            await toLook(page, look);
            const label = `${party}, out of office, ${card.id} in ${look}`;
            failures.push(...(await misfits(page, label)));
            failures.push(...(await contrast(page, label)));
          }
        }
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    it("every dialog stays on a small phone's screen and scrolls within itself", async () => {
      // Settings outgrew a 360×640 phone by 218px and could not be scrolled, so Close and
      // Erase were out of reach; nothing here could see it until BACKLOG-5 phase 33.
      const failures: string[] = [];
      const page = await startRun(browser, "left", { width: 360, height: 640, settings: { keepRecord: true } });
      await page.getByRole("button", { name: STRINGS.ui.settings, exact: true }).click();
      failures.push(...(await misfits(page, "settings")));
      await page.getByRole("button", { name: STRINGS.ui.close }).click();
      await page.getByRole("button", { name: new RegExp(`^${STRINGS.cabinet.title}`) }).click();
      failures.push(...(await misfits(page, "cabinet")));
      await page.getByRole("button", { name: STRINGS.ui.close }).click();
      await page.getByRole("button", { name: STRINGS.ui.settings, exact: true }).click();
      await page.getByRole("button", { name: STRINGS.ui.howItWorks }).click();
      failures.push(...(await misfits(page, "how it works")));
      await page.getByRole("button", { name: STRINGS.ui.close }).click();
      await page.getByRole("button", { name: STRINGS.ui.settings, exact: true }).click();
      await page.getByRole("button", { name: STRINGS.move.open }).click();
      failures.push(...(await misfits(page, "moving progress")));
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

    it("at an era boundary a crisis bends, on the short phones", async () => {
      // The bend is a second rule on a panel that must not scroll (BACKLOG-5 phase 35). The
      // run is the audit seed's own, with the crisis swapped for the one that bends era 2.
      const failures: string[] = [];
      const setup = rollSetup(library, SEED, "left", []);
      const code = encodeRunCode({ seed: SEED, align: "left", modifiers: ["crisis_blackouts", ...setup.modifiers!.slice(1)], unlocked: [], mandates: [] });
      for (const [width, height] of [[360, 640], [412, 732]] as const) {
        const page = await open(browser, { width, height, query: `run=${code}` });
        await page.getByRole("button", { name: STRINGS.share.offerPlay }).click();
        await page.waitForSelector(".card");
        await playToBoundary(page, null);
        expect(await page.locator(".era-bend").textContent()).toBe(STRINGS.bends["crisis_blackouts:2"]);
        const panel = (await page.evaluate("(() => { const j = document.querySelector('.era-jump'); return j.scrollHeight - j.clientHeight; })()")) as number;
        if (panel > 0) failures.push(`${width}×${height}: the era panel scrolls by ${panel}px`);
        failures.push(...(await misfits(page, `${width}×${height}, bent`)), ...(await contrast(page, `${width}×${height}, bent`)));
        await close(page);
      }
      expect(failures).toEqual([]);
    });

    /**
     * Every meter name whole at 360px, in every look, for both parties (BACKLOG-5 phase 32).
     * A slot is 54px wide; the decay looks set the names in bold capitals and the ascent
     * looks space them out. This used to be a list of fifteen names allowed to be cut short.
     * "Institutions" became "State", "THE SYSTEM" became "THE MAN", and the decay looks lost
     * a fiftieth of an em between letters. The tightest now is "The Money", with 0.6px to
     * spare in Roboto.
     */
    it("cuts no meter name short at 360px, in any look, for either party", async () => {
      const cut: string[] = [];
      for (const party of ["left", "right"] as const) {
        const page = await startRun(browser, party, { width: 360, height: 780 });
        for (const look of LOOKS) {
          await toLook(page, look);
          for (const c of await clipped(page)) if (c.ellipsis) cut.push(`${party} ${look}: "${c.text}" is ${c.x}px too long`);
        }
        await close(page);
      }
      expect(cut).toEqual([]);
    });
  });
});
