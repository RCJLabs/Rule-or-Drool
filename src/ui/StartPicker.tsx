import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { Inheritance } from "../engine/types";
import { historyTitle, type RunRecord } from "../meta";
import { inheritedLabels, leanWords } from "./dynasty";

interface Props {
  lib: Library;
  /** The last run, which a new one can take over from. */
  from: RunRecord;
  inheritance: Inheritance;
  /** Whether the new run takes over. */
  value: boolean;
  onChange: (takeOver: boolean) => void;
}

/**
 * Where a run starts (BACKLOG-10 phase 63): fresh, or in the country the last run left. Taking
 * over says what it hands on before it is chosen: the side, which way the country leans, what is
 * still in force, and who remembers. A fresh start is always beside it, because a bad inheritance
 * compounds.
 */
export function StartPicker({ lib, from, inheritance, value, onChange }: Props) {
  const d = STRINGS.dynasty;
  const history = (from.history && historyTitle(from.history)) || (lib.endings.get(from.endingId)?.title ?? from.endingId);
  const labels = inheritedLabels(inheritance);
  const rival = inheritance.rival ? lib.advisorsById.get(inheritance.rival)?.name : undefined;
  return (
    <fieldset className="mandates start">
      <legend>{d.legend}</legend>
      <button type="button" className={`mandate-choice${value ? "" : " selected"}`} aria-pressed={!value} onClick={() => onChange(false)}>
        <b>{d.fresh}</b>
        <span>{d.freshBlurb}</span>
      </button>
      <button type="button" className={`mandate-choice take-over${value ? " selected" : ""}`} aria-pressed={value} onClick={() => onChange(true)}>
        <b>{d.takeOver}</b>
        <span>{d.takeOverBlurb.replace("{party}", STRINGS.parties[from.align]).replace("{history}", history).replace("{lean}", leanWords(inheritance.band))}</span>
        {labels.length > 0 && <em>{d.still.replace("{legacies}", labels.join(" · "))}</em>}
        {rival && <em>{d.rival.replace("{rival}", rival)}</em>}
      </button>
    </fieldset>
  );
}
