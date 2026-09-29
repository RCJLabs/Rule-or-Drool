import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw, reckoningDue } from "../../src/engine/draw";
import { withNames } from "../../src/engine/endings";
import { getCard } from "../../src/engine/library";
import { reckonedLegacy } from "../../src/engine/reckoning";
import { resolve } from "../../src/engine/resolve";
import { makeRng, rankOf } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { LEGACIES } from "../../src/meta/legacies";
import { BOTS, makeContext } from "../../src/sim";

/**
 * The reckoning (BACKLOG-13 phase 92): once, in the ordinary game's last ten cards, a card that
 * asks what becomes of what the reign will be remembered for, opening on that legacy.
 */

const cfg = library.config;
const window = cfg.eraLength * cfg.eraCount - cfg.reckoningCards;

/** A run played by the informed voter, with each state its cards were drawn in. */
function played(seed: number, eraCount?: number): { run: GameState; drawn: GameState[] } {
  const rng = makeRng(seed ^ 0x3c6ef372);
  let s = newRun(library, seed, { ...rollSetup(library, seed, seed % 2 ? "left" : "right", []), ...(eraCount ? { eraCount } : {}) });
  const drawn: GameState[] = [];
  while (!s.over) {
    s = draw(library, s);
    drawn.push(s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS.informed(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return { run: s, drawn };
}
const runs = Array.from({ length: 30 }, (_, i) => played(i + 1));

describe("a reckoning", () => {
  it("comes once, in office, in the ordinary game's last ten cards, to nearly every run that gets there", () => {
    let reached = 0;
    let met = 0;
    for (const { drawn } of runs) {
      const reckonings = drawn.filter((s) => s.currentFrom === "reckoning");
      expect(reckonings.length).toBeLessThanOrEqual(1);
      for (const s of reckonings) {
        expect(s.cardCount).toBeGreaterThanOrEqual(window);
        expect(s.opposition).toBeFalsy();
      }
      if (drawn.some((s) => s.cardCount >= window && !s.opposition)) {
        reached++;
        if (reckonings.length) met++;
      }
    }
    expect(reached).toBeGreaterThan(20);
    expect(met / reached).toBeGreaterThan(0.9);
  });

  it("answers for the highest legacy in history's order a reckoning is written for, and opens on it", () => {
    let seen = 0;
    for (const { drawn } of runs) {
      const s = drawn.find((x) => x.currentFrom === "reckoning");
      if (!s) continue;
      seen++;
      const card = getCard(library, s.current!);
      const legacy = reckonedLegacy(library, s)!;
      expect(card.reckons).toContain(legacy);
      // Nothing higher the run left has a reckoning written for it.
      const higher = library.legacyOrder.slice(0, library.legacyOrder.indexOf(legacy));
      for (const f of higher) if (s.flags.includes(f)) expect(library.reckonings.some((c) => c.reckons!.includes(f))).toBe(false);
      // Of those written for it, the one first in the seed's order.
      const first = library.reckonings.filter((c) => c.reckons!.includes(legacy)).sort((a, b) => rankOf(s.seed, b.id, 1) - rankOf(s.seed, a.id, 1))[0]!;
      expect(card.id).toBe(first.id);
      expect(withNames(library, s, card.text, card.speaker).startsWith(`${LEGACIES[legacy]}.`)).toBe(true);
    }
    expect(seen).toBeGreaterThan(20);
  });

  it("opens on the highest legacy the card itself is written for, whatever else the run left", () => {
    const sale = library.reckonings.find((c) => c.id === "rk_sale")!;
    const files = library.reckonings.find((c) => c.id === "rk_files")!;
    // The vote abolished is the files' to answer for, and the ring the sale's as well.
    expect([files.reckons!.includes("elections_abolished"), sale.reckons!.includes("elections_abolished"), sale.reckons!.includes("ring_started")]).toEqual([
      true,
      false,
      true,
    ]);
    const s = { ...newRun(library, 1, { align: "left" }), flags: ["elections_abolished", "ring_started"] };
    expect(reckonedLegacy(library, s)).toBe("elections_abolished");
    expect(withNames(library, s, files.text, files.speaker).startsWith(`${LEGACIES.elections_abolished}.`)).toBe(true);
    expect(withNames(library, s, sale.text, sale.speaker).startsWith(`${LEGACIES.ring_started}.`)).toBe(true);
  });

  it("is not for a legacy the reign took over from the last, and not out of office", () => {
    const s = runs.map((r) => r.drawn.find((x) => x.currentFrom === "reckoning")).find(Boolean)!;
    const before = { ...s, current: null, seen: s.seen.filter((id) => id !== s.current) };
    expect(reckoningDue(library, before)).toBe(true);
    // What it took over is the last reign's, so only what this one left is reckoned.
    const took = before.flags.filter((f) => library.reckonings.some((c) => c.reckons!.includes(f)));
    expect(
      reckonedLegacy(library, { ...before, inherited: { ...(before.inherited ?? { legacies: [] }), legacies: took } as GameState["inherited"] }),
    ).toBeNull();
    expect(reckoningDue(library, { ...before, opposition: { since: before.cardCount, returnAt: null } })).toBe(false);
    expect(reckoningDue(library, { ...before, cardCount: window - 1 })).toBe(false);
  });

  it("never comes to a first term, and comes to a long reign where it comes to the ordinary game", () => {
    for (let seed = 1; seed <= 10; seed++) expect(played(seed, cfg.firstTermEras).drawn.some((s) => s.currentFrom === "reckoning")).toBe(false);
    let compared = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const long = played(seed, cfg.longEraCount).drawn.filter((s) => s.currentFrom === "reckoning");
      const ordinary = runs[seed - 1]!.drawn.filter((s) => s.currentFrom === "reckoning");
      expect(long.map((s) => [s.cardCount, s.current])).toEqual(ordinary.map((s) => [s.cardCount, s.current]));
      if (ordinary.length) compared++;
    }
    expect(compared).toBeGreaterThan(5);
  });

  it("is never dealt from the pools, and every legacy it names is one history names", () => {
    for (const cells of library.eventPool.values()) for (const c of cells) expect(c.reckons).toBeUndefined();
    for (const c of library.reckonings) {
      expect(c.text.startsWith("{legacy}")).toBe(true);
      for (const f of c.reckons!) {
        expect(LEGACIES[f], f).toBeDefined();
        expect(library.legacyOrder, f).toContain(f);
      }
    }
  });
});
