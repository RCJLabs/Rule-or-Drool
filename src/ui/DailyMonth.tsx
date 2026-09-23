import { useId, useState } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { dailyNumber, dayIndex, daysOfMonth, FIRST_DAILY, historyTitle, monthOf, shiftMonth, streakOf, weekdayOf, type DailyEntry } from "../meta";

interface Props {
  lib: Library;
  dailies: readonly DailyEntry[];
  /** Today's UTC day key: what the streak is counted up to. */
  today: string;
  /** The month to open on; today's by default. */
  month?: string;
  /** Page back through earlier months (the codex). The end of a daily shows only its own. */
  browse?: boolean;
  /** Say the streak here; off where the screen has said it already. */
  streak?: boolean;
}

/** "Daily #412", or "Daily" for a day with no number (a clock that has lost its place). */
export function dailyName(day: string): string {
  const n = dailyNumber(day);
  return n ? STRINGS.daily.number.replace("{n}", String(n)) : STRINGS.daily.unnumbered;
}

/** How the streak stands, in a line. */
export function streakLine(dailies: readonly DailyEntry[], today: string): string {
  const { current } = streakOf(dailies, today);
  const s = STRINGS.daily;
  if (current === 0) return s.streakNone;
  const playedToday = dailies.some((d) => d.day === today);
  if (playedToday) return current === 1 ? s.streakFirst : s.streakToday.replace("{n}", String(current));
  return current === 1 ? s.streakOpenOne : s.streakOpen.replace("{n}", String(current));
}

export function monthName(month: string): string {
  const [y, m] = month.split("-");
  return `${STRINGS.daily.months[Number(m) - 1]} ${y}`;
}

/** ", #412" after "played", where the day has a number. */
function numberOf(day: string): string {
  const n = dailyNumber(day);
  return n ? `, #${n}` : "";
}

/** "23 September": a day as the month view says it. */
function dayName(day: string): string {
  return `${Number(day.slice(8))} ${STRINGS.daily.months[Number(day.slice(5, 7)) - 1]}`;
}

/**
 * A month of dailies (BACKLOG-5 phase 38): the streak, the month laid out in weeks with each
 * day played marked, and under it each day's name, newest first. A day before the player's
 * first daily is not a missed one; they were not playing yet.
 */
export function DailyMonth({ lib, dailies, today, month: opening, browse = false, streak = true }: Props) {
  const [month, setMonth] = useState(() => opening ?? monthOf(today));
  const heading = useId();
  const byDay = new Map(dailies.map((d) => [d.day, d]));
  const started = dailies[0]?.day ?? today;
  const earliest = monthOf(started < today ? started : today);
  const latest = monthOf(today);
  const { best, current } = streakOf(dailies, today);
  const days = daysOfMonth(month);
  const t = dayIndex(today);
  const from = Math.max(dayIndex(started), dayIndex(FIRST_DAILY));

  const stateOf = (day: string): "played" | "today" | "missed" | "future" | "before" => {
    const i = dayIndex(day);
    if (byDay.has(day)) return "played";
    if (i === t) return "today";
    if (i > t) return "future";
    return i < from ? "before" : "missed";
  };
  const said = (day: string): string => {
    const e = byDay.get(day);
    const state = stateOf(day);
    const what =
      state === "played" && e
        ? `${STRINGS.daily.played}${numberOf(day)}: ${historyTitle(e.history ?? "") ?? lib.endings.get(e.ending)?.title ?? e.ending}`
        : state === "missed"
          ? STRINGS.daily.missed
          : state === "today"
            ? STRINGS.daily.today
            : state === "future"
              ? STRINGS.daily.toCome
              : "";
    return what ? `${dayName(day)}: ${what}` : dayName(day);
  };

  const cells: (string | null)[] = [...Array<null>(weekdayOf(days[0]!)).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const played = days.filter((d) => byDay.has(d)).reverse();

  return (
    <section className="daily-month" aria-labelledby={heading}>
      <h2 id={heading}>{STRINGS.daily.title}</h2>
      {streak && <p className="daily-streak">{streakLine(dailies, today)}</p>}
      {best > current && <p className="daily-best">{STRINGS.daily.best.replace("{n}", String(best))}</p>}
      <div className="daily-month-head">
        {browse && (
          <button type="button" aria-label={STRINGS.daily.earlier} disabled={month <= earliest} onClick={() => setMonth(shiftMonth(month, -1))}>
            ‹
          </button>
        )}
        <h3>{monthName(month)}</h3>
        {browse && (
          <button type="button" aria-label={STRINGS.daily.later} disabled={month >= latest} onClick={() => setMonth(shiftMonth(month, 1))}>
            ›
          </button>
        )}
      </div>
      <table className="daily-grid">
        <thead>
          <tr>
            {STRINGS.daily.weekdaysShort.map((w, i) => (
              <th key={STRINGS.daily.weekdays[i]} scope="col" abbr={STRINGS.daily.weekdays[i]}>
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.find(Boolean)}>
              {week.map((day, i) =>
                day ? (
                  <td key={day} data-day={stateOf(day)}>
                    <span aria-hidden="true">{Number(day.slice(8))}</span>
                    <span className="sr-only">{said(day)}</span>
                  </td>
                ) : (
                  <td key={`blank-${i}`} />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {played.length === 0 ? (
        <p className="daily-none">{STRINGS.daily.none}</p>
      ) : (
        <ol className="daily-days">
          {played.map((day) => {
            const e = byDay.get(day)!;
            const ending = lib.endings.get(e.ending)?.title ?? e.ending;
            return (
              <li key={day}>
                <b>{historyTitle(e.history ?? "") ?? ending}</b>
                <span>
                  {[dailyNumber(day) && `#${dailyNumber(day)}`, dayName(day), STRINGS.daily.endedIn.replace("{ending}", ending).replace("{n}", String(e.cards))].filter(Boolean).join(" · ")}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <p className="daily-turnover">{STRINGS.daily.turnover}</p>
    </section>
  );
}
