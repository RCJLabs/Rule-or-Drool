/**
 * The mockup pages are written as three files — a page, a shared stylesheet and a shared
 * renderer — because thirty treatments in one file would be unreadable. That is fine on a
 * server and useless everywhere else: opened as a single file, the page has no stylesheet
 * and no renderer, so it shows unstyled prose and no mockups at all.
 *
 * This runs the renderer at build time and writes each page out self-contained: markup
 * already in the HTML, stylesheet inlined, no script left to run. A design page you cannot
 * open on the phone you are designing for is not a design page (BACKLOG-3 phase 18).
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = resolve("public/mockups");
const SCRIPT = /<script type="module">([\s\S]*?)<\/script>/;
const SHEET = /\n?[ \t]*<link rel="stylesheet" href="mock\.css"[^>]*>/;

export async function buildMockups(outDir) {
  const css = readFileSync(join(SRC, "mock.css"), "utf8");
  const mod = await import(pathToFileURL(join(SRC, "mock.js")).href);
  mkdirSync(outDir, { recursive: true });
  let built = 0;

  for (const name of readdirSync(SRC).filter((f) => f.endsWith(".html"))) {
    const src = readFileSync(join(SRC, name), "utf8");
    const script = SCRIPT.exec(src);
    if (!script) continue;

    // The page's script only ever calls render(id, list, rows); capture what it would have
    // put in the DOM instead of needing a DOM to put it in.
    const slots = new Map();
    const render = (id, list, rows, foot) => slots.set(id, list.map((m) => mod.mock(m, rows, foot)).join(""));
    const body = script[1].replace(/^\s*import\s[\s\S]*?from\s*"\.\/mock\.js";\s*$/m, "");
    new Function(...Object.keys(mod), "render", body)(...Object.values(mod), render);

    let out = src.replace(SCRIPT, "").replace(SHEET, `\n<style>\n${css}</style>`);
    for (const [id, html] of slots) {
      const slot = new RegExp(`(<div class="[^"]*" id="${id}">)(</div>)`);
      if (!slot.test(out)) throw new Error(`${name}: nothing to fill for #${id}`);
      out = out.replace(slot, `$1${html}$2`);
    }
    writeFileSync(join(outDir, name), out);
    const frames = [...slots.values()].join("").match(/class="mk /g)?.length ?? 0;
    console.log(`  ${name}: ${frames} frames inlined, ${(out.length / 1024).toFixed(0)} kB`);
    built++;
  }
  return built;
}

if (process.argv[1]?.endsWith("build-mockups.mjs")) {
  const out = resolve(process.argv[2] ?? "dist/mockups");
  console.log(`self-contained mockup pages -> ${out}`);
  await buildMockups(out);
}
