import type { EngineConfig } from "./config";

/**
 * The look drift implies on its own: 0 is the muddle, -1 to -3 Decay's three looks, 1 to 3
 * the Ascent's (section 9, BACKLOG-3 phase 18).
 */
export function stageOf(drift: number, config: EngineConfig): number {
  const mag = Math.abs(drift);
  let s = 0;
  for (const t of config.lookAt) if (mag >= t) s++;
  return s === 0 ? 0 : drift < 0 ? -s : s;
}

/**
 * The look the frame shows, given the one it showed before (BACKLOG-7 phase 45).
 *
 * The look used to follow drift card by card, and drift wobbles: over 2,000 of the mixed bot's
 * runs it changed 27 times a run, and 53% of the changes were undone within three cards. A
 * look that keeps flipping teaches a player to stop reading the only sign of drift there is.
 *
 * So a look is entered as soon as drift crosses its line, deeper or across to the other side,
 * exactly as before, and left only once drift is `lookMargin` back past that line. The look
 * is never shallower than drift alone would make it, so early signs keep their timing; what
 * changes is how soon it lets go. Nothing in the engine reads it.
 */
export function settleLook(prev: number, drift: number, config: EngineConfig): number {
  const now = stageOf(drift, config);
  if (now !== 0 && Math.sign(now) !== Math.sign(prev)) return now;
  if (Math.abs(now) > Math.abs(prev)) return now;
  if (prev === 0) return 0;
  // Easing back: the look drift would imply if it were still the margin further out, never
  // past the muddle, and never deeper than the look already is.
  const held = stageOf(drift + Math.sign(prev) * config.lookMargin, config);
  return prev > 0 ? Math.min(prev, Math.max(0, held)) : Math.max(prev, Math.min(0, held));
}
