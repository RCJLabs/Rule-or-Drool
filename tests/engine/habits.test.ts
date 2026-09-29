import { describe, expect, it } from "vitest";
import { content, library } from "../../src/content";
import { draw, isHabitCard } from "../../src/engine/draw";
import { EMPTY_HABITS, HABIT_RUNS, allHabitMarks, habitMarks, noticeHabits } from "../../src/engine/habits";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { Card, FxSpec, GameState } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim";
import { checkRules } from "../../src/validate/rules";

/**
 * The deck notices how you rule (BACKLOG-13 phase 94): a way of ruling read off every choice, a
 * mark when a run shows one, and a card written for it that comes while it still shows.
 */

const marks = habitMarks(library.config);
const start = (): GameState => newRun(library, 3, { align: "left" });

/** A card whose left side has these effects and drift. */
function choice(fx: FxSpec, drift = 0, extra: Partial<Card> = {}): Card {
  return {
    id: "t",
    type: "event",
    align: "any",
    eras: [1],
    bands: ["muddle"],
    speaker: "chief",
    text: "",
    left: { label: "a", fx, drift },
    right: { label: "b", fx: {}, drift: 0 },
    ...extra,
  } as Card;
}

/** The same choice made `n` times. */
const made = (s: GameState, c: Card, n: number): GameState => {
  let out = s;
  for (let i = 0; i < n; i++) out = noticeHabits(library, out, c, "left");
  return out;
};

describe("a way of ruling", () => {
  it("is marked once a bloc is pleased five choices running, and starts again after one that pleases another", () => {
    const base = choice({ base: 4, backers: 1 });
    expect(made(start(), base, HABIT_RUNS.favoured - 1).flags).not.toContain(marks.favoured.base);
    expect(made(start(), base, HABIT_RUNS.favoured).flags).toContain(marks.favoured.base);
    // One that pleases the backers more breaks it; one that pleases none does too.
    const broken = made(noticeHabits(library, made(start(), base, 4), choice({ backers: 5 }), "left"), base, 4);
    expect(broken.flags).not.toContain(marks.favoured.base);
    expect(made(noticeHabits(library, made(start(), base, 4), choice({ money: 3 }), "left"), base, 4).flags).not.toContain(marks.favoured.base);
    // A tie pleases nobody in particular.
    expect(made(start(), choice({ base: 3, public: 3 }), 10).flags.filter((f) => f.includes("favoured"))).toEqual([]);
  });

  it("is marked when a bloc loses on six choices running, the money is raised on four, or the State cut on six", () => {
    expect(made(start(), choice({ public: -2 }), HABIT_RUNS.leftOut).flags).toContain(marks.leftOut.public);
    expect(made(start(), choice({ public: -2 }), HABIT_RUNS.leftOut - 1).flags).not.toContain(marks.leftOut.public);
    expect(made(start(), choice({ money: 3 }), HABIT_RUNS.money).flags).toContain(marks.money);
    expect(made(start(), choice({ inst: -2 }), HABIT_RUNS.state).flags).toContain(marks.state);
    expect(made(start(), choice({ inst: -2 }), HABIT_RUNS.state - 1).flags).not.toContain(marks.state);
  });

  it("counts the easy way through choices that lean neither way, and starts again at an honest one", () => {
    const easy = choice({}, -3);
    const neutral = choice({}, 0);
    let s = made(start(), easy, 3);
    s = made(s, neutral, 5);
    expect(made(s, easy, HABIT_RUNS.easy - 3).flags).toContain(marks.easy);
    const reset = noticeHabits(library, made(start(), easy, 5), choice({}, 2), "left");
    expect(made(reset, easy, HABIT_RUNS.easy - 1).flags).not.toContain(marks.easy);
  });

  it("is marked when every vote so far was arranged, two of them, and when every campaign was won the easy way", () => {
    const s = start();
    const arranged = { ...s, stats: { ...s.stats, electionsCheated: 2, electionsHonest: 0 } };
    expect(noticeHabits(library, arranged, choice({}), "left").flags).toContain(marks.votes);
    expect(noticeHabits(library, { ...arranged, stats: { ...arranged.stats, electionsHonest: 1 } }, choice({}), "left").flags).not.toContain(marks.votes);
    const campaign = { ...choice({ base: 2 }, -4), campaign: true, right: { label: "b", fx: { base: 1 }, drift: 2 } } as Card;
    expect(easyTwice(campaign).flags).toContain(marks.campaigns);
    // One fought honestly between them, and it is not every campaign.
    const mixed = noticeHabits(library, noticeHabits(library, noticeHabits(library, start(), campaign, "left"), campaign, "right"), campaign, "left");
    expect(mixed.flags).not.toContain(marks.campaigns);
  });

  it("marks a way once, keeps what it has counted on the state, and starts from nothing for a run saved before", () => {
    const s = made(start(), choice({ money: 3 }), HABIT_RUNS.money + 3);
    expect(s.flags.filter((f) => f === marks.money)).toHaveLength(1);
    expect(s.habits?.money).toBe(HABIT_RUNS.money + 3);
    const before = { ...start(), habits: undefined };
    expect(noticeHabits(library, before, choice({ money: 3 }), "left").habits).toEqual({ ...EMPTY_HABITS, money: 1, pleased: { bloc: null, run: 0 } });
  });
});

function easyTwice(campaign: Card): GameState {
  return noticeHabits(library, noticeHabits(library, start(), campaign, "left"), campaign, "left");
}

describe("the cards that notice it", () => {
  const cards = content.cards.filter((c) => c.id.startsWith("hw_"));

  it("are habit cards, one a party for every way, each reading a mark the engine sets", () => {
    const all = new Set(allHabitMarks(library.config));
    expect(cards).toHaveLength(22);
    for (const c of cards) {
      expect(isHabitCard(library, c), c.id).toBe(true);
      expect(
        c.cond!.flags!.every((f) => all.has(f)),
        c.id,
      ).toBe(true);
      expect(c.align === "left" || c.align === "right", c.id).toBe(true);
    }
    for (const f of all)
      for (const party of ["left", "right"])
        expect(
          cards.filter((c) => c.align === party && c.cond!.flags!.includes(f)),
          `${f} ${party}`,
        ).toHaveLength(1);
  });

  it("each ask the honest way against the self-serving one", () => {
    for (const c of cards) expect([(c.left.drift ?? 0) > 0, (c.right.drift ?? 0) < 0], c.id).toEqual([true, true]);
  });

  it("come while the way still shows: soon after the mark, in nearly every run that shows one", () => {
    const delays: number[] = [];
    let marked = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rng = makeRng(seed ^ 0x3c6ef372);
      let s = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
      const at = new Map<string, number>();
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        if (card.id.startsWith("hw_")) {
          expect(s.currentFrom).toBe("habit");
          const when = at.get(card.cond!.flags![0]!);
          expect(when, card.id).toBeDefined();
          delays.push(s.cardCount - when!);
        }
        const before = new Set(s.flags);
        s = resolve(library, s, card.id, BOTS.informed(makeContext(library, s, card, rng, { danger: 25 })));
        for (const f of s.flags) if (!before.has(f) && f.startsWith("mark_") && allHabitMarks(library.config).includes(f)) at.set(f, s.cardCount);
      }
      marked += at.size;
    }
    expect(marked).toBeGreaterThan(40);
    expect(delays.length / marked).toBeGreaterThan(0.85);
    expect([...delays].sort((a, b) => a - b)[Math.floor(delays.length / 2)]).toBeLessThanOrEqual(3);
  });

  it("are refused by the content gate when they read a mark no way of ruling sets", () => {
    const stray = { ...cards[0]!, id: "hw_stray", cond: { flags: ["mark_favoured_nobody"] } };
    const issues = checkRules({ ...content, cards: [...content.cards, stray] });
    expect(issues.some((i) => i.code === "flag-unset" && i.message.includes("mark_favoured_nobody"))).toBe(true);
    expect(checkRules(content).some((i) => i.code === "flag-unset")).toBe(false);
  });
});
