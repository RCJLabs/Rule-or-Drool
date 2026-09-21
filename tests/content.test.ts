import { describe, expect, it } from "vitest";
import { content, library } from "../src/content";
import { buildLibrary } from "../src/engine/library";
import { BANDS } from "../src/engine/types";
import { validateContent } from "../src/validate";
import { makeFixture } from "./fixtures/content";

/**
 * Guards on the shipped content that go beyond the validator's rules (card counts, cell
 * coverage, the house convention that drift signs differ), plus one validator run.
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

  it("passes the validator (which owns the reference, flag, ending, election, speaker and length checks)", () => {
    const errors = validateContent(content).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
  });

  it("offers a real tradeoff on every event card (sign of drift differs between sides)", () => {
    for (const c of events) {
      const l = c.left.drift ?? 0;
      const r = c.right.drift ?? 0;
      expect(Math.sign(l) !== Math.sign(r) || (l === 0 && r === 0), c.id).toBe(true);
    }
  });
});
