import { DEFAULT_CONFIG } from "../engine/config";
import { CLOCK } from "../engine/danger";
import type { Library } from "../engine/library";
import { inheritanceProblem } from "../engine/inherit";
import { brokenByFlags, inCatalogOrder, platformProblem } from "../engine/mandates";
import { pursuitProblem } from "../engine/pursuit";
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
 *
 * Format 4 adds the ending a run went looking for (BACKLOG-13 phase 83), after what it took over
 * (`-` for a fresh start's), since a run looking for one is dealt differently:
 * `4.gh2k7p.L.crisis_war~trait_orator~flaw_vain.-.-.-.-.the_posters`. Only a run looking for an
 * ending is written in it; a version from before says it cannot reproduce the run, which is true.
 *
 * Format 5 adds the clock (BACKLOG-13 phase 93), after the ending looked for (`-` for none): the
 * decisions a meter in danger at its bottom has, since a run on the clock plays by it:
 * `5.gh2k7p.L.crisis_war~trait_orator~flaw_vain.-.-.-.-.-.8`. Only a run on the clock is written
 * in it, and a version whose clock is another length says it cannot reproduce the run.
 */
export interface RunCode {
  seed: number;
  align: PlayerAlign;
  modifiers: string[];
  unlocked: string[];
  /** The promises the run was taken on, in the catalog's order: none, one, or two. */
  mandates: string[];
  /**
   * Eras, for a long reign (BACKLOG-5 phase 39) or a first or short term (BACKLOG-10 phase 59,
   * BACKLOG-12 phase 77); an ordinary run's code has none.
   */
  eraCount?: number;
  /** What the run took over from the last one; a fresh start's code has none (BACKLOG-10 phase 63). */
  inheritance?: Inheritance;
  /** The ending the run went looking for; any other run's code has none (BACKLOG-13 phase 83). */
  pursuit?: string;
  /** The decisions a meter in danger has, for a run on the clock; any other run's code has none (BACKLOG-13 phase 93). */
  clock?: number;
}

/** The ordinary game's era count, which a code leaves unsaid. */
const ORDINARY_ERAS = DEFAULT_CONFIG.eraCount;
const VERSION = "1";
const LONG_VERSION = "2";
const LINE_VERSION = "3";
const PURSUIT_VERSION = "4";
const CLOCK_VERSION = "5";
const NONE = "-";

export function encodeRunCode(code: RunCode): string {
  const list = (xs: readonly string[]) => (xs.length ? [...xs].join("~") : NONE);
  const parts = [code.seed.toString(36), code.align === "left" ? "L" : "R", list(code.modifiers), list([...code.unlocked].sort()), list(inCatalogOrder(code.mandates))];
  const ordinary = code.eraCount === undefined || code.eraCount === ORDINARY_ERAS;
  const eras = ordinary ? NONE : String(code.eraCount);
  const inh = code.inheritance;
  const took = inh ? [inh.band, String(inh.line), inh.rival ?? NONE, String(inh.rivalStanding), ...inh.legacies].join("~") : NONE;
  if (code.clock !== undefined) return [CLOCK_VERSION, ...parts, eras, took, code.pursuit ?? NONE, String(code.clock)].join(".");
  if (code.pursuit) return [PURSUIT_VERSION, ...parts, eras, took, code.pursuit].join(".");
  if (inh) return [LINE_VERSION, ...parts, eras, took].join(".");
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
  if (v !== VERSION && v !== LONG_VERSION && v !== LINE_VERSION && v !== PURSUIT_VERSION && v !== CLOCK_VERSION) return { ok: false, reason: parts.length >= 6 ? "version" : "format" };
  if (parts.length !== (v === VERSION ? 6 : v === LONG_VERSION ? 7 : v === LINE_VERSION ? 8 : v === PURSUIT_VERSION ? 9 : 10)) return { ok: false, reason: "format" };
  const [, seed36, side, mods, unlocks, promises, erasPart, tookPart, pursuitPart, clockPart] = parts as [string, string, string, string, string, string, string?, string?, string?, string?];
  if (!/^[0-9a-z]{1,8}$/.test(seed36) || (side !== "L" && side !== "R")) return { ok: false, reason: "format" };
  // Formats 3 to 5 say "-" for an ordinary run's eras; format 2 always names them. Formats 4 and 5
  // say "-" for a fresh start, and format 5 for a run looking for no ending.
  const eras = (v === LINE_VERSION || v === PURSUIT_VERSION || v === CLOCK_VERSION) && erasPart === NONE ? undefined : erasPart;
  const took = (v === PURSUIT_VERSION || v === CLOCK_VERSION) && tookPart === NONE ? undefined : tookPart;
  const pursuit = v === CLOCK_VERSION && pursuitPart === NONE ? undefined : pursuitPart;
  // Only a clock as long as this game's plays the run it names.
  if (clockPart !== undefined && !/^[1-9][0-9]?$/.test(clockPart)) return { ok: false, reason: "format" };
  const clock = clockPart === undefined ? undefined : Number(clockPart);
  if (clock !== undefined && clock !== CLOCK) return { ok: false, reason: "content" };
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
  const withLine = inheritance ? { ...withEras, inheritance } : withEras;
  const withClock = clock === undefined ? withLine : { ...withLine, clock };
  if (pursuit === undefined) return { ok: true, code: withClock };
  // An ending this run could not reach is not one it went looking for, whatever the code says.
  if (!/^[a-z0-9_]+$/.test(pursuit)) return { ok: false, reason: "format" };
  if (pursuitProblem(lib, { align, eraCount: eraCount ?? lib.config.eraCount, unlocked, inheritance }, pursuit)) return { ok: false, reason: "content" };
  return { ok: true, code: { ...withClock, pursuit } };
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
  const withLine = code.inheritance ? { ...withEras, inheritance: { ...code.inheritance, legacies: [...code.inheritance.legacies] } } : withEras;
  const withClock = code.clock === undefined ? withLine : { ...withLine, clock: code.clock };
  return code.pursuit ? { ...withClock, pursuit: code.pursuit } : withClock;
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
  pursuit?: string;
  clock?: number;
}): RunCode {
  const code: RunCode = { seed: state.seed, align: state.align, modifiers: [...state.modifiers], unlocked: [...state.unlocked], mandates: inCatalogOrder(state.mandates) };
  const withEras = state.eraCount === undefined || state.eraCount === ORDINARY_ERAS ? code : { ...code, eraCount: state.eraCount };
  const withLine = state.inherited ? { ...withEras, inheritance: { ...state.inherited, legacies: [...state.inherited.legacies] } } : withEras;
  const withClock = state.clock === undefined ? withLine : { ...withLine, clock: state.clock };
  return state.pursuit ? { ...withClock, pursuit: state.pursuit } : withClock;
}
