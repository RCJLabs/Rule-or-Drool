import type { Library } from "./library";
import { nextInt, nextRandom, seedToState } from "./rng";
import { MANDATES_BY_ID, MANDATE_FLAG_PREFIX } from "./mandates";
import type { Advisor, Band, Cond, FxSpec, GameState, Meters, PlayerAlign, RunSetup } from "./types";
import { BLOC_KEYS, EMPTY_STATS, METER_KEYS } from "./types";

export function clampMeter(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export function clampDrift(v: number): number {
  return Math.max(-100, Math.min(100, v));
}

/**
 * "Mood" is no longer a meter; it is how the three blocs feel on average. Elections and any
 * content that reads `mood` use this (BACKLOG item 5).
 */
export function moodOf(meters: Meters): number {
  return Math.round(BLOC_KEYS.reduce((sum, b) => sum + meters[b], 0) / BLOC_KEYS.length);
}

/** Spread an FxSpec into per-meter deltas, expanding the `mood` shorthand across the blocs. */
export function fxDeltas(fx: FxSpec | undefined): Partial<Record<(typeof METER_KEYS)[number], number>> {
  const out: Partial<Record<(typeof METER_KEYS)[number], number>> = {};
  if (!fx) return out;
  for (const k of METER_KEYS) {
    const v = fx[k];
    if (v) out[k] = (out[k] ?? 0) + v;
  }
  if (fx.mood) for (const b of BLOC_KEYS) out[b] = (out[b] ?? 0) + fx.mood;
  return out;
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

/**
 * How big a threat the rival is right now, on 0-100. Part of it they have banked (stolen
 * and clean votes, and cards that are about them); the rest is read straight off how far
 * you have gone, because they are whoever you are not: a reformer while you rot, a
 * demagogue while you ascend (5.9, BACKLOG item 7).
 */
/**
 * How long whoever speaks this card has held their role, in cards. Conditions read it as
 * `tenure`, so content can wait for someone to have earned something (phase 15).
 */
export function tenureOf(state: GameState, role: string | undefined): number {
  if (!role) return 0;
  const since = state.cabinetSince[role];
  return since === undefined ? 0 : Math.max(0, state.cardCount - since);
}

export function rivalPressure(lib: Library, state: GameState): number {
  return clampMeter(Math.round(state.rivalStanding + Math.abs(state.drift) * lib.config.rivalDriftPull));
}

export function condMet(lib: Library, cond: Cond | undefined, state: GameState, speaker?: string): boolean {
  if (!cond) return true;
  if (cond.flags) for (const f of cond.flags) if (!state.flags.includes(f)) return false;
  if (cond.notFlags) for (const f of cond.notFlags) if (state.flags.includes(f)) return false;
  if (cond.meters) {
    for (const k of [...METER_KEYS, "mood", "rival", "drift", "tenure"] as const) {
      const m = cond.meters[k];
      if (!m) continue;
      // `band` only moves at an era boundary, so anything meant to follow where the run is
      // heading has to read drift itself (BACKLOG item 7).
      const v =
        k === "mood" ? moodOf(state.meters)
        : k === "rival" ? rivalPressure(lib, state)
        : k === "drift" ? state.drift
        : k === "tenure" ? tenureOf(state, speaker)
        : state.meters[k];
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

/**
 * Flags naming who is in the cabinet: one per person and one per trait in the room, so
 * content can be written for Saffi Kenner or for whoever happens to be corrupt (5.8, phase 15).
 */
export function cabinetFlags(lib: Library, cabinet: Record<string, string>): string[] {
  const out: string[] = [];
  const add = (flag: string) => {
    if (!out.includes(flag)) out.push(flag);
  };
  for (const id of Object.values(cabinet)) {
    // One per trait in the room, and one per person in it, so a card can be written for
    // Saffi Kenner rather than for whoever happens to be the tycoon (BACKLOG-2 phase 15).
    if (lib.advisorsById.has(id)) add(`${lib.config.advisorFlagPrefix}${id}`);
    for (const t of lib.advisorsById.get(id)?.traits ?? []) add(`${lib.config.advisorFlagPrefix}${t}`);
  }
  return out;
}

/**
 * Draw a run setup: the player's alignment plus one opening crisis, one leader trait and
 * one flaw (5.9). Deterministic for a seed, and independent of the run's own RNG so the
 * setup can be shown before the run starts.
 */
export function rollSetup(lib: Library, seed: number, align: PlayerAlign, unlocked: readonly string[] = []): RunSetup {
  let rng = seedToState((seed ^ 0x9e3779b9) | 0);
  const modifiers: string[] = [];
  for (const kind of ["crisis", "trait", "flaw"] as const) {
    const pool = lib.content.modifiers.filter(
      (m) =>
        m.kind === kind &&
        (!m.requires || unlocked.includes(m.requires)) &&
        // An inherited crisis is nobody's politics; a flaw usually is (BACKLOG item 4).
        (m.align === undefined || m.align === align),
    );
    if (pool.length === 0) continue;
    const pick = nextInt(rng, 0, pool.length - 1);
    rng = pick.state;
    modifiers.push(pool[pick.value]!.id);
  }
  return { align, modifiers, unlocked: [...unlocked] };
}

/**
 * Who can hold a role in this run. Cabinet advisors carry no side and serve anyone; the
 * rival carries one, and you get the rival from the side you did not pick (item 7).
 */
export function advisorPool(lib: Library, role: string, align: PlayerAlign): Advisor[] {
  const all = lib.advisorsByRole.get(role) ?? [];
  const sided = all.filter((a) => a.align !== undefined);
  if (sided.length === 0) return [...all];
  return sided.filter((a) => a.align !== align);
}

/**
 * Swap the advisor in a role for another from the same pool, refreshing trait flags.
 * The rival is not yours to replace, so that role is left alone.
 */
export function replaceAdvisor(lib: Library, state: GameState, role: string): GameState {
  if (role === lib.config.rivalRole) return state;
  const pool = advisorPool(lib, role, state.align).filter((a) => a.id !== state.cabinet[role]);
  if (pool.length === 0) return state;
  const [p, s1] = roll(state);
  const cabinet = { ...s1.cabinet, [role]: pool[Math.floor(p * pool.length)]!.id };
  const cabinetSince = { ...s1.cabinetSince, [role]: s1.cardCount };
  const prefix = lib.config.advisorFlagPrefix;
  const flags = [...s1.flags.filter((f) => !f.startsWith(prefix)), ...cabinetFlags(lib, cabinet)];
  return { ...s1, cabinet, cabinetSince, flags };
}

export function newRun(lib: Library, seed: number, setup: RunSetup): GameState {
  const cfg = lib.config;
  let rng = seedToState(seed);

  const meters = Object.fromEntries(METER_KEYS.map((k) => [k, cfg.meterStart])) as Meters;
  const flags: string[] = [];
  const modifierIds = setup.modifiers ?? [];
  for (const id of modifierIds) {
    const mod = lib.modifiers.get(id);
    if (!mod) throw new Error(`unknown modifier id: ${id}`);
    for (const [k, delta] of Object.entries(fxDeltas(mod.meterStart))) {
      meters[k as keyof Meters] = clampMeter(meters[k as keyof Meters] + delta);
    }
    for (const f of mod.flags ?? []) if (!flags.includes(f)) flags.push(f);
  }

  // A mandate is applied with the modifiers and before the clamp, because what you
  // promised to get the job is part of the position you start from (phase 16).
  const mandate = setup.mandate ? MANDATES_BY_ID.get(setup.mandate) : undefined;
  if (setup.mandate && !mandate) throw new Error(`unknown mandate id: ${setup.mandate}`);
  if (mandate) {
    for (const [k, delta] of Object.entries(fxDeltas(mandate.meterStart))) {
      meters[k as keyof Meters] = clampMeter(meters[k as keyof Meters] + delta);
    }
    for (const f of mandate.startFlags ?? []) if (!flags.includes(f)) flags.push(f);
    // The deck can be written for a particular promise, which is what lets it put the
    // promise and the country on opposite sides of one card.
    flags.push(`${MANDATE_FLAG_PREFIX}${mandate.id}`);
  }

  for (const k of METER_KEYS) {
    meters[k] = Math.max(cfg.meterStartMin, Math.min(cfg.meterStartMax, meters[k]));
  }

  const cabinet: Record<string, string> = {};
  for (const role of lib.roles) {
    const pool = advisorPool(lib, role, setup.align);
    if (pool.length === 0) continue;
    const pick = nextInt(rng, 0, pool.length - 1);
    rng = pick.state;
    cabinet[role] = pool[pick.value]!.id;
  }

  for (const f of cabinetFlags(lib, cabinet)) if (!flags.includes(f)) flags.push(f);
  const cabinetSince: Record<string, number> = {};
  for (const role of Object.keys(cabinet)) cabinetSince[role] = 0;

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
    cabinetSince,
    modifiers: [...modifierIds],
    nextElectionAt: cfg.electionInterval,
    over: null,
    current: null,
    currentFrom: null,
    arcBudget: budget.value,
    rivalStanding: cfg.rivalStart,
    stats: { ...EMPTY_STATS },
    unlocked: [...(setup.unlocked ?? [])],
    mandate: mandate?.id ?? null,
    mandateBrokenAt: null,
  };
}
