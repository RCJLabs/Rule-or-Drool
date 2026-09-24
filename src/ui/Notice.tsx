import { STRINGS } from "../content/strings";
import { todayKey } from "../meta";
import type { Notice } from "./useGame";

interface Props {
  notice: Notice;
  onMoveProgress: () => void;
  onDismiss: () => void;
}

/**
 * Something the player has to know before anything else, told once (BACKLOG-8 phase 50): a
 * save that failed, a profile this version could not read and set aside, or one set aside
 * earlier that this version can read. Each offers the way out that already exists, Move my
 * progress (BACKLOG-5 phase 33).
 */
export function NoticeDialog({ notice, onMoveProgress, onDismiss }: Props) {
  const n = STRINGS.notice;
  const [title, body] =
    notice.kind === "storage" ? [n.storageTitle, n.storage]
    : notice.kind === "setAside" ? [n.asideTitle, notice.aside.reason === "newer" ? n.asideNewer : n.asideUnreadable]
    : [n.backTitle, n.back.replace("{day}", todayKey(new Date(notice.aside.at)))];
  return (
    <div className="overlay" role="alertdialog" aria-modal="true" aria-labelledby="notice-title" aria-describedby="notice-body">
      <div className="overlay-card notice">
        <h2 id="notice-title">{title}</h2>
        <p id="notice-body">{body}</p>
        <div className="settings-actions">
          <button type="button" className="primary" onClick={onMoveProgress} autoFocus>
            {STRINGS.move.open}
          </button>
          <button type="button" onClick={onDismiss}>
            {STRINGS.ui.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
}
