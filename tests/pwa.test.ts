import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "../src/version";

const sw = readFileSync("public/sw.js", "utf8");
const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
const html = readFileSync("index.html", "utf8");

/** PNG dimensions live in the IHDR chunk, bytes 16-24. */
function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  expect(buf.subarray(1, 4).toString("ascii"), `${path} is not a PNG`).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("service worker", () => {
  it("keeps CACHE_NAME in step with APP_VERSION (section 12)", () => {
    const match = /const CACHE_NAME = "([^"]+)";/.exec(sw);
    expect(match?.[1]).toBe(`rod-v${APP_VERSION}`);
  });

  it("does not skip waiting on install, so an update cannot interrupt a run", () => {
    const install = sw.slice(sw.indexOf('addEventListener("install"'), sw.indexOf('addEventListener("activate"'));
    expect(install).not.toContain("self.skipWaiting()");
    // It still must be able to skip when the player asks.
    expect(sw).toContain('if (event.data === "SKIP_WAITING") self.skipWaiting();');
  });

  it("clears old caches and claims clients on activate", () => {
    expect(sw).toContain("caches.delete(key)");
    expect(sw).toContain("self.clients.claim()");
  });

  it("serves navigations from the cached shell, which is what makes offline play work", () => {
    expect(sw).toContain('req.mode === "navigate"');
    expect(sw).toContain("cache.match(INDEX)");
  });

  it("ignores non-GET and cross-origin requests", () => {
    expect(sw).toContain('req.method !== "GET"');
    expect(sw).toContain("self.location.origin");
  });
});

describe("web app manifest", () => {
  it("is installable: name, standalone display, colours and a start url in scope", () => {
    expect(manifest.name).toBe("Rule or Drool");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe(".");
    expect(manifest.scope).toBe(".");
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("ships both a 192 and a 512 icon, in any and maskable purposes", () => {
    const by = (purpose: string, size: string) =>
      manifest.icons.find((i: { purpose: string; sizes: string }) => i.purpose === purpose && i.sizes === size);
    for (const purpose of ["any", "maskable"]) {
      for (const size of ["192x192", "512x512"]) {
        const icon = by(purpose, size);
        expect(icon, `${purpose} ${size}`).toBeTruthy();
        const [w, h] = size.split("x").map(Number);
        expect(pngSize(`public/${icon.src}`)).toEqual({ width: w, height: h });
      }
    }
  });

  it("is linked from the page, with an apple touch icon", () => {
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(pngSize("public/icons/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
    const theme = /<meta name="theme-color" content="([^"]+)"/.exec(html)?.[1];
    expect(theme).toBe(manifest.theme_color);
  });
});
