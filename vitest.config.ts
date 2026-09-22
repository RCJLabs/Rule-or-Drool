import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["tests/**/*.test.{ts,tsx}"],
      // The browser audits read the built site and have their own config and command.
      exclude: [...configDefaults.exclude, "tests/browser/**"],
    },
  }),
);
