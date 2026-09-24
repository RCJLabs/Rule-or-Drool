import { useEffect, useId, useMemo, useRef, useState } from "react";
import { STRINGS } from "../content/strings";
import { epilogueByKey, withNames } from "../engine/endings";
import type { Library } from "../engine/library";
import { MANDATES_BY_ID } from "../engine/mandates";
import { otherSide, replays } from "../engine/replay";
import { exitBand } from "../engine/state";
import type { Band, GameState } from "../engine/types";
import {
  LEGACIES,
  OBJECTIVES_BY_ID,
  bandOfHistory,
  dailyNumber,
  historyOf,
  historyTitle,
  monthOf,
  resultOf,
  runCodeOf,
  theirRun,
  todayKey,
  type RunFold,
  type RunResult,
} from "../meta";
import { DailyMonth, dailyName, streakLine } from "./DailyMonth";
import { Frame } from "./Frame";
import { runRecord, timeline } from "./record";
import { renderCard, runFacts, shareLink, shareRun, shareText, type ShareOutcome } from "./share";
import { SetupSummary } from "./SetupSummary";
import { themeOf } from "./theme";
import { composeWorld } from "./world";
import { WorldAfter } from "./WorldAfter";

interface Props {
  lib: Library;
  state: GameState;
  fold: RunFold | null;
  onPlayAgain: () => void;
  onCodex: () => void;
  onSettings: () => void;
  /** Go back to the k-th card and take the other side (BACKLOG-5 phase 34). */
  onTakeOtherRoad?: (k: number) => void;
  /** Today's UTC day, for the streak; the clock's by default. */
  today?: string;
  /** How the run went for whoever sent it, when their link said (BACKLOG-5 phase 37). */
  challenge?: RunResult | null;
}

/**
 * The end of a run (post-run histories). It used to lead with how the run stopped, and a
 * competent player's run stops the same way 97% of the time. It leads now with what the run
 * made: the world after it, drawn from the decisions that shaped it, and the name history
 * gives it. How it stopped is still here, one line up, because it is still true.
 *
 * Read top to bottom it goes: the world you left, what history calls it, what became of the
 * decisions that made it, how it went, what you did with the office, and the long view.
 */
export function Ending({ lib, state, fold, onPlayAgain, onCodex, onSettings, onTakeOtherRoad, today = todayKey(), challenge = null }: Props) {
  const scene = useRef<HTMLElement>(null);
  // The run screen and everything that had focus have just gone. Land on the history's
  // name, so a screen reader starts where a sighted player's eye does (BACKLOG-5 phase 30).
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const [sharing, setSharing] = useState<ShareOutcome | "working" | null>(null);
  // Retraced once, whole. A record this version of the game no longer deals the same way
  // would take a way back into a run that never happened (BACKLOG-5 phase 35).
  const retraceable = useMemo(() => !state.road && replays(lib, state), [lib, state]);
  // The run someone sent, when their link said how it went (BACKLOG-5 phase 37): dealt again
  // from their sides, so their world is drawn from their own run. A second road does not
  // compare; its end already shows two.
  const vs = challenge && !state.road ? challenge : null;
  const theirs = useMemo(() => (vs ? theirRun(lib, runCodeOf(state), vs) : null), [lib, state, vs]);
  const over = state.over;
  if (!over) return null;
  const ending = lib.endings.get(over.endingId);
  const epilogue = epilogueByKey(lib, over.epilogueKey);
  const band = exitBand(lib, state);
  const mandate = state.mandate ? MANDATES_BY_ID.get(state.mandate) : undefined;
  const history = fold?.history ?? historyOf(state, band);
  const world = composeWorld({ band, drift: state.drift, align: state.align, flags: state.flags, seed: state.seed, era: state.era });
  const endingTitle = ending?.title ?? over.endingId;
  const moments = timeline(lib, state, endingTitle);
  // An ouster already says what happened and does not want a tally of your elections under it.
  const record = over.endingId.startsWith(lib.config.finalePrefix) ? runRecord(lib, state) : null;
  const shown = new Set(history.consequences.map((c) => c.flag));
  const rest = state.flags.filter((f) => LEGACIES[f] && !shown.has(f)).map((f) => LEGACIES[f]!);
  const when = STRINGS.world.when[Math.min(state.era, STRINGS.world.when.length) - 1] ?? "";
  // A daily is marked in the text by its number, so a group can compare without links
  // (BACKLOG-5 phase 38). Only the run that went into the log as the day's daily says so.
  const daily = fold?.daily ?? null;
  const dailyDay = daily?.day;

  // Another road from any decision that shaped this one, where the run can be retraced to it
  // (BACKLOG-5 phase 34). A second road shows both instead, and does not branch again.
  const road = state.road;
  const retrace = retraceable && onTakeOtherRoad ? onTakeOtherRoad : null;
  const other = (at: number | null) => {
    const made = at && at > 0 ? state.choices?.[at - 1] : undefined;
    const card = made && lib.cards.get(made[0]);
    return made && card ? { k: at! - 1, label: card[otherSide(made[1])].label } : null;
  };
  const first = road?.first;
  const firstBand = first ? exitBand(lib, first) : band;
  const firstHistory = first ? historyOf(first, firstBand) : null;
  const firstWorld = first ? composeWorld({ band: firstBand, drift: first.drift, align: first.align, flags: first.flags, seed: first.seed, era: first.era }) : null;
  const parted = road && first?.choices?.[road.at];
  const partedCard = parted && lib.cards.get(parted[0]);
  const theirBand = theirs ? exitBand(lib, theirs) : bandOfHistory(vs?.history ?? null);
  const theirHistory = theirs && theirBand ? historyOf(theirs, theirBand) : null;
  const theirWorld = theirs && theirBand ? composeWorld({ band: theirBand, drift: theirs.drift, align: theirs.align, flags: theirs.flags, seed: theirs.seed, era: theirs.era }) : null;
  // Two worlds side by side: the first road and the other (phase 34), or their run and yours
  // (phase 37). The one on the right is always this run, and is the picture a share sends.
  const pair =
    first && firstWorld && firstHistory
      ? { label: STRINGS.road.first, world: firstWorld, band: firstBand, title: firstHistory.title, mine: STRINGS.road.second }
      : theirWorld && theirHistory && theirBand
        ? { label: STRINGS.vs.theirs, world: theirWorld, band: theirBand, title: theirHistory.title, mine: STRINGS.vs.yours }
        : null;

  const share = async () => {
    setSharing("working");
    // The link says how this run went, so whoever opens it can put theirs beside it.
    const text = shareText(state, history, endingTitle, shareLink(state, undefined, resultOf(lib, state)), dailyDay);
    const svg = scene.current?.querySelector("svg");
    // The picture is the best part and still optional: a failed render shares the words.
    const card = svg
      ? await renderCard(svg, { when, kicker: STRINGS.after.calls, title: history.title, facts: runFacts(state, endingTitle), number: (dailyDay && dailyNumber(dailyDay)) || undefined }).catch(() => null)
      : null;
    const slug = history.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSharing(await shareRun(text, card, `rule-or-drool-${slug}.png`));
  };

  return (
    <Frame theme={themeOf(state, lib.config)} align={state.align} seed={state.seed} n={state.cardCount}>
      <div className="ending">
        {pair ? (
          <div className="roads">
            <div className="road">
              <figure className="world-frame" data-band={pair.band}>
                <WorldAfter world={pair.world} title={pair.title} />
              </figure>
              <p className="road-caption">
                <span>{pair.label}</span> <b>{pair.title}</b>
              </p>
            </div>
            <div className="road">
              <figure className="world-frame" data-band={band} ref={scene}>
                <WorldAfter world={world} title={history.title} />
              </figure>
              <p className="road-caption">
                <span>{pair.mine}</span> <b>{history.title}</b>
              </p>
            </div>
          </div>
        ) : (
          <figure className="world-frame" data-band={band} ref={scene}>
            <WorldAfter world={world} title={history.title} />
            <figcaption className="world-when">{when}</figcaption>
          </figure>
        )}
        {road && parted && partedCard && (
          <p className="roads-parted">
            {STRINGS.road.parted
              .replace("{n}", String(road.at + 1))
              .replace("{a}", partedCard[parted[1]].label)
              .replace("{b}", partedCard[otherSide(parted[1])].label)}
          </p>
        )}

        <p className="kicker">
          {STRINGS.ui.ruleEnds} · <b className="ending-how">{endingTitle}</b>
        </p>
        <p className="history-calls">{STRINGS.after.calls}</p>
        <h1 className="history-title" ref={heading} tabIndex={-1}>
          {history.title}
        </h1>
        {fold?.newHistory && <p className="history-new">{STRINGS.after.newHistory}</p>}
        <div className="share-row">
          <button type="button" className="share" onClick={share} disabled={sharing === "working"}>
            {sharing === "working" ? STRINGS.share.working : STRINGS.share.button}
          </button>
          <p className="share-status" role="status">
            {sharing === "shared" ? STRINGS.share.shared : sharing === "copied" ? STRINGS.share.copied : sharing === "failed" ? STRINGS.share.failed : ""}
          </p>
        </div>
        {daily && fold && (
          <p className="daily-mark">
            {dailyName(daily.day)} · {streakLine(fold.meta.dailies, today)}
          </p>
        )}
        {vs && (
          <Versus
            lib={lib}
            vs={vs}
            replayed={!!theirs}
            theirBand={theirBand}
            theirTitle={theirHistory?.title ?? (vs.history ? historyTitle(vs.history) : null)}
            mine={{ key: history.key, title: history.title, ending: endingTitle, cards: state.cardCount, band }}
          />
        )}
        <p className="ending-text">{ending ? withNames(lib, state, ending.text) : null}</p>

        <section className="became">
          <h2>{STRINGS.after.became}</h2>
          <ul>
            {history.consequences.map((c) => {
              const back = retrace ? other(c.at) : null;
              return (
                <li key={c.flag}>
                  {c.label && (
                    <b>
                      {c.label}
                      {c.at !== null && c.at > 0 && <span className="became-when">{STRINGS.timeline.card.replace("{n}", String(c.at))}</span>}
                    </b>
                  )}
                  <p>{c.after}</p>
                  {retrace && back && (
                    <button type="button" className="road-back" onClick={() => retrace(back.k)}>
                      {STRINGS.road.choose.replace("{label}", back.label)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {rest.length > 0 && (
            <p className="became-also">
              {STRINGS.after.also} {rest.join(" · ")}
            </p>
          )}
        </section>

        <section className="timeline">
          <h2>{STRINGS.timeline.title}</h2>
          <ol>
            {moments.map((m, i) => (
              <li key={`${m.kind}-${m.at}-${i}`} data-kind={m.kind}>
                <span className="timeline-at">{m.kind === "start" ? "" : m.at}</span>
                <span className="timeline-text">{m.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {record && (
          <section className="record">
            <h2>{STRINGS.record.title}</h2>
            <ul className="record-lines">
              {record.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="epilogue">
          <h2>{STRINGS.ui.epilogue}</h2>
          <p className="band-label" data-band={band}>
            {STRINGS.bands[band]}
          </p>
          <p>{epilogue?.text ?? "The record ends here."}</p>
        </section>
        {daily && fold && <DailyMonth lib={lib} dailies={fold.meta.dailies} today={today} month={monthOf(daily.day)} streak={false} />}
        {fold && (fold.newObjectives.length > 0 || fold.newUnlocks.length > 0 || fold.newEnding || fold.newHistory) && (
          <section className="earned">
            <h2>{STRINGS.ui.earned}</h2>
            <ul>
              {fold.newHistory && <li>{STRINGS.ui.newHistoryEarned}</li>}
              {fold.newEnding && <li>A new ending for the codex.</li>}
              {fold.newObjectives.map((id) => (
                <li key={id}>{OBJECTIVES_BY_ID.get(id)?.title ?? id}</li>
              ))}
              {fold.newUnlocks.map((u) => (
                <li key={u}>
                  {STRINGS.ui.unlocked}: {STRINGS.unlockNames[u] ?? u}
                </li>
              ))}
              {/* A way to play rather than content: the first finale opens the long reign (BACKLOG-5 phase 39). */}
              {fold.newObjectives.some((id) => OBJECTIVES_BY_ID.get(id)?.opens) && (
                <li>
                  {STRINGS.ui.unlocked}: {STRINGS.reign.opened}
                </li>
              )}
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

interface Mine {
  key: string;
  title: string;
  ending: string;
  cards: number;
  band: Band;
}

/**
 * Their run and yours (BACKLOG-5 phase 37): what history called each, how each ended, how long
 * each lasted and which way each went, and a line on the difference. When their run cannot be
 * dealt again here, it is what their link says it was, and the screen says so.
 */
function Versus({ lib, vs, replayed, theirBand, theirTitle, mine }: { lib: Library; vs: RunResult; replayed: boolean; theirBand: Band | null; theirTitle: string | null; mine: Mine }) {
  const heading = useId();
  const v = STRINGS.vs;
  const theirEnding = vs.ending ? (lib.endings.get(vs.ending)?.title ?? null) : null;
  const verdict =
    vs.history && vs.history === mine.key
      ? v.bothLeft.replace("{history}", mine.title)
      : theirBand && theirBand === mine.band
        ? v.sameWay.replace("{band}", STRINGS.bands[mine.band])
        : theirBand
          ? v.otherWays.replace("{theirs}", STRINGS.bands[theirBand]).replace("{yours}", STRINGS.bands[mine.band])
          : null;
  const rows: [string, string, string][] = [
    [v.history, theirTitle ?? v.unknown, mine.title],
    [v.ending, theirEnding ?? v.unknown, mine.ending],
    [v.cards, String(vs.cards), String(mine.cards)],
    [v.went, theirBand ? STRINGS.bands[theirBand] : v.unknown, STRINGS.bands[mine.band]],
  ];
  return (
    <section className="versus" aria-labelledby={heading}>
      <h2 id={heading}>{v.title}</h2>
      {verdict && <p className="versus-verdict">{verdict}</p>}
      {!replayed && <p className="versus-note">{v.unreplayed}</p>}
      <table className="versus-table">
        <thead>
          <tr>
            <td />
            <th scope="col">{v.theirs}</th>
            <th scope="col">{v.yours}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, theirs, yours]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{theirs}</td>
              <td>{yours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
