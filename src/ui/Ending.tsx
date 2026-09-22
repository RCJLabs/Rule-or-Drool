import { STRINGS } from "../content/strings";
import { epilogueByKey, withNames } from "../engine/endings";
import type { Library } from "../engine/library";
import { exitBand } from "../engine/state";
import type { GameState } from "../engine/types";
import { OBJECTIVES_BY_ID, type RunFold } from "../meta";
import { MANDATES_BY_ID } from "../engine/mandates";
import { Frame } from "./Frame";
import { SetupSummary } from "./SetupSummary";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  state: GameState;
  fold: RunFold | null;
  onPlayAgain: () => void;
  onCodex: () => void;
  onSettings: () => void;
}

export function Ending({ lib, state, fold, onPlayAgain, onCodex, onSettings }: Props) {
  const over = state.over;
  if (!over) return null;
  const ending = lib.endings.get(over.endingId);
  const epilogue = epilogueByKey(lib, over.epilogueKey);
  const band = exitBand(lib, state);
  const mandate = state.mandate ? MANDATES_BY_ID.get(state.mandate) : undefined;
  return (
    <Frame theme={themeFor(state.drift, lib.config)} seed={state.seed} n={state.cardCount}>
      <div className="ending">
        <p className="kicker">Your rule ends</p>
        <h1>{ending?.title ?? over.endingId}</h1>
        <p className="ending-text">{ending ? withNames(lib, state, ending.text) : null}</p>
        <section className="epilogue">
          <h2>{STRINGS.ui.epilogue}</h2>
          <p className="band-label" data-band={band}>
            {STRINGS.bands[band]}
          </p>
          <p>{epilogue?.text ?? "The record ends here."}</p>
        </section>
        {fold && (fold.newObjectives.length > 0 || fold.newUnlocks.length > 0 || fold.newEnding) && (
          <section className="earned">
            <h2>{STRINGS.ui.earned}</h2>
            <ul>
              {fold.newEnding && <li>A new ending for the codex.</li>}
              {fold.newObjectives.map((id) => (
                <li key={id}>{OBJECTIVES_BY_ID.get(id)?.title ?? id}</li>
              ))}
              {fold.newUnlocks.map((u) => (
                <li key={u}>
                  {STRINGS.ui.unlocked}: {STRINGS.unlockNames[u] ?? u}
                </li>
              ))}
            </ul>
          </section>
        )}
        {mandate && (
          <p className={`mandate-result${state.mandateBrokenAt === null ? " kept" : " broken"}`}>
            <b>{mandate.title}</b>{" "}
            {state.mandateBrokenAt === null
              ? STRINGS.ui.mandateKept
              : `${STRINGS.ui.mandateBroken} · ${STRINGS.ui.mandateBrokenAt} ${state.mandateBrokenAt}`}
          </p>
        )}
        <SetupSummary lib={lib} modifiers={state.modifiers} compact />
        <dl className="stats">
          <dt>Cards</dt>
          <dd>{state.cardCount}</dd>
          <dt>Era</dt>
          <dd>{state.era}</dd>
          <dt>Side</dt>
          <dd>{STRINGS.parties[state.align]}</dd>
          <dt>Seed</dt>
          <dd>{state.seed}</dd>
        </dl>
        <button type="button" className="primary big" onClick={onPlayAgain}>
          {STRINGS.ui.playAgain}
        </button>
        <div className="meta-row">
          <button type="button" onClick={onCodex}>
            {STRINGS.ui.codex}
          </button>
          <button type="button" onClick={onSettings}>
            {STRINGS.ui.settings}
          </button>
        </div>
      </div>
    </Frame>
  );
}
