import { STRINGS } from "../content/strings";
import { survivedTo, withNames } from "../engine/endings";
import type { Library } from "../engine/library";
import { LOST_OFFICE_FLAG, goesOut } from "../engine/opposition";
import { replayTo } from "../engine/replay";
import { applyChoice, coupRisk, honestCount, type HonestCount } from "../engine/resolve";
import { hasFlag } from "../engine/state";
import type { Card, GameState, MeterKey, Side } from "../engine/types";
import { BLOC_KEYS, METER_KEYS } from "../engine/types";
import { countBand } from "./count";
import { shownInDanger } from "./signals";
import { meterName } from "./speech";

/**
 * Why a run ended, said on the end screen (BACKLOG-11 phase 67). The screen led
 * with the history's name and gave how the run stopped as a title and a sentence; the meters are
 * gone by then, since the game goes to the end screen on the card that ended it. A run cut short
 * learned a name and had to guess the rest, and the four endings for a meter that goes too high
 * were explained nowhere.
 *
 * Everything here is read back from the run: its last choice, and the run as it stood with that
 * card on the table, which the record of choices puts back exactly (`replayTo`). In words, as the
 * rest of the game is: the meters' numbers are never shown, so neither are they here.
 */
export type EndCause =
  /**
   * A meter at an edge. `before` is where it stood with the last card on the table, and `chosen`
   * where the side taken left it: short of the edge when the era's own pressure took the rest.
   */
  | { kind: "meter"; meter: MeterKey; edge: "low" | "high"; card: Card | null; side: Side | null; before: number | null; chosen: number | null; byEra: boolean; outOfOffice: boolean }
  /** Every bloc high at once. */
  | { kind: "cult"; card: Card | null; side: Side | null }
  /**
   * A vote left to the count and lost, where losing it ended the run: the way back into office,
   * or a second lost vote once the first had sent the run out.
   */
  | { kind: "count"; card: Card; side: Side; count: HonestCount; returnVote: boolean; second: boolean }
  /** The side taken ended the run itself: a story's end, or an ending chosen outright. */
  | { kind: "choice"; card: Card; side: Side }
  /** The coup roll that replaces the vote once it is abolished, at the odds it was rolled at. */
  | { kind: "coup"; risk: number }
  /**
   * Seen through, but out of office: a count lost in the run's last era, or a first term's,
   * with no vote left to win it back (BACKLOG-11 phase 70). The finale read as if the office
   * had been kept.
   */
  | { kind: "out" };

/** The run's last choice: the card and the side, where the run kept a record of them. */
function lastChoice(lib: Library, state: GameState): { card: Card; side: Side } | null {
  const made = state.choices?.[state.cardCount - 1];
  const card = made ? lib.cards.get(made[0]) : undefined;
  return made && card ? { card, side: made[1] } : null;
}

/** The meter whose edge this ending is, and which edge. */
function meterOf(lib: Library, state: GameState, endingId: string): { meter: MeterKey; edge: "low" | "high" } | null {
  for (const k of METER_KEYS) {
    const e = lib.config.meterEndings[k];
    if (e.low === endingId && state.meters[k] <= 0) return { meter: k, edge: "low" };
    if (e.high === endingId && state.meters[k] >= 100) return { meter: k, edge: "high" };
  }
  return null;
}

/**
 * How this run ended, or null for one that was seen through in office (a finale, a first term's
 * end) and for one whose ending cannot be read back. `before` is the run with its last card on
 * the table, when the caller has it already; otherwise it is replayed from the record.
 */
export function endCause(lib: Library, state: GameState, before: GameState | null = replayTo(lib, state, state.cardCount - 1)): EndCause | null {
  const over = state.over;
  if (!over) return null;
  if (survivedTo(lib.config, over.endingId)) return state.opposition ? { kind: "out" } : null;
  const cfg = lib.config;
  const id = over.endingId;
  const last = lastChoice(lib, state);
  const at = before && last && before.current === last.card.id ? before : null;

  if (last) {
    const choice = last.card[last.side];
    // A vote left to the count: lost where losing ends the run, it is the count that ended it,
    // whatever the ending is called. Won, or lost the first time, which only sends the run out,
    // the run can still end on the card at a meter's edge.
    if (last.card.type === "election" && choice.honest && at) {
      const count = honestCount(lib, at);
      const returnVote = !!last.card.opposition;
      if (!count.wins && !goesOut(lib, at, last.card)) {
        return { kind: "count", card: last.card, side: last.side, count, returnVote, second: !returnVote && hasFlag(at, LOST_OFFICE_FLAG) };
      }
    } else if (choice.ending === id) {
      return { kind: "choice", card: last.card, side: last.side };
    }
  }
  // The roll comes after the card, and only once the vote is gone: the card did not cause it.
  if (id === cfg.coupEnding && hasFlag(state, cfg.electionsAbolishedFlag)) return { kind: "coup", risk: coupRisk(lib, state) };
  if (id === cfg.cultEnding) return { kind: "cult", card: last?.card ?? null, side: last?.side ?? null };

  const edge = meterOf(lib, state, id);
  if (!edge) return null;
  const { meter } = edge;
  // Whether the choice took it over, or the era's own pressure did once the choice was made.
  const chosen = at && last ? applyChoice(lib, at, last.card, last.side).meters[meter] : null;
  const byEra = chosen !== null && (edge.edge === "low" ? chosen > 0 : chosen < 100);
  return {
    kind: "meter",
    ...edge,
    card: last?.card ?? null,
    side: last?.side ?? null,
    before: at ? at.meters[meter] : null,
    chosen,
    byEra,
    outOfOffice: !!at?.opposition,
  };
}

const isBloc = (k: MeterKey) => (BLOC_KEYS as readonly string[]).includes(k);

/** Where a meter stood, in the words its icon gave the eye: at the edge, or low, about half, high. */
function levelWord(k: MeterKey, value: number, outOfOffice: boolean): string {
  const { levels } = STRINGS.cause;
  if (shownInDanger(k, value, outOfOffice)) return levels.edge;
  return value < 35 ? levels.low : value > 65 ? levels.high : levels.half;
}

/** The odds of a coup, in words. */
export function oddsWord(risk: number): string {
  const { odds } = STRINGS.cause;
  const at = odds.find(([upTo]) => risk <= upTo);
  return (at ?? odds[odds.length - 1]!)[1];
}

/** The line for the end screen, or null for a run seen through in office or one that cannot be read back. */
export function causeLine(lib: Library, state: GameState, cause: EndCause | null = endCause(lib, state)): string | null {
  if (!cause) return null;
  const c = STRINGS.cause;
  const label = (card: Card, side: Side) => card[side].label;
  switch (cause.kind) {
    case "choice":
      return withNames(lib, state, c.choice.replace("{label}", label(cause.card, cause.side)));
    case "coup":
      return c.coup.replace("{odds}", oddsWord(cause.risk));
    case "out":
      return withNames(lib, state, c.out);
    case "count": {
      const band = countBand(cause.count) === "narrowLoss" ? c.lost.narrow : c.lost.plain;
      const template = cause.returnVote ? c.count.back : cause.second ? c.count.second : c.count.first;
      return template.replace("{label}", label(cause.card, cause.side)).replace("{lost}", band);
    }
    case "cult":
      return c.cult;
    case "meter": {
      const bloc = isBloc(cause.meter);
      const name = bloc ? c.bloc.replace("{name}", meterName(cause.meter, state.align)) : c.names[cause.meter as "money" | "order" | "inst"];
      const kind = bloc ? "bloc" : "state";
      const edge = cause.edge;
      const why = edge === "high" ? ` ${c.high[cause.meter as "money" | "order" | "inst"]}` : "";
      const lines = cause.byEra ? c.byEra : c.byChoice;
      const where = cause.byEra ? cause.chosen : cause.before;
      const template = kind === "bloc" ? (edge === "low" ? lines.bloc : null) : lines.state[edge];
      if (!cause.card || !cause.side || where === null || !template) return `${c.bare[edge].replace("{meter}", name)}${why}`;
      return `${template
        .replace("{meter}", name)
        .replace("{level}", levelWord(cause.meter, where, cause.outOfOffice))
        .replace("{label}", label(cause.card, cause.side))}${why}`;
    }
  }
}
