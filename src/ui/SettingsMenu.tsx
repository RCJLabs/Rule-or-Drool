import { useState } from "react";
import { STRINGS } from "../content/strings";
import type { SendOutcome } from "./playtest";
import type { Settings } from "./settings";

/**
 * One row of the menu. Adding a setting means adding a `Settings` field and one entry
 * here; the menu itself does not change. `kind` is a toggle for now and is the seam where
 * a choice or a slider goes in later.
 */
/** Only the settings that are actually a switch; `taught` is a record, not a preference. */
type ToggleKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

interface Row {
  key: ToggleKey;
  kind: "toggle";
  title: string;
  blurb: string;
  /**
   * A setting this one is already doing. The row shows on and locked while that holds, so
   * the menu never claims the text is being mangled when it is not (BACKLOG-3 phase 21).
   */
  impliedBy?: ToggleKey;
}

const ROWS: readonly Row[] = [
  {
    key: "readable",
    kind: "toggle",
    title: "Plain screen",
    blurb: "Drop the stream, the projection and the glow. The colours and the writing stay.",
  },
  { key: "sound", kind: "toggle", title: "Sound", blurb: "The card landing, a meter going bad, a story opening." },
  { key: "haptics", kind: "toggle", title: "Vibration", blurb: "A short buzz when a card lands, if the device does that." },
  { key: "reduceMotion", kind: "toggle", title: "Reduce motion", blurb: "Cards change without sliding or settling." },
  {
    key: "plainText",
    kind: "toggle",
    title: "Keep the text clean",
    blurb: "Late Decay stops mangling the words on the card.",
    impliedBy: "readable",
  },
  { key: "portraits", kind: "toggle", title: "Show portraits", blurb: "Draw the face of whoever is speaking." },
  { key: "alwaysHint", kind: "toggle", title: "Always show the hint", blurb: "Keep the how-to-swipe line under every card." },
  { key: "showChoices", kind: "toggle", title: "Show choice buttons", blurb: "Two buttons under the card, for tapping instead of dragging." },
  { key: "keepRecord", kind: "toggle", title: STRINGS.playtest.title, blurb: STRINGS.playtest.blurb },
];

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
  /** Present during a run. Leaving keeps the save, so the menu can resume it. */
  onExitToMenu?: () => void;
  onEraseProgress: () => void;
  onHowItWorks: () => void;
  /** The playtest record (BACKLOG-5 phase 31): how many runs it holds, and whether it is full. */
  record?: { runs: number; full: boolean };
  onSendRecord?: () => Promise<SendOutcome>;
  onDeleteRecord?: () => void;
}

export function SettingsMenu({ settings, onChange, onClose, onExitToMenu, onEraseProgress, onHowItWorks, record, onSendRecord, onDeleteRecord }: Props) {
  const [confirmErase, setConfirmErase] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sending, setSending] = useState<SendOutcome | "working" | null>(null);
  const p = STRINGS.playtest;

  const send = async () => {
    if (!onSendRecord) return;
    setSending("working");
    setSending(await onSendRecord());
  };
  const recordLine = !record ? "" : record.full ? p.full.replace("{n}", String(record.runs)) : record.runs === 0 ? p.none : record.runs === 1 ? p.countOne : p.count.replace("{n}", String(record.runs));

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="overlay-card settings">
        <h2 id="settings-title">{STRINGS.ui.settings}</h2>

        <ul className="settings-list">
          {ROWS.map((row) => {
            const implied = row.impliedBy ? settings[row.impliedBy] === true : false;
            const on = settings[row.key] || implied;
            return (
              <li key={row.key}>
                <label className={implied ? "implied" : undefined}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={implied}
                    onChange={(e) => onChange({ ...settings, [row.key]: e.target.checked })}
                  />
                  <span>
                    <b>{row.title}</b>
                    <em>{implied ? STRINGS.ui.impliedBy : row.blurb}</em>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {/* What the record holds, and the only two things to do with it. Shown while it is on,
            and while there is anything in it, so turning it off never hides what was kept. */}
        {record && (settings.keepRecord || record.runs > 0) && (
          <div className="settings-record">
            <p className="settings-note">{recordLine}</p>
            {record.runs > 0 && (
              <div className="settings-actions">
                <button type="button" onClick={send} disabled={sending === "working"}>
                  {p.send}
                </button>
                {confirmDelete ? (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      onDeleteRecord?.();
                      setConfirmDelete(false);
                      setSending(null);
                    }}
                  >
                    {p.deleteConfirm}
                  </button>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)}>
                    {p.delete}
                  </button>
                )}
              </div>
            )}
            <p className="settings-note" role="status">
              {sending === "shared" ? p.shared : sending === "saved" ? p.saved : sending === "failed" ? p.failed : ""}
            </p>
          </div>
        )}

        <div className="settings-actions">
          <button type="button" onClick={onHowItWorks}>
            {STRINGS.ui.howItWorks}
          </button>
          {onExitToMenu && (
            <button type="button" onClick={onExitToMenu}>
              {STRINGS.ui.exitToMenu}
            </button>
          )}
          {confirmErase ? (
            <button type="button" className="danger" onClick={onEraseProgress}>
              {STRINGS.ui.eraseConfirm}
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmErase(true)}>
              {STRINGS.ui.erase}
            </button>
          )}
        </div>
        {confirmErase && <p className="settings-warning">{STRINGS.ui.eraseWarning}</p>}

        <button type="button" className="primary" onClick={onClose} autoFocus>
          {STRINGS.ui.close}
        </button>
      </div>
    </div>
  );
}
