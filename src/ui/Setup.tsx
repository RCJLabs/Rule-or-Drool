import { useMemo, useState } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { rollSetup } from "../engine/state";
import type { GameState, PlayerAlign } from "../engine/types";
import { PLAYER_ALIGNS } from "../engine/types";
import { APP_VERSION } from "../version";
import { Frame } from "./Frame";
import { SetupSummary } from "./SetupSummary";
import { randomSeed } from "./flow";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  saved: GameState | null;
  onStart: (seed: number, align: PlayerAlign) => void;
  onContinue: () => void;
}

export function Setup({ lib, saved, onStart, onContinue }: Props) {
  const [seed, setSeed] = useState(() => randomSeed());
  const [align, setAlign] = useState<PlayerAlign>("left");
  const setup = useMemo(() => rollSetup(lib, seed, align), [lib, seed, align]);
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
        <label className="seed">
          {STRINGS.ui.seed}
          <input type="number" inputMode="numeric" value={seed} onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value)) || 0))} />
          <button type="button" onClick={() => setSeed(randomSeed())}>
            {STRINGS.ui.shuffle}
          </button>
        </label>
        <button type="button" className="primary big" onClick={() => onStart(seed, align)}>
          {STRINGS.ui.start}
        </button>
        <p className="hint">{STRINGS.ui.hint}</p>
        <footer className="version">v{APP_VERSION}</footer>
      </div>
    </Frame>
  );
}
