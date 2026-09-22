import { STRINGS } from "../content/strings";
import { MANDATES } from "../engine/mandates";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

/**
 * The one thing about a run the player sets rather than is dealt (BACKLOG-2 phase 16).
 * Each option says what it will cost as plainly as what it is, because a promise you did
 * not understand when you made it is a trap rather than a challenge.
 */
export function MandatePicker({ value, onChange }: Props) {
  return (
    <fieldset className="mandates">
      <legend>{STRINGS.ui.mandate}</legend>
      <button
        type="button"
        className={`mandate-choice${value === null ? " selected" : ""}`}
        aria-pressed={value === null}
        onClick={() => onChange(null)}
      >
        <b>{STRINGS.ui.mandateNone}</b>
        <span>{STRINGS.ui.mandateNoneBlurb}</span>
      </button>
      {MANDATES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`mandate-choice${value === m.id ? " selected" : ""}`}
          aria-pressed={value === m.id}
          onClick={() => onChange(m.id)}
        >
          <b>{m.title}</b>
          <span>{m.promise}</span>
          <em>{m.cost}</em>
        </button>
      ))}
      <p className="hint">{STRINGS.ui.mandateHint}</p>
    </fieldset>
  );
}
