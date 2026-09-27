import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { PlayerAlign } from "../engine/types";
import { startsLine } from "./setup";

interface Props {
  lib: Library;
  /** The crisis dealt, then the one offered beside it. */
  offer: readonly [string, string];
  value: string;
  onChange: (crisis: string) => void;
  /** Whose run, for the names of its groups in what each crisis starts. */
  align: PlayerAlign;
}

/**
 * The trouble a run of the player's own starts in (BACKLOG-13 phase 84): the crisis dealt, or one
 * more beside it. Each says what it starts higher or lower, as the dealt setup does. Measured on the
 * same seeds, the two differ little in how often a run reaches the Ascent (2 points, the median
 * pair); what they change is which meters start low, which stories come, and the rules a debt or
 * the blackouts bring. The trait and the flaw stay dealt.
 */
export function CrisisPicker({ lib, offer, value, onChange, align }: Props) {
  const p = STRINGS.crisisPick;
  return (
    <fieldset className="mandates crisis-pick">
      <legend>{p.legend}</legend>
      {offer.map((id) => {
        const text = STRINGS.modifiers[id];
        const starts = startsLine(lib, id, align);
        return (
          <button
            key={id}
            type="button"
            className={`mandate-choice${id === value ? " selected" : ""}`}
            aria-pressed={id === value}
            onClick={() => onChange(id)}
          >
            <b>{text?.name ?? id}</b>
            <span>{text?.blurb}</span>
            {starts && <em>{starts}</em>}
          </button>
        );
      })}
    </fieldset>
  );
}
