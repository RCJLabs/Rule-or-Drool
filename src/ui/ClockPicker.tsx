import { STRINGS } from "../content/strings";
import { CLOCK } from "../engine/danger";

interface Props {
  value: boolean;
  onChange: (onTheClock: boolean) => void;
}

/**
 * How danger is played (BACKLOG-13 phase 93): as a warning, where a meter ends the rule only at its
 * edge, or on the clock, where one left in danger at its bottom ends it after a count of decisions.
 * Offered once a run has ended on the Ascent, and for the player's own runs only: the daily, the
 * week's scenario and a run from a link are played as they were dealt.
 */
export function ClockPicker({ value, onChange }: Props) {
  const c = STRINGS.clock;
  const choices = [
    { on: false, title: c.ordinary, blurb: c.ordinaryBlurb },
    { on: true, title: c.title, blurb: c.blurb.replace("{n}", String(CLOCK)) },
  ];
  return (
    <fieldset className="mandates reign clock">
      <legend>{c.legend}</legend>
      {choices.map((choice) => (
        <button
          key={choice.on ? "clock" : "warning"}
          type="button"
          className={`mandate-choice${value === choice.on ? " selected" : ""}`}
          aria-pressed={value === choice.on}
          onClick={() => onChange(choice.on)}
        >
          <b>{choice.title}</b>
          <span>{choice.blurb}</span>
        </button>
      ))}
    </fieldset>
  );
}
