import { endRun } from "./endings";
import { getCard, type Library } from "./library";
import { bandOf, clampDrift, clampMeter, exitBand, fxDeltas, hasFlag, moodOf, replaceAdvisor, roll } from "./state";
import type { Card, GameState, Meters, RunStats, Side } from "./types";
import { BLOC_KEYS, CORE_KEYS, METER_KEYS } from "./types";

/**
 * How the advisor currently holding a role scales that role's own card effects (5.8).
 * Traits multiply; `gain` applies to effects that help, `loss` to effects that hurt.
 */
export function traitScale(lib: Library, state: GameState, speaker: string): { gain: number; loss: number } {
  const advisor = lib.advisorsById.get(state.cabinet[speaker] ?? "");
  let gain = 1;
  let loss = 1;
  for (const t of advisor?.traits ?? []) {
    const fx = lib.config.traitEffects[t];
    if (!fx) continue;
    gain *= fx.gain;
    loss *= fx.loss;
  }
  return { gain, loss };
}

/**
 * Apply one choice: meter effects (scaled by band volatility and advisor traits), drift, flags, queue,
 * arc pointer, election bookkeeping and any ending the choice itself carries.
 * Does not tick the card counter. Deterministic (no RNG), so preview() can reuse it.
 */
export function applyChoice(lib: Library, state: GameState, card: Card, side: Side): GameState {
  const cfg = lib.config;
  const choice = card[side];
  let s = state;

  let endingId: string | null = choice.ending ?? null;
  if (card.type === "election") {
    if (choice.honest) {
      const lost = moodOf(s.meters) < cfg.electionMoodThreshold;
      endingId = lost ? (choice.ending ?? cfg.electionLossEnding) : null;
    }
    const interval = choice.electionDelay ?? cfg.electionInterval;
    s = { ...s, nextElectionAt: s.cardCount + interval };
  }

  const mult = cfg.volatility[s.band];
  const trait = traitScale(lib, s, card.speaker);
  const meters: Meters = { ...s.meters };
  for (const k of METER_KEYS) {
    const v = fxDeltas(choice.fx)[k];
    if (v) meters[k] = clampMeter(meters[k] + Math.round(v * mult * (v > 0 ? trait.gain : trait.loss)));
  }
  const drift = clampDrift(s.drift + (choice.drift ?? 0));

  let flags = s.flags;
  if (choice.clearFlags?.length) {
    const clear = choice.clearFlags;
    flags = flags.filter((f) => !clear.includes(f));
  }
  if (choice.setFlags?.length) {
    const add = choice.setFlags.filter((f, i, arr) => !flags.includes(f) && arr.indexOf(f) === i);
    if (add.length) flags = [...flags, ...add];
  }

  let queue = s.queue;
  if (choice.enqueue?.length) {
    queue = [...queue, ...choice.enqueue.map((e) => ({ id: e.id, dueAt: s.cardCount + e.delay }))];
  }

  let activeArcs = s.activeArcs;
  if (card.arc) {
    const next = choice.nextByAlign?.[s.align] ?? choice.next ?? null;
    const idx = activeArcs.findIndex((a) => a.id === card.arc);
    activeArcs =
      idx >= 0
        ? activeArcs.map((a, i) => (i === idx ? { ...a, nextCard: next } : a))
        : [...activeArcs, { id: card.arc, nextCard: next }];
  } else if (choice.next) {
    // A plain card handing off to a specific card: play it next.
    queue = [...queue, { id: choice.next, dueAt: s.cardCount + 1 }];
  }

  s = { ...s, meters, drift, flags, queue, activeArcs };
  if (endingId) s = endRun(lib, s, endingId);
  return s;
}

/**
 * Meter extremes oust you (5.1). A bloc at zero has abandoned you; the state meters still
 * fail at both ends; and a cult is every bloc adoring you at once, with nobody left to
 * disagree (BACKLOG item 5). Choice endings already set take precedence.
 */
export function checkOuster(lib: Library, state: GameState): GameState {
  if (state.over) return state;
  const cfg = lib.config;
  for (const k of METER_KEYS) {
    if (state.meters[k] <= 0) return endRun(lib, state, cfg.meterEndings[k].low);
  }
  for (const k of CORE_KEYS) {
    const high = cfg.meterEndings[k].high;
    if (high && state.meters[k] >= 100) return endRun(lib, state, high);
  }
  if (BLOC_KEYS.every((b) => state.meters[b] >= cfg.cultAt)) return endRun(lib, state, cfg.cultEnding);
  return state;
}

/** Coup risk for the abolished-elections path, in [0, 1]. */
export function coupRisk(lib: Library, state: GameState): number {
  const cfg = lib.config;
  const shortfall = Math.max(0, 50 - state.meters.order) + Math.max(0, 50 - state.meters.inst);
  return Math.min(1, Math.max(0, cfg.coupBase + cfg.coupPerPoint * shortfall));
}

/**
 * Once elections are abolished the election slot becomes a coup-risk check against
 * Order and Institutions (5.4). Regular elections are drawn as cards by draw().
 */
export function checkElection(lib: Library, state: GameState): GameState {
  if (state.over) return state;
  const cfg = lib.config;
  if (!hasFlag(state, cfg.electionsAbolishedFlag)) return state;
  if (state.cardCount < state.nextElectionAt) return state;
  const [p, s1] = roll(state);
  const s2 = { ...s1, nextElectionAt: s1.cardCount + cfg.electionInterval };
  if (p < coupRisk(lib, s2)) return endRun(lib, s2, cfg.coupEnding);
  return s2;
}

/**
 * Era boundary: after the last era the run ends in a finale by band; otherwise a
 * successor takes office, the band is recomputed (and locked past bandLockAfterEra),
 * meters are pulled toward 50 and the election clock restarts (5.3).
 */
export function advanceEra(lib: Library, state: GameState): GameState {
  if (state.over) return state;
  const cfg = lib.config;
  if (state.cardCount < state.era * cfg.eraLength) return state;
  if (state.era >= cfg.eraCount) {
    return endRun(lib, state, `${cfg.finalePrefix}${exitBand(lib, state)}`);
  }
  const era = state.era + 1;
  const band = state.bandLocked ? state.band : bandOf(lib, state.drift);
  const bandLocked = state.bandLocked || era > cfg.bandLockAfterEra;
  const meters: Meters = { ...state.meters };
  if (cfg.eraMeterPull > 0) {
    for (const k of METER_KEYS) meters[k] = clampMeter(Math.round(meters[k] + (50 - meters[k]) * cfg.eraMeterPull));
  }
  return { ...state, era, band, bandLocked, meters, nextElectionAt: state.cardCount + cfg.electionInterval };
}

/**
 * Resolve the card on the table (core loop steps 3–5): apply the choice, check
 * ousters, tick the counter, fire the election/coup check and era transition.
 */
export function resolve(lib: Library, state: GameState, cardId: string, side: Side): GameState {
  if (state.over) return state;
  if (state.current !== cardId) {
    throw new Error(`resolve: card ${cardId} is not on the table (current: ${state.current})`);
  }
  const card = getCard(lib, cardId);
  const choice = card[side];
  let s = applyChoice(lib, state, card, side);

  const stats: RunStats = { ...s.stats };
  const drift = choice.drift ?? 0;
  if (drift < 0) stats.tempting++;
  else if (drift > 0) stats.honest++;
  else stats.neutral++;
  if (card.type === "election") {
    if (choice.honest) stats.electionsHonest++;
    else stats.electionsCheated++;
  }
  if (choice.fireSpeaker) {
    const before = s.cabinet[card.speaker];
    s = replaceAdvisor(lib, s, card.speaker);
    if (s.cabinet[card.speaker] !== before) stats.advisorsFired++;
  }
  s = { ...s, stats, current: null, cardCount: s.cardCount + 1 };
  s = checkOuster(lib, s);
  s = checkElection(lib, s);
  s = advanceEra(lib, s);
  return s;
}
