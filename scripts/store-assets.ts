/**
 * The Play store graphics, made from the built game rather than drawn (BACKLOG-2 phase 17):
 *
 * - eight phone screenshots, 1080×1920: a 360×640 phone at three device pixels per CSS pixel;
 * - the 1024×500 feature graphic, from the same world pictures the end screen draws;
 * - the 512×512 icon as the 32-bit PNG the console asks for (the site's icon has no alpha).
 *
 * Run after a build:  npm run build && npm run store:assets   (writes twa/store/)
 *
 * The game's font is the system's, which on Android is Roboto. Rendered here it would be
 * this machine's, and DejaVu Sans is a fifth wider, so Chromium is pointed at the Roboto the
 * browser audits measure in (tests/browser/roboto.ts): the screenshots look like the phone.
 * Only Chromium on Linux reads fontconfig; on a Mac or Windows they come out in the system's
 * own font.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium, type Browser, type Page } from "playwright-core";
import { preview } from "vite";
import { library } from "../src/content";
import { STRINGS } from "../src/content/strings";
import { draw } from "../src/engine/draw";
import { getCard } from "../src/engine/library";
import { resolve as resolveCard } from "../src/engine/resolve";
import { makeRng } from "../src/engine/rng";
import { newRun, rollSetup } from "../src/engine/state";
import type { GameState, PlayerAlign } from "../src/engine/types";
import { emptyMeta, foldRun, type MetaState } from "../src/meta";
import { BOTS, makeContext } from "../src/sim";
import { LESSONS } from "../src/ui/teach";
import { WorldAfter } from "../src/ui/WorldAfter";
import { composeWorld } from "../src/ui/world";
import { close, endRun, findChromium, LATE, openAt, playToBoundary, startRunAt, toLook, type OpenOptions } from "../tests/browser/drive";
import { robotoEnv } from "../tests/browser/roboto";

const OUT = resolve("twa/store");
const PHONE = { width: 360, height: 640, scale: 3 };
const SEED = 8065615;
/**
 * A profile thirty runs in, so the codex has something to show: thirty runs of the mixed
 * bot, each folded into the profile by the game's own fold, unlocks and all. Nothing in it
 * is written by hand.
 */
function veteranProfile(runs = 30): MetaState {
  let meta = emptyMeta();
  for (let i = 0; i < runs; i++) {
    const seed = 1000 + i * 7919;
    const align: PlayerAlign = i % 2 ? "right" : "left";
    const rng = makeRng(seed ^ 0x5bd1e995);
    let s: GameState = newRun(library, seed, { ...rollSetup(library, seed, align, meta.unlocks), mandate: null });
    while (!s.over) {
      s = draw(library, s);
      s = resolveCard(library, s, s.current!, BOTS.mixed(makeContext(library, s, getCard(library, s.current!), rng, { danger: 25 })));
    }
    meta = foldRun(library, meta, s).meta;
  }
  return meta;
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate("new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))");
  await page.screenshot({ path: join(OUT, name), type: "jpeg", quality: 90 });
}

async function screenshots(browser: Browser, url: string, veteran: MetaState): Promise<void> {
  // Every lesson already given, so each shot shows the game rather than a teaching note.
  const phone: OpenOptions = { ...PHONE, settings: { taught: LESSONS.map((l) => l.id) } };
  const run = (align: PlayerAlign) => startRunAt(browser, url, SEED, align, phone);

  // At rest: a peek slides the card half off the screen, which in a still reads as broken.
  let page = await run("left");
  await shoot(page, "01-card.jpg");
  await close(page);

  page = await run("left");
  await toLook(page, "decay3");
  await shoot(page, "02-decay.jpg");
  await close(page);

  page = await run("right");
  await toLook(page, "ascent3");
  await shoot(page, "03-ascent.jpg");
  await close(page);

  page = await run("left");
  await playToBoundary(page, "]");
  await shoot(page, "04-twenty-years-on.jpg");
  await close(page);

  page = await run("left");
  await endRun(page, LATE.ascent);
  await shoot(page, "05-end-ascent.jpg");
  await close(page);

  page = await run("right");
  await endRun(page, LATE.decay);
  await shoot(page, "06-end-decay.jpg");
  await close(page);

  // The codex and the menu of a player thirty runs in.
  page = await openAt(browser, url, phone);
  await page.evaluate(`localStorage.setItem("rod.meta", ${JSON.stringify(JSON.stringify(veteran))})`);
  await page.reload();
  await page.waitForSelector(".frame");
  await shoot(page, "08-menu.jpg");
  await page.getByRole("button", { name: new RegExp(`^${STRINGS.ui.codex}`) }).click();
  await page.waitForSelector(".codex");
  await shoot(page, "07-codex.jpg");
  await close(page);
}

/**
 * Two futures from the same city, split down the middle, under the game's name. The decay
 * half only shows the right of its picture, so its landmarks are placed there by hand, in
 * slots each of them may take in a real run; everything else is the renderer's own.
 */
async function featureGraphic(browser: Browser): Promise<void> {
  const up = composeWorld({ band: "ascent", drift: 60, align: "left", seed: 31, era: 3, flags: ["ring_started", "housing_built", "seawall", "referendum_called"] });
  const down = {
    ...composeWorld({ band: "decay", drift: -60, align: "right", seed: 31, era: 3, flags: [] }),
    placed: [
      { motif: "broadcast", slot: "media", flag: "feed_captured" },
      { motif: "tanks", slot: "money", flag: "general_unleashed" },
      { motif: "statue", slot: "pad", flag: "elections_abolished" },
      { motif: "dryBay", slot: "bay", flag: "water_rationed" },
    ],
  } satisfies ReturnType<typeof composeWorld>;
  const svg = (w: ReturnType<typeof composeWorld>) => renderToStaticMarkup(createElement(WorldAfter, { world: w, title: "" }));
  const html = `<!doctype html><html><head><style>
    body { margin: 0; }
    .fg { position: relative; width: 1024px; height: 500px; overflow: hidden; font-family: system-ui, sans-serif; }
    .fg > div { position: absolute; inset: 0; }
    .fg svg { width: 100%; height: 100%; display: block; }
    .down { clip-path: polygon(58% 0, 100% 0, 100% 100%, 42% 100%); }
    .seam { background: linear-gradient(103deg, transparent calc(50% - 2px), #f1ebdf calc(50% - 2px), #f1ebdf calc(50% + 2px), transparent calc(50% + 2px)); }
    .title { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .plate { padding: 22px 40px 20px; border-radius: 22px; background: rgba(8, 6, 10, 0.78); text-align: center; color: #fff; }
    h1 { margin: 0; font-size: 84px; font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
    p { margin: 12px 0 0; font-size: 26px; font-weight: 500; color: #f1ebdf; }
  </style></head><body><div class="fg">
    <div class="up">${svg(up)}</div><div class="down">${svg(down)}</div><div class="seam"></div>
    <div class="title"><div class="plate"><h1>Rule or Drool</h1><p>The easy choice now is the ruinous choice later.</p></div></div>
  </div></body></html>`;
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: join(OUT, "feature-graphic.jpg"), type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: 1024, height: 500 } });
  await page.close();
}

/**
 * The site's 512px icon, re-encoded with an alpha channel, which is what the console asks
 * for. A screenshot will not do it: Chromium drops the channel when every pixel is opaque.
 * A canvas keeps it.
 */
async function icon(browser: Browser): Promise<void> {
  const png = readFileSync("public/icons/icon-512.png").toString("base64");
  const page = await browser.newPage();
  const dataUrl = (await page.evaluate(`new Promise((done, fail) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      c.getContext("2d").drawImage(img, 0, 0, 512, 512);
      done(c.toDataURL("image/png"));
    };
    img.onerror = fail;
    img.src = "data:image/png;base64,${png}";
  })`)) as string;
  writeFileSync(join(OUT, "icon-512.png"), Buffer.from(dataUrl.split(",")[1]!, "base64"));
  await page.close();
}

async function main(): Promise<void> {
  if (!existsSync("dist/index.html")) throw new Error("No build to photograph. Run `npm run build` first.");
  const chrome = findChromium();
  if (!chrome) throw new Error("No Chromium found. Point CHROME_PATH at one.");
  mkdirSync(OUT, { recursive: true });

  const server = await preview({ logLevel: "silent", preview: { port: 4181, strictPort: false, open: false } });
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("vite preview started without a local URL");
  const browser = await chromium.launch({ executablePath: chrome, env: robotoEnv() });
  try {
    const veteran = veteranProfile();
    await screenshots(browser, url, veteran);
    await featureGraphic(browser);
    await icon(browser);
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`Store graphics in ${OUT}:`);
  for (const f of ["01-card.jpg", "02-decay.jpg", "03-ascent.jpg", "04-twenty-years-on.jpg", "05-end-ascent.jpg", "06-end-decay.jpg", "07-codex.jpg", "08-menu.jpg", "feature-graphic.jpg", "icon-512.png"]) {
    console.log(`  ${f.padEnd(24)} ${(statSync(join(OUT, f)).size / 1024).toFixed(0).padStart(4)} KB`);
  }
}

await main();
