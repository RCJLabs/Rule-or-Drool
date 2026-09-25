import { draw } from "../engine/draw";
import { getCard, questionOfArc, type Library } from "../engine/library";
import { honestCount, losingEnding, resolve } from "../engine/resolve";
import { makeRng } from "../engine/rng";
import { exitBand, newRun, rollSetup } from "../engine/state";
import { survivedTo } from "../engine/endings";
import type { Band, GameState, PlayerAlign, RunSetup, Side } from "../engine/types";
import { BOTS, makeContext, type BotName, type BotOptions } from "./bots";

export interface RunResult {
  seed: number;
  bot: BotName;
  align: PlayerAlign;
  cards: number;
  era: number;
  endingId: string;
  exitBand: Band;
  drift: number;
  /** Survived every era and ended in a finale. */
  finale: boolean;
  electionsSeen: number;
  cheats: number;
  /** Campaign cards played (BACKLOG-10 phase 56), and of those the ones campaigned the easy way. */
  campaigns: number;
  easyCampaigns: number;
  /**
   * Votes the card told wrong (BACKLOG-9 phase 53): it said an honest count would win and the
   * honest side lost the vote, or the other way round. Anything but zero means the card lied.
   */
  mistold: number;
  /** Stories this run entered. */
  arcs: number;
  /** Questions this run was asked (BACKLOG-6 phase 40), which are arcs with a budget of their own. */
  questions: number;
  modifiers: string[];
  /** Everyone who held a cabinet role at any point in the run, the rival aside (BACKLOG-5 phase 35). */
  served: string[];
  /** Pool draws that only succeeded because a filter was relaxed (content thinness). */
  relaxed: { cooldown: number; band: number; era: number };
}

export interface RunOptions extends BotOptions {
  /** Safety valve so a broken content set cannot loop forever. */
  maxCards: number;
  /** Meta unlock tokens in force; default none, i.e. a first-time player (5.10). */
  unlocked?: string[];
  /** Eras per run: the ordinary game's by default, or a long reign's (BACKLOG-5 phase 39). */
  eraCount?: number;
}

export const DEFAULT_RUN_OPTIONS: RunOptions = { danger: 25, maxCards: 1000 };

const SIDES: readonly Side[] = ["left", "right"];

export function playRun(lib: Library, bot: BotName, seed: number, align: PlayerAlign, opts: RunOptions = DEFAULT_RUN_OPTIONS): RunResult {
  const setup = rollSetup(lib, seed, align, opts.unlocked ?? []);
  return playRunFrom(lib, bot, seed, opts.eraCount === undefined ? setup : { ...setup, eraCount: opts.eraCount }, opts);
}

/**
 * A bot playing from a given setup rather than one rolled from its own unlocks: the run a
 * person played, from its code, so the two can be set side by side (BACKLOG-5 phase 31).
 */
export function playRunFrom(lib: Library, bot: BotName, seed: number, setup: RunSetup, opts: RunOptions = DEFAULT_RUN_OPTIONS): RunResult {
  const policy = BOTS[bot];
  const rng = makeRng(seed ^ 0x5bd1e995);
  const align = setup.align;
  let state: GameState = newRun(lib, seed, setup);
  const served = new Set<string>();
  const seat = (s: GameState) => {
    for (const [role, id] of Object.entries(s.cabinet)) if (role !== lib.config.rivalRole) served.add(id);
  };
  seat(state);
  const relaxed = { cooldown: 0, band: 0, era: 0 };
  let electionsSeen = 0;
  let cheats = 0;
  let mistold = 0;
  let campaigns = 0;
  let easyCampaigns = 0;

  while (!state.over) {
    if (state.cardCount >= opts.maxCards) throw new Error(`run exceeded ${opts.maxCards} cards (seed ${seed}, bot ${bot})`);
    const before = state;
    state = draw(lib, state);
    const id = state.current!;
    const card = getCard(lib, id);

    // The draw says why the card is here now, so the relaxed-filter count no longer has to
    // reconstruct it from the queue and the active arcs (BACKLOG-3 phase 19).
    if (card.type === "event" && (card.weight ?? 1) > 0 && (state.currentFrom === "deck" || state.currentFrom === "habit")) {
      if (before.cooldown.includes(id)) relaxed.cooldown++;
      if (!card.bands.includes(before.band)) relaxed.band++;
      if (!card.eras.includes(before.era)) relaxed.era++;
    }

    const ctx = makeContext(lib, state, card, rng, opts);
    const side = policy(ctx);
    if (card.type === "election") {
      electionsSeen++;
      if (!card[side].honest) cheats++;
      // What the card says an honest count will do, against what the honest side then does,
      // whichever side the bot takes: it loses the vote when it ends the run as a lost vote
      // ends, or when it puts the run out of office (BACKLOG-10 phase 55).
      const honest = SIDES.find((h) => card[h].honest);
      if (honest) {
        const out = ctx[honest].outOfOffice && !state.opposition;
        const lost = out || ctx[honest].endingId === (card[honest].ending ?? losingEnding(lib, state));
        if (honestCount(lib, state).wins === lost) mistold++;
      }
    }
    if (card.campaign) {
      campaigns++;
      if ((card[side].drift ?? 0) < (card[side === "left" ? "right" : "left"].drift ?? 0)) easyCampaigns++;
    }
    state = resolve(lib, state, id, side);
    seat(state);
  }

  const endingId = state.over!.endingId;
  return {
    seed,
    bot,
    align,
    cards: state.cardCount,
    era: state.era,
    endingId,
    exitBand: exitBand(lib, state),
    drift: state.drift,
    finale: survivedTo(lib.config, endingId),
    electionsSeen,
    cheats,
    campaigns,
    easyCampaigns,
    mistold,
    arcs: state.activeArcs.filter((a) => questionOfArc(lib, a.id) === undefined).length,
    questions: state.activeArcs.filter((a) => questionOfArc(lib, a.id) !== undefined).length,
    modifiers: state.modifiers,
    served: [...served],
    relaxed,
  };
}

export interface SimOptions extends RunOptions {
  runs: number;
  seed: number;
  bots: readonly BotName[];
  align: PlayerAlign | "alternate";
}

export function simulate(lib: Library, opts: SimOptions): Map<BotName, RunResult[]> {
  const out = new Map<BotName, RunResult[]>();
  for (const bot of opts.bots) {
    const results: RunResult[] = [];
    for (let i = 0; i < opts.runs; i++) {
      const seed = opts.seed + i;
      const align: PlayerAlign = opts.align === "alternate" ? (i % 2 === 0 ? "left" : "right") : opts.align;
      results.push(playRun(lib, bot, seed, align, opts));
    }
    out.set(bot, results);
  }
  return out;
}
