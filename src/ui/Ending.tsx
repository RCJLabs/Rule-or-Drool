import { STRINGS } from "../content/strings";
import { epilogueByKey } from "../engine/endings";
import type { Library } from "../engine/library";
import { exitBand } from "../engine/state";
import type { GameState } from "../engine/types";
import { Frame } from "./Frame";
import { SetupSummary } from "./SetupSummary";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  state: GameState;
  onPlayAgain: () => void;
}

export function Ending({ lib, state, onPlayAgain }: Props) {
  const over = state.over;
  if (!over) return null;
  const ending = lib.endings.get(over.endingId);
  const epilogue = epilogueByKey(lib, over.epilogueKey);
  const band = exitBand(lib, state);
  return (
    <Frame theme={themeFor(state.drift, lib.config)} seed={state.seed} n={state.cardCount}>
      <div className="ending">
        <p className="kicker">Your rule ends</p>
        <h1>{ending?.title ?? over.endingId}</h1>
        <p className="ending-text">{ending?.text}</p>
        <section className="epilogue">
          <h2>{STRINGS.ui.epilogue}</h2>
          <p className="band-label" data-band={band}>
            {STRINGS.bands[band]}
          </p>
          <p>{epilogue?.text ?? "The record ends here."}</p>
        </section>
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
      </div>
    </Frame>
  );
}
