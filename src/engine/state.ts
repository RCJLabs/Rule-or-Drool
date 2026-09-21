import type { Library } from "./library";
import { nextInt, nextRandom, seedToState } from "./rng";
import type { Band, Cond, GameState, Meters, RunSetup } from "./types";
import { METER_KEYS } from "./types";

export function clampMeter(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export function clampDrift(v: number): number {
  return Math.max(-100, Math.min(100, v));
}

export function bandOf(lib: Library, drift: number): Band {
  if (drift <= lib.config.bandDecayAt) return "decay";
  if (drift >= lib.config.bandAscentAt) return "ascent";
  return "muddle";
}

/**
 * The band a run "exits" in: the locked band if locked, otherwise the band implied by
 * drift right now. Used for epilogues and finales so short runs still reveal the futures.
 */
export function exitBand(lib: Library, state: GameState): Band {
  return state.bandLocked ? state.band : bandOf(lib, state.drift);
}

export function hasFlag(state: GameState, flag: string): boolean {
  return state.flags.includes(flag);
}

export function condMet(cond: Cond | undefined, state: GameState): boolean {
  if (!cond) return true;
  if (cond.flags) for (const f of cond.flags) if (!state.flags.includes(f)) return false;
  if (cond.notFlags) for (const f of cond.notFlags) if (state.flags.includes(f)) return false;
  if (cond.meters) {
    for (const k of METER_KEYS) {
      const m = cond.meters[k];
      if (!m) continue;
      const v = state.meters[k];
      if (m.lt !== undefined && !(v < m.lt)) return false;
      if (m.gt !== undefined && !(v > m.gt)) return false;
    }
  }
  return true;
}

/** Advance the run's RNG once. Returns the uniform value and the new state. */
export function roll(state: GameState): [number, GameState] {
  const r = nextRandom(state.rngState);
  return [r.value, { ...state, rngState: r.state }];
}

export function newRun(lib: Library, seed: number, setup: RunSetup): GameState {
  const cfg = lib.config;
  let rng = seedToState(seed);

  const meters: Meters = { mood: cfg.meterStart, money: cfg.meterStart, order: cfg.meterStart, inst: cfg.meterStart };
  const flags: string[] = [];
  const modifierIds = setup.modifiers ?? [];
  for (const id of modifierIds) {
    const mod = lib.modifiers.get(id);
    if (!mod) throw new Error(`unknown modifier id: ${id}`);
    if (mod.meterStart) {
      for (const k of METER_KEYS) {
        const delta = mod.meterStart[k];
        if (delta) meters[k] = clampMeter(meters[k] + delta);
      }
    }
    for (const f of mod.flags ?? []) if (!flags.includes(f)) flags.push(f);
  }

  const cabinet: Record<string, string> = {};
  for (const role of lib.roles) {
    const pool = lib.advisorsByRole.get(role) ?? [];
    if (pool.length === 0) continue;
    const pick = nextInt(rng, 0, pool.length - 1);
    rng = pick.state;
    cabinet[role] = pool[pick.value]!.id;
  }

  const budget = nextInt(rng, cfg.arcBudgetMin, cfg.arcBudgetMax);
  rng = budget.state;

  return {
    seed,
    rngState: rng,
    align: setup.align,
    era: 1,
    cardCount: 0,
    meters,
    drift: 0,
    band: "muddle",
    bandLocked: false,
    flags,
    queue: [],
    seen: [],
    cooldown: [],
    activeArcs: [],
    cabinet,
    modifiers: [...modifierIds],
    nextElectionAt: cfg.electionInterval,
    over: null,
    current: null,
    arcBudget: budget.value,
  };
}
