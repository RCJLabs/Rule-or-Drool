import { endRun } from "./endings";
export { rivalPressure } from "./state";
import { getCard, type Library } from "./library";
import { settleLook, stageOf } from "./look";
import { BROKE_MANDATE_FLAG, MANDATES_BY_ID } from "./mandates";
import { appoint, bandOf, candidatesFor, clampDrift, clampMeter, exitBand, fxDeltas, hasFlag, isFirstTerm, isLongReign, moodOf, replaceAdvisor, rivalPressure, roll } from "./state";
import { goesOut, LOST_OFFICE_FLAG, returnAtFor, WON_BACK_FLAG } from "./opposition";
import type { Card, EraBend, EraRule, GameState, Meters, RunStats, Side } from "./types";
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
 * The rules an era is played under: its own (BACKLOG item 8), then whatever this run's
 * modifiers bend it with (BACKLOG-5 phase 35).
 */
export function eraRules(lib: Library, state: Pick<GameState, "era" | "modifiers">): EraRule[] {
  return [lib.config.eraRules[state.era - 1] ?? {}, ...eraBends(lib, state.modifiers, state.era)];
}

/** What a run's modifiers add to one era's rules, in the order the modifiers were drawn. */
export function eraBends(lib: Library, modifiers: readonly string[], era: number): EraBend[] {
  return modifiers.flatMap((id) => (lib.modifiers.get(id)?.bends ?? []).filter((b) => b.era === era));
}

/**
 * A multiplier the era's rules stack: every rule in force multiplies it. Volatility also takes
 * whatever a rule sets for the band the run is in (BACKLOG-5 phase 39).
 */
function eraProduct(lib: Library, state: GameState, key: "volatility" | "queueScale"): number {
  return eraRules(lib, state).reduce((m, r) => m * (r[key] ?? 1) * (key === "volatility" ? (r.bandVolatility?.[state.band] ?? 1) : 1), 1);
}

/**
 * The share of the coalition an honest vote needs. A rival with standing takes votes that
 * would otherwise be yours, so the bar rises as they do (item 7).
 */
export function electionBar(lib: Library, state: GameState): number {
  const cfg = lib.config;
  const over = Math.max(0, rivalPressure(lib, state) - cfg.rivalStart);
  // Out of office the only vote is the return vote, and it is kinder than the one that was
  // lost: oppositions do not win elections, governments lose them (BACKLOG-10 phase 55).
  const swing = state.opposition ? cfg.returnSwing : 0;
  return cfg.electionMoodThreshold + over * cfg.rivalElectionPull - swing;
}

/**
 * How an honest count goes if it is held on these meters (BACKLOG-9 phase 53): the coalition's
 * average against the bar. The count reads the meters as the card finds them, before the
 * honest side's own effects, so the card can say what it will do before it is chosen, and
 * `applyChoice` decides the vote with this and nothing else. `margin` is the average less the
 * bar, in points; the count is won at the bar itself.
 */
export interface HonestCount {
  wins: boolean;
  margin: number;
}

export function honestCount(lib: Library, state: GameState): HonestCount {
  const mood = moodOf(state.meters);
  const bar = electionBar(lib, state);
  return { wins: mood >= bar, margin: mood - bar };
}

/** Losing a vote to a rival who has become somebody is their win, and reads as one. */
export function losingEnding(lib: Library, state: GameState): string {
  const cfg = lib.config;
  return rivalPressure(lib, state) >= cfg.rivalWinsAt ? cfg.rivalEnding : cfg.electionLossEnding;
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
  // The first honest vote a run loses sends it into opposition, where a later one would end it;
  // either side of the return vote ends the opposition, unless the run ends there
  // (BACKLOG-10 phase 55).
  let goingOut = false;
  if (card.type === "election") {
    if (choice.honest) {
      const lost = !honestCount(lib, s).wins;
      goingOut = lost && goesOut(lib, s, card);
      endingId = lost && !goingOut ? (choice.ending ?? losingEnding(lib, s)) : null;
    }
    const interval = choice.electionDelay ?? cfg.electionInterval;
    s = { ...s, nextElectionAt: s.cardCount + interval };
  }
  const comingBack = !!card.opposition && card.type === "election" && !endingId;

  const mult = cfg.volatility[s.band] * eraProduct(lib, s, "volatility");
  const trait = traitScale(lib, s, card.speaker);
  const meters: Meters = { ...s.meters };
  const deltas = fxDeltas(choice.fx);
  for (const k of METER_KEYS) {
    const v = deltas[k];
    if (v) meters[k] = clampMeter(meters[k] + Math.round(v * mult * (v > 0 ? trait.gain : trait.loss)));
  }
  const drift = clampDrift(s.drift + (choice.drift ?? 0));
  // What the rival banks: a stolen vote is the gift, a clean one is the cost. The rest of
  // their threat is not banked at all, it is read off how far you have gone (rivalPressure).
  const vote = card.type !== "election" ? 0 : choice.honest ? -cfg.rivalHonestLoss : cfg.rivalCheatGain;
  const rivalStanding = clampMeter(s.rivalStanding + vote + (choice.rival ?? 0));

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
    const scale = eraProduct(lib, s, "queueScale");
    queue = [...queue, ...choice.enqueue.map((e) => ({ id: e.id, dueAt: s.cardCount + Math.max(1, Math.round(e.delay * scale)) }))];
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

  let opposition = s.opposition;
  if (goingOut) {
    const returnAt = returnAtFor(lib, s);
    opposition = { since: s.cardCount + 1, returnAt };
    if (!flags.includes(LOST_OFFICE_FLAG)) flags = [...flags, LOST_OFFICE_FLAG];
    // The bills wait for whoever holds the office next: every one due is moved on by the
    // cards left in the era, the opposition's length.
    const wait = s.era * cfg.eraLength - (s.cardCount + 1);
    if (wait > 0) queue = queue.map((q) => ({ ...q, dueAt: q.dueAt + wait }));
  } else if (comingBack) {
    opposition = null;
    if (choice.honest && !flags.includes(WON_BACK_FLAG)) flags = [...flags, WON_BACK_FLAG];
  }

  s = { ...s, meters, drift, flags, queue, activeArcs, rivalStanding, opposition };
  // A seat filled at an era's start: the left side appoints the first of its two candidates,
  // the right side the second (BACKLOG-10 phase 61).
  if (card.appoints) {
    const pair = candidatesFor(lib, s, card.appoints);
    if (pair) s = appoint(lib, s, card.appoints, pair[side === "left" ? 0 : 1].id);
  }
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
  // Out of office, only the coalition can end the run: the state is the rival's to break, and
  // it is held off its edges so the office is never handed back already lost (BACKLOG-10
  // phase 55).
  if (state.opposition) {
    for (const b of BLOC_KEYS) {
      if (state.meters[b] <= 0) return endRun(lib, state, cfg.meterEndings[b].low);
    }
    const held = CORE_KEYS.filter((k) => state.meters[k] < 1 || state.meters[k] > 99);
    if (!held.length) return state;
    const meters = { ...state.meters };
    for (const k of held) meters[k] = Math.min(99, Math.max(1, meters[k]));
    return { ...state, meters };
  }
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
  // Somebody has to be organised enough to take over. Once the institutions are gone too,
  // what follows is not a coup, and the run is left to reach anarchy on its own terms.
  if (state.meters.inst < cfg.coupNeedsInst) return 0;
  const shortfall = Math.max(0, 50 - state.meters.order) + Math.max(0, 50 - state.meters.inst);
  // Take the ballot away and the rival does not go away with it; they just stop needing one.
  const pressure = Math.max(0, rivalPressure(lib, state) - cfg.rivalStart);
  return Math.min(1, Math.max(0, cfg.coupBase + cfg.coupPerPoint * shortfall + cfg.rivalCoupPerPoint * pressure));
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
  // Time passing with nobody able to remove you is the decay, and it is the only place a
  // decree run pays for the cheating it no longer has to do (phase 16).
  const s2 = {
    ...s1,
    nextElectionAt: s1.cardCount + cfg.electionInterval,
    drift: clampDrift(s1.drift - cfg.decreeDriftPull),
  };
  if (p < coupRisk(lib, s2)) {
    const theirs = rivalPressure(lib, s2) >= cfg.rivalWinsAt;
    return endRun(lib, s2, theirs ? cfg.rivalEnding : cfg.coupEnding);
  }
  return s2;
}

/**
 * Era boundary: after the run's last era it ends in a finale by band; otherwise a
 * successor takes office, the band is recomputed (and locked past bandLockAfterEra),
 * meters are pulled toward 50 and the election clock restarts (5.3). A long reign has two
 * eras more and finales of its own (BACKLOG-5 phase 39); a first term ends after its one
 * era in an end of its own (BACKLOG-10 phase 59).
 */
export function advanceEra(lib: Library, state: GameState): GameState {
  if (state.over) return state;
  const cfg = lib.config;
  if (state.cardCount < state.era * cfg.eraLength) return state;
  if (state.era >= (state.eraCount ?? cfg.eraCount)) {
    const prefix = isLongReign(lib, state) ? cfg.longFinalePrefix : isFirstTerm(lib, state) ? cfg.firstTermPrefix : cfg.finalePrefix;
    return endRun(lib, state, `${prefix}${exitBand(lib, state)}`);
  }
  const era = state.era + 1;
  const band = state.bandLocked ? state.band : bandOf(lib, state.drift);
  const bandLocked = state.bandLocked || era > cfg.bandLockAfterEra;
  const meters: Meters = { ...state.meters };
  if (cfg.eraMeterPull > 0) {
    for (const k of METER_KEYS) meters[k] = clampMeter(Math.round(meters[k] + (50 - meters[k]) * cfg.eraMeterPull));
  }
  // A successor takes office, even one whose side was out of it: an era is a generation, and
  // an opposition the return vote did not end (a vote on the era's last card) ends here.
  return { ...state, era, band, bandLocked, meters, nextElectionAt: state.cardCount + cfg.electionInterval, opposition: null };
}

/**
 * The era's standing pressure, applied every `passiveEvery` cards. Nothing on the table
 * caused it, which is the point: era two's money arrives whether or not you asked for it,
 * and era three's institutions wear out whoever is in charge (BACKLOG item 8). A bend brings
 * pressure of its own, on its own beat (BACKLOG-5 phase 35).
 */
export function applyEraPassive(lib: Library, state: GameState): GameState {
  if (state.cardCount === 0) return state;
  let meters: Meters | null = null;
  for (const rule of eraRules(lib, state)) {
    const every = rule.passiveEvery ?? 0;
    if (every <= 0 || state.cardCount % every !== 0) continue;
    // The era's pressure, then whatever it presses on a country in this band (BACKLOG-5 phase 39).
    for (const fx of [rule.passive, rule.bandPassive?.[state.band]]) {
      if (!fx) continue;
      meters ??= { ...state.meters };
      for (const [k, v] of Object.entries(fxDeltas(fx))) {
        meters[k as keyof Meters] = clampMeter(meters[k as keyof Meters] + v);
      }
    }
  }
  return meters ? { ...state, meters } : state;
}

/**
 * Resolve the card on the table (core loop steps 3–5): apply the choice, check
 * ousters, tick the counter, fire the election/coup check and era transition.
 */
/**
 * A promise made at setup is checked after every card and can only go one way. Breaking it
 * does not end the run and does not cost meters on the spot: the run carries the flag, the
 * country is told in its own voice a few cards later, and the codex remembers that this was
 * a run where you said one thing and did another (phase 16).
 */
export function checkMandate(lib: Library, state: GameState): GameState {
  if (!state.mandate || state.mandateBrokenAt !== null) return state;
  const mandate = MANDATES_BY_ID.get(state.mandate);
  if (!mandate || !mandate.isBroken(state)) return state;
  const queued = state.queue.some((q) => q.id === mandate.brokeCard);
  return {
    ...state,
    mandateBrokenAt: state.cardCount,
    flags: hasFlag(state, BROKE_MANDATE_FLAG) ? state.flags : [...state.flags, BROKE_MANDATE_FLAG],
    queue: queued ? state.queue : [...state.queue, { id: mandate.brokeCard, dueAt: state.cardCount + 2 }],
  };
}

export function resolve(lib: Library, state: GameState, cardId: string, side: Side): GameState {
  if (state.over) return state;
  if (state.current !== cardId) {
    throw new Error(`resolve: card ${cardId} is not on the table (current: ${state.current})`);
  }
  const card = getCard(lib, cardId);
  const choice = card[side];
  let s = applyChoice(lib, state, card, side);

  const stats: RunStats = { ...s.stats };
  if (card.arc && !choice.nextByAlign?.[state.align] && !choice.next) {
    const outcome = `${card.id}:${side}`;
    if (!stats.arcOutcomes.includes(outcome)) stats.arcOutcomes = [...stats.arcOutcomes, outcome];
  }
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
    if (s.cabinet[card.speaker] !== before) {
      stats.advisorsFired++;
      if (before) stats.firedAdvisors = [...stats.firedAdvisors, before];
    }
  }
  const choices = state.choices ? [...state.choices, [cardId, side] as [string, Side]] : null;
  s = { ...s, stats, current: null, cardCount: s.cardCount + 1, choices };
  s = applyEraPassive(lib, s);
  // Before the ouster check: a choice that breaks the promise and ends the run did both.
  s = checkMandate(lib, s);
  s = checkOuster(lib, s);
  s = checkElection(lib, s);
  s = advanceEra(lib, s);
  // Once every step that can move drift has (the choice, a decree's pull), as the next card
  // will be read in it.
  const look = settleLook(state.look ?? stageOf(state.drift, lib.config), s.drift, lib.config);
  if (look !== s.look) s = { ...s, look };
  return stampFlags(state, s);
}

/**
 * Date every flag this card added, whichever step added it — the choice, a firing, a broken
 * promise. Diffing once at the end means no step that sets a flag has to remember to do it.
 */
function stampFlags(before: GameState, after: GameState): GameState {
  const added = after.flags.filter((f) => !before.flags.includes(f) && after.flagSince[f] === undefined);
  if (added.length === 0) return after;
  const flagSince = { ...after.flagSince };
  for (const f of added) flagSince[f] = after.cardCount;
  return { ...after, flagSince };
}
