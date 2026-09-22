import { useState } from "react";
import { STRINGS } from "../content/strings";
import type { Settings } from "./settings";

/**
 * One row of the menu. Adding a setting means adding a `Settings` field and one entry
 * here; the menu itself does not change. `kind` is a toggle for now and is the seam where
 * a choice or a slider goes in later.
 */
interface Row {
  key: keyof Settings;
  kind: "toggle";
  title: string;
  blurb: string;
}

const ROWS: readonly Row[] = [
  { key: "sound", kind: "toggle", title: "Sound", blurb: "The card landing, a meter going bad, a story opening." },
  { key: "haptics", kind: "toggle", title: "Vibration", blurb: "A short buzz when a card lands, if the device does that." },
  { key: "reduceMotion", kind: "toggle", title: "Reduce motion", blurb: "Cards change without sliding or settling." },
  { key: "plainText", kind: "toggle", title: "Keep the text clean", blurb: "Late Decay stops mangling the words on the card." },
  { key: "portraits", kind: "toggle", title: "Show portraits", blurb: "Draw the face of whoever is speaking." },
  { key: "alwaysHint", kind: "toggle", title: "Always show the hint", blurb: "Keep the how-to-swipe line under every card." },
];

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
  /** Present during a run. Leaving keeps the save, so the menu can resume it. */
  onExitToMenu?: () => void;
  onEraseProgress: () => void;
}

export function SettingsMenu({ settings, onChange, onClose, onExitToMenu, onEraseProgress }: Props) {
  const [confirmErase, setConfirmErase] = useState(false);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="overlay-card settings">
        <h2 id="settings-title">{STRINGS.ui.settings}</h2>

        <ul className="settings-list">
          {ROWS.map((row) => {
            const on = settings[row.key];
            return (
              <li key={row.key}>
                <label>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => onChange({ ...settings, [row.key]: e.target.checked })}
                  />
                  <span>
                    <b>{row.title}</b>
                    <em>{row.blurb}</em>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="settings-actions">
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
