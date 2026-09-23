import type { Library } from "../engine/library";
import type { MetaState } from "./types";

/** One answer to a question: the legacy it leaves, and the words it is given on the card. */
export interface Answer {
  flag: string;
  label: string;
}

/**
 * The questions (BACKLOG-6 phases 40-41) and their two answers, in the order the content asks
 * them. Each side asks a question in its own words, but the answers are the same two on both
 * sides, set by the same swipe, so the first arc found for a question speaks for it.
 */
export function questionsOf(lib: Library): { id: string; answers: [Answer, Answer] }[] {
  const out: { id: string; answers: [Answer, Answer] }[] = [];
  const done = new Set<string>();
  for (const arc of lib.content.arcs) {
    if (arc.question === undefined || done.has(arc.question)) continue;
    done.add(arc.question);
    const asking = lib.cards.get(arc.cards[0] ?? "");
    const left = asking?.left.setFlags?.[0];
    const right = asking?.right.setFlags?.[0];
    if (!asking || !left || !right) continue;
    out.push({ id: arc.question, answers: [{ flag: left, label: asking.left.label }, { flag: right, label: asking.right.label }] });
  }
  return out;
}

/**
 * How a player has answered each question across their runs (BACKLOG-6 phase 42), read from
 * the legacies a profile already counts: an answer is a legacy, so the runs that left it are
 * the runs that gave it.
 */
export function answeredQuestions(lib: Library, meta: Pick<MetaState, "legacies">): { id: string; answers: (Answer & { times: number })[]; asked: number }[] {
  return questionsOf(lib).map(({ id, answers }) => {
    const counted = answers.map((a) => ({ ...a, times: meta.legacies[a.flag] ?? 0 }));
    return { id, answers: counted, asked: counted.reduce((n, a) => n + a.times, 0) };
  });
}
