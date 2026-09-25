import { STRINGS } from "../content/strings";

/** One way a reign can run: its era count, or undefined for the ordinary game's. */
export interface ReignChoice {
  eraCount: number | undefined;
  title: string;
  blurb: string;
}

interface Props {
  choices: readonly ReignChoice[];
  value: number | undefined;
  onChange: (eraCount: number | undefined) => void;
}

/**
 * How long a reign runs: three eras or five once a finale has opened the long reign (BACKLOG-5
 * phase 39), and a first term or three eras for a profile that has not seen a run through yet
 * (BACKLOG-10 phase 59). Each choice says the one thing that changes how it plays.
 */
export function ReignPicker({ choices, value, onChange }: Props) {
  return (
    <fieldset className="mandates reign">
      <legend>{STRINGS.reign.legend}</legend>
      {choices.map((c) => (
        <button
          key={c.eraCount ?? "ordinary"}
          type="button"
          className={`mandate-choice${value === c.eraCount ? " selected" : ""}`}
          aria-pressed={value === c.eraCount}
          onClick={() => onChange(c.eraCount)}
        >
          <b>{c.title}</b>
          <span>{c.blurb}</span>
        </button>
      ))}
    </fieldset>
  );
}
