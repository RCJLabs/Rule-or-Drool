import type { GameState } from "../engine/types";
import { themeFor, type Theme } from "./theme";

/** Shown with ?debug=1: the hidden numbers, for playtest calibration only. */
export function Debug({ state, theme }: { state: GameState; theme: Theme }) {
  // The look holds a little past drift on the way back (BACKLOG-7 phase 45); say so when it is.
  const alone = themeFor(state.drift).name;
  const lines = [
    `drift ${state.drift}  band ${state.band}${state.bandLocked ? " (locked)" : ""}  theme ${theme.name}${alone !== theme.name ? ` (drift alone: ${alone})` : ""}`,
    `era ${state.era}  card #${state.cardCount}  ${state.current ?? "-"}`,
    `election @${state.nextElectionAt}  arcs ${state.activeArcs.length}/${state.arcBudget}  seed ${state.seed}`,
    `flags ${state.flags.join(", ") || "-"}`,
    `queue ${state.queue.map((q) => `${q.id}@${q.dueAt}`).join(", ") || "-"}`,
    "[ / ] shift drift by 10",
  ];
  return <pre className="debug">{lines.join("\n")}</pre>;
}
