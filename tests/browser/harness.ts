import { chromium, type Browser, type Page } from "playwright-core";
import { inject } from "vitest";
import type { PlayerAlign } from "../../src/engine/types";
import { openAt, startRunAt, type OpenOptions } from "./drive";

export * from "./drive";

declare module "vitest" {
  export interface ProvidedContext {
    audit: { chrome: string; url: string } | null;
  }
}

/** The served build and the browser to read it with, or null when the audits are skipped. */
export const target = inject("audit");

/** The seed every audited run is dealt, so the same cards come each time and a failure reproduces. */
export const SEED = 8065615;

export function launch(): Promise<Browser> {
  return chromium.launch({ executablePath: target!.chrome });
}

export function open(browser: Browser, opts: OpenOptions = {}): Promise<Page> {
  return openAt(browser, target!.url, opts);
}

export function startRun(browser: Browser, align: PlayerAlign, opts: OpenOptions & { mandate?: string } = {}): Promise<Page> {
  return startRunAt(browser, target!.url, SEED, align, opts);
}
