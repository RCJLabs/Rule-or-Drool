import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { electionBar, resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { moodOf, newRun, rollSetup } from "../../src/engine/state";
import type { GameState, Side } from "../../src/engine/types";
import { closeRun, openRun, takeCard, type RecordedRun } from "../../src/playtest/record";
import type { Trace } from "../../src/playtest/trace";
import { BOTS, makeContext, nearAnEdge, type BotName } from "../../src/sim/bots";

/** A whole run played the way the game plays one, and recorded the way the game records it. */
export function recordRun(seed: number, pick: (i: number) => Side = (i) => (i % 3 ? "right" : "left"), ms = (i: number) => 900 + 37 * i): { run: RecordedRun; state: GameState } {
  let s = newRun(library, seed, rollSetup(library, seed, "left", []));
  let run = openRun(s, { kind: "own", run: 1, game: "0.43.0" });
  for (let i = 0; !s.over; i++) {
    s = draw(library, s);
    const side = pick(i);
    const after = resolve(library, s, s.current!, side);
    run = { ...run, cards: [...run.cards, takeCard(s, after, side, { ms: ms(i), looked: side === "left" ? [400, 0] : [0, 400] })] };
    s = after;
  }
  return { run: closeRun(library, run, s), state: s };
}

/**
 * A bot's run recorded the way the game records a person's, beside what was true at each card
 * as it was played: the look it was read in, and at a vote whether an honest one would have
 * won and whether a meter was within 25 of its edge. Worked out here while playing, not by
 * rebuilding, so a rebuild has something independent to be checked against (BACKLOG-7 phase 46).
 */
export function recordBotRun(seed: number, bot: BotName): { run: RecordedRun; seen: Trace } {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
  let run = openRun(s, { kind: "own", run: 1, game: "0.57.0" });
  // Recorded on a version from before the election card said how the count stood.
  const seen: Trace = { looks: [], votes: [], line: false };
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    const side = BOTS[bot](makeContext(library, s, card, rng, { danger: 25 }));
    seen.looks.push(s.look);
    if (card.type === "election") {
      seen.votes.push({ honest: card[side].honest === true, winnable: moodOf(s.meters) >= electionBar(library, s), near: nearAnEdge(s.meters, 25) });
    }
    const after = resolve(library, s, card.id, side);
    run = { ...run, cards: [...run.cards, takeCard(s, after, side, { ms: 1200, looked: [0, 0] })] };
    s = after;
  }
  return { run: closeRun(library, run, s), seen };
}
