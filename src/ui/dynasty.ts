import { STRINGS } from "../content/strings";
import type { Band, Inheritance } from "../engine/types";
import { LEGACIES } from "../meta/legacies";

const d = STRINGS.dynasty;

/** "Second of its line", from the second reign of a line on; empty for a fresh start. */
export function lineName(line: number): string {
  if (line < 2) return "";
  const ordinal = d.ordinals[line] ?? d.ordinalMany.replace("{n}", String(line));
  return d.line.replace("{ordinal}", ordinal);
}

/** Which way the country leans after a reign that ended in this band. */
export function leanWords(band: Band): string {
  return d.lean[band];
}

/** The legacies a run took over, as the country names them. */
export function inheritedLabels(inh: Pick<Inheritance, "legacies">): string[] {
  return inh.legacies.map((f) => LEGACIES[f] ?? f);
}

/** What a run took over, in a sentence, for the end of it. */
export function tookOverLine(inh: Inheritance): string {
  const lean = leanWords(inh.band);
  const labels = inheritedLabels(inh);
  return labels.length
    ? d.tookOver.replace("{lean}", lean).replace("{legacies}", labels.map((l) => `“${l}”`).join(" and "))
    : d.tookOverBare.replace("{lean}", lean);
}
