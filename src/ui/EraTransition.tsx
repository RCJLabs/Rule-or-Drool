import { STRINGS } from "../content/strings";

interface Props {
  era: number;
  onContinue: () => void;
}

export function EraTransition({ era, onContinue }: Props) {
  const info = STRINGS.eras[era - 1];
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="era-title">
      <div className="overlay-card">
        <p className="kicker">Era {era}</p>
        <h2 id="era-title">{info?.name ?? `Era ${era}`}</h2>
        <p>{info?.jump ?? "Time passes."}</p>
        <button type="button" className="primary" onClick={onContinue} autoFocus>
          {STRINGS.ui.continueEra}
        </button>
      </div>
    </div>
  );
}
