import { useEffect, useId, useMemo, useRef, useState } from "react";
import { STRINGS } from "../content/strings";
import { deckStamp } from "../engine/deck";
import { epilogueByKey, survivedTo, withNames } from "../engine/endings";
import type { Library } from "../engine/library";
import { MANDATES_BY_ID } from "../engine/mandates";
import { otherSide } from "../engine/replay";
import { exitBand, exitDrift, isFirstTerm } from "../engine/state";
import type { Band, GameState } from "../engine/types";
import {
  HISTORY_ORDER,
  LEGACIES,
  NOTHING_READ,
  OBJECTIVES_BY_ID,
  bandOfHistory,
  contractById,
  dailyNumber,
  followUpKey,
  historyOfRun,
  historyTitle,
  monthOf,
  resultOf,
  runCodeOf,
  scenarioFor,
  theirRun,
  todayKey,
  toldByEnding,
  type Consequence,
  type RunFold,
  type RunResult,
} from "../meta";
import { DailyMonth, dailyName, streakLine } from "./DailyMonth";
import { Frame } from "./Frame";
import { lineName, tookOverLine } from "./dynasty";
import { causeLine } from "./cause";
import { runRecord, timeline } from "./record";
import { goalOf } from "./Scenario";
import { renderCard, runFacts, shareLink, shareRun, shareText, type ShareOutcome } from "./share";
import { SetupSummary } from "./SetupSummary";
import { billsOf } from "./receipt";
import { lookedOf, rumourOf } from "./pursuit";
import { shapeOf } from "./shape";
import { ShapeChart } from "./ShapeChart";
import { endThemeOf } from "./theme";
import { turningCount, turningOutcome, useTurningPoints } from "./turning";
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
  // Retraced once, whole, card by card for the chart of how it went (BACKLOG-12 phase 74). A
  // record this version of the game no longer deals the same way has no shape, and would take a
  // way back into a run that never happened (BACKLOG-5 phase 35).
  const shape = useMemo(() => shapeOf(lib, state), [lib, state]);
  // What came back, read off the same replay (BACKLOG-13 phase 80).
  const bills = useMemo(() => (shape ? billsOf(lib, state, shape) : []), [lib, state, shape]);
  const retraceable = !state.road && shape !== null;
  // Where it turned (BACKLOG-14 phase 88): worked out after the screen shows, for a run that can
  // be retraced and is not itself the other road.
  const turning = useTurningPoints(lib, state, retraceable);
  // The run someone sent, when their link said how it went (BACKLOG-5 phase 37): dealt again
  // from their sides, so their world is drawn from their own run. A second road does not
  // compare; its end already shows two.
  const vs = challenge && !state.road ? challenge : null;
  // Whether their link named this deck: true, false, or null when it named none (BACKLOG-8
  // phase 49). A run from another deck is not dealt again here, even where it would end the
  // same way: the cards on the way would not be the ones they saw.
  const deck = deckStamp(lib);
  const sameDeck = vs?.deck ? vs.deck === deck : null;
  const theirs = useMemo(() => (vs && sameDeck !== false ? theirRun(lib, runCodeOf(state), vs) : null), [lib, state, vs, sameDeck]);
  // Why it ended, for a run cut short (BACKLOG-11 phase 67): read back from its last choice.
  const cause = useMemo(() => causeLine(lib, state), [lib, state]);
  const over = state.over;
  if (!over) return null;
  const ending = lib.endings.get(over.endingId);
  const epilogue = epilogueByKey(lib, over.epilogueKey);
  const band = exitBand(lib, state);
  const promises = state.mandates.flatMap((id) => {
    const mandate = MANDATES_BY_ID.get(id);
    return mandate ? [{ mandate, brokenAt: state.mandatesBroken[id] ?? null }] : [];
  });
  // How going looking for an ending went (BACKLOG-13 phase 83), said as a promise's outcome is.
  const looked = lookedOf(lib, state);
  // What its ending already told is not followed up again (BACKLOG-11 phase 72).
  const told = toldByEnding(lib, state);
  const history = fold?.history ?? historyOfRun(lib, state, band);
  // A long reign's end is drawn in the band it locked, wherever drift went after (phase 72).
  const world = composeWorld({ band, drift: exitDrift(lib, state), align: state.align, opposition: !!state.opposition, flags: state.flags, seed: state.seed, era: state.era });
  const endingTitle = ending?.title ?? over.endingId;
  const moments = timeline(lib, state, endingTitle);
  const survived = survivedTo(lib.config, over.endingId);
  // An ouster already says what happened and does not want a tally of your elections under it.
  const record = survived ? runRecord(lib, state) : null;
  // A first term seen through says what comes next (BACKLOG-10 phase 59); a short term chosen
  // after one does not, since what comes next is whatever the player picks (BACKLOG-12 phase 77).
  const firstTermDone = isFirstTerm(lib, state) && over.endingId.startsWith(lib.config.firstTermPrefix) && (fold?.firstSeenThrough ?? false);
  const shown = new Set(history.consequences.map((c) => c.flag));
  // What the player has read before, folded into a line they can open, the new leading
  // (BACKLOG-13 phase 86). A screen with no fold to say, as after a reload, folds nothing.
  const read = fold?.read ?? NOTHING_READ;
  const readFollowUps = new Set(read.followUps);
  const followUpRead = (c: Consequence) => readFollowUps.has(followUpKey(c.flag, band));
  const fresh = history.consequences.filter((c) => !followUpRead(c));
  const again = history.consequences.filter(followUpRead);
  const againLabels = again.flatMap((c) => (c.label ? [c.label] : []));
  // What this reign left and history did not name; what it took over is named above (BACKLOG-11 phase 66).
  const inherited = state.inherited?.legacies ?? [];
  const rest = state.flags.filter((f) => LEGACIES[f] && !shown.has(f) && !inherited.includes(f) && !told.has(f)).map((f) => LEGACIES[f]!);
  const when = STRINGS.world.when[Math.min(state.era, STRINGS.world.when.length) - 1] ?? "";
  // A daily is marked in the text by its number, so a group can compare without links
  // (BACKLOG-5 phase 38). Only the run that went into the log as the day's daily says so.
  const daily = fold?.daily ?? null;
  const dailyDay = daily?.day;
  // The week's scenario, when this run was its one try (BACKLOG-12 phase 78).
  const tried = fold?.scenario ?? null;
  const triedWeek = tried ? scenarioFor(tried.week) : null;
  const sharedTry = tried && triedWeek ? { week: tried.week, met: tried.result.met, goal: goalOf(triedWeek) } : null;

  // Another road from any decision that shaped this one, where the run can be retraced to it
  // (BACKLOG-5 phase 34). A second road shows both instead, and does not branch again.
  const road = state.road;
  const retrace = retraceable && onTakeOtherRoad ? onTakeOtherRoad : null;
  // A run that cannot be retraced here was dealt, in part at least, from another deck: say
  // so, rather than leave the way back missing without a word (BACKLOG-8 phase 49).
  const roadGone = !!onTakeOtherRoad && !road && !retraceable && state.deck !== deck;
  const other = (at: number | null) => {
    const made = at && at > 0 ? state.choices?.[at - 1] : undefined;
    const card = made && lib.cards.get(made[0]);
    return made && card ? { k: at! - 1, label: card[otherSide(made[1])].label } : null;
  };
  // One follow-up: the decision, the card it was made on, what became of it, and the road back.
  const followUp = (c: Consequence) => {
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
  };
  // The roads back from the legacies the ending told, which are not followed up below it and
  // so have no road of their own there (BACKLOG-11 phase 72): one a card, in the order taken.
  const toldRoads = new Map<number, { k: number; label: string }>();
  if (retrace)
    for (const f of HISTORY_ORDER) {
      const back = told.has(f) && state.flags.includes(f) ? other(state.flagSince?.[f] ?? null) : null;
      if (back) toldRoads.set(back.k, back);
    }
  const first = road?.first;
  const firstBand = first ? exitBand(lib, first) : band;
  const firstHistory = first ? historyOfRun(lib, first, firstBand) : null;
  const firstWorld = first ? composeWorld({ band: firstBand, drift: exitDrift(lib, first), align: first.align, opposition: !!first.opposition, flags: first.flags, seed: first.seed, era: first.era }) : null;
  const parted = road && first?.choices?.[road.at];
  const partedCard = parted && lib.cards.get(parted[0]);
  const theirBand = theirs ? exitBand(lib, theirs) : bandOfHistory(vs?.history ?? null);
  const theirHistory = theirs && theirBand ? historyOfRun(lib, theirs, theirBand) : null;
  const theirWorld = theirs && theirBand ? composeWorld({ band: theirBand, drift: exitDrift(lib, theirs), align: theirs.align, opposition: !!theirs.opposition, flags: theirs.flags, seed: theirs.seed, era: theirs.era }) : null;
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
    const text = shareText(state, history, endingTitle, shareLink(state, undefined, resultOf(lib, state)), dailyDay, sharedTry);
    const svg = scene.current?.querySelector("svg");
    // The picture is the best part and still optional: a failed render shares the words.
    const card = svg
      ? await renderCard(
          svg,
          { when, kicker: STRINGS.after.calls, title: history.title, facts: runFacts(state, endingTitle), number: (dailyDay && dailyNumber(dailyDay)) || undefined },
          shape && { points: shape, eraLength: lib.config.eraLength, bandAscentAt: lib.config.bandAscentAt, bandDecayAt: lib.config.bandDecayAt },
        ).catch(() => null)
      : null;
    const slug = history.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSharing(await shareRun(text, card, `rule-or-drool-${slug}.png`));
  };

  return (
    <Frame theme={endThemeOf(lib, state)} align={state.align} seed={state.seed} n={state.cardCount}>
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

        {/* A reign cut short is told as one: its name stands, under the card it stopped at (phase 72). */}
        <p className="kicker">
          {survived ? STRINGS.ui.ruleEnds : STRINGS.ui.cutShort.replace("{n}", String(state.cardCount))} · <b className="ending-how">{endingTitle}</b>
        </p>
        <p className="history-calls">{STRINGS.after.calls}</p>
        <h1 className="history-title" ref={heading} tabIndex={-1}>
          {history.title}
        </h1>
        {fold?.newHistory && <p className="history-new">{STRINGS.after.newHistory}</p>}
        {state.inherited && (
          <p className="line-note">
            <b>{lineName(state.inherited.line)}</b> {tookOverLine(state.inherited)}
          </p>
        )}
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
        {sharedTry && (
          <p className={`scenario-mark${sharedTry.met ? " met" : ""}`}>
            <b>
              {STRINGS.scenario.ended.replace("{n}", String(sharedTry.week))} · {sharedTry.met ? `✓ ${STRINGS.scenario.met}` : STRINGS.scenario.missed}
            </b>
            <span>{sharedTry.goal}</span>
          </p>
        )}
        {vs && (
          <Versus
            lib={lib}
            vs={vs}
            replayed={!!theirs}
            sameDeck={sameDeck}
            theirBand={theirBand}
            theirTitle={theirHistory?.title ?? (vs.history ? historyTitle(vs.history) : null)}
            mine={{ key: history.key, title: history.title, ending: endingTitle, cards: state.cardCount, band }}
          />
        )}
        {ending && read.ending ? (
          <details className="read-before ending-again">
            <summary>{STRINGS.after.readBefore.ending}</summary>
            <p className="ending-text">{withNames(lib, state, ending.text)}</p>
          </details>
        ) : (
          <p className="ending-text">{ending ? withNames(lib, state, ending.text) : null}</p>
        )}
        {cause && <p className="ending-cause">{cause}</p>}
        {retrace && toldRoads.size > 0 && (
          <div className="ending-roads">
            {[...toldRoads.values()]
              .sort((a, b) => a.k - b.k)
              .map((back) => (
                <button key={back.k} type="button" className="road-back" onClick={() => retrace(back.k)}>
                  {STRINGS.road.choose.replace("{label}", back.label)}
                </button>
              ))}
          </div>
        )}
        {firstTermDone && <p className="first-term-after">{STRINGS.reign.afterFirst}</p>}

        {(history.consequences.length > 0 || rest.length > 0) && (
          <section className="became">
            <h2>{STRINGS.after.became}</h2>
            {roadGone && <p className="became-note">{STRINGS.road.updated}</p>}
            {fresh.length > 0 && <ul>{fresh.map(followUp)}</ul>}
            {again.length > 0 && (
              <details className="read-before became-again">
                <summary>
                  {againLabels.length ? STRINGS.after.readBefore.followUps.replace("{labels}", againLabels.join(" · ")) : STRINGS.after.readBefore.followUpsBare}
                </summary>
                <ul>{again.map(followUp)}</ul>
              </details>
            )}
            {rest.length > 0 && (
              <p className="became-also">
                {STRINGS.after.also} {rest.join(" · ")}
              </p>
            )}
          </section>
        )}

        {/* Folded, and one line tall whether it is still working or done, so that nothing below it
            moves when it is done (BACKLOG-14 phase 88). A screen reader hears what it found. */}
        {turning && (
          <details className="turning">
            <summary>
              <h2>{STRINGS.turning.title}</h2>
              <span className="turning-badge">{turning.status === "working" ? "\u2026" : turning.all.length}</span>
            </summary>
            <p className="turning-count">{turning.status === "working" ? STRINGS.turning.working : turningCount(turning)}</p>
            {turning.status === "done" && turning.shown.length > 0 && (
              <>
                {turning.all.length > turning.shown.length && (
                  <p className="turning-most">{STRINGS.turning.most.replace("{n}", NUMBER_WORDS[turning.shown.length] ?? String(turning.shown.length))}</p>
                )}
                <ul>
                  {turning.shown.map((p) => (
                    <li key={p.k}>
                      <b>{STRINGS.timeline.card.replace("{n}", String(p.k + 1)).replace(/^./, (c) => c.toUpperCase())}</b>
                      <p>{STRINGS.turning.chose.replace("{label}", p.chose).replace("{outcome}", turningOutcome(lib, state, p))}</p>
                      {retrace && (
                        <button type="button" className="road-back" onClick={() => retrace(p.k)}>
                          {STRINGS.road.choose.replace("{label}", p.other)}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="turning-how">{STRINGS.turning.how}</p>
              </>
            )}
          </details>
        )}
        {turning && (
          <p className="sr-only turning-status" role="status">
            {turning.status === "done" ? turningCount(turning) : ""}
          </p>
        )}

        <section className="timeline">
          <h2>{STRINGS.timeline.title}</h2>
          {shape && <ShapeChart lib={lib} align={state.align} points={shape} moments={moments} />}
          <ol>
            {moments.map((m, i) => (
              <li key={`${m.kind}-${m.at}-${i}`} data-kind={m.kind}>
                <span className="timeline-at">{m.kind === "start" ? "" : m.at}</span>
                <span className="timeline-text">{m.text}</span>
              </li>
            ))}
          </ol>
          {/* The choices that came back, folded: seven or eight a run, a page of their own open. */}
          {bills.length > 0 && (
            <details className="came-back">
              <summary>{(bills.length === 1 ? STRINGS.receipt.one : STRINGS.receipt.many).replace("{n}", String(bills.length))}</summary>
              <ul>
                {bills.map((b) => (
                  <li key={b.at}>
                    <b>{STRINGS.receipt.sent.replace("{n}", String(b.sent.n)).replace("{label}", b.sent.label)}</b>
                    <p>{STRINGS.receipt.back.replace("{n}", String(b.at)).replace("{text}", b.text)}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
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
          {epilogue && read.epilogue ? (
            <details className="read-before">
              <summary>{STRINGS.after.readBefore.epilogue}</summary>
              <p>{epilogue.text}</p>
            </details>
          ) : (
            <p>{epilogue?.text ?? "The record ends here."}</p>
          )}
        </section>
        {daily && fold && <DailyMonth lib={lib} dailies={fold.meta.dailies} today={today} month={monthOf(daily.day)} streak={false} />}
        {fold && (fold.newObjectives.length > 0 || fold.newUnlocks.length > 0 || fold.newEnding || fold.newHistory || fold.newContracts.length > 0) && (
          <section className="earned">
            <h2>{STRINGS.ui.earned}</h2>
            <ul>
              {fold.newHistory && <li>{STRINGS.ui.newHistoryEarned}</li>}
              {fold.newEnding && <li>A new ending for the codex.</li>}
              {fold.newContracts.map((id) => (
                <li key={id}>{STRINGS.contracts.earned.replace("{text}", contractById(id)?.text ?? id)}</li>
              ))}
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
        {looked && state.pursuit && (
          <p className={`pursuit-result ${looked}`}>
            <b>{STRINGS.pursuit.endHead}</b> {rumourOf(state.pursuit)} {STRINGS.pursuit[looked]}
          </p>
        )}
        {promises.map(({ mandate, brokenAt }) => (
          <p key={mandate.id} className={`mandate-result${brokenAt === null ? " kept" : " broken"}`}>
            <b>{mandate.title}</b> {brokenAt === null ? STRINGS.ui.mandateKept : `${STRINGS.ui.mandateBroken} · ${STRINGS.ui.mandateBrokenAt} ${brokenAt}`}
          </p>
        ))}
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

/** "The three that set the most in motion", in words. */
const NUMBER_WORDS: readonly string[] = ["none", "one", "two", "three"];

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
function Versus({ lib, vs, replayed, sameDeck, theirBand, theirTitle, mine }: { lib: Library; vs: RunResult; replayed: boolean; sameDeck: boolean | null; theirBand: Band | null; theirTitle: string | null; mine: Mine }) {
  const heading = useId();
  const v = STRINGS.vs;
  const theirEnding = vs.ending ? (lib.endings.get(vs.ending)?.title ?? null) : null;
  // A verdict only for two runs of the same deal: theirs dealt again here, from this deck or
  // from a link that named none (BACKLOG-8 phase 49). Otherwise the two are set side by side.
  const compared = replayed && sameDeck !== false;
  const note = sameDeck === false ? v.otherDeck : replayed ? null : v.unreplayed;
  const verdict = !compared
    ? null
    : vs.history && vs.history === mine.key
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
      {note && <p className="versus-note">{note}</p>}
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
