import { describe, expect, it } from "vitest";
import { content, library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard, questionOf } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { arcOutcomes } from "../../src/engine/endings";
import { answeredQuestions, codexProgress, emptyMeta, foldRun, questionsOf } from "../../src/meta";
import { BOTS, makeContext } from "../../src/sim";

/**
 * How a player has answered the questions across their runs (BACKLOG-6 phase 42), read from
 * the legacies a profile already keeps: nothing new is saved for it.
 */
describe("the questions a profile has answered", () => {
  it("lists every question once, with the same two answers whichever side asks it", () => {
    const listed = questionsOf(library);
    const ids = new Set(content.arcs.filter((a) => a.question !== undefined).map((a) => a.question!));
    expect(listed.map((q) => q.id).sort()).toEqual([...ids].sort());
    for (const { id, answers } of listed) {
      for (const arc of content.arcs.filter((a) => a.question === id)) {
        const asking = library.cards.get(arc.cards[0]!)!;
        expect([asking.left.setFlags?.[0], asking.right.setFlags?.[0]], `${arc.id}`).toEqual(answers.map((a) => a.flag));
        expect([asking.left.label, asking.right.label], `${arc.id}`).toEqual(answers.map((a) => a.label));
      }
    }
  });

  it("counts each answer by the runs that gave it", () => {
    const meta = { ...emptyMeta(), legacies: { went_to_war: 2, stayed_out: 1, wage_left: 3 } };
    const byId = new Map(answeredQuestions(library, meta).map((q) => [q.id, q]));
    expect(byId.get("treaty")!.answers.map((a) => a.times)).toEqual([2, 1]);
    expect(byId.get("treaty")!.asked).toBe(3);
    expect(byId.get("wage")!.answers.map((a) => a.times)).toEqual([0, 3]);
    expect(byId.get("care")!.asked).toBe(0);
    const p = codexProgress(library, meta);
    expect(p.questionsAsked).toBe(2);
    expect(p.questionsTotal).toBe(byId.size);
  });

  it("keeps the questions out of the stories' count, and a run that answers one counts it once", () => {
    const empty = codexProgress(library, emptyMeta());
    const stories = content.arcs.filter((a) => a.question === undefined);
    expect(empty.storiesTotal).toBeGreaterThan(0);
    expect(empty.questionsAsked).toBe(0);
    // Play until a run has answered a question, and fold it into a new profile.
    for (let seed = 1; seed < 200; seed++) {
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s: GameState = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
      let answered = 0;
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        if (questionOf(library, card) !== undefined && card.step === 1) answered++;
        s = resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 })));
      }
      if (answered === 0) continue;
      const after = codexProgress(library, foldRun(library, emptyMeta(), s).meta);
      expect(after.questionsAsked).toBe(answered);
      // Every outcome counted as a story is a story's, not a question's.
      const storyOutcomes = s.stats.arcOutcomes.filter((key) => questionOf(library, library.cards.get(key.split(":")[0]!)!) === undefined);
      expect(after.storiesSeen).toBe(storyOutcomes.length);
      expect(stories.length).toBeGreaterThan(0);
      return;
    }
    throw new Error("no run answered a question");
  });

  it("does not count as a story an outcome of a card the deck no longer has", () => {
    const outcome = aStoryOutcome();
    const meta = { ...emptyMeta(), arcOutcomes: [outcome, "q_treaty_l_a4:left", "gone_card:right"] };
    expect(codexProgress(library, meta).storiesSeen).toBe(1);
  });
});

/** One outcome of an ordinary story, as a profile records it. */
function aStoryOutcome(): string {
  const story = content.arcs.find((a) => a.question === undefined)!;
  return arcOutcomes(library, story.id)[0]!.key;
}
