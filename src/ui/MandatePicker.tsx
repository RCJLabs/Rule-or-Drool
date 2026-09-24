import { useId, useRef, useState, type KeyboardEvent } from "react";
import { STRINGS } from "../content/strings";
import { MANDATES } from "../engine/mandates";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

interface Option {
  id: string | null;
  title: string;
  promise: string;
  cost?: string;
}

const OPTIONS: readonly Option[] = [
  { id: null, title: STRINGS.ui.mandateNone, promise: STRINGS.ui.mandateNoneBlurb },
  ...MANDATES.map((m) => ({ id: m.id, title: m.title, promise: m.promise, cost: m.cost })),
];

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
 * An inline drop-down: the promise chosen, and the others only when it is opened, in place,
 * so the menu is not five cards long on a phone. Not a native select, whose list shows titles
 * only: every option still shows its cost before it is taken.
 */
export function MandatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const current = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0]!;

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
      <legend>{STRINGS.ui.mandate}</legend>
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
          {OPTIONS.filter((o) => o !== current).map((o) => (
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
          <p className="hint">{STRINGS.ui.mandateHint}</p>
        </div>
      )}
    </fieldset>
  );
}
