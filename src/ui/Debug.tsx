import type { GameState } from "../engine/types";
import type { Theme } from "./theme";

/** Shown with ?debug=1: the hidden numbers, for playtest calibration only. */
export function Debug({ state, theme }: { state: GameState; theme: Theme }) {
  const lines = [
    `drift ${state.drift}  band ${state.band}${state.bandLocked ? " (locked)" : ""}  theme ${theme.name}`,
    `era ${state.era}  card #${state.cardCount}  ${state.current ?? "-"}`,
    `election @${state.nextElectionAt}  arcs ${state.activeArcs.length}/${state.arcBudget}  seed ${state.seed}`,
    `flags ${state.flags.join(", ") || "-"}`,
    `queue ${state.queue.map((q) => `${q.id}@${q.dueAt}`).join(", ") || "-"}`,
    "[ / ] shift drift by 10",
  ];
  return <pre className="debug">{lines.join("\n")}</pre>;
}
