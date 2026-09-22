import { readFileSync } from "node:fs";
import { chromium, type Browser, type Page } from "playwright-core";
import { inject } from "vitest";
import { STRINGS } from "../../src/content/strings";
import type { PlayerAlign, Side } from "../../src/engine/types";
import { SETTINGS_VERSION } from "../../src/version";

declare module "vitest" {
  export interface ProvidedContext {
    audit: { chrome: string; url: string } | null;
  }
}

/** The served build and the browser to read it with, or null when the audits are skipped. */
export const target = inject("audit");

/** The in-page measurements, as plain JavaScript (see probes.js). */
export const PROBES = readFileSync(new URL("./probes.js", import.meta.url), "utf8");

/** Every look the frame can wear, in the order a run could pass through them. */
export const LOOKS = ["muddle", "decay1", "decay2", "decay3", "ascent1", "ascent2", "ascent3"] as const;

export function launch(): Promise<Browser> {
  return chromium.launch({ executablePath: target!.chrome });
}

const errors = new WeakMap<Page, string[]>();

export interface OpenOptions {
  width?: number;
  height?: number;
  /** Player settings over the defaults. Reduced motion is on, so a run can be played quickly. */
  settings?: Record<string, unknown>;
  /** More query string. The debug flag is always on, for the keys that push drift. */
  query?: string;
}

/**
 * The built site in a fresh profile: nothing saved, the given settings, and transitions that
 * finish at once so every measurement is of where things come to rest.
 */
export async function open(browser: Browser, opts: OpenOptions = {}): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: opts.width ?? 390, height: opts.height ?? 844 },
    serviceWorkers: "block",
  });
  const settings = JSON.stringify({ v: SETTINGS_VERSION, reduceMotion: true, ...opts.settings });
  await context.addInitScript({
    content: `if (!localStorage.getItem("rod.settings")) localStorage.setItem("rod.settings", ${JSON.stringify(settings)});`,
  });
  await context.addInitScript({ content: PROBES });
  const page = await context.newPage();
  const seen: string[] = [];
  errors.set(page, seen);
  page.on("pageerror", (e) => seen.push(e.message));
  await page.goto(`${target!.url}?debug=1${opts.query ? `&${opts.query}` : ""}`);
  await page.waitForSelector(".frame");
  return page;
}

export async function close(page: Page): Promise<void> {
  await page.context().close();
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

export function pageErrors(page: Page, label: string): string[] {
  return (errors.get(page) ?? []).map((e) => `${label}: page error: ${e}`);
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
export async function misfits(page: Page, label: string, opts: { mayScroll?: boolean } = {}): Promise<string[]> {
  const out: string[] = [];
  const { x, y } = await overflow(page);
  if (y > 0 && !opts.mayScroll) out.push(`${label}: the page scrolls by ${y}px`);
  if (x > 0) out.push(`${label}: the page scrolls sideways by ${x}px`);
  for (const c of await clipped(page)) {
    if (!c.ellipsis) out.push(`${label}: .${c.sel} cuts off ${Math.max(c.x, c.y)}px of "${c.text}"`);
  }
  return [...out, ...pageErrors(page, label)];
}

export async function lookOf(page: Page): Promise<string> {
  return (await page.getAttribute(".frame", "data-theme")) ?? "";
}

export async function takeOffice(page: Page, party?: PlayerAlign): Promise<void> {
  if (party) await page.getByRole("button", { name: new RegExp(STRINGS.parties[party]) }).click();
  await page.getByRole("button", { name: STRINGS.ui.start, exact: true }).click();
  await page.waitForSelector(".card");
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

/**
 * Play one card the way a keyboard player does, once to look and once to commit, and wait
 * until the table has moved on: a new card, an era boundary or the end of the run.
 */
export async function choose(page: Page, side: Side): Promise<void> {
  await page.evaluate("document.querySelector('.card').__audited = true");
  const key = side === "left" ? "ArrowLeft" : "ArrowRight";
  await page.keyboard.press(key);
  // The key handler reads the peek from the last render, so a second press sent straight
  // after the first can find no peek and look again instead of committing. No player can
  // press twice inside a frame; the audit waits for the peek to be drawn, and a frame more.
  await page.waitForSelector(".card-labels[aria-hidden='false']");
  await page.evaluate("new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))");
  await page.keyboard.press(key);
  await page.waitForFunction("(() => { const c = document.querySelector('.card'); return !c || !c.__audited; })()");
}
