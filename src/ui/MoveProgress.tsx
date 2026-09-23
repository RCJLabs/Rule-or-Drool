import { useEffect, useRef, useState } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { MetaState } from "../meta";
import { APP_VERSION } from "../version";
import { progressCode, progressJson, progressSummary, readProgress, type ProgressSummary, type Readout } from "./progress";
import type { Settings } from "./settings";
import { handFile, type SendOutcome } from "./share";

interface Props {
  lib: Library;
  meta: MetaState;
  settings: Settings;
  /** A code that arrived in a link, to read as soon as the dialog opens. */
  incoming?: string;
  onReplace: (meta: MetaState, settings: Settings) => void;
  onClose: () => void;
}

export const PROGRESS_FILE_NAME = "rule-or-drool-progress.txt";

/**
 * Settings › Move my progress (BACKLOG-5 phase 33). Taking it away is a file or a code;
 * bringing it here reads first and replaces only when asked, with what is here and what is
 * coming set side by side, because a replaced codex does not come back.
 */
export function MoveProgress({ lib, meta, settings, incoming, onReplace, onClose }: Props) {
  const m = STRINGS.move;
  const [code, setCode] = useState<string | null>(null);
  const [sent, setSent] = useState<SendOutcome | "copied" | "byHand" | null>(null);
  const [input, setInput] = useState(incoming ?? "");
  const [readout, setReadout] = useState<Readout | null>(null);
  const [done, setDone] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const read = async (text: string) => {
    setDone(false);
    setReadout(text.trim() ? await readProgress(text) : null);
  };
  useEffect(() => {
    if (incoming) void read(incoming);
    // Once, for the link the dialog was opened with.
  }, []);

  const saveFile = async () => {
    const f = new File([progressJson(meta, settings)], PROGRESS_FILE_NAME, { type: "text/plain" });
    setSent(await handFile(f, { title: m.shareTitle, text: m.shareText.replace("{version}", APP_VERSION) }));
  };
  const copyCode = async () => {
    const c = await progressCode(meta, settings);
    setCode(c);
    try {
      await navigator.clipboard.writeText(c);
      setSent("copied");
    } catch {
      setSent("byHand");
    }
  };
  const openFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    setInput(text);
    await read(text);
  };

  const here = progressSummary(lib, meta);
  const coming = readout?.ok ? progressSummary(lib, readout.meta) : null;
  const refusal =
    !readout || readout.ok ? ""
    : readout.reason === "newer" ? (readout.game ? m.newer.replace("{version}", readout.game) : m.newerUnknown)
    : readout.reason === "cannotUnpack" ? m.cannotUnpack
    : m.unreadable;
  const sentLine =
    sent === "copied" ? m.copied : sent === "byHand" ? m.copyByHand : sent === "shared" ? m.shared : sent === "saved" ? m.saved : sent === "failed" ? m.failed : "";

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="move-title">
      <div className="overlay-card move">
        <h2 id="move-title">{m.title}</h2>
        <p className="move-lead">{m.lead}</p>

        <h3>{m.takeTitle}</h3>
        <div className="settings-actions">
          <button type="button" onClick={saveFile}>
            {m.saveFile}
          </button>
          <button type="button" onClick={copyCode}>
            {m.copyCode}
          </button>
        </div>
        {code && <textarea className="move-code" readOnly value={code} aria-label={m.codeLabel} rows={3} onFocus={(e) => e.currentTarget.select()} />}
        <p className="settings-note" role="status">
          {sentLine}
        </p>

        <h3>{m.bringTitle}</h3>
        <textarea className="move-code" value={input} onChange={(e) => setInput(e.target.value)} aria-label={m.pasteLabel} placeholder={m.paste} rows={3} />
        <div className="settings-actions">
          <button type="button" onClick={() => read(input)} disabled={!input.trim()}>
            {m.read}
          </button>
          <button type="button" onClick={() => file.current?.click()}>
            {m.openFile}
          </button>
          <input ref={file} type="file" accept=".txt,.json,text/plain,application/json" hidden onChange={(e) => openFile(e.target.files?.[0])} />
        </div>
        {refusal && (
          <p className="settings-warning" role="alert">
            {refusal}
          </p>
        )}
        {coming && readout?.ok && (
          <div className="move-compare">
            <Compare here={here} coming={coming} />
            <p className="settings-warning">{coming.runs < here.runs ? m.fewer : m.replaces}</p>
            <div className="settings-actions">
              <button
                type="button"
                className="danger"
                onClick={() => {
                  onReplace(readout.meta, readout.settings);
                  setReadout(null);
                  setInput("");
                  setDone(true);
                }}
              >
                {m.replace}
              </button>
              <button type="button" onClick={() => setReadout(null)}>
                {m.keep}
              </button>
            </div>
          </div>
        )}
        <p className="settings-note" role="status">
          {done ? m.done : ""}
        </p>

        <button type="button" className="primary" onClick={onClose} autoFocus>
          {STRINGS.ui.close}
        </button>
      </div>
    </div>
  );
}

/** "12, streak 4": the dailies, and the streak a replace would carry off or bring. */
const dailies = (p: ProgressSummary) => (p.streak > 0 ? STRINGS.move.dailiesStreak.replace("{n}", String(p.dailies)).replace("{s}", String(p.streak)) : String(p.dailies));

function Compare({ here, coming }: { here: ProgressSummary; coming: ProgressSummary }) {
  const m = STRINGS.move;
  const rows: [string, string, string][] = [
    [m.runs, String(here.runs), String(coming.runs)],
    [m.endings, `${here.endings} of ${here.endingsTotal}`, `${coming.endings} of ${coming.endingsTotal}`],
    [m.unlocks, String(here.unlocks), String(coming.unlocks)],
    [m.dailies, dailies(here), dailies(coming)],
  ];
  return (
    <table>
      <thead>
        <tr>
          <td />
          <th scope="col">{m.here}</th>
          <th scope="col">{m.coming}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, a, b]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{a}</td>
            <td>{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
