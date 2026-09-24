import { draw } from "../engine/draw";
import { getCard, questionOf, type Library } from "../engine/library";
import { stageOf } from "../engine/look";
import { resolve } from "../engine/resolve";
import { makeRng } from "../engine/rng";
import { newRun, rollSetup } from "../engine/state";
import type { GameState, PlayerAlign } from "../engine/types";
import { emptyMeta, foldRun } from "../meta/state";
import { BOTS, makeContext, type BotName } from "./bots";

export interface RepeatOptions {
  /** How many players, each with their own seeds. */
  players: number;
  /** Which of each player's runs to measure (1 is their first). */
  run: number;
  /**
   * Where the players' seeds start. BACKLOG-5 audited from 100,000; BACKLOG-6 measured the
   * targets phase 44 was set against with forty players from 300,000.
   */
  seedBase?: number;
  /**
   * Which cards count: every card (the default), or only the stories' own, which repeat
   * fastest of all (BACKLOG-7 phase 48). A question's cards are not a story's.
   */
  cards?: "all" | "stories";
}

/**
 * For each player, the share of the cards in their `run`th run that they had already played
 * in an earlier one, over the whole run and era by era. A player plays their runs in order
 * with the mixed bot, on alternating sides, keeping what each run unlocks: the audit behind
 * BACKLOG-5 phase 36, which found 89% at run ten when the deck held 554 cards.
 */
export function repeatProfile(lib: Library, { players, run, seedBase = 100_000, cards = "all" }: RepeatOptions): { all: number[]; byEra: Map<number, number[]> } {
  const counts = (id: string) => {
    if (cards === "all") return true;
    const card = getCard(lib, id);
    return card.arc !== undefined && questionOf(lib, card) === undefined;
  };
  const all: number[] = [];
  const byEra = new Map<number, number[]>();
  for (let p = 0; p < players; p++) {
    let meta = emptyMeta();
    const seen = new Set<string>();
    for (let r = 1; r <= run; r++) {
      const seed = seedBase + p * 1000 + r;
      const align: PlayerAlign = (p + r) % 2 ? "left" : "right";
      const rng = makeRng(seed ^ 0x5bd1e995);
      let state: GameState = newRun(lib, seed, rollSetup(lib, seed, align, meta.unlocks));
      const drawn: { id: string; era: number }[] = [];
      while (!state.over) {
        if (state.cardCount >= 1000) throw new Error(`run exceeded 1000 cards (seed ${seed})`);
        state = draw(lib, state);
        const id = state.current!;
        if (counts(id)) drawn.push({ id, era: state.era });
        state = resolve(lib, state, id, BOTS.mixed(makeContext(lib, state, getCard(lib, id), rng, { danger: 25 })));
      }
      if (r === run && drawn.length) {
        const share = (ds: typeof drawn) => ds.filter((d) => seen.has(d.id)).length / ds.length;
        all.push(share(drawn));
        for (const era of new Set(drawn.map((d) => d.era))) {
          byEra.set(era, [...(byEra.get(era) ?? []), share(drawn.filter((d) => d.era === era))]);
        }
      }
      for (const d of drawn) seen.add(d.id);
      meta = foldRun(lib, meta, state).meta;
    }
  }
  return { all, byEra };
}

export interface LookOptions {
  /** How many first runs, each on its own seed. */
  runs: number;
  /** Where the seeds start. BACKLOG-7's audit measured 2,000 runs from 900,000. */
  seedBase?: number;
  bot?: BotName;
}

export interface LookProfile {
  /** Changes of look in a run, the median over the runs. */
  changes: number;
  /** Of all the changes, the share undone within the next three cards. */
  undone: number;
  /** Of all the cards shown, the share in a look drift alone would already have left. */
  held: number;
  /** Cards shown in a look shallower than drift alone implies, or on its other side. */
  late: number;
}

/**
 * The frame's look as a player sees it, card by card, over first runs on alternating sides
 * (BACKLOG-7 phase 45): how often it changes, how often a change is undone within three
 * cards, and what settling it costs, the cards still showing a look drift has left. At v0.56.1,
 * before the look settled, the mixed bot's runs changed 27 times and 53% of it was undone.
 */
export function lookProfile(lib: Library, { runs, seedBase = 900_000, bot = "mixed" }: LookOptions): LookProfile {
  const counts: number[] = [];
  let changes = 0, undone = 0, held = 0, late = 0, cards = 0;
  for (let i = 0; i < runs; i++) {
    const seed = seedBase + i;
    const rng = makeRng(seed ^ 0x5bd1e995);
    let state: GameState = newRun(lib, seed, rollSetup(lib, seed, i % 2 ? "left" : "right", []));
    const shown: number[] = [];
    while (!state.over) {
      if (state.cardCount >= 1000) throw new Error(`run exceeded 1000 cards (seed ${seed})`);
      state = draw(lib, state);
      const id = state.current!;
      const alone = stageOf(state.drift, lib.config);
      shown.push(state.look);
      if (state.look !== alone) held++;
      if (alone !== 0 && (Math.sign(state.look) !== Math.sign(alone) || Math.abs(state.look) < Math.abs(alone))) late++;
      state = resolve(lib, state, id, BOTS[bot](makeContext(lib, state, getCard(lib, id), rng, { danger: 25 })));
    }
    let n = 0;
    for (let k = 1; k < shown.length; k++) {
      if (shown[k] === shown[k - 1]) continue;
      n++;
      if (shown.slice(k + 1, k + 4).includes(shown[k - 1]!)) undone++;
    }
    counts.push(n);
    changes += n;
    cards += shown.length;
  }
  counts.sort((a, b) => a - b);
  return { changes: counts[counts.length >> 1] ?? 0, undone: undone / Math.max(1, changes), held: held / Math.max(1, cards), late };
}
