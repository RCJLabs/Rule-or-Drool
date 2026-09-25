import { STRINGS } from "../content/strings";
import { contractStreak, contractsFor, keptIn, weekNumber, type MetaState } from "../meta";

const c = STRINGS.contracts;

/** The run of weeks, worded as the daily's run of days is: a week still open keeps it alive. */
export function contractStreakLine(meta: Pick<MetaState, "contracts">, week: number): string {
  const { current } = contractStreak(meta, week);
  if (current === 0) return c.streakNone;
  if (keptIn(meta, week).length > 0) return current === 1 ? c.streakFirst : c.streakThis.replace("{n}", String(current));
  return current === 1 ? c.streakOpenOne : c.streakOpen.replace("{n}", String(current));
}

/**
 * This week's three contracts, which are kept, and the run of weeks (BACKLOG-10 phase 60). The
 * week is dealt from its number, so a profile keeps only which ones it kept.
 */
export function ContractsWeek({ meta, today }: { meta: MetaState; today: string }) {
  const week = weekNumber(today);
  if (week === null) return <p className="codex-empty">{c.turnover}</p>;
  const kept = keptIn(meta, week);
  const { best, current } = contractStreak(meta, week);
  return (
    <div className="contracts">
      <h3 className="contracts-week">{c.heading.replace("{n}", String(week))}</h3>
      <p className="codex-foot">{c.intro}</p>
      <ul className="codex-list">
        {contractsFor(week).map((x) => {
          const done = kept.includes(x.id);
          return (
            <li key={x.id} className={done ? "found" : ""}>
              <b>
                {done ? "✓ " : ""}
                {c.tiers[x.tier]}
              </b>
              <span>{x.text}</span>
              <em>{done ? c.kept : c.open}</em>
            </li>
          );
        })}
      </ul>
      <p className="daily-streak">{contractStreakLine(meta, week)}</p>
      {best > current && <p className="codex-foot">{c.best.replace("{n}", String(best))}</p>}
      {week > 1 && <p className="codex-foot">{c.lastWeek.replace("{n}", String(keptIn(meta, week - 1).length))}</p>}
      <p className="codex-foot">{c.turnover}</p>
    </div>
  );
}
