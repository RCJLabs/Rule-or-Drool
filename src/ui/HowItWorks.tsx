import { STRINGS } from "../content/strings";
import { LESSONS } from "./teach";

interface Props {
  onClose: () => void;
}

/**
 * The same lessons, collected, for a player who dismissed one and wants it back, or who
 * would rather read than be told as they go (BACKLOG-2 phase 10).
 */
export function HowItWorks({ onClose }: Props) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="how-title">
      <div className="overlay-card how">
        <h2 id="how-title">{STRINGS.ui.howItWorks}</h2>
        <ul className="how-list">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <b>{l.title}</b>
              <span>{l.body("One of your groups")}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="primary" onClick={onClose} autoFocus>
          {STRINGS.ui.close}
        </button>
      </div>
    </div>
  );
}
