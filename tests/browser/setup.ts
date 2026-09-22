import { existsSync } from "node:fs";
import { preview, type PreviewServer } from "vite";
import type { TestProject } from "vitest/node";

/**
 * The browser audits read the built site as it is deployed: the bundle Vite emitted, served
 * under the same base path. This serves it once for every audit file, or says loudly that
 * the audits are not running rather than letting a skip pass for a pass.
 */

/** Where a Chromium usually is: this project's cloud sandbox, CI's Ubuntu image, Linux, a Mac. */
const USUAL = [
  "/opt/pw-browsers/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

/** CHROME_PATH if it is set, and it has to be right; otherwise the first usual place. */
function findChromium(): string | null {
  const asked = process.env.CHROME_PATH;
  if (asked) {
    if (existsSync(asked)) return asked;
    throw new Error(`CHROME_PATH is ${asked}, and there is no browser there.`);
  }
  return USUAL.find((p) => existsSync(p)) ?? null;
}

let server: PreviewServer | undefined;

export async function setup(project: TestProject): Promise<void> {
  const chrome = findChromium();
  if (!chrome) {
    if (process.env.REQUIRE_BROWSER) {
      throw new Error("REQUIRE_BROWSER is set and no Chromium was found. Point CHROME_PATH at one.");
    }
    console.warn(
      "\n  ⚠  BROWSER AUDITS SKIPPED: no Chromium found.\n" +
        "     Contrast, fit and the world pictures were NOT checked. Set CHROME_PATH to run them.\n",
    );
    project.provide("audit", null);
    return;
  }
  if (!existsSync("dist/index.html")) {
    throw new Error("There is no build to audit. `npm run check:browser` builds first; `npm run test:browser` expects one.");
  }
  server = await preview({ logLevel: "silent", preview: { port: 4180, strictPort: false, open: false } });
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("vite preview started without a local URL");
  project.provide("audit", { chrome, url });
}

export async function teardown(): Promise<void> {
  await server?.close();
}
