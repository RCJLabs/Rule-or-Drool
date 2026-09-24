import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { content } from "../src/content";
import { VOICE, carrying } from "../src/content/voice";

// BACKLOG-7 phase 47: the phrases the drafts leaned on, held under their ceilings.
describe("the deck's voice", () => {
  it("keeps every watched phrase under its ceiling", () => {
    for (const p of VOICE) expect(carrying(content.cards, p).length, p.phrase).toBeLessThanOrEqual(p.ceiling);
  });

  it("opens no card drawn in both of the long reign's eras with the time of one of them", () => {
    const both = content.cards.filter((c) => c.eras.includes(4) && c.eras.includes(5));
    expect(both.filter((c) => /\b(two|five) centuries (on|later|after)\b/i.test(c.text)).map((c) => c.id)).toEqual([]);
  });
});

describe("npm run voice", () => {
  const voice = (...args: string[]) => spawnSync(process.execPath, ["--import", "tsx", "scripts/voice.ts", ...args], { encoding: "utf8" });

  it("counts the watched phrases against their ceilings, and the phrases in the most cards", () => {
    const out = voice();
    expect(out.status).toBe(0);
    expect(out.stdout).toContain("== watched (src/content/voice.ts) ==");
    for (const p of VOICE) expect(out.stdout).toContain(p.phrase);
    expect(out.stdout).toContain("== the phrases in the most cards");
    expect(out.stdout).toContain("Every watched phrase is under its ceiling.");
  }, 30_000);

  it("lists the cards carrying a phrase, by file", () => {
    const out = voice("would like");
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/^"would like": \d+ cards$/m);
    expect(out.stdout).toMatch(/^ {2}cards\/promises\.json$/m);
    expect(out.stdout).toMatch(/^ {4}p_taxes\s/m);
  }, 30_000);
});
