import { useMemo, useState } from "react";
import { STRINGS } from "../content/strings";
import { deckStamp, missingContent } from "../engine/deck";
import type { Library } from "../engine/library";
import { isFirstTerm, isLongReign, rollSetup } from "../engine/state";
import type { GameState, Inheritance, PlayerAlign } from "../engine/types";
import {
  codexProgress,
  dailyNumber,
  dailySeed,
  encodeRunCode,
  firstTermDue,
  historyTitle,
  inheritanceFrom,
  keptIn,
  longReignOpen,
  lookingFor,
  scenarioFor,
  scenarioTry,
  streakOf,
  takeOverFrom,
  todayKey,
  weekNumber,
  type Decoded,
  type MetaState,
  type RunCode,
  type RunResult,
} from "../meta";
import { MANDATES_BY_ID, brokenByFlags } from "../engine/mandates";
import { pursuitProblem } from "../engine/pursuit";
import { PLAYER_ALIGNS } from "../engine/types";
import { APP_VERSION } from "../version";
import { Frame } from "./Frame";
import { MandatePicker } from "./MandatePicker";
import { ReignPicker, type ReignChoice } from "./ReignPicker";
import { StartPicker } from "./StartPicker";
import { SetupSummary } from "./SetupSummary";
import { dailyCode, isScenarioCode, randomSeed } from "./flow";
import { dailyName } from "./DailyMonth";
import { cannotLine, rumourOf } from "./pursuit";
import type { DailyMark, ScenarioMark } from "./save";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  saved: GameState | null;
  /** The saved run's daily, when it is one. */
  savedDaily?: DailyMark | null;
  /** The saved run's week, when it is the try at a week's scenario (BACKLOG-12 phase 78). */
  savedScenario?: ScenarioMark | null;
  meta: MetaState;
  onStart: (seed: number, align: PlayerAlign, mandates: readonly string[], eraCount?: number, inheritance?: Inheritance | null, pursuit?: string | null) => void;
  /** Stop looking for the ending the profile is looking for (BACKLOG-13 phase 83). */
  onPursue?: (id: string | null) => void;
  onDaily: (align: PlayerAlign, mandates: readonly string[]) => void;
  /** A run someone sent, decoded from the link that opened the game, if one did. */
  shared?: Decoded | null;
  /** How it went for them, when the link said (BACKLOG-5 phase 37). */
  sharedResult?: RunResult | null;
  /** The deck their run was dealt from, when the link said (BACKLOG-8 phase 49). */
  sharedDeck?: string | null;
  onPlayShared?: (code: RunCode) => void;
  onDismissShared?: () => void;
  onContinue: () => void;
  onCodex: () => void;
  /** Open the codex at this week's contracts (BACKLOG-10 phase 60). */
  onContracts?: () => void;
  /** Open the codex at the week's scenario (BACKLOG-12 phase 78). */
  onScenario?: () => void;
  onSettings: () => void;
  /** Today's UTC day, for the daily; the clock's by default. */
  today?: string;
}

export function Setup({
  lib,
  saved,
  savedDaily,
  savedScenario,
  meta,
  onStart,
  onPursue,
  onDaily,
  onContinue,
  onCodex,
  onContracts,
  onScenario,
  onSettings,
  shared,
  sharedResult,
  sharedDeck,
  onPlayShared,
  onDismissShared,
  today = todayKey(),
}: Props) {
  const [seed, setSeed] = useState(() => randomSeed());
  const [align, setAlign] = useState<PlayerAlign>("left");
  // None, one, or a platform of two (BACKLOG-10 phase 62).
  const [mandates, setMandates] = useState<readonly string[]>([]);
  // Fresh, or taking over the country the last run left (BACKLOG-10 phase 63). Only a profile
  // past its first term, with a run behind it, is offered it; the daily is always fresh.
  const parent = takeOverFrom(meta);
  const inheritance = useMemo(() => (parent ? inheritanceFrom(lib, parent) : null), [lib, parent]);
  const [takeOverChosen, setTakeOver] = useState(false);
  const takeOver = takeOverChosen && !!inheritance;
  const unavailable = takeOver && inheritance ? brokenByFlags(inheritance.legacies) : [];
  const chooseStart = (on: boolean) => {
    setTakeOver(on);
    // Taking over is taking over the same side, and a promise the country already breaks goes.
    if (on && parent && inheritance) {
      setAlign(parent.align);
      const gone = brokenByFlags(inheritance.legacies);
      setMandates((m) => m.filter((id) => !gone.includes(id)));
    }
  };
  const chooseSide = (a: PlayerAlign) => {
    setAlign(a);
    if (parent && a !== parent.align) setTakeOver(false);
  };
  // Five eras rather than three, once a finale has opened them (BACKLOG-5 phase 39); one, as a
  // first term, until the profile has seen a run through (BACKLOG-10 phase 59), and as a short
  // term after, started by its own button (BACKLOG-12 phase 77).
  const termDue = firstTermDue(meta);
  const [eraCount, setEraCount] = useState<number | undefined>(() => (termDue ? lib.config.firstTermEras : undefined));
  const longOpen = longReignOpen(meta);
  const r = STRINGS.reign;
  const ordinary: ReignChoice = { eraCount: undefined, title: r.ordinary, blurb: r.ordinaryBlurb };
  const reigns: ReignChoice[] | null = longOpen
    ? [ordinary, { eraCount: lib.config.longEraCount, title: r.long, blurb: r.longBlurb }]
    : termDue
      ? [{ eraCount: lib.config.firstTermEras, title: r.first, blurb: r.firstBlurb }, ordinary]
      : null;
  // A profile moved in on this screen can take the choice away: then the first one stands.
  const chosen = reigns?.some((c) => c.eraCount === eraCount) ? eraCount : reigns?.[0]!.eraCount;
  const setup = useMemo(() => rollSetup(lib, seed, align, meta.unlocks), [lib, seed, align, meta.unlocks]);
  // The ending the profile is looking for, and whether the run about to start can look for it
  // (BACKLOG-13 phase 83): a run of the other side, one too short for its story, or one taking over
  // a country that has settled it looks for nothing, and says so. A short term is asked on its own.
  const looking = lookingFor(lib, meta);
  const setupFor = (eras: number) => ({ align, eraCount: eras, unlocked: meta.unlocks, inheritance: takeOver ? inheritance : null });
  const reign = (reigns ? chosen : undefined) ?? lib.config.eraCount;
  const cannot = looking ? pursuitProblem(lib, setupFor(reign), looking) : null;
  const shortCannot = looking ? pursuitProblem(lib, setupFor(lib.config.firstTermEras), looking) : null;
  const progress = codexProgress(lib, meta);
  const dailyPlayed = meta.dailies.some((d) => d.day === today);
  const n = dailyNumber(today);
  const dailyLabel = n ? (dailyPlayed ? STRINGS.ui.dailyDone : STRINGS.ui.daily).replace("{n}", String(n)) : dailyPlayed ? STRINGS.ui.dailyPlainDone : STRINGS.ui.dailyPlain;
  const { current: streak } = streakOf(meta.dailies, today);
  // This week's contracts, once there are full reigns to keep them with (BACKLOG-10 phase 60).
  const week = weekNumber(today);
  // And the week's scenario, which says on the menu how its one try went (BACKLOG-12 phase 78).
  const scenario = termDue ? null : scenarioFor(week);
  const tried = scenario ? scenarioTry(meta, scenario.week) : undefined;
  const savedIsScenario = !!saved && !!savedScenario && scenarioFor(savedScenario.week)?.seed === saved.seed;
  const sc = STRINGS.scenario;
  const scenarioLabel = !scenario
    ? ""
    : (tried?.result ? (tried.result.met ? sc.menuMet : sc.menuMissed) : tried ? (savedIsScenario && savedScenario?.week === scenario.week ? sc.menuUnderWay : sc.menuLeft) : sc.menu).replace(
        "{n}",
        String(scenario.week),
      );
  // Today's daily, sent by someone who played it, is today's daily here too (phases 37 and 38).
  const sharedIsDaily =
    !!shared?.ok &&
    shared.code.seed === dailySeed(today) &&
    encodeRunCode(shared.code) === encodeRunCode(dailyCode(lib, shared.code.seed, shared.code.align, shared.code.mandates));
  // This week's scenario, sent by someone who played it, is this week's try here too (BACKLOG-12
  // phase 78), past the first term, as the daily is.
  const sharedScenario = shared?.ok && scenario && isScenarioCode(lib, shared.code, scenario) ? scenario : null;
  const sharedTried = !!sharedScenario && !!tried;
  // "The same deck" only when the link says so and it is this one (BACKLOG-8 phase 49).
  const deck = deckStamp(lib);
  const offerBody = !sharedDeck ? STRINGS.share.offerMaybe : sharedDeck === deck ? STRINGS.share.offerBody : STRINGS.share.offerOtherDeck;
  const savedGone = saved ? missingContent(lib, saved).length > 0 : false;
  const savedUpdated = !!saved?.deck && saved.deck !== deck;
  return (
    <Frame theme={themeFor(0)} align={align} seed={0} n={0}>
      <div className="setup">
        <h1>{STRINGS.title}</h1>
        <p className="tagline">{STRINGS.tagline}</p>
        {shared && (
          <section className="shared-run" aria-labelledby="shared-title">
            <h2 id="shared-title">{STRINGS.share.offerTitle}</h2>
            {shared.ok ? (
              <>
                <p className="shared-side">
                  <b>{STRINGS.parties[shared.code.align]}</b>
                  {shared.code.mandates.map((id) => ` · ${MANDATES_BY_ID.get(id)?.title ?? ""}`).join("")}
                </p>
                <SetupSummary lib={lib} modifiers={shared.code.modifiers} align={shared.code.align} />
                {shared.code.eraCount !== undefined && <p className="shared-reign">{shared.code.eraCount < lib.config.eraCount ? STRINGS.reign.offerFirst : STRINGS.reign.offer}</p>}
                {/* Their run went looking for an ending, and is dealt as it was for them (BACKLOG-13 phase 83). */}
                {shared.code.pursuit && <p className="shared-reign">{STRINGS.pursuit.offer.replace("“{clue}”", rumourOf(shared.code.pursuit))}</p>}
                {sharedResult && <TheirResult lib={lib} result={sharedResult} />}
                {sharedScenario && <p className="shared-daily">{(sharedTried ? sc.offerTried : sc.offer).replace("{n}", String(sharedScenario.week))}</p>}
                {sharedIsDaily && n && (
                  <p className="shared-daily">{(dailyPlayed ? STRINGS.share.offerDailyPlayed : STRINGS.share.offerDaily).replace("{n}", String(n))}</p>
                )}
                <p className="shared-body">{offerBody}</p>
                {/* Not .meta-row: its button rule repaints the background, and the primary
                    button's white text sat on paper at 1.02:1 until the audit caught it. */}
                <div className="shared-actions">
                  <button type="button" className="primary" onClick={() => onPlayShared?.(shared.code)}>
                    {STRINGS.share.offerPlay}
                  </button>
                  <button type="button" onClick={onDismissShared}>
                    {STRINGS.share.offerDismiss}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="shared-body">{STRINGS.share.offerBroken}</p>
                <button type="button" onClick={onDismissShared}>
                  {STRINGS.share.offerDismiss}
                </button>
              </>
            )}
          </section>
        )}
        {saved && savedGone && <p className="saved-note">{STRINGS.ui.savedGone}</p>}
        {saved && !savedGone && (
          <button type="button" className="primary" onClick={onContinue}>
            {STRINGS.ui.continueRun} · era {saved.era}, {STRINGS.parties[saved.align]}
            {isLongReign(lib, saved) && ` · ${STRINGS.reign.short}`}
            {isFirstTerm(lib, saved) && ` · ${STRINGS.reign.firstShort}`}
            {savedDaily && ` · ${dailyName(savedDaily.day)}`}
            {savedIsScenario && ` · ${sc.heading.replace("{n}", String(savedScenario!.week))}`}
          </button>
        )}
        {saved && !savedGone && savedUpdated && <p className="saved-note">{STRINGS.ui.savedUpdated}</p>}
        <fieldset className="align">
          <legend>Your side</legend>
          {PLAYER_ALIGNS.map((a) => (
            <button key={a} type="button" className={`align-choice${align === a ? " selected" : ""}`} aria-pressed={align === a} onClick={() => chooseSide(a)}>
              <b>{STRINGS.parties[a]}</b>
              <span>{STRINGS.partyBlurbs[a]}</span>
            </button>
          ))}
        </fieldset>
        <SetupSummary lib={lib} modifiers={setup.modifiers ?? []} align={align} />
        {parent && inheritance && <StartPicker lib={lib} from={parent} inheritance={inheritance} value={takeOver} onChange={chooseStart} />}
        <MandatePicker value={mandates} onChange={setMandates} unavailable={unavailable} />
        {reigns && <ReignPicker choices={reigns} value={chosen} onChange={setEraCount} />}
        {looking && (
          <section className="pursuit" aria-labelledby="pursuit-head">
            <p>
              <b id="pursuit-head">{STRINGS.pursuit.setupHead}</b> {rumourOf(looking)}
            </p>
            <p className="pursuit-note">{cannot ? cannotLine(cannot, align) : STRINGS.pursuit.thisRun}</p>
            {onPursue && (
              <button type="button" onClick={() => onPursue(null)}>
                {STRINGS.pursuit.stop}
              </button>
            )}
          </section>
        )}
        <label className="seed">
          {STRINGS.ui.seed}
          <input type="number" inputMode="numeric" value={seed} onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value)) || 0))} />
          <button type="button" onClick={() => setSeed(randomSeed())}>
            {STRINGS.ui.shuffle}
          </button>
        </label>
        <button
          type="button"
          className="primary big"
          onClick={() => onStart(seed, align, mandates, reigns ? chosen : undefined, takeOver ? inheritance : null, cannot ? null : looking)}
        >
          {STRINGS.ui.start}
        </button>
        {/* A short term (BACKLOG-12 phase 77): a profile's first term, taken again any time after
            for a short sitting. Under "Take office" rather than in the reign picker, which would
            push it below the fold on a 390x844 phone. */}
        {!termDue && (
          <div className="short-start">
            <button
              type="button"
              aria-describedby="short-start-note"
              onClick={() => onStart(seed, align, mandates, lib.config.firstTermEras, takeOver ? inheritance : null, shortCannot ? null : looking)}
            >
              {r.shortStart}
            </button>
            <p id="short-start-note">
              {r.shortNote}
              {looking && shortCannot === "short" && ` ${STRINGS.pursuit.shortNote}`}
            </p>
          </div>
        )}
        <div className="meta-row">
          <button type="button" onClick={() => onDaily(align, mandates)} disabled={dailyPlayed}>
            {dailyLabel}
          </button>
          <button type="button" onClick={onCodex}>
            {progress.historiesSeen === 0 ? STRINGS.ui.codex : progress.historiesSeen === 1 ? STRINGS.ui.codexHistory : STRINGS.ui.codexHistories.replace("{n}", String(progress.historiesSeen))}
          </button>
          <button type="button" onClick={onSettings}>
            {STRINGS.ui.settings}
          </button>
        </div>
        {streak > 0 && <p className="menu-streak">{STRINGS.daily.menuStreak.replace("{n}", String(streak))}</p>}
        {week !== null && !termDue && (onContracts || (scenario && onScenario)) && (
          <div className="meta-row">
            {scenario && onScenario && (
              <button type="button" className="menu-contracts menu-scenario" onClick={onScenario}>
                {scenarioLabel}
              </button>
            )}
            {onContracts && (
              <button type="button" className="menu-contracts" onClick={onContracts}>
                {STRINGS.contracts.menu.replace("{n}", String(keptIn(meta, week).length))}
              </button>
            )}
          </div>
        )}
        <p className="hint">{STRINGS.ui.hint}</p>
        <footer className="version">
          v{APP_VERSION} · {STRINGS.ui.deck.replace("{stamp}", deck)}
        </footer>
      </div>
    </Frame>
  );
}

/** What the sender got: the name history gave their run, and how it ended. */
function TheirResult({ lib, result }: { lib: Library; result: RunResult }) {
  const title = result.history ? historyTitle(result.history) : null;
  const ending = result.ending ? lib.endings.get(result.ending)?.title : undefined;
  return (
    <p className="shared-result">
      {title && <b>{STRINGS.share.theyLeft.replace("{history}", title)}</b>}
      <span>{ending ? STRINGS.share.theirEnd.replace("{ending}", ending).replace("{n}", String(result.cards)) : STRINGS.share.theirCards.replace("{n}", String(result.cards))}</span>
    </p>
  );
}
