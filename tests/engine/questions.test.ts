import { describe, expect, it } from "vitest";
import type { EngineConfig } from "../../src/engine/config";
import { draw, questionsDue } from "../../src/engine/draw";
import { buildLibrary, getCard, questionOf, questionOfArc } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { Arc, Card } from "../../src/engine/types";
import { library } from "../../src/content";
import { BOTS, makeContext } from "../../src/sim";
import { ev, makeFixture } from "../fixtures/content";
import { play, start } from "../helpers";

/**
 * Questions (BACKLOG-6 phase 40): policies the country argues about, drawn from a budget of
 * their own so they neither take a story's place nor wait for one to end.
 */

const ALL = ["decay", "muddle", "ascent"] as const;

/** A two-step question arc: the answer, then how it is carried out. */
function question(id: string, q: string, align: Arc["align"]): { arc: Arc; cards: Card[] } {
  const step = (n: number, next?: string): Card => ({
    ...ev(`${id}${n}`),
    type: "arc",
    arc: id,
    step: n,
    align,
    left: { label: "yes", ...(next ? { next } : {}) },
    right: { label: "no", ...(next ? { next } : {}) },
  });
  return {
    arc: { id, align, entry: { eras: [1, 2, 3], bands: [...ALL] }, weight: 1, cards: [`${id}1`, `${id}2`], question: q },
    cards: [step(1, `${id}2`), step(2)],
  };
}

function withQuestions(overrides: Partial<EngineConfig> = {}) {
  const fx = makeFixture();
  const qs = [question("qa_l", "qa", "left"), question("qa_r", "qa", "right"), question("qb", "qb", "any"), question("qc", "qc", "any")];
  return buildLibrary(
    { ...fx, arcs: [...fx.arcs, ...qs.map((q) => q.arc)], cards: [...fx.cards, ...qs.flatMap((q) => q.cards)] },
    { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0, questionEntryProb: 1, questionBudget: 2, ...overrides },
  );
}

const isQuestion = (id: string) => /^q[abc]/.test(id);

describe("questions", () => {
  it("are asked from a budget of their own, whatever the stories' budget says", () => {
    const l = withQuestions();
    const s = draw(l, start(l, { arcBudget: 0 }));
    expect(isQuestion(s.current!)).toBe(true);
    expect(s.currentFrom).toBe("arc");
    // Not a story entered: the objective that counts stories counts stories.
    expect(s.stats.arcsEntered).toBe(0);
  });

  it("do not hold a story's slot while they run", () => {
    const l = withQuestions({ arcEntryProb: 1, questionEntryProb: 0, arcContinueProb: 0 });
    const s = draw(l, start(l, { arcBudget: 1, activeArcs: [{ id: "qb", nextCard: "qb2" }] }));
    expect(s.current).toBe("arc_t1");
  });

  it("are asked one at a time, each once, up to the budget", () => {
    // A game of one era, which has the whole budget in it (BACKLOG-13 phase 91).
    const l = withQuestions({ arcContinueProb: 1, eraCount: 1 });
    const { state, ids } = play(l, start(l), 40);
    const asked = ids.filter((id) => isQuestion(id));
    // Two questions, both steps of each, and the second only once the first was answered.
    expect(asked).toHaveLength(4);
    expect(asked[1]).toBe(`${asked[0]!.slice(0, -1)}2`);
    expect(asked[3]).toBe(`${asked[2]!.slice(0, -1)}2`);
    const met = state.activeArcs.filter((a) => l.arcs.get(a.id)?.question);
    expect(met).toHaveLength(2);
    expect(new Set(met.map((a) => l.arcs.get(a.id)!.question)).size).toBe(2);
  });

  it("are spread across a run's eras: one by the end of the first, two by the second, three by the third", () => {
    const l = withQuestions({ questionBudget: 3 });
    const due = (era: number) => questionsDue(l, { era });
    expect([1, 2, 3].map(due)).toEqual([1, 2, 3]);
    // A first term is the ordinary game's first era, and a long reign has asked them all by its fourth.
    expect([4, 5].map(due)).toEqual([3, 3]);
  });

  it("ask the second once the first era is over, and the third in the last era", () => {
    const l = withQuestions({ questionBudget: 3, arcContinueProb: 1, eraLength: 6 });
    const { ids } = play(l, start(l), 18);
    const asked = ids.flatMap((id, k) => (isQuestion(id) && id.endsWith("1") ? [Math.floor(k / 6) + 1] : []));
    expect(asked).toEqual([1, 2, 3]);
  });

  it("are asked in the run's own side's voice", () => {
    const l = withQuestions({ questionBudget: 3, arcContinueProb: 1 });
    for (const align of ["left", "right"] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        const { ids } = play(l, start(l, {}, align, seed), 40);
        const other = align === "left" ? "qa_r" : "qa_l";
        expect(ids.some((id) => id.startsWith(other)), `${align} seed ${seed}`).toBe(false);
      }
    }
  });

  it("names the question on every step of it, and on nothing else", () => {
    const l = withQuestions();
    expect(questionOf(l, l.cards.get("qa_l1")!)).toBe("qa");
    expect(questionOf(l, l.cards.get("qa_r2")!)).toBe("qa");
    expect(questionOf(l, l.cards.get("arc_t1")!)).toBeUndefined();
    expect(questionOf(l, l.cards.get("f01")!)).toBeUndefined();
  });

  it("carry an answer through to the step after it, like any arc", () => {
    const l = withQuestions({ arcContinueProb: 1 });
    let s = draw(l, start(l));
    const first = s.current!;
    s = resolve(l, s, first, "left");
    s = draw(l, s);
    expect(s.current).toBe(`${first.slice(0, -1)}2`);
  });
});

/** The game's own deck, played by the informed voter: a question an era (BACKLOG-13 phase 91). */
describe("questions on the game's own deck", () => {
  it("come one an era at most, and the last era asks one in nearly every run that reaches it", () => {
    let reached = 0;
    let askedThere = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const rng = makeRng(seed ^ 0x3c6ef372);
      let s = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
      const byEra = [0, 0, 0];
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        if (card.arc && questionOfArc(library, card.arc) !== undefined && library.arcs.get(card.arc)!.cards[0] === card.id) {
          byEra[s.era - 1]!++;
          // Never more than the run's share by the end of the era it is in.
          expect(byEra.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(questionsDue(library, s));
        }
        s = resolve(library, s, card.id, BOTS.informed(makeContext(library, s, card, rng, { danger: 25 })));
      }
      if (s.cardCount > 2 * library.config.eraLength) {
        reached++;
        if (byEra[2]! > 0) askedThere++;
      }
    }
    expect(reached).toBeGreaterThan(20);
    expect(askedThere / reached).toBeGreaterThan(0.8);
  });
});
