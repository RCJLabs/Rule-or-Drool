import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { MANDATES_BY_ID } from "../engine/mandates";
import { contractById, historyTitle, scenarioFor, scenarioTry, weekNumber, type MetaState, type ScenarioTry, type ScenarioWeek as Week } from "../meta";
import { dailyCode } from "./flow";
import { SetupSummary } from "./SetupSummary";

const w = STRINGS.scenario;

/** A week's goal in the contracts' words. */
export function goalOf(s: Week): string {
  return contractById(s.goal)?.text ?? s.goal;
}

/** What a try came to, in a word: met, not met, or not finished. */
function outcome(t: ScenarioTry): string {
  return t.result ? (t.result.met ? w.met : w.missed) : w.unfinished;
}

interface Props {
  lib: Library;
  meta: MetaState;
  today: string;
  /** The saved run is this week's try, left for later. */
  underWay?: boolean;
  onStart?: () => void;
}

/**
 * The week's scenario in the codex (BACKLOG-12 phase 78): the goal, the run it is set on, and the
 * one try, before it and after; then how the weeks before went.
 */
export function ScenarioWeek({ lib, meta, today, underWay = false, onStart }: Props) {
  const s = scenarioFor(weekNumber(today));
  const past = (meta.scenarios ?? []).filter((t) => t.week !== s?.week && scenarioFor(t.week)).reverse();
  return (
    <div className="scenario">
      {s ? <ThisWeek lib={lib} s={s} t={scenarioTry(meta, s.week)} underWay={underWay} onStart={onStart} /> : <p className="codex-empty">{w.none}</p>}
      {past.length > 0 && (
        <>
          <h3 className="contracts-week">{w.past}</h3>
          <ul className="codex-list">
            {past.map((t) => (
              <li key={t.week} className={t.result?.met ? "found" : ""}>
                <b>
                  {t.result?.met ? "✓ " : ""}
                  {w.heading.replace("{n}", String(t.week))}
                </b>
                <span>{goalOf(scenarioFor(t.week)!)}</span>
                <em>{outcome(t)}</em>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="codex-foot">{w.turnover}</p>
    </div>
  );
}

function ThisWeek({ lib, s, t, underWay, onStart }: { lib: Library; s: Week; t: ScenarioTry | undefined; underWay: boolean; onStart?: () => void }) {
  const code = dailyCode(lib, s.seed, s.align, s.mandates);
  const promise = s.mandates.map((id) => MANDATES_BY_ID.get(id)?.title ?? id).join(" · ");
  const r = t?.result;
  const name = r ? historyTitle(r.history) : null;
  return (
    <>
      <h3 className="contracts-week">{w.heading.replace("{n}", String(s.week))}</h3>
      <p className="scenario-goal">
        <b>{w.goal}</b> {goalOf(s)}
      </p>
      <p className="scenario-side">
        {w.side} <b>{STRINGS.parties[s.align]}</b> ·{" "}
        {promise ? (
          <>
            {w.promise} <b>{promise}</b>
          </>
        ) : (
          w.noPromise
        )}
      </p>
      <SetupSummary lib={lib} modifiers={code.modifiers} align={s.align} />
      {!t && (
        <>
          <p className="codex-foot">{w.intro}</p>
          {onStart && (
            <button type="button" className="primary scenario-start" onClick={onStart}>
              {w.start}
            </button>
          )}
        </>
      )}
      {t && !r && <p className="scenario-state">{underWay ? w.underWay : w.left}</p>}
      {r && (
        <p className={`scenario-state${r.met ? " met" : ""}`}>
          <b>
            {r.met ? "✓ " : ""}
            {r.met ? w.met : w.missed}
          </b>
          {name && ` · ${name}`} · {w.result.replace("{cards}", String(r.cards)).replace("{ending}", lib.endings.get(r.ending)?.title ?? r.ending)}
        </p>
      )}
    </>
  );
}
