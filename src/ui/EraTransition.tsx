import { useEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { GameState } from "../engine/types";
import { CountryStrip } from "./CountryStrip";
import { frontPage } from "./paper";
import { pageText, renderPage, shareLink, shareRun, type ShareOutcome } from "./share";
import { themeOf } from "./theme";
import { composeCountry } from "./world";

interface Props {
  lib: Library;
  /** The state as it is on the far side of the boundary, which is what carried over. */
  state: GameState;
  era: number;
  /** Instant rather than staged, when the player has asked for less movement. */
  reduceMotion: boolean;
  onContinue: () => void;
  /** The week's goal, when the run is the try at the week's scenario (BACKLOG-12 phase 78). */
  goal?: string | null;
}

/**
 * The era boundary (BACKLOG-3 phase 25). It is the largest structural event in a run — a
 * successor takes office, the band is recomputed, the meters are pulled toward the middle,
 * the era's standing pressure changes and the deck's era filter moves — and it used to be a
 * modal card with a heading and two lines in front of the look, which is the one thing it
 * should not be.
 *
 * It takes the whole frame now and is rendered in the era it is arriving into, so the look
 * changes *here* rather than behind a dialog. The cabinet is left out: 8.3 of the 9 are there
 * from the first day, so its tenure says nothing at a boundary.
 *
 * What the era did is its front page (BACKLOG-13 phase 82), in place of the list of what the
 * country carries: every door into era 2 has a decision to lead with, and 84-90% of doors into
 * era 3, measured over 1,000 runs each of the informed, eyes and mixed bots.
 */
export function EraTransition({ lib, state, era, reduceMotion, onContinue, goal = null }: Props) {
  const info = STRINGS.eras[era - 1];
  const rule = STRINGS.eraRules[era - 1];
  // The era's front page (BACKLOG-13 phase 82): what it decided, the vote, the rival and the
  // reign's name so far, in the voice of the direction's paper. Read by dealing the era again.
  const page = useMemo(() => frontPage(lib, state, era), [lib, state, era]);
  const paper = useRef<HTMLElement>(null);
  const [sharing, setSharing] = useState<ShareOutcome | "working" | null>(null);
  // The page goes out as the end screen's card does: a picture of it, a few words, and a link to
  // the same run. The picture is optional; a failed render still shares the words.
  const share = async () => {
    setSharing("working");
    const text = { ...page, when: info?.name ?? `Era ${era}` };
    const strip = paper.current?.querySelector("svg");
    const picture = strip ? await renderPage(strip, text).catch(() => null) : null;
    setSharing(await shareRun(pageText(text, shareLink(state)), picture, `rule-or-drool-era-${era}.png`));
  };
  const said = sharing === "shared" ? STRINGS.paper.shared : sharing === "copied" ? STRINGS.paper.copied : sharing === "failed" ? STRINGS.paper.failed : null;
  // The country the era hands on, drawn on every phone: the only place a phone too short for
  // the strip under the card sees it before the end (BACKLOG-10 phase 64).
  const country = composeCountry({ stage: themeOf(state, lib.config).stage, drift: state.drift, align: state.align, opposition: !!state.opposition, flags: state.flags, seed: state.seed });
  const owed = state.queue.length;
  // What the crisis this run inherited does to the era it is arriving into, beside the era's
  // own rule (BACKLOG-5 phase 35).
  const bends = state.modifiers
    .filter((id) => lib.modifiers.get(id)?.bends?.some((b) => b.era === era))
    .map((id) => STRINGS.bends[`${id}:${era}`])
    .filter((text): text is string => !!text);
  // A long reign's direction is set as it enters the era after the lock (BACKLOG-5 phase 39),
  // which changes what every choice from here can do, so it is said first among the rules.
  const locked = state.bandLocked && era === lib.config.bandLockAfterEra + 1;
  // A door with a rule more to say has the least room, so its page leaves out the era's other
  // decisions: the end screen tells them all (BACKLOG-13 phase 82).
  const crowded = bends.length > 0 || !!goal || locked;
  // Only what is on the panel: an era with nothing owed or no new rule has no such line.
  const described = ["era-lead", "era-paper", owed > 0 ? "era-owed" : "", locked ? "era-locked" : "", rule ? "era-rule" : "", ...bends.map((_, i) => `era-bend-${i}`), goal ? "era-goal" : ""]
    .filter(Boolean)
    .join(" ");

  // Three beats rather than one page: the years, then the era's front page, then the rule that
  // is different now. Time passing is the point, so it is not instant.
  const [beat, setBeat] = useState(reduceMotion ? 3 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    const timers = [450, 1000, 1550].map((ms, i) => setTimeout(() => setBeat((b) => Math.max(b, i + 1)), ms));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  return (
    // Focus lands on Continue, so the panel's own words are its description: without it a
    // screen reader arrives, hears "Continue" and nothing of the twenty years (BACKLOG-5
    // phase 30).
    <div className="era-jump" role="dialog" aria-modal="true" aria-labelledby="era-title" aria-describedby={described} data-beat={beat}>
      <div className="era-jump-inner">
        <p className="kicker">{STRINGS.ui.eraKicker.replace("{n}", String(era))}</p>
        <h2 id="era-title">{info?.name ?? `Era ${era}`}</h2>
        <p className="era-jump-lead" id="era-lead">
          {info?.jump ?? "Time passes."}
        </p>

        <article className="paper" data-paper={page.band} id="era-paper" ref={paper}>
          <header className="paper-head">
            <p className="paper-name">{page.paper}</p>
            <p className="paper-motto">{page.motto}</p>
          </header>
          <div className="era-country">
            <CountryStrip country={country} />
          </div>
          <h3 className="paper-headline">{page.headline}</h3>
          {page.inside && !crowded && <p className="paper-inside">{page.inside}</p>}
          {page.strap && <p className="paper-strap">{page.strap}</p>}
          {page.rival && <p className="paper-rival">{page.rival}</p>}
          <p className="paper-called">{page.called}</p>
        </article>
        {owed > 0 && (
          <p className="era-owed" id="era-owed">
            {(owed === 1 ? STRINGS.ui.owedOne : STRINGS.ui.owed).replace("{n}", String(owed))}
          </p>
        )}

        {locked && (
          <p className="era-rule era-locked" id="era-locked">
            {STRINGS.reign.locked}
          </p>
        )}
        {rule ? (
          <p className="era-rule" id="era-rule">
            {rule}
          </p>
        ) : null}
        {bends.map((text, i) => (
          <p key={text} className="era-rule era-bend" id={`era-bend-${i}`}>
            {text}
          </p>
        ))}
        {/* The play screen has no room for the week's goal, so it is said at each era's door. */}
        {goal && (
          <p className="era-rule era-goal" id="era-goal">
            <b>{STRINGS.scenario.goal}</b> {goal}
          </p>
        )}
        <div className="era-actions">
          <button type="button" className="primary" onClick={onContinue} autoFocus>
            {STRINGS.ui.continueEra}
          </button>
          <button type="button" className="share" onClick={share} disabled={sharing === "working"}>
            {sharing === "working" ? STRINGS.paper.working : (said ?? STRINGS.paper.share)}
          </button>
        </div>
        <p className="sr-only" role="status">
          {said ?? ""}
        </p>
      </div>
    </div>
  );
}
