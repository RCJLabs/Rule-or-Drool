import { useId, useRef, useState, type KeyboardEvent } from "react";
import { STRINGS } from "../content/strings";
import { MANDATES, compatible } from "../engine/mandates";

interface Props {
  /** The promises chosen, in the order they were chosen: none, one, or two. */
  value: readonly string[];
  onChange: (ids: string[]) => void;
  /** Promises that cannot be made in this run: the country it takes over already breaks them (phase 63). */
  unavailable?: readonly string[];
}

interface Option {
  id: string | null;
  title: string;
  promise: string;
  cost?: string;
}

const NONE: Option = { id: null, title: STRINGS.ui.mandateNone, promise: STRINGS.ui.mandateNoneBlurb };
const JUST_ONE: Option = { id: null, title: STRINGS.ui.mandateOnlyOne, promise: STRINGS.ui.mandateOnlyOneBlurb };
const PROMISES: readonly Option[] = MANDATES.map((m) => ({ id: m.id, title: m.title, promise: m.promise, cost: m.cost }));

function Words({ option }: { option: Option }) {
  return (
    <span className="mandate-words">
      <b>{option.title}</b>
      <span>{option.promise}</span>
      {option.cost && <em>{option.cost}</em>}
    </span>
  );
}

/**
 * The one thing about a run the player sets rather than is dealt (BACKLOG-2 phase 16).
 * Each option says what it will cost as plainly as what it is, because a promise you did
 * not understand when you made it is a trap rather than a challenge.
 *
 * A run can stand on two, a platform (BACKLOG-10 phase 62). The second is asked for only once
 * a first is made, so a player who promises nothing has nothing more to choose, and it offers
 * only what can stand beside the first.
 */
export function MandatePicker({ value, onChange, unavailable = [] }: Props) {
  const [first = null, second = null] = value;
  const open = PROMISES.filter((o) => !unavailable.includes(o.id!));
  const beside = first ? open.filter((o) => compatible(first, o.id!)) : [];
  return (
    <>
      <Dropdown
        legend={STRINGS.ui.mandate}
        options={[NONE, ...open]}
        value={first}
        hint={STRINGS.ui.mandateHint}
        // A second that cannot stand beside the new first is let go, not kept out of sight.
        onChange={(id) => onChange(id === null ? [] : second && compatible(id, second) ? [id, second] : [id])}
      />
      {first && (
        <Dropdown
          legend={STRINGS.ui.mandateSecond}
          options={[JUST_ONE, ...beside]}
          value={second}
          hint={STRINGS.ui.mandateSecondHint}
          onChange={(id) => onChange(id === null ? [first] : [first, id])}
        />
      )}
    </>
  );
}

interface DropdownProps {
  legend: string;
  options: readonly Option[];
  value: string | null;
  hint: string;
  onChange: (id: string | null) => void;
}

/**
 * An inline drop-down: the promise chosen, and the others only when it is opened, in place,
 * so the menu is not ten cards long on a phone. Not a native select, whose list shows titles
 * only: every option still shows its cost before it is taken.
 */
function Dropdown({ legend, options, value, hint, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.id === value) ?? options[0]!;

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close();
    }
  };

  return (
    <fieldset className="mandates" onKeyDown={onKeyDown}>
      <legend>{legend}</legend>
      <button
        ref={trigger}
        type="button"
        className="mandate-choice mandate-current selected"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <Words option={current} />
        <svg className="mandate-chevron" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5l5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div id={listId} className="mandate-list">
          {options
            .filter((o) => o !== current)
            .map((o) => (
              <button
                key={o.id ?? "none"}
                type="button"
                className="mandate-choice"
                onClick={() => {
                  onChange(o.id);
                  close();
                }}
              >
                <Words option={o} />
              </button>
            ))}
          <p className="hint">{hint}</p>
        </div>
      )}
    </fieldset>
  );
}
