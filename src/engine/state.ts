import type { Library } from "./library";
import { nextInt, nextRandom, seedToState } from "./rng";
import type { Band, Cond, GameState, Meters, PlayerAlign, RunSetup } from "./types";
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

/** Flags naming every trait sitting in the cabinet, for arc gating (5.8). */
export function cabinetTraitFlags(lib: Library, cabinet: Record<string, string>): string[] {
  const out: string[] = [];
  for (const id of Object.values(cabinet)) {
    for (const t of lib.advisorsById.get(id)?.traits ?? []) {
      const flag = `${lib.config.advisorFlagPrefix}${t}`;
      if (!out.includes(flag)) out.push(flag);
    }
  }
  return out;
}

/**
 * Draw a run setup: the player's alignment plus one opening crisis, one leader trait and
 * one flaw (5.9). Deterministic for a seed, and independent of the run's own RNG so the
 * setup can be shown before the run starts.
 */
export function rollSetup(lib: Library, seed: number, align: PlayerAlign): RunSetup {
  let rng = seedToState((seed ^ 0x9e3779b9) | 0);
  const modifiers: string[] = [];
  for (const kind of ["crisis", "trait", "flaw"] as const) {
    const pool = lib.content.modifiers.filter((m) => m.kind === kind);
    if (pool.length === 0) continue;
    const pick = nextInt(rng, 0, pool.length - 1);
    rng = pick.state;
    modifiers.push(pool[pick.value]!.id);
  }
  return { align, modifiers };
}

/** Swap the advisor in a role for another from the same pool, refreshing trait flags. */
export function replaceAdvisor(lib: Library, state: GameState, role: string): GameState {
  const pool = (lib.advisorsByRole.get(role) ?? []).filter((a) => a.id !== state.cabinet[role]);
  if (pool.length === 0) return state;
  const [p, s1] = roll(state);
  const cabinet = { ...s1.cabinet, [role]: pool[Math.floor(p * pool.length)]!.id };
  const prefix = lib.config.advisorFlagPrefix;
  const flags = [...s1.flags.filter((f) => !f.startsWith(prefix)), ...cabinetTraitFlags(lib, cabinet)];
  return { ...s1, cabinet, flags };
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

  for (const k of METER_KEYS) {
    meters[k] = Math.max(cfg.meterStartMin, Math.min(cfg.meterStartMax, meters[k]));
  }

  const cabinet: Record<string, string> = {};
  for (const role of lib.roles) {
    const pool = lib.advisorsByRole.get(role) ?? [];
    if (pool.length === 0) continue;
    const pick = nextInt(rng, 0, pool.length - 1);
    rng = pick.state;
    cabinet[role] = pool[pick.value]!.id;
  }

  for (const f of cabinetTraitFlags(lib, cabinet)) if (!flags.includes(f)) flags.push(f);

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
