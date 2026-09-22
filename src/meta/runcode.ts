import type { Library } from "../engine/library";
import { MANDATES_BY_ID } from "../engine/mandates";
import type { PlayerAlign, RunSetup } from "../engine/types";
import { allUnlockTokens } from "./objectives";

/**
 * Everything that decides how a run starts, so it can be handed to someone else
 * (BACKLOG-2 phase 11).
 *
 * A seed on its own does not do it. `rollSetup` picks the crisis, trait and flaw from pools
 * filtered by the player's own unlocks, and arcs with a `requires` are gated the same way
 * during play. Measured over 360 daily runs, a new player and a fully unlocked one making
 * identical choices started from a different setup 66.7% of the time, drew a different card
 * by card 10 (median) 98.3% of the time, and ended differently 45.3% of the time. So a run is
 * shared as its setup, not its seed.
 *
 * The code is readable on purpose — `1.gh2k7p.L.crisis_war~trait_orator~flaw_vain.-.m_broad`
 * — so a player can see what they are being sent, and it names content by id rather than by
 * position, so adding a modifier or an unlock later does not change what an old code means.
 * The leading `1` is the format version; a new format gets a new number and this one keeps
 * decoding.
 */
export interface RunCode {
  seed: number;
  align: PlayerAlign;
  modifiers: string[];
  unlocked: string[];
  mandate: string | null;
}

const VERSION = "1";
const NONE = "-";

export function encodeRunCode(code: RunCode): string {
  const list = (xs: readonly string[]) => (xs.length ? [...xs].join("~") : NONE);
  return [VERSION, code.seed.toString(36), code.align === "left" ? "L" : "R", list(code.modifiers), list([...code.unlocked].sort()), code.mandate ?? NONE].join(".");
}

export type Decoded = { ok: true; code: RunCode } | { ok: false; reason: "format" | "version" | "content" };

/**
 * Read a code back, refusing anything this version of the game cannot reproduce exactly.
 * A code naming a modifier, unlock or promise the game no longer has would start a different
 * run while claiming to be the same one, which is the bug this exists to fix.
 */
export function decodeRunCode(lib: Library, raw: string): Decoded {
  const parts = raw.trim().split(".");
  if (parts.length !== 6) return { ok: false, reason: "format" };
  const [v, seed36, side, mods, unlocks, mandate] = parts as [string, string, string, string, string, string];
  if (v !== VERSION) return { ok: false, reason: "version" };
  if (!/^[0-9a-z]{1,8}$/.test(seed36) || (side !== "L" && side !== "R")) return { ok: false, reason: "format" };
  const seed = parseInt(seed36, 36);
  if (!Number.isSafeInteger(seed)) return { ok: false, reason: "format" };
  const list = (s: string) => (s === NONE ? [] : s.split("~"));
  const modifiers = list(mods);
  const unlocked = list(unlocks);
  const known = new Set(lib.content.modifiers.map((m) => m.id));
  const tokens = new Set(allUnlockTokens());
  if (!modifiers.every((m) => known.has(m))) return { ok: false, reason: "content" };
  if (!unlocked.every((u) => tokens.has(u))) return { ok: false, reason: "content" };
  if (mandate !== NONE && !MANDATES_BY_ID.has(mandate)) return { ok: false, reason: "content" };
  return { ok: true, code: { seed, align: side === "L" ? "left" : "right", modifiers, unlocked, mandate: mandate === NONE ? null : mandate } };
}

/** The setup a code describes, ready for `newRun`. */
export function setupOf(code: RunCode): RunSetup {
  return { align: code.align, modifiers: [...code.modifiers], unlocked: [...code.unlocked], mandate: code.mandate };
}

/** The code for a run in progress or finished: what it started from, not what it became. */
export function runCodeOf(state: { seed: number; align: PlayerAlign; modifiers: readonly string[]; unlocked: readonly string[]; mandate: string | null }): RunCode {
  return { seed: state.seed, align: state.align, modifiers: [...state.modifiers], unlocked: [...state.unlocked], mandate: state.mandate };
}
