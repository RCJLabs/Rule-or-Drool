import { existsSync, readFileSync } from "node:fs";
import type { Browser, Page } from "playwright-core";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { stageOf as driftStage } from "../../src/engine/look";
import { rollSetup } from "../../src/engine/state";
import { preview } from "../../src/engine/preview";
import { METER_KEYS, type GameState, type PlayerAlign, type Side } from "../../src/engine/types";
import { encodeRunCode } from "../../src/meta";
import { stability } from "../../src/sim/bots";
import { SETTINGS_VERSION } from "../../src/version";

/**
 * Playing the built game from outside it, for the browser audits and for the store
 * screenshots alike. Nothing here knows about a test runner; harness.ts binds it to vitest.
 */

/** The in-page measurements, as plain JavaScript (see probes.js). */
export const PROBES = readFileSync(new URL("./probes.js", import.meta.url), "utf8");

/** Every look the frame can wear, in the order a run could pass through them. */
export const LOOKS = ["muddle", "decay1", "decay2", "decay3", "ascent1", "ascent2", "ascent3"] as const;

/** Where a Chromium usually is: this project's cloud sandbox, CI's Ubuntu image, Linux, a Mac. */
const USUAL = [
  "/opt/pw-browsers/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

/** CHROME_PATH if it is set, and it has to be right; otherwise the first usual place. */
export function findChromium(): string | null {
  const asked = process.env.CHROME_PATH;
  if (asked) {
    if (existsSync(asked)) return asked;
    throw new Error(`CHROME_PATH is ${asked}, and there is no browser there.`);
  }
  return USUAL.find((p) => existsSync(p)) ?? null;
}

const errors = new WeakMap<Page, string[]>();

export interface OpenOptions {
  width?: number;
  height?: number;
  /**
   * Device pixels per CSS pixel. 3 by default, which is what a phone runs at: nothing
   * measured so far comes out differently at 1, but the audits describe phones, and it
   * costs no time.
   */
  scale?: number;
  /** Player settings over the defaults. Reduced motion is on, so a run can be played quickly. */
  settings?: Record<string, unknown>;
  /** More query string. The debug flag is always on, for the keys that push drift. */
  query?: string;
  /** A touch screen, as a phone has: CSS sees `pointer: coarse`. */
  touch?: boolean;
  /**
   * The browser's clock, fixed at this moment. The daily is dealt from the date, so a test of
   * it would deal a different run every day it ran (BACKLOG-5 phase 38). Timers still run.
   */
  at?: string;
}

/**
 * The built site in a fresh profile: nothing saved, the given settings, and transitions that
 * finish at once so every measurement is of where things come to rest.
 */
export async function openAt(browser: Browser, url: string, opts: OpenOptions = {}): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: opts.width ?? 390, height: opts.height ?? 844 },
    deviceScaleFactor: opts.scale ?? 3,
    hasTouch: opts.touch ?? false,
    serviceWorkers: "block",
  });
  const settings = JSON.stringify({ v: SETTINGS_VERSION, reduceMotion: true, ...opts.settings });
  await context.addInitScript({
    content: `if (!localStorage.getItem("rod.settings")) localStorage.setItem("rod.settings", ${JSON.stringify(settings)});`,
  });
  await context.addInitScript({ content: PROBES });
  if (opts.at) await context.clock.setFixedTime(new Date(opts.at));
  const page = await context.newPage();
  const seen: string[] = [];
  errors.set(page, seen);
  page.on("pageerror", (e) => seen.push(e.message));
  await page.goto(`${url}?debug=1${opts.query ? `&${opts.query}` : ""}`);
  await page.waitForSelector(".frame");
  return page;
}

/**
 * The stream's decorations that overlap the card, by class. The chat and the emotes get a
 * gutter so they never cover the prose: the first version did, and made the game unreadable.
 */
export async function overCard(page: Page): Promise<string[]> {
  return (await page.evaluate(`(() => {
    const card = document.querySelector(".card");
    if (!card) return [];
    const c = card.getBoundingClientRect();
    return [...document.querySelectorAll(".stream-chat, .stream-emotes")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top;
    }).map((el) => el.className);
  })()`)) as string[];
}

export async function close(page: Page): Promise<void> {
  await page.context().close();
}

/** The run code for a new player's run on the given seed: no unlocks, the base setup. */
export function codeFor(seed: number, align: PlayerAlign, mandate: string | null = null): string {
  return encodeRunCode({ seed, align, modifiers: rollSetup(library, seed, align, []).modifiers ?? [], unlocked: [], mandate });
}

/** A new player's run, started the way a shared link starts one, so the same cards come. */
export async function startRunAt(browser: Browser, url: string, seed: number, align: PlayerAlign, opts: OpenOptions & { mandate?: string } = {}): Promise<Page> {
  const page = await openAt(browser, url, { ...opts, query: `run=${codeFor(seed, align, opts.mandate ?? null)}` });
  await page.getByRole("button", { name: STRINGS.share.offerPlay }).click();
  await page.waitForSelector(".card");
  return page;
}

export async function lookOf(page: Page): Promise<string> {
  return (await page.getAttribute(".frame", "data-theme")) ?? "";
}

const stageOf = (look: string): number =>
  look.startsWith("decay") ? -Number(look.slice(5)) : look.startsWith("ascent") ? Number(look.slice(6)) : 0;

/** Push hidden drift with the debug keys, ten points a press, until the frame wears `look`. */
export async function toLook(page: Page, look: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const now = await lookOf(page);
    if (now === look) return;
    await page.keyboard.press(stageOf(look) < stageOf(now) ? "[" : "]");
  }
  throw new Error(`the frame never reached ${look}; it is ${await lookOf(page)}`);
}

/** Look at one side of the card, the way the first press of a keyboard choice does. */
export async function peek(page: Page, side: Side): Promise<void> {
  await page.keyboard.press(side === "left" ? "ArrowLeft" : "ArrowRight");
  // The key handler reads the peek from the last render, so a second press sent straight
  // after the first can find no peek and look again instead of committing. No player can
  // press twice inside a frame; wait for the peek to be drawn, and a frame more.
  await page.waitForSelector(".card-labels[aria-hidden='false']");
  await page.evaluate("new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))");
}

/**
 * Play one card the way a keyboard player does, once to look and once to commit, and wait
 * until the table has moved on: a new card, an era boundary or the end of the run.
 */
export async function choose(page: Page, side: Side): Promise<void> {
  await page.evaluate("document.querySelector('.card').__audited = true");
  await peek(page, side);
  await page.keyboard.press(side === "left" ? "ArrowLeft" : "ArrowRight");
  await page.waitForFunction("(() => { const c = document.querySelector('.card'); return !c || !c.__audited; })()");
}

/**
 * The side to play for a driver that means to keep going, the way a player who is paying
 * attention would: the one asked for, unless that ends the run and the other does not, and
 * the calmer of the two while a meter is near its edge. The drivers swipe on a fixed pattern
 * that was chosen to survive the deck it was written against, and any new card can undo that:
 * the questions (BACKLOG-6 phase 40) ended one audit's run at card 12 on the fast side of a
 * turning point, and walked another's Money up to 96, where card 35 ended it either way. The
 * engine's own preview says, from the saved run.
 */
async function goingOn(page: Page, side: Side): Promise<Side> {
  const id = await page.getAttribute(".card", "data-card");
  const card = id ? library.cards.get(id) : undefined;
  if (!card) return side;
  const saved = (await page.evaluate(`localStorage.getItem("rod.run")`)) as string | null;
  const state = saved ? (JSON.parse(saved) as { state: GameState }).state : null;
  const other: Side = side === "left" ? "right" : "left";
  if (state?.current !== card.id) return card[side].ending && !card[other].ending ? other : side;
  const [mine, theirs] = [preview(library, state, card, side), preview(library, state, card, other)];
  if (mine.endingId && !theirs.endingId) return other;
  const nearEdge = METER_KEYS.some((k) => state.meters[k] <= 15 || state.meters[k] >= 85);
  return nearEdge && !theirs.endingId && stability(theirs.meters) > stability(mine.meters) ? other : side;
}

/** Play until the first era ends, leaning the run toward a direction on the way. */
export async function playToBoundary(page: Page, lean: "[" | "]" | null): Promise<void> {
  const { eraLength, eraCount } = library.config;
  for (let i = 0; i < eraLength * eraCount; i++) {
    if (await page.locator(".era-jump").count()) return;
    if (!(await page.locator(".card").count())) throw new Error(`the run ended at card ${i}, before its first era did`);
    await choose(page, await goingOn(page, i % 3 === 0 ? "left" : "right"));
    if (lean && i % 2 === 0) await page.keyboard.press(lean);
  }
  throw new Error("a whole run's worth of cards and no era boundary");
}

/** Play the run out the way a keyboard player would, through each era, to its end. */
export async function playOut(page: Page): Promise<void> {
  for (let i = 0; i < 400; i++) {
    if (await page.locator(".history-title").count()) return;
    if (await page.locator(".era-jump").count()) {
      await page.getByRole("button", { name: STRINGS.ui.continueEra }).click();
      await page.waitForSelector(".card");
      continue;
    }
    await choose(page, await goingOn(page, i % 3 === 0 ? "left" : "right"));
  }
  throw new Error("four hundred cards and the run never ended");
}

/** What a run carried to its end, for `endRun`. */
export interface Late {
  drift: number;
  flags: string[];
  since: Record<string, number>;
}

/** Three ends, one in each direction, each carrying decisions that draw a full picture. */
export const LATE: Record<"ascent" | "decay" | "muddle", Late> = {
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

/**
 * The end of a run in a given direction, without playing 105 cards to get there: play a few
 * so there is a save, rewrite it to the last card of the last era carrying these decisions,
 * and play that card.
 */
export async function endRun(page: Page, late: Late): Promise<void> {
  const { eraLength, eraCount } = library.config;
  await playFrom(page, late, { cardCount: eraLength * eraCount - 1, era: eraCount });
  await page.waitForSelector(".history-title");
}

/**
 * A run moved to a card without playing to it: play a few so there is a save, rewrite it to
 * stand on `cardCount` in `era` carrying these decisions, and play that card. A long reign past
 * its third era also takes the band its first three set (BACKLOG-5 phase 39).
 */
export async function playFrom(page: Page, late: Late, at: { cardCount: number; era: number; band?: string }): Promise<void> {
  for (let i = 0; i < 4; i++) await choose(page, "right");
  const patch = {
    cardCount: at.cardCount,
    era: at.era,
    drift: late.drift,
    // A run arrives at a drift in the look it implies; the look it was in before is gone.
    look: driftStage(late.drift, library.config),
    meters: Object.fromEntries(METER_KEYS.map((k) => [k, 55])),
    // The clock moves with the card, so the one card played is not also an election, or a
    // coup's turn for a run that abolished them.
    nextElectionAt: at.cardCount + library.config.electionInterval,
    ...(at.band ? { band: at.band, bandLocked: true } : {}),
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
}

interface Failure {
  sel: string;
  text: string;
  size: number;
  weight: number;
  got: number;
  need: number;
  fg: string;
  bg: string;
}

export function pageErrors(page: Page, label: string): string[] {
  return (errors.get(page) ?? []).map((e) => `${label}: page error: ${e}`);
}

/**
 * Every text style on screen that fails WCAG AA, one line per style, plus anything the page
 * threw. Empty when the screen passes, so a test reads `expect(...).toEqual([])` and a
 * failure prints exactly what to fix.
 */
export async function contrast(page: Page, label: string): Promise<string[]> {
  const found = (await page.evaluate("window.__audit.contrast()")) as Failure[];
  const lines = new Map<string, string>();
  for (const f of found) {
    lines.set(`${f.sel}|${f.size}|${f.fg}|${f.bg}`, `${label}: ${f.got}:1, needs ${f.need} — ${f.fg} on ${f.bg}, ${f.size}px w${f.weight}, .${f.sel} "${f.text}"`);
  }
  return [...lines.values(), ...pageErrors(page, label)];
}

export async function overflow(page: Page): Promise<{ x: number; y: number }> {
  return (await page.evaluate("window.__audit.overflow()")) as { x: number; y: number };
}

export interface Clip {
  sel: string;
  x: number;
  y: number;
  text: string;
  /** Cut short on purpose, with an ellipsis to say so. */
  ellipsis: boolean;
}

/** Boxes on screen hiding part of their content (see probes.js). */
export async function clipped(page: Page): Promise<Clip[]> {
  return (await page.evaluate("window.__audit.clipped()")) as Clip[];
}

/**
 * What stops a screen fitting: the page scrolls when it should not, or a box cuts off its
 * own content. A screen that is a page to read, like the end of a run, may scroll down.
 */
/**
 * Dialogs that run past the screen. An overlay is fixed, so the page never scrolls and no
 * box clips: a card taller than the screen simply went on below it, out of reach, and the
 * fit checks above could not see it.
 */
export async function stranded(page: Page): Promise<string[]> {
  return (await page.evaluate(`[...document.querySelectorAll(".overlay-card")].map((c) => {
    const r = c.getBoundingClientRect();
    const past = Math.max(-r.top, r.bottom - innerHeight);
    return past > 1 ? c.className + " runs " + Math.round(past) + "px past the screen" : null;
  }).filter(Boolean)`)) as string[];
}

export async function misfits(page: Page, label: string, opts: { mayScroll?: boolean } = {}): Promise<string[]> {
  const out: string[] = [];
  for (const s of await stranded(page)) out.push(`${label}: .${s}`);
  const { x, y } = await overflow(page);
  if (y > 0 && !opts.mayScroll) out.push(`${label}: the page scrolls by ${y}px`);
  if (x > 0) out.push(`${label}: the page scrolls sideways by ${x}px`);
  for (const c of await clipped(page)) {
    if (!c.ellipsis) out.push(`${label}: .${c.sel} cuts off ${Math.max(c.x, c.y)}px of "${c.text}"`);
  }
  return [...out, ...pageErrors(page, label)];
}
