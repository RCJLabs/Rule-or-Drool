import { STRINGS } from "../content/strings";
import type { GameState } from "../engine/types";
import { lessonBody, type Lesson } from "./teach";

interface Props {
  lesson: Lesson;
  state: GameState;
  onDismiss: () => void;
}

/**
 * A lesson, said where it happens. Deliberately not a dialog: a modal stops the run to
 * explain the run, and the thing being explained is on screen behind it (phase 10).
 */
export function TeachNote({ lesson, state, onDismiss }: Props) {
  return (
    <aside className="teach" role="note">
      <b>{lesson.title}</b>
      <p>{lessonBody(lesson, state)}</p>
      <button type="button" onClick={onDismiss}>
        {STRINGS.ui.gotIt}
      </button>
    </aside>
  );
}
