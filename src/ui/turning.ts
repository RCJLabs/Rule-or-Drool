import { useEffect, useState } from "react";
import { STRINGS } from "../content/strings";
import { survivedTo } from "../engine/endings";
import type { Library } from "../engine/library";
import type { GameState } from "../engine/types";
import { pickTurningPoints, turningPointsOf, type TurningPoint } from "../sim/turning";

/**
 * Where a run turned, worked out on the end screen (BACKLOG-14 phase 88). The work is about a
 * second in node for an ordinary reign and a few on a slow phone, so it runs after the screen
 * shows, in slices the browser can spare, a decision or more at a time.
 */

export type Turning = { status: "working" } | { status: "done"; all: readonly TurningPoint[]; shown: readonly TurningPoint[] };

/** How long one slice may run when the browser does not say how long it can spare. */
const SLICE_MS = 12;

type Handle = { cancel: () => void };
function later(fn: (spare: () => number) => void): Handle {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback((d) => fn(() => d.timeRemaining()), { timeout: 250 });
    return { cancel: () => cancelIdleCallback(id) };
  }
  const id = setTimeout(() => {
    const until = performance.now() + SLICE_MS;
    fn(() => until - performance.now());
  }, 0);
  return { cancel: () => clearTimeout(id) };
}

/** The run's turning points once worked out, "working" until then, and null where there are none to look for. */
export function useTurningPoints(lib: Library, state: GameState, enabled: boolean): Turning | null {
  const [turning, setTurning] = useState<Turning | null>(null);
  useEffect(() => {
    if (!enabled || !state.over) {
      setTurning(null);
      return;
    }
    const work = turningPointsOf(lib, state);
    let handle: Handle | null = null;
    setTurning({ status: "working" });
    const step = (spare: () => number) => {
      // At least one decision a slice, however little the browser can spare.
      do {
        const r = work.next();
        if (r.done) {
          setTurning(r.value ? { status: "done", all: r.value, shown: pickTurningPoints(r.value, state, lib) } : null);
          return;
        }
      } while (spare() > 1);
      handle = later(step);
    };
    handle = later(step);
    return () => handle?.cancel();
  }, [lib, state, enabled]);
  return turning;
}

/** How the other road ends, in a clause: seen through where the run was cut short, cut short where it was not. */
export function turningOutcome(lib: Library, run: GameState, p: TurningPoint): string {
  const t = STRINGS.turning;
  if (p.band === null) return t.cutShort.replace("{n}", String(p.cards)).replace("{ending}", lib.endings.get(p.endingId)?.title ?? p.endingId);
  const seen = !!run.over && survivedTo(lib.config, run.over.endingId);
  return (seen ? t.endsIn : t.seenThrough).replace("{band}", STRINGS.bands[p.band]);
}

/** The line that says how many decisions turned the run, or that none did. */
export function turningCount(t: Extract<Turning, { status: "done" }>): string {
  const s = STRINGS.turning;
  if (t.all.length === 0) return s.none;
  if (t.shown.length === 0) return t.all.length === 1 ? s.closeOne : s.close.replace("{n}", String(t.all.length));
  return t.all.length === 1 ? s.one : s.many.replace("{n}", String(t.all.length));
}
