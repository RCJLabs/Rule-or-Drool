import { useEffect, useRef, useState } from "react";
import { STRINGS } from "../content/strings";
import { epilogueByKey, withNames } from "../engine/endings";
import type { Library } from "../engine/library";
import { MANDATES_BY_ID } from "../engine/mandates";
import { exitBand } from "../engine/state";
import type { GameState } from "../engine/types";
import { LEGACIES, OBJECTIVES_BY_ID, historyOf, type RunFold } from "../meta";
import { Frame } from "./Frame";
import { runRecord, timeline } from "./record";
import { renderCard, runFacts, shareLink, shareRun, shareText, type ShareOutcome } from "./share";
import { SetupSummary } from "./SetupSummary";
import { themeFor } from "./theme";
import { composeWorld } from "./world";
import { WorldAfter } from "./WorldAfter";

interface Props {
  lib: Library;
  state: GameState;
  fold: RunFold | null;
  onPlayAgain: () => void;
  onCodex: () => void;
  onSettings: () => void;
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
export function Ending({ lib, state, fold, onPlayAgain, onCodex, onSettings }: Props) {
  const scene = useRef<HTMLElement>(null);
  // The run screen and everything that had focus have just gone. Land on the history's
  // name, so a screen reader starts where a sighted player's eye does (BACKLOG-5 phase 30).
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const [sharing, setSharing] = useState<ShareOutcome | "working" | null>(null);
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
  // A daily is marked in the text, so the people it goes to know they can play the same one.
  const dailyDay = fold?.meta.daily?.seed === state.seed ? fold.meta.daily.day : undefined;

  const share = async () => {
    setSharing("working");
    const text = shareText(state, history, endingTitle, shareLink(state), dailyDay);
    const svg = scene.current?.querySelector("svg");
    // The picture is the best part and still optional: a failed render shares the words.
    const card = svg
      ? await renderCard(svg, { when, kicker: STRINGS.after.calls, title: history.title, facts: runFacts(state, endingTitle) }).catch(() => null)
      : null;
    const slug = history.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSharing(await shareRun(text, card, `rule-or-drool-${slug}.png`));
  };

  return (
    <Frame theme={themeFor(state.drift, lib.config)} align={state.align} seed={state.seed} n={state.cardCount}>
      <div className="ending">
        <figure className="world-frame" data-band={band} ref={scene}>
          <WorldAfter world={world} title={history.title} />
          <figcaption className="world-when">{when}</figcaption>
        </figure>

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
        <p className="ending-text">{ending ? withNames(lib, state, ending.text) : null}</p>

        <section className="became">
          <h2>{STRINGS.after.became}</h2>
          <ul>
            {history.consequences.map((c) => (
              <li key={c.flag}>
                {c.label && (
                  <b>
                    {c.label}
                    {c.at !== null && c.at > 0 && <span className="became-when">{STRINGS.timeline.card.replace("{n}", String(c.at))}</span>}
                  </b>
                )}
                <p>{c.after}</p>
              </li>
            ))}
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
