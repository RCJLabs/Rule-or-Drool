import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "../src/version";

const sw = readFileSync("public/sw.js", "utf8");
const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
const html = readFileSync("index.html", "utf8");

/**
 * Run the worker's script against stand-ins for the browser, fire its activate event with
 * these caches on the origin, and report what it deleted and whether it claimed its pages.
 */
async function activateAmong(keys: string[]): Promise<{ deleted: string[]; claimed: boolean }> {
  const handlers = new Map<string, (event: unknown) => void>();
  const deleted: string[] = [];
  let claimed = false;
  const self = {
    addEventListener: (type: string, handler: (event: unknown) => void) => handlers.set(type, handler),
    clients: { claim: async () => void (claimed = true) },
    location: { origin: "https://rcjlabs.github.io" },
    skipWaiting: () => undefined,
  };
  const caches = {
    keys: async () => [...keys],
    delete: async (key: string) => (deleted.push(key), true),
    open: async () => ({ add: async () => undefined, match: async () => undefined, put: async () => undefined }),
  };
  runInNewContext(sw, { self, caches });
  let done: unknown;
  handlers.get("activate")!({ waitUntil: (work: unknown) => void (done = work) });
  await done;
  return { deleted, claimed };
}

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

  // BACKLOG-8 phase 50: the game shares its origin, rcjlabs.github.io, with every Pages site
  // on the account, and it used to delete every cache there but its own on activating.
  it("clears only its own old caches on activate, never another site's, and claims its pages", async () => {
    const current = /const CACHE_NAME = "([^"]+)";/.exec(sw)![1]!;
    const others = ["other-game-v3", "workbox-precache-v2-https://rcjlabs.github.io/elsewhere/", "rod"];
    const { deleted, claimed } = await activateAmong([current, "rod-v0.58.0", "rod-v0.10.0", ...others]);
    expect(deleted.sort()).toEqual(["rod-v0.10.0", "rod-v0.58.0"]);
    expect(claimed).toBe(true);
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

describe("the build splits content from the shell", () => {
  it("keeps src/content in its own chunk and the rest of the app out of it", async () => {
    // Content is about half the bundle and changes on nearly every release; the shell
    // rarely does. The split is what stops a card edit invalidating React in the cache.
    const config = (await import("../vite.config")).default as {
      build?: { rolldownOptions?: { output?: { advancedChunks?: { groups?: { name: string; test: RegExp }[] } } } };
    };
    const groups = config.build?.rolldownOptions?.output?.advancedChunks?.groups ?? [];
    const content = groups.find((g) => g.name === "content");
    expect(content, "the build declares a content chunk").toBeTruthy();
    expect(content!.test.test("/repo/src/content/cards/era1/any.json")).toBe(true);
    expect(content!.test.test("/repo/src/content/index.ts")).toBe(true);
    expect(content!.test.test("/repo/src/engine/resolve.ts")).toBe(false);
    expect(content!.test.test("/repo/src/ui/Play.tsx")).toBe(false);
  });

  it("precaches whatever the build emits, so a new chunk cannot be missed offline", () => {
    // The plugin walks dist rather than naming files, which is why splitting the bundle
    // needed no change to the service worker.
    const config = readFileSync("vite.config.ts", "utf8");
    expect(config).toContain("const walk = (dir: string)");
    expect(config).toContain("PRECACHE = ${precache}");
  });
});
