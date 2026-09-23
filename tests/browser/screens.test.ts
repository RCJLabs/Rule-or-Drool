import { readFileSync } from "node:fs";
import type { Browser } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { MANDATES } from "../../src/engine/mandates";
import { rollSetup } from "../../src/engine/state";
import { encodeRunResult, resultOf } from "../../src/meta/challenge";
import { decodeRunCode, encodeRunCode } from "../../src/meta/runcode";
import { draw } from "../../src/engine/draw";
import { resolve } from "../../src/engine/resolve";
import { newRun } from "../../src/engine/state";
import { setupOf } from "../../src/meta/runcode";
import { emptyMeta } from "../../src/meta/state";
import { choose, clipped, close, codeFor, contrast, endRun, LATE, launch, lookOf, LOOKS, misfits, open, overCard, playFrom, playToBoundary, SEED, startRun, target, toLook } from "./harness";

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
        await page.evaluate(`(() => {
          const raw = JSON.parse(localStorage.getItem("rod.run"));
          raw.state.current = ${JSON.stringify(longest.id)};
          raw.state.currentFrom = "arc";
          raw.state.activeArcs = [...raw.state.activeArcs, { id: ${JSON.stringify(longest.arc)}, nextCard: ${JSON.stringify(longest.id)} }];
          localStorage.setItem("rod.run", JSON.stringify(raw));
        })()`);
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
      // The fullest footer a run has: the longest mandate's badge and a teaching note.
      const page = await startRun(browser, "left", { width, height, mandate: LONGEST_MANDATE.id });
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
      const page = await startRun(browser, "left", { width: 1280, height: 720, mandate: LONGEST_MANDATE.id });
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
      const page = await startRun(browser, "left", { width: 360, height: 640, mandate: LONGEST_MANDATE.id, settings: { showChoices: true } });
      const failures: string[] = [];
      for (const look of ["muddle", "decay3", "ascent3"]) {
        await toLook(page, look);
        failures.push(...(await misfits(page, `buttons drawn, ${look}`)));
      }
      await close(page);
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
      const code = encodeRunCode({ seed: SEED, align: "left", modifiers: ["crisis_blackouts", ...setup.modifiers!.slice(1)], unlocked: [], mandate: null });
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
