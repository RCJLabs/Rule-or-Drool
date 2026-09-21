import { describe, expect, it } from "vitest";
import { content, library } from "../src/content";
import { buildLibrary } from "../src/engine/library";
import { BANDS } from "../src/engine/types";
import { makeFixture } from "./fixtures/content";

/**
 * Smoke checks on the shipped content. The phase 2 validator supersedes these; they
 * exist so a bad placeholder batch fails loudly before then.
 */
describe("content", () => {
  const events = content.cards.filter((c) => c.type === "event" && (c.weight ?? 1) > 0);
  const elections = content.cards.filter((c) => c.type === "election");

  it("ships at least 30 drawable event cards and an election card", () => {
    expect(events.length).toBeGreaterThanOrEqual(30);
    expect(elections.length).toBeGreaterThanOrEqual(1);
  });

  it("covers era 1 across all three bands for both alignments", () => {
    for (const band of BANDS) {
      for (const align of ["left", "right", "any"] as const) {
        const cell = library.eventPool.get(`1:${band}:${align}`) ?? [];
        expect(cell.length, `era 1 / ${band} / ${align}`).toBeGreaterThan(0);
      }
    }
  });

  it("rejects duplicate ids", () => {
    const fx = makeFixture();
    expect(() => buildLibrary({ ...fx, cards: [...fx.cards, fx.cards[0]!] })).toThrow(/duplicate card id/);
  });

  it("references only ids that exist", () => {
    for (const c of content.cards) {
      for (const side of [c.left, c.right]) {
        for (const e of side.enqueue ?? []) expect(library.cards.has(e.id), `${c.id} enqueues ${e.id}`).toBe(true);
        if (side.next) expect(library.cards.has(side.next), `${c.id} next ${side.next}`).toBe(true);
        if (side.ending) expect(library.endings.has(side.ending), `${c.id} ending ${side.ending}`).toBe(true);
      }
      if (c.arc) expect(library.arcs.has(c.arc), `${c.id} arc ${c.arc}`).toBe(true);
    }
    for (const a of content.arcs) for (const id of a.cards) expect(library.cards.has(id), `arc ${a.id} card ${id}`).toBe(true);
  });

  it("has every ending the engine can reach", () => {
    const cfg = library.config;
    const needed = [
      cfg.electionLossEnding,
      cfg.coupEnding,
      ...BANDS.map((b) => `${cfg.finalePrefix}${b}`),
      ...Object.values(cfg.meterEndings).flatMap((e) => [e.low, e.high]),
    ];
    for (const id of needed) expect(library.endings.has(id), id).toBe(true);
  });

  it("sets every flag it reads and reads every flag it sets", () => {
    const set = new Set<string>();
    const read = new Set<string>([library.config.electionsAbolishedFlag]);
    const readCond = (cond?: { flags?: string[]; notFlags?: string[] }) => {
      for (const f of cond?.flags ?? []) read.add(f);
      for (const f of cond?.notFlags ?? []) read.add(f);
    };
    for (const c of content.cards) {
      readCond(c.cond);
      for (const side of [c.left, c.right]) {
        for (const f of side.setFlags ?? []) set.add(f);
        for (const f of side.clearFlags ?? []) read.add(f);
      }
    }
    for (const a of content.arcs) readCond(a.entry);
    for (const m of content.modifiers) for (const f of m.flags ?? []) set.add(f);
    const engineRead = new Set([library.config.electionsAbolishedFlag]);
    for (const f of set) expect(read.has(f) || engineRead.has(f), `flag ${f} is set but never read`).toBe(true);
    for (const f of read) {
      if (engineRead.has(f) && !set.has(f)) continue;
      expect(set.has(f), `flag ${f} is read but never set`).toBe(true);
    }
  });

  it("gives every election card exactly one honest side", () => {
    for (const c of elections) {
      const honest = [c.left, c.right].filter((s) => s.honest).length;
      expect(honest, c.id).toBe(1);
    }
  });

  it("keeps text under 160 characters and labels under 24", () => {
    for (const c of content.cards) {
      expect(c.text.length, c.id).toBeLessThanOrEqual(160);
      expect(c.left.label.length, `${c.id} left`).toBeLessThanOrEqual(24);
      expect(c.right.label.length, `${c.id} right`).toBeLessThanOrEqual(24);
    }
  });

  it("has an advisor for every speaker role and an epilogue for every band", () => {
    for (const c of content.cards) expect(library.advisorsByRole.has(c.speaker), `${c.id} speaker ${c.speaker}`).toBe(true);
    for (const band of BANDS) expect(content.epilogues.some((e) => e.band === band && e.era === 1), band).toBe(true);
  });

  it("offers a real tradeoff on every event card (sign of drift differs between sides)", () => {
    for (const c of events) {
      const l = c.left.drift ?? 0;
      const r = c.right.drift ?? 0;
      expect(Math.sign(l) !== Math.sign(r) || (l === 0 && r === 0), c.id).toBe(true);
    }
  });
});
