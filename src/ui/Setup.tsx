import { useMemo, useState } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { isLongReign, rollSetup } from "../engine/state";
import type { GameState, PlayerAlign } from "../engine/types";
import { codexProgress, dailyNumber, dailySeed, encodeRunCode, historyTitle, longReignOpen, streakOf, todayKey, type Decoded, type MetaState, type RunCode, type RunResult } from "../meta";
import { MANDATES_BY_ID } from "../engine/mandates";
import { PLAYER_ALIGNS } from "../engine/types";
import { APP_VERSION } from "../version";
import { Frame } from "./Frame";
import { MandatePicker } from "./MandatePicker";
import { ReignPicker } from "./ReignPicker";
import { SetupSummary } from "./SetupSummary";
import { dailyCode, randomSeed } from "./flow";
import { dailyName } from "./DailyMonth";
import type { DailyMark } from "./save";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  saved: GameState | null;
  /** The saved run's daily, when it is one. */
  savedDaily?: DailyMark | null;
  meta: MetaState;
  onStart: (seed: number, align: PlayerAlign, mandate: string | null, eraCount?: number) => void;
  onDaily: (align: PlayerAlign, mandate: string | null) => void;
  /** A run someone sent, decoded from the link that opened the game, if one did. */
  shared?: Decoded | null;
  /** How it went for them, when the link said (BACKLOG-5 phase 37). */
  sharedResult?: RunResult | null;
  onPlayShared?: (code: RunCode) => void;
  onDismissShared?: () => void;
  onContinue: () => void;
  onCodex: () => void;
  onSettings: () => void;
  /** Today's UTC day, for the daily; the clock's by default. */
  today?: string;
}

export function Setup({ lib, saved, savedDaily, meta, onStart, onDaily, onContinue, onCodex, onSettings, shared, sharedResult, onPlayShared, onDismissShared, today = todayKey() }: Props) {
  const [seed, setSeed] = useState(() => randomSeed());
  const [align, setAlign] = useState<PlayerAlign>("left");
  const [mandate, setMandate] = useState<string | null>(null);
  // Five eras rather than three, once a finale has opened them (BACKLOG-5 phase 39).
  const [eraCount, setEraCount] = useState<number | undefined>(undefined);
  const longOpen = longReignOpen(meta);
  const setup = useMemo(() => rollSetup(lib, seed, align, meta.unlocks), [lib, seed, align, meta.unlocks]);
  const progress = codexProgress(lib, meta);
  const dailyPlayed = meta.dailies.some((d) => d.day === today);
  const n = dailyNumber(today);
  const dailyLabel = n ? (dailyPlayed ? STRINGS.ui.dailyDone : STRINGS.ui.daily).replace("{n}", String(n)) : dailyPlayed ? STRINGS.ui.dailyPlainDone : STRINGS.ui.dailyPlain;
  const { current: streak } = streakOf(meta.dailies, today);
  // Today's daily, sent by someone who played it, is today's daily here too (phases 37 and 38).
  const sharedIsDaily =
    !!shared?.ok &&
    shared.code.seed === dailySeed(today) &&
    encodeRunCode(shared.code) === encodeRunCode(dailyCode(lib, shared.code.seed, shared.code.align, shared.code.mandate));
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
                  {shared.code.mandate && ` · ${MANDATES_BY_ID.get(shared.code.mandate)?.title ?? ""}`}
                </p>
                <SetupSummary lib={lib} modifiers={shared.code.modifiers} />
                {shared.code.eraCount !== undefined && <p className="shared-reign">{STRINGS.reign.offer}</p>}
                {sharedResult && <TheirResult lib={lib} result={sharedResult} />}
                {sharedIsDaily && n && (
                  <p className="shared-daily">{(dailyPlayed ? STRINGS.share.offerDailyPlayed : STRINGS.share.offerDaily).replace("{n}", String(n))}</p>
                )}
                <p className="shared-body">{STRINGS.share.offerBody}</p>
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
        {saved && (
          <button type="button" className="primary" onClick={onContinue}>
            {STRINGS.ui.continueRun} · era {saved.era}, {STRINGS.parties[saved.align]}
            {isLongReign(lib, saved) && ` · ${STRINGS.reign.short}`}
            {savedDaily && ` · ${dailyName(savedDaily.day)}`}
          </button>
        )}
        <fieldset className="align">
          <legend>Your side</legend>
          {PLAYER_ALIGNS.map((a) => (
            <button key={a} type="button" className={`align-choice${align === a ? " selected" : ""}`} aria-pressed={align === a} onClick={() => setAlign(a)}>
              <b>{STRINGS.parties[a]}</b>
              <span>{STRINGS.partyBlurbs[a]}</span>
            </button>
          ))}
        </fieldset>
        <SetupSummary lib={lib} modifiers={setup.modifiers ?? []} />
        <MandatePicker value={mandate} onChange={setMandate} />
        {longOpen && <ReignPicker value={eraCount} longEraCount={lib.config.longEraCount} onChange={setEraCount} />}
        <label className="seed">
          {STRINGS.ui.seed}
          <input type="number" inputMode="numeric" value={seed} onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value)) || 0))} />
          <button type="button" onClick={() => setSeed(randomSeed())}>
            {STRINGS.ui.shuffle}
          </button>
        </label>
        <button type="button" className="primary big" onClick={() => onStart(seed, align, mandate, longOpen ? eraCount : undefined)}>
          {STRINGS.ui.start}
        </button>
        <div className="meta-row">
          <button type="button" onClick={() => onDaily(align, mandate)} disabled={dailyPlayed}>
            {dailyLabel}
          </button>
          <button type="button" onClick={onCodex}>
            {STRINGS.ui.codex} {progress.endingsSeen}/{progress.endingsTotal}
          </button>
          <button type="button" onClick={onSettings}>
            {STRINGS.ui.settings}
          </button>
        </div>
        {streak > 0 && <p className="menu-streak">{STRINGS.daily.menuStreak.replace("{n}", String(streak))}</p>}
        <p className="hint">{STRINGS.ui.hint}</p>
        <footer className="version">v{APP_VERSION}</footer>
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
