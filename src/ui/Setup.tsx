import { useMemo, useState } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { rollSetup } from "../engine/state";
import type { GameState, PlayerAlign } from "../engine/types";
import { codexProgress, todayKey, type MetaState } from "../meta";
import { PLAYER_ALIGNS } from "../engine/types";
import { APP_VERSION } from "../version";
import { Frame } from "./Frame";
import { MandatePicker } from "./MandatePicker";
import { SetupSummary } from "./SetupSummary";
import { randomSeed } from "./flow";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  saved: GameState | null;
  meta: MetaState;
  onStart: (seed: number, align: PlayerAlign, mandate: string | null) => void;
  onDaily: (align: PlayerAlign, mandate: string | null) => void;
  onContinue: () => void;
  onCodex: () => void;
  onSettings: () => void;
}

export function Setup({ lib, saved, meta, onStart, onDaily, onContinue, onCodex, onSettings }: Props) {
  const [seed, setSeed] = useState(() => randomSeed());
  const [align, setAlign] = useState<PlayerAlign>("left");
  const [mandate, setMandate] = useState<string | null>(null);
  const setup = useMemo(() => rollSetup(lib, seed, align, meta.unlocks), [lib, seed, align, meta.unlocks]);
  const progress = codexProgress(lib, meta);
  const dailyPlayed = meta.daily?.day === todayKey();
  return (
    <Frame theme={themeFor(0)} seed={0} n={0}>
      <div className="setup">
        <h1>{STRINGS.title}</h1>
        <p className="tagline">{STRINGS.tagline}</p>
        {saved && (
          <button type="button" className="primary" onClick={onContinue}>
            {STRINGS.ui.continueRun} · era {saved.era}, {STRINGS.parties[saved.align]}
          </button>
        )}
        <fieldset className="align">
          <legend>Your side</legend>
          {PLAYER_ALIGNS.map((a) => (
            <button key={a} type="button" className={`align-choice${align === a ? " selected" : ""}`} aria-pressed={align === a} onClick={() => setAlign(a)}>
              <b>{STRINGS.parties[a]}</b>
              <span>{STRINGS.partyBlurbs[a]}</span>
            </button>
          ))}
        </fieldset>
        <SetupSummary lib={lib} modifiers={setup.modifiers ?? []} />
        <MandatePicker value={mandate} onChange={setMandate} />
        <label className="seed">
          {STRINGS.ui.seed}
          <input type="number" inputMode="numeric" value={seed} onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value)) || 0))} />
          <button type="button" onClick={() => setSeed(randomSeed())}>
            {STRINGS.ui.shuffle}
          </button>
        </label>
        <button type="button" className="primary big" onClick={() => onStart(seed, align, mandate)}>
          {STRINGS.ui.start}
        </button>
        <div className="meta-row">
          <button type="button" onClick={() => onDaily(align, mandate)} disabled={dailyPlayed}>
            {dailyPlayed ? STRINGS.ui.dailyDone : STRINGS.ui.daily}
          </button>
          <button type="button" onClick={onCodex}>
            {STRINGS.ui.codex} {progress.endingsSeen}/{progress.endingsTotal}
          </button>
          <button type="button" onClick={onSettings}>
            {STRINGS.ui.settings}
          </button>
        </div>
        <p className="hint">{STRINGS.ui.hint}</p>
        <footer className="version">v{APP_VERSION}</footer>
      </div>
    </Frame>
  );
}
