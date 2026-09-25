import { DEFAULT_CONFIG } from "../engine/config";
import type { Library } from "../engine/library";
import { inheritanceProblem } from "../engine/inherit";
import { brokenByFlags, inCatalogOrder, platformProblem } from "../engine/mandates";
import { advisorPool } from "../engine/state";
import { BANDS, type Band, type Inheritance, type PlayerAlign, type RunSetup } from "../engine/types";
import { inheritable } from "./dynasty";
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
 *
 * Format 2 adds the number of eras, for a long reign (BACKLOG-5 phase 39):
 * `2.gh2k7p.L.crisis_war~trait_orator~flaw_vain.-.m_broad.5`. A code is written in the
 * oldest format that can say it, so an ordinary run's code is the same as it always was and
 * opens on every version since phase 11. A long reign's does not open on a version from
 * before this one, which could not play it; that version says it cannot reproduce the run.
 *
 * A run taken on two promises (BACKLOG-10 phase 62) lists them in the promise slot the way the
 * modifiers are listed, `m_broad~m_loyal`, in the catalog's order. That needs no new format: a
 * version from before reads the pair, or a promise it never had, as a promise it does not know,
 * and says it cannot reproduce the run, which is true. A code with one promise is unchanged.
 *
 * Format 3 adds what a run took over from the last one (BACKLOG-10 phase 63), after the era count
 * (`-` for an ordinary run's): the band the last reign ended in, the reign of its line this is,
 * the rival or `-`, their standing, and the legacies in force:
 * `3.gh2k7p.L.crisis_war~trait_orator~flaw_vain.-.-.-.decay~2~adv_wrenne~41~ring_started~seawall`.
 * Only a run that took over is written in it, so every other code is the code it was.
 */
export interface RunCode {
  seed: number;
  align: PlayerAlign;
  modifiers: string[];
  unlocked: string[];
  /** The promises the run was taken on, in the catalog's order: none, one, or two. */
  mandates: string[];
  /**
   * Eras, for a long reign (BACKLOG-5 phase 39) or a first term (BACKLOG-10 phase 59); an
   * ordinary run's code has none.
   */
  eraCount?: number;
  /** What the run took over from the last one; a fresh start's code has none (BACKLOG-10 phase 63). */
  inheritance?: Inheritance;
}

/** The ordinary game's era count, which a code leaves unsaid. */
const ORDINARY_ERAS = DEFAULT_CONFIG.eraCount;
const VERSION = "1";
const LONG_VERSION = "2";
const LINE_VERSION = "3";
const NONE = "-";

export function encodeRunCode(code: RunCode): string {
  const list = (xs: readonly string[]) => (xs.length ? [...xs].join("~") : NONE);
  const parts = [code.seed.toString(36), code.align === "left" ? "L" : "R", list(code.modifiers), list([...code.unlocked].sort()), list(inCatalogOrder(code.mandates))];
  const ordinary = code.eraCount === undefined || code.eraCount === ORDINARY_ERAS;
  const eras = ordinary ? NONE : String(code.eraCount);
  const inh = code.inheritance;
  if (inh) {
    const took = [inh.band, String(inh.line), inh.rival ?? NONE, String(inh.rivalStanding), ...inh.legacies].join("~");
    return [LINE_VERSION, ...parts, eras, took].join(".");
  }
  return ordinary ? [VERSION, ...parts].join(".") : [LONG_VERSION, ...parts, eras].join(".");
}

export type Decoded = { ok: true; code: RunCode } | { ok: false; reason: "format" | "version" | "content" };

/**
 * Read a code back, refusing anything this version of the game cannot reproduce exactly.
 * A code naming a modifier, unlock or promise the game no longer has would start a different
 * run while claiming to be the same one, which is the bug this exists to fix.
 */
export function decodeRunCode(lib: Library, raw: string): Decoded {
  const parts = raw.trim().split(".");
  const v = parts[0];
  if (v !== VERSION && v !== LONG_VERSION && v !== LINE_VERSION) return { ok: false, reason: parts.length >= 6 ? "version" : "format" };
  if (parts.length !== (v === VERSION ? 6 : v === LONG_VERSION ? 7 : 8)) return { ok: false, reason: "format" };
  const [, seed36, side, mods, unlocks, promises, erasPart, took] = parts as [string, string, string, string, string, string, string?, string?];
  if (!/^[0-9a-z]{1,8}$/.test(seed36) || (side !== "L" && side !== "R")) return { ok: false, reason: "format" };
  // Format 3 says "-" for an ordinary run's eras; format 2 always names them.
  const eras = v === LINE_VERSION && erasPart === NONE ? undefined : erasPart;
  if (eras !== undefined && !/^[1-9][0-9]?$/.test(eras)) return { ok: false, reason: "format" };
  // Only a long reign or a first term is written with its eras, and only one as long as this game's.
  const eraCount = eras === undefined ? undefined : Number(eras);
  if (eraCount !== undefined && eraCount !== lib.config.longEraCount && eraCount !== lib.config.firstTermEras) return { ok: false, reason: "content" };
  const seed = parseInt(seed36, 36);
  if (!Number.isSafeInteger(seed)) return { ok: false, reason: "format" };
  const list = (s: string) => (s === NONE ? [] : s.split("~"));
  const modifiers = list(mods);
  const unlocked = list(unlocks);
  const known = new Set(lib.content.modifiers.map((m) => m.id));
  const tokens = new Set(allUnlockTokens());
  if (!modifiers.every((m) => known.has(m))) return { ok: false, reason: "content" };
  if (!unlocked.every((u) => tokens.has(u))) return { ok: false, reason: "content" };
  const mandates = list(promises);
  // A platform this version would refuse to start (a promise twice, two that cannot stand
  // together) is refused here too, rather than failing when the run is started.
  if (platformProblem(mandates)) return { ok: false, reason: "content" };
  const align = side === "L" ? "left" : "right";
  let inheritance: Inheritance | undefined;
  if (took !== undefined) {
    const read = readInheritance(lib, took, align);
    if (!read.ok) return read;
    inheritance = read.inheritance;
    // As the setup would: a promise the country already breaks cannot be made in it.
    if (brokenByFlags(inheritance.legacies).some((id) => mandates.includes(id))) return { ok: false, reason: "content" };
  }
  const code: RunCode = { seed, align, modifiers, unlocked, mandates: inCatalogOrder(mandates) };
  const withEras = eraCount === undefined ? code : { ...code, eraCount };
  return { ok: true, code: inheritance ? { ...withEras, inheritance } : withEras };
}

/** The inheritance a format 3 code carries, read as carefully as the rest of it. */
function readInheritance(lib: Library, raw: string, align: PlayerAlign): { ok: true; inheritance: Inheritance } | { ok: false; reason: "format" | "content" } {
  const [band, line, rival, standing, ...legacies] = raw.split("~") as [string, string?, string?, string?, ...string[]];
  if (line === undefined || rival === undefined || standing === undefined) return { ok: false, reason: "format" };
  if (!/^[1-9][0-9]{0,3}$/.test(line) || !/^[0-9]{1,3}$/.test(standing) || !/^[a-z0-9_-]+$/.test(rival)) return { ok: false, reason: "format" };
  if (!(BANDS as readonly string[]).includes(band)) return { ok: false, reason: "content" };
  const inheritance: Inheritance = { band: band as Band, line: Number(line), legacies, rival: rival === NONE ? null : rival, rivalStanding: Number(standing) };
  // Legacies this game can hand on, and a rival who can sit against this side, or it is not the run.
  if (!legacies.every(inheritable) || inheritanceProblem(lib, inheritance)) return { ok: false, reason: "content" };
  if (inheritance.rival !== null && !advisorPool(lib, lib.config.rivalRole, align).some((a) => a.id === inheritance.rival)) return { ok: false, reason: "content" };
  return { ok: true, inheritance };
}

/** The setup a code describes, ready for `newRun`. */
export function setupOf(code: RunCode): RunSetup {
  const setup: RunSetup = { align: code.align, modifiers: [...code.modifiers], unlocked: [...code.unlocked], mandates: [...code.mandates] };
  const withEras = code.eraCount === undefined ? setup : { ...setup, eraCount: code.eraCount };
  return code.inheritance ? { ...withEras, inheritance: { ...code.inheritance, legacies: [...code.inheritance.legacies] } } : withEras;
}

/**
 * The code for a run in progress or finished: what it started from, not what it became. An
 * ordinary run's code names no era count, which is what makes it the code it always was.
 */
export function runCodeOf(state: {
  seed: number;
  align: PlayerAlign;
  modifiers: readonly string[];
  unlocked: readonly string[];
  mandates: readonly string[];
  eraCount?: number;
  inherited?: Inheritance | null;
}): RunCode {
  const code: RunCode = { seed: state.seed, align: state.align, modifiers: [...state.modifiers], unlocked: [...state.unlocked], mandates: inCatalogOrder(state.mandates) };
  const withEras = state.eraCount === undefined || state.eraCount === ORDINARY_ERAS ? code : { ...code, eraCount: state.eraCount };
  return state.inherited ? { ...withEras, inheritance: { ...state.inherited, legacies: [...state.inherited.legacies] } } : withEras;
}
