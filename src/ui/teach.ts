import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { Card, GameState, PlayerAlign } from "../engine/types";
import { BLOC_KEYS } from "../engine/types";

/**
 * The game teaches by playing rather than by telling (BACKLOG-2 phase 10). Each lesson is
 * attached to the moment that demonstrates it, fires once ever, and says the one thing the
 * screen cannot: why this card is here, what the six meters are, that nothing displays the
 * direction the country is going.
 */
export interface Lesson {
  id: string;
  title: string;
  /** Written for the moment it fires; `who` is filled with a bloc name when one applies. */
  body: (who: string) => string;
  /** True when this card, in this state, is the moment. */
  when: (ctx: LessonContext) => boolean;
}

export interface LessonContext {
  state: GameState;
  card: Card;
  /** Weight 0 means it can only have arrived because something queued it. */
  delayed: boolean;
  /** The unhappiest bloc under the threshold, if any. */
  restless: (typeof BLOC_KEYS)[number] | null;
}

/** The lowest bloc under 40, which is the point at which one of them is visibly a problem. */
function worstBloc(state: GameState): (typeof BLOC_KEYS)[number] | null {
  let worst: (typeof BLOC_KEYS)[number] | null = null;
  for (const b of BLOC_KEYS) {
    if (state.meters[b] >= 40) continue;
    if (!worst || state.meters[b] < state.meters[worst]) worst = b;
  }
  return worst;
}

/**
 * Ordered by when they should first be possible, and only one is ever shown at a time, so a
 * busy card cannot bury the player in notes.
 */
export const LESSONS: readonly Lesson[] = [
  {
    id: "meters",
    title: "Six meters, two kinds",
    body: () =>
      "The first three are your coalition: three groups who want different things from you. The last three belong to the state. Any of them hitting bottom ends your rule.",
    when: ({ state }) => state.cardCount === 0,
  },
  {
    id: "hidden",
    title: "Nothing shows the direction",
    body: () =>
      "There is no score. Where the country is heading is hidden, and the only clue is how the page itself looks and reads as you go.",
    when: ({ state }) => state.cardCount === 4,
  },
  {
    id: "delayed",
    title: "This one is your own doing",
    body: () =>
      "This card was not dealt: an earlier choice sent it. Most of what goes wrong here was decided some time ago, by you.",
    when: ({ delayed }) => delayed,
  },
  {
    id: "bloc",
    title: "One of them in particular",
    body: (who) =>
      `Support is not one number. ${who} are unhappy while the others are not, and a group that walks out ends the run on its own.`,
    when: ({ restless }) => restless !== null,
  },
  {
    id: "arc",
    title: "A story, not a card",
    body: () => "This one comes back. It remembers which way you went, and the two sides lead somewhere different.",
    when: ({ card }) => card.type === "arc",
  },
  {
    id: "election",
    title: "The count reads the average",
    body: () =>
      "An honest win needs the average of your three groups. Cheating is always cheaper today, which is the whole problem with it.",
    when: ({ card }) => card.type === "election",
  },
];

export const LESSONS_BY_ID: ReadonlyMap<string, Lesson> = new Map(LESSONS.map((l) => [l.id, l]));

/** The lesson this moment should teach, if there is one the player has not had. */
export function lessonFor(lib: Library, state: GameState, taught: readonly string[]): Lesson | null {
  const id = state.current;
  if (!id || state.over) return null;
  const card = lib.cards.get(id);
  if (!card) return null;
  const ctx: LessonContext = {
    state,
    card,
    delayed: (card.weight ?? 1) === 0,
    restless: worstBloc(state),
  };
  return LESSONS.find((l) => !taught.includes(l.id) && l.when(ctx)) ?? null;
}

/** The lesson's text with the bloc named, for the side the player actually leads. */
export function lessonBody(lesson: Lesson, state: GameState): string {
  const bloc = worstBloc(state);
  const who = bloc ? STRINGS.blocNames[state.align as PlayerAlign][bloc] : "They";
  return lesson.body(who);
}
