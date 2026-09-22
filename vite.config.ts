import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { APP_VERSION } from "./src/version";

/**
 * Vite emits content-hashed asset names, so a hand-written service worker cannot know the
 * precache list ahead of time. This rewrites dist/sw.js after the build with the files that
 * were actually emitted, and derives CACHE_NAME from APP_VERSION so the two cannot drift
 * apart (TRANSFER.md section 12).
 */
function serviceWorkerPrecache(): Plugin {
  const SKIP = new Set(["sw.js"]);
  return {
    name: "rod-sw-precache",
    apply: "build",
    closeBundle() {
      const dist = resolve("dist");
      const swPath = join(dist, "sw.js");
      let sw: string;
      try {
        sw = readFileSync(swPath, "utf8");
      } catch {
        return; // no service worker in this build
      }
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const abs = join(dir, entry.name);
          if (entry.isDirectory()) walk(abs);
          else {
            const rel = relative(dist, abs).split(sep).join("/");
            if (SKIP.has(rel) || rel.endsWith(".map")) continue;
            files.push(`./${rel}`);
          }
        }
      };
      walk(dist);
      files.sort();
      const precache = JSON.stringify(["./", ...files], null, 2).replace(/\n/g, "\n");
      sw = sw
        .replace(/const CACHE_NAME = "[^"]*";/, `const CACHE_NAME = "rod-v${APP_VERSION}";`)
        .replace(/const PRECACHE = \[[^\]]*\];/s, `const PRECACHE = ${precache};`);
      writeFileSync(swPath, sw);
      this.info?.(`sw.js: cache rod-v${APP_VERSION}, ${files.length} precached files`);
    },
  };
}

// GitHub Pages serves the project at https://<owner>.github.io/Rule-or-Drool/
export default defineConfig({
  base: "/Rule-or-Drool/",
  plugins: [react(), serviceWorkerPrecache()],
  build: {
    target: "es2022",
    sourcemap: true,
    /**
     * The cards are about half the bundle and change on almost every release, while the
     * shell changes rarely. Splitting them means a content-only release re-downloads the
     * content chunk and leaves React and the UI in the browser's cache. The service
     * worker precaches whatever is emitted, so offline play is unaffected either way.
     */
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [{ name: "content", test: /[\\/]src[\\/]content[\\/]/ }],
        },
      },
    },
  },
});
