import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

/**
 * The browser audits: contrast, fit and the world pictures, read from the built site in a
 * real Chromium. `npm run check:browser` builds and runs them, and `npm run check` includes
 * them. With no Chromium they skip and say so; CI sets REQUIRE_BROWSER, so a skip there fails.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["tests/browser/**/*.test.{ts,tsx}"],
      globalSetup: ["tests/browser/setup.ts"],
      // One browser at a time: the audits measure layout, and a starved CPU is not a phone.
      fileParallelism: false,
      testTimeout: 90_000,
      hookTimeout: 60_000,
    },
  }),
);
