import { useCallback, useEffect, useRef, useState } from "react";
import { deckStamp, missingContent } from "../engine/deck";
import type { Library } from "../engine/library";
import type { GameState, PlayerAlign, Side } from "../engine/types";
import { asides, canComeBack, clearAsides, clearMeta, dailySeedFor, dropAside, emptyMeta, encodeRunCode, foldRun, loadProfile, markAside, runCodeOf, saveMeta, todayKey, type MetaState, type RunFold, type RunResult, type SetAside } from "../meta";
import { askToBeKept, onWriteFailed, writeFailures } from "../meta/storage";
import { closeRun, openRun, takeCard, type Measure, type RecordedRun, type RunKind } from "../playtest/record";
import { APP_VERSION } from "../version";
import { canRetrace, otherSide, replayTo } from "../engine/replay";
import { beginRun, beginRunFromCode, commitChoice, dailyCode, ensureCard } from "./flow";
import type { RunCode } from "../meta";
import { appendRecorded, clearRecorded, loadOpen, loadRecorded, MAX_RECORDED_RUNS, saveOpen, sendRecord } from "./playtest";
import { clearRun, loadRun, loadRunChallenge, loadRunDaily, saveRun, type DailyMark } from "./save";
import { applySettings, loadSettings, saveSettings, type Settings } from "./settings";
import { buzz, newlyDangerous, play } from "./sound";
import { DANGER_BELOW } from "./Meters";
import { stageOf } from "../engine/look";
import { clampDrift } from "../engine/state";
import { survivedTo } from "../engine/endings";
import { soundLevel, themeOf } from "./theme";

export type Screen = "setup" | "play" | "over" | "codex";

/**
 * Something the player has to be told before anything else (BACKLOG-8 phase 50): a save that
 * failed, a profile this version could not read and set aside, or one set aside earlier that
 * this version can read. Each is told once.
 */
export type Notice = { kind: "storage" } | { kind: "setAside"; aside: SetAside } | { kind: "canComeBack"; aside: SetAside };

/** What loading the profile has to say: a profile it set aside, then any that can come back. */
function noticesOf(aside: SetAside | null, kept: readonly SetAside[]): Notice[] {
  const out: Notice[] = aside && !aside.told ? [{ kind: "setAside", aside }] : [];
  for (const a of kept) if (a.at !== aside?.at && !a.offered && canComeBack(a)) out.push({ kind: "canComeBack", aside: a });
  return out;
}

/**
 * A game action that threw, carried into the next render so the error screen catches it
 * (BACKLOG-8 phase 50). An exception in a click handler never reaches React on its own: the
 * screen stays as it was and the button does nothing, every time, when a saved run is what
 * throws.
 */
function guarded<A extends unknown[]>(crash: (e: unknown) => void, act: (...args: A) => void): (...args: A) => void {
  return (...args: A) => {
    try {
      act(...args);
    } catch (e) {
      crash(e);
    }
  };
}

/**
 * What a choice sounds like. Ordered so the loudest thing a card did is the last thing you
 * hear: the card lands, then anything that went wrong, then anything that opened
 * (BACKLOG-2 phase 9).
 */
function cue(lib: Library, settings: Settings, before: GameState, after: GameState, side: Side, eraChanged: boolean): void {
  if (settings.haptics) buzz(after.over ? [40, 60, 90] : 12);
  if (!settings.sound) return;
  // The card landing follows the same look the frame does, read after the choice, so the
  // swipe that tipped the run over is the one that sounds different (BACKLOG-3 phase 22).
  play("commit", side, soundLevel(themeOf(after, lib.config)));
  for (const meter of newlyDangerous(before.meters, after.meters, DANGER_BELOW, !!after.opposition)) play("danger", meter);
  if (after.activeArcs.length > before.activeArcs.length) play("arc");
  if (after.stats.electionsHonest + after.stats.electionsCheated > before.stats.electionsHonest + before.stats.electionsCheated) {
    play("election");
  }
  if (eraChanged) play("era");
  if (after.over && !before.over) play(survivedTo(lib.config, after.over.endingId) ? "endWell" : "endBadly");
}

export function useGame(lib: Library) {
  const [saved, setSaved] = useState<GameState | null>(() => {
    const s = loadRun();
    return s && !s.over ? s : null;
  });
  /** The saved run's daily, when it is one, so it is still one when it is continued. */
  const [savedDaily, setSavedDaily] = useState<DailyMark | null>(() => loadRunDaily());
  /**
   * How the run went for whoever sent it, while their run is being played and at its end
   * (BACKLOG-5 phase 37); and the one saved beside a run left for later.
   */
  const [challenge, setChallenge] = useState<RunResult | null>(null);
  const [savedChallenge, setSavedChallenge] = useState<RunResult | null>(() => loadRunChallenge(lib));
  const challengeRef = useRef(challenge);
  challengeRef.current = challenge;
  const [state, setState] = useState<GameState | null>(null);
  const [transition, setTransition] = useState<number | null>(null);
  // The profile, and any stored profile this version could not read and set aside instead
  // of writing over it (BACKLOG-8 phase 50).
  const [boot] = useState(() => {
    const load = loadProfile();
    return { ...load, kept: asides() };
  });
  const [meta, setMeta] = useState<MetaState>(boot.meta);
  const [kept, setKept] = useState<SetAside[]>(boot.kept);
  const [notices, setNotices] = useState<Notice[]>(() => noticesOf(boot.aside, boot.kept));
  const [thrown, setThrown] = useState<Error | null>(null);
  const crash = useCallback((e: unknown) => {
    const error = e instanceof Error ? e : new Error(String(e));
    setThrown(() => error);
  }, []);
  const [lastFold, setLastFold] = useState<RunFold | null>(null);
  const [showCodex, setShowCodex] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCabinet, setShowCabinet] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());
  const stateRef = useRef(state);
  stateRef.current = state;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const metaRef = useRef(meta);
  metaRef.current = meta;
  /**
   * Set while a daily-seed run is in progress, so the result is recorded as one. Saved with
   * the run, so a daily left for later is still one when it comes back (BACKLOG-5 phase 38).
   */
  const dailyRef = useRef<DailyMark | null>(null);
  /** How many runs the playtest record holds (BACKLOG-5 phase 31). */
  const [recorded, setRecorded] = useState(() => loadRecorded().length);
  /** The run being recorded, while the player has asked for a record and one is under way. */
  const openRef = useRef<RecordedRun | null | undefined>(undefined);
  if (openRef.current === undefined) openRef.current = loadOpen();
  /** The next card was left and came back, so the time it reports counts from its return. */
  const resumedRef = useRef(false);

  /** Put an unfinished recording with the finished ones, marked as left, if it got anywhere. */
  const shelveOpen = useCallback(() => {
    const open = openRef.current;
    openRef.current = null;
    saveOpen(null);
    if (open && open.cards.length > 0) setRecorded(appendRecorded(open));
  }, []);

  /** A run is starting: record it, if the player asked for a record and it has room. */
  const beginRecording = useCallback(
    (s: GameState, kind: RunKind) => {
      shelveOpen();
      resumedRef.current = false;
      if (!settingsRef.current.keepRecord || loadRecorded().length >= MAX_RECORDED_RUNS) return;
      openRef.current = openRun(s, { kind, run: metaRef.current.runs + 1, game: APP_VERSION });
      saveOpen(openRef.current);
    },
    [shelveOpen],
  );

  useEffect(() => {
    if (state) saveRun(state, dailyRef.current, challenge);
  }, [state, challenge]);

  // A write that failed, here or anywhere, is told once a page, including one that failed
  // while the page was loading. Told a turn later, since a write can fail inside an update.
  const toldStorage = useRef(false);
  useEffect(() => {
    const tell = () => {
      if (toldStorage.current) return;
      toldStorage.current = true;
      queueMicrotask(() => setNotices((n) => [...n, { kind: "storage" }]));
    };
    if (writeFailures() > 0) tell();
    return onWriteFailed(tell);
  }, []);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  /** Mark a lesson as given, so it never fires again on any run. */
  const markTaught = useCallback((id: string) => {
    setSettingsState((prev) => {
      if (prev.taught.includes(id)) return prev;
      const next = { ...prev, taught: [...prev.taught, id] };
      saveSettings(next);
      return next;
    });
  }, []);

  const setSettings = useCallback((next: Settings) => {
    // Off means off: a run being recorded stops being recorded, and is not kept.
    if (!next.keepRecord && openRef.current) {
      openRef.current = null;
      saveOpen(null);
    }
    setSettingsState(next);
    saveSettings(next);
  }, []);

  /**
   * Leave a run without ending it. The run is already saved on every choice, so this only
   * has to put it back where the menu looks for it (`saved`) and clear the live state.
   */
  const exitToMenu = useCallback(guarded(crash, () => {
    const s = stateRef.current;
    setShowSettings(false);
    setShowCabinet(false);
    setShowCodex(false);
    setTransition(null);
    setLastFold(null);
    if (s && !s.over) {
      saveRun(s, dailyRef.current, challengeRef.current);
      setSaved(s);
      setSavedDaily(dailyRef.current);
      setSavedChallenge(challengeRef.current);
    }
    setChallenge(null);
    setState(null);
  }), [crash]);

  /**
   * Wipes the codex, every unlock, the run in progress, the playtest record and any profile set
   * aside. Confirmed in the menu first.
   */
  const eraseProgress = useCallback(() => {
    clearRun();
    clearMeta();
    clearRecorded();
    clearAsides();
    setKept([]);
    openRef.current = null;
    setRecorded(0);
    const fresh = emptyMeta();
    metaRef.current = fresh;
    setMeta(fresh);
    setSaved(null);
    setSavedDaily(null);
    setSavedChallenge(null);
    setChallenge(null);
    setState(null);
    setTransition(null);
    setLastFold(null);
    setShowSettings(false);
    setShowCodex(false);
    dailyRef.current = null;
  }, []);

  /** A run of the player's own; `eraCount` is set for a long reign (BACKLOG-5 phase 39). */
  const start = useCallback(
    guarded(crash, (seed: number, align: PlayerAlign, mandate: string | null = null, eraCount?: number) => {
      setSaved(null);
      setSavedDaily(null);
      setSavedChallenge(null);
      setChallenge(null);
      setTransition(null);
      setLastFold(null);
      dailyRef.current = null;
      const s = beginRun(lib, seed, align, metaRef.current.unlocks, mandate, eraCount);
      setState(s);
      beginRecording(s, "own");
    }),
    [lib, beginRecording, crash],
  );

  /**
   * A run someone else played, from its code: their setup, not this profile's. When the link
   * said how it went for them, the end compares the two (BACKLOG-5 phase 37).
   */
  const startFromCode = useCallback(
    guarded(crash, (code: RunCode, daily?: DailyMark, vs?: RunResult | null) => {
      setSaved(null);
      setSavedDaily(null);
      setSavedChallenge(null);
      setChallenge(vs ?? null);
      setTransition(null);
      setLastFold(null);
      dailyRef.current = daily ?? null;
      const s = beginRunFromCode(lib, code);
      setState(s);
      beginRecording(s, daily ? "daily" : "shared");
    }),
    [lib, beginRecording, crash],
  );

  /**
   * Today's shared run (5.10). It used to be today's seed read through this profile's
   * unlocks, which made it a different run for 98.3% of players who had unlocked different
   * things (BACKLOG-2 phase 11). It starts from a fixed setup now.
   */
  const startDaily = useCallback(
    (align: PlayerAlign, mandate: string | null = null) => {
      const d = dailySeedFor();
      startFromCode(dailyCode(lib, d.seed, align, mandate), d);
    },
    [lib, startFromCode],
  );

  /**
   * A run from a link. Today's daily sent by someone who played it is today's daily for
   * whoever plays it too, so the menu does not go on to offer them the run they have just
   * played (BACKLOG-5 phases 37 and 38).
   */
  const playShared = useCallback(
    (code: RunCode, vs: RunResult | null = null) => {
      const today = dailySeedFor();
      const isToday = code.seed === today.seed && encodeRunCode(code) === encodeRunCode(dailyCode(lib, today.seed, code.align, code.mandate));
      startFromCode(code, isToday ? today : undefined, vs);
    },
    [lib, startFromCode],
  );

  const continueSaved = useCallback(guarded(crash, () => {
    if (!saved || missingContent(lib, saved).length) return;
    // A run dealt from another deck plays on under this one, so no one deck dealt it: it
    // keeps no stamp, and its links and records claim none (BACKLOG-8 phase 49).
    const moved = !!saved.deck && saved.deck !== deckStamp(lib);
    const { deck: _deck, ...unstamped } = saved;
    const run: GameState = moved ? unstamped : saved;
    setSaved(null);
    setLastFold(null);
    dailyRef.current = savedDaily?.seed === saved.seed ? savedDaily : null;
    setSavedDaily(null);
    setChallenge(savedChallenge);
    setSavedChallenge(null);
    setState(ensureCard(lib, run));
    // The recording carries on only if it is this run's, card for card, on the deck it began
    // on; a record that lost a card, belongs to another run, or would go on under another
    // deck is kept as far as it got.
    const open = openRef.current;
    if (open && (moved || open.code !== encodeRunCode(runCodeOf(saved)) || open.cards.length !== saved.cardCount)) shelveOpen();
    else if (open) resumedRef.current = true;
  }), [lib, saved, savedDaily, savedChallenge, shelveOpen, crash]);

  /** A run has ended: fold it into the profile, and into the daily only if it was that. */
  const foldFinished = useCallback(
    (done: GameState) => {
      const fold = foldRun(lib, metaRef.current, done, dailyRef.current ?? undefined, todayKey());
      metaRef.current = fold.meta;
      setMeta(fold.meta);
      setLastFold(fold);
      saveMeta(fold.meta);
      // There is progress to lose now, so the browser is asked to keep it (BACKLOG-8 phase 50).
      askToBeKept();
      dailyRef.current = null;
    },
    [lib],
  );

  const choose = useCallback(
    guarded(crash, (side: Side, measure: Measure) => {
      const s = stateRef.current;
      if (!s) return;
      const r = commitChoice(lib, s, side);
      setState(r.state);
      const open = openRef.current;
      if (open && s.current && r.state !== s) {
        const next = { ...open, cards: [...open.cards, takeCard(s, r.state, side, measure, resumedRef.current)] };
        resumedRef.current = false;
        if (r.state.over) {
          openRef.current = null;
          saveOpen(null);
          setRecorded(appendRecorded(closeRun(lib, next, r.state)));
        } else {
          openRef.current = next;
          saveOpen(next);
        }
      }
      // A sound or a buzz that fails is not worth an error screen, nor the fold below.
      try {
        cue(lib, settingsRef.current, s, r.state, side, r.eraChanged);
      } catch {
        // The choice stands without it.
      }
      if (r.eraChanged) setTransition(r.state.era);
      if (r.state.over && !s.over) foldFinished(r.state);
    }),
    [lib, foldFinished, crash],
  );

  /**
   * Go back to a card of the run that has just ended and take the other side of it
   * (BACKLOG-5 phase 34). The run is replayed to that card, which puts it back exactly as it
   * was, the other side is taken, and the player plays on. The first road rides along, so the
   * end of the second can show both. A second road does not branch again.
   */
  const takeOtherRoad = useCallback(
    guarded(crash, (k: number) => {
      const first = stateRef.current;
      if (!first?.over || first.road || !canRetrace(first)) return;
      const back = replayTo(lib, first, k);
      const made = first.choices![k];
      if (!back || !made) return;
      const r = commitChoice(lib, { ...back, road: { first, at: k } }, otherSide(made[1]));
      // A second road's end shows the two roads; the run someone sent was the first's to compare.
      setChallenge(null);
      setLastFold(null);
      setTransition(r.eraChanged ? r.state.era : null);
      setState(r.state);
      if (r.state.over) foldFinished(r.state);
    }),
    [lib, foldFinished, crash],
  );

  const dismissTransition = useCallback(() => {
    setTransition(null);
    setState((s) => (s ? ensureCard(lib, s) : s));
  }, [lib]);

  /**
   * Debug only: shift hidden drift so the frame theming can be checked without playing 30
   * cards. The look goes straight to the one the new drift implies: a nudge is not drift
   * easing back, and the browser audit steps through the looks this way.
   */
  const nudgeDrift = useCallback(
    (delta: number) => {
      setState((s) => {
        if (!s || s.over) return s;
        const drift = clampDrift(s.drift + delta);
        return { ...s, drift, look: stageOf(drift, lib.config) };
      });
    },
    [lib],
  );

  /**
   * Put a profile brought from elsewhere in place of this one (BACKLOG-5 phase 33), after the
   * player has seen both and said so. A run in progress is left alone: it carries its own
   * unlocks and plays the same under either profile. A profile set aside that comes back is
   * no longer set aside (BACKLOG-8 phase 50).
   */
  const replaceProgress = useCallback((next: MetaState, nextSettings: Settings, fromAside?: number) => {
    const kept = saveMeta(next);
    metaRef.current = next;
    setMeta(next);
    setLastFold(null);
    setSettings(nextSettings);
    if (kept && fromAside !== undefined) {
      dropAside(fromAside);
      setKept(asides());
    }
  }, [setSettings]);

  const notice = notices[0] ?? null;
  /** The notice has been read: one about a profile set aside is not told again. */
  const dismissNotice = useCallback(() => {
    if (notice?.kind === "setAside") markAside(notice.aside.at, "told");
    if (notice?.kind === "canComeBack") markAside(notice.aside.at, "offered");
    setNotices((n) => n.slice(1));
  }, [notice]);

  /** Hand the record to the share sheet; the player picks where it goes. */
  const sendPlaytest = useCallback(() => sendRecord(loadRecorded()), []);

  /** Delete the record, the run being recorded included. The setting stays as it is. */
  const deletePlaytest = useCallback(() => {
    clearRecorded();
    openRef.current = null;
    setRecorded(0);
  }, []);

  const reset = useCallback(() => {
    clearRun();
    setSaved(null);
    setSavedDaily(null);
    setSavedChallenge(null);
    setChallenge(null);
    setTransition(null);
    setState(null);
    setLastFold(null);
    dailyRef.current = null;
  }, []);

  // An action that threw is thrown again here, where the error screen can catch it.
  if (thrown) throw thrown;
  const screen: Screen = showCodex ? "codex" : !state ? "setup" : state.over ? "over" : "play";
  return {
    screen,
    state,
    transition,
    saved,
    savedDaily,
    challenge,
    meta,
    lastFold,
    start,
    startDaily,
    startFromCode,
    playShared,
    continueSaved,
    choose,
    takeOtherRoad,
    dismissTransition,
    nudgeDrift,
    reset,
    openCodex: () => setShowCodex(true),
    closeCodex: () => setShowCodex(false),
    settings,
    setSettings,
    record: { runs: recorded, full: recorded >= MAX_RECORDED_RUNS },
    sendRecord: sendPlaytest,
    deleteRecord: deletePlaytest,
    showSettings,
    openSettings: () => setShowSettings(true),
    closeSettings: () => setShowSettings(false),
    showCabinet,
    openCabinet: () => setShowCabinet(true),
    closeCabinet: () => setShowCabinet(false),
    showHow,
    openHowItWorks: () => {
      setShowSettings(false);
      setShowHow(true);
    },
    closeHowItWorks: () => setShowHow(false),
    showMove,
    openMoveProgress: () => {
      setShowSettings(false);
      setShowMove(true);
    },
    closeMoveProgress: () => setShowMove(false),
    replaceProgress,
    exitToMenu,
    eraseProgress,
    markTaught,
    notice,
    dismissNotice,
    /** Profiles this version could not read, set aside rather than written over. */
    asides: kept,
  };
}
