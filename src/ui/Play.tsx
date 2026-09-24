import { withNames } from "../engine/endings";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent } from "react";
import { STRINGS } from "../content/strings";
import { rivalReport } from "./rival";
import { textLevel, type Settings } from "./settings";
import { lessonFor } from "./teach";
import { TeachNote } from "./TeachNote";
import { getCard, questionOf, type Library } from "../engine/library";
import { preview } from "../engine/preview";
import type { GameState, Meters, Side } from "../engine/types";
import { CardClock } from "../playtest/clock";
import type { Measure } from "../playtest/record";
import { CardView } from "./CardView";
import { countLine } from "./count";
import { Debug } from "./Debug";
import { EraTransition } from "./EraTransition";
import { Frame } from "./Frame";
import { MandateBadge } from "./MandateBadge";
import { StreamGutters } from "./PathChrome";
import { DANGER_BELOW, MetersBar } from "./Meters";
import { degrade } from "./degrade";
import { yearInEra } from "./flow";
import { hintSeen, markHintSeen } from "./save";
import { newlyDangerous } from "./sound";
import { choiceSummary, lookChange, meterName, resultSummary } from "./speech";
import { themeOf } from "./theme";

interface Props {
  lib: Library;
  state: GameState;
  transition: number | null;
  /** The side taken, and how long the card was in front of the player before it was. */
  onChoose: (side: Side, measure: Measure) => void;
  onDismissTransition: () => void;
  /** A menu is over the card: the settings, or how it works. The card's clock stops. */
  paused?: boolean;
  debug: boolean;
  onNudgeDrift?: (delta: number) => void;
  settings: Settings;
  onSettings: () => void;
  onCabinet: () => void;
  onTaught: (id: string) => void;
}

const LEAVE_MS = 260;
const SIDES: readonly Side[] = ["left", "right"];

function reducedMotion(settings: Settings): boolean {
  if (settings.reduceMotion) return true;
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** What the last announcement was made about, to say what changed since. */
interface Heard {
  key: string;
  meters: Meters;
  stage: number;
  era: number;
}

export function Play({ lib, state, transition, onChoose, onDismissTransition, paused = false, debug, onNudgeDrift , settings, onSettings, onCabinet, onTaught }: Props) {
  const [peek, setPeek] = useState<Side | null>(null);
  const [dragSide, setDragSide] = useState<Side | null>(null);
  const [leaving, setLeaving] = useState<Side | null>(null);
  const [showHint, setShowHint] = useState(() => !hintSeen());
  const [said, setSaid] = useState("");
  const heard = useRef<Heard | null>(null);
  // The run's first card, and the first after an era, take focus (see CardView).
  const focusNext = useRef(true);
  const choices = useRef<HTMLDivElement>(null);
  const describe = useId().replace(/\W/g, "");
  // How long each card is in front of the player, for the playtest record (BACKLOG-5
  // phase 31). Measured always, kept only if the player asked for a record.
  const clock = useRef<CardClock | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const inView = () => !pausedRef.current && (typeof document === "undefined" || document.visibilityState !== "hidden");

  const card = state.current ? getCard(lib, state.current) : null;
  const cardKey = card ? `${card.id}:${state.cardCount}` : null;
  const questionId = card ? questionOf(lib, card) : undefined;
  const asked = card && questionId ? { title: STRINGS.questions.titles[questionId] ?? questionId, asking: card.step === 1 } : undefined;
  // An election says how an honest count goes, on the card and aloud (BACKLOG-9 phase 53).
  const count = card ? countLine(lib, state, card) : null;
  const theme = themeOf(state, lib.config);
  const busy = transition !== null || leaving !== null;

  const commit = useCallback(
    (side: Side) => {
      if (busy || !card) return;
      // Read at the moment of deciding, not when the card has finished flying off.
      const measure: Measure = clock.current?.read() ?? { ms: 0, looked: [0, 0] };
      clock.current = null;
      setLeaving(side);
      setPeek(null);
      setDragSide(null);
      if (showHint) {
        markHintSeen();
        setShowHint(false);
      }
      window.setTimeout(
        () => {
          setLeaving(null);
          onChoose(side, measure);
        },
        reducedMotion(settings) ? 0 : LEAVE_MS,
      );
    },
    [busy, card, onChoose, showHint],
  );

  // A layout effect, not a passive one: a passive effect is re-attached a moment after the new
  // card is on the page, and a key pressed in that moment reached the old listener, which
  // still took the last card for leaving and dropped it. No person presses that fast; the
  // browser audits did, and one hung on it in CI (BACKLOG-5 phase 37).
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy) return;
      // A focused button answers Enter itself. Committing here as well meant that dismissing
      // a teaching note with Enter, while a side was peeked, also played the card.
      const onControl = e.target instanceof Element && e.target.closest("button, a, input, select, textarea") !== null;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const side: Side = e.key === "ArrowLeft" ? "left" : "right";
        if (peek === side) commit(side);
        else {
          setPeek(side);
          // Between the two choice buttons, focus follows the peek, so Enter commits the side
          // that is showing.
          if (e.target instanceof Node && choices.current?.contains(e.target)) {
            choices.current.querySelector<HTMLButtonElement>(`[data-side="${side}"]`)?.focus();
          }
        }
      } else if (e.key === "Enter" && peek && !onControl) {
        commit(peek);
      } else if (e.key === "Escape") {
        setPeek(null);
      } else if (debug && onNudgeDrift && (e.key === "[" || e.key === "]")) {
        onNudgeDrift(e.key === "[" ? -10 : 10);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, peek, commit, debug, onNudgeDrift]);

  // One at a time, and only while the card that demonstrates it is on the table.
  const lesson = lessonFor(lib, state, settings.taught);
  const previewSide = dragSide ?? peek;
  const projected = card && previewSide && !leaving ? preview(lib, state, card, previewSide) : null;

  const advisorId = card ? (state.cabinet[card.speaker] ?? "") : "";
  const advisor = card ? lib.advisorsByRole.get(card.speaker)?.find((a) => a.id === advisorId) : undefined;
  const roleLabel = card ? (STRINGS.roles[card.speaker] ?? card.speaker) : "";
  const speakerName = advisor?.name ?? roleLabel;
  const traitName = advisor?.traits.map((t) => STRINGS.traits[t]?.name).filter(Boolean).join(" · ") || undefined;
  // What the card says, and what the screen shows of it: late Decay mangles the second.
  const spoken = card ? withNames(lib, state, card.text, card.speaker) : "";
  const shown = card ? degrade(spoken, textLevel(settings, theme), state.seed) : "";
  const rival = rivalReport(lib, state);
  const eraInfo = STRINGS.eras[state.era - 1];
  // The first card of a second road says where it left the first (BACKLOG-5 phase 34).
  const branched = state.road && state.cardCount === state.road.at + 1 ? state.choices?.[state.road.at] : undefined;
  const roadNote = branched
    ? STRINGS.road.note.replace("{n}", String(state.road!.at + 1)).replace("{label}", getCard(lib, branched[0])[branched[1]].label)
    : null;
  const year = yearInEra(state, lib.config.eraLength);
  const progress = Math.min(1, Math.max(0, (year - 1) / lib.config.eraLength));

  // What a sighted player takes in when a card lands, said aloud (BACKLOG-5 phase 30): how
  // the last choice moved the meters, anything that went into danger, a change of look, and
  // the card. The hidden drift and the numbers stay hidden.
  useEffect(() => {
    if (!card || !cardKey) return;
    const prev = heard.current;
    if (prev?.key === cardKey) return;
    const parts: string[] = [];
    if (prev && prev.era === state.era) {
      const moved = resultSummary(prev.meters, state.meters, state.align);
      if (moved) parts.push(moved);
    }
    if (prev) {
      for (const m of newlyDangerous(prev.meters, state.meters, DANGER_BELOW)) {
        parts.push(STRINGS.speech.inDanger.replace("{meter}", meterName(m, state.align)));
      }
    }
    const look = lookChange(prev?.stage ?? 0, theme.stage);
    if (look) parts.push(look);
    if (roadNote) parts.push(roadNote);
    parts.push(`${speakerName}, ${roleLabel}${traitName ? `, ${traitName}` : ""}.`);
    if (state.currentFrom === "queue") parts.push(STRINGS.ui.cameBack);
    if (state.currentFrom === "habit") parts.push(STRINGS.ui.aHabit);
    // A question says it is one out loud too, as its title does on the card (BACKLOG-6 phase 40).
    if (asked) parts.push(`${asked.asking ? `${STRINGS.questions.asking}: ${asked.title}` : asked.title}.`);
    parts.push(spoken);
    if (count) parts.push(`${count.text}.`);
    if (!prev) parts.push(STRINGS.speech.choicesHint);
    setSaid(parts.join(" "));
    heard.current = { key: cardKey, meters: state.meters, stage: theme.stage, era: state.era };
  }, [cardKey]);

  useEffect(() => {
    if (cardKey) focusNext.current = false;
  }, [cardKey]);

  // A new card on the table starts its own clock; a hidden page or a menu over the card stops it.
  useEffect(() => {
    clock.current = cardKey ? new CardClock(() => performance.now(), inView()) : null;
  }, [cardKey]);
  useEffect(() => {
    clock.current?.setRunning(inView());
  }, [paused]);
  useEffect(() => {
    const onVisibility = () => clock.current?.setRunning(inView());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    clock.current?.setPreview(previewSide);
  }, [previewSide]);

  const dismissTransition = () => {
    focusNext.current = true;
    onDismissTransition();
  };

  // Keyboard focus on a choice shows it the way the arrow keys do. A mouse or a script
  // putting focus there does not, or the card would slide on its own.
  const focusChoice = (side: Side) => (e: FocusEvent<HTMLButtonElement>) => {
    if (e.currentTarget.matches(":focus-visible")) setPeek(side);
  };

  return (
    <Frame theme={theme} align={state.align} seed={state.seed} n={state.cardCount} fill>
      <MetersBar lib={lib} state={state} meters={state.meters} preview={projected} theme={theme} align={state.align} />
      <main className="stage">
        <StreamGutters theme={theme} seed={state.seed} n={state.cardCount} />
        {card && (
          <CardView
            key={cardKey}
            card={card}
            text={shown}
            spokenText={spoken}
            speakerName={speakerName}
            roleLabel={roleLabel}
            traitName={traitName}
            advisorId={advisorId}
            seed={state.seed}
            from={state.currentFrom}
            question={asked}
            count={count}
            peek={peek}
            leaving={leaving}
            onDrag={setDragSide}
            onCommit={commit}
            focusOnMount={focusNext.current}
          />
        )}
      </main>
      {/* The two choices as buttons (BACKLOG-5 phase 30). Always there for a screen reader,
          which has nothing to drag; drawn only when the player asks, or while one has
          keyboard focus. Each says what it moves, as the preview dots do. */}
      {card && (
        <div ref={choices} className={`choices${settings.showChoices ? "" : " choices-hidden"}`}>
          {SIDES.map((side) => (
            <button
              key={side}
              type="button"
              className="choice"
              data-side={side}
              aria-describedby={`${describe}-${side}`}
              onClick={() => commit(side)}
              onFocus={focusChoice(side)}
              onBlur={() => setPeek((p) => (p === side ? null : p))}
            >
              {card[side].label}
            </button>
          ))}
          {SIDES.map((side) => (
            <span key={side} id={`${describe}-${side}`} className="sr-only">
              {choiceSummary(preview(lib, state, card, side), state.meters, state.align)}
            </span>
          ))}
        </div>
      )}
      <footer className="status">
        {/* Who is in office, in words as well as in the card's shape (BACKLOG-3 phase 23).
            The shape signature is geometry and says nothing to a screen reader or to anyone
            who cannot pick it out at this size; this says it outright, and takes the party's
            own corner so the two agree. */}
        <div className="office">
          <span className="party">{STRINGS.parties[state.align]}</span>
          <span className="office-tools">
            {/* The cabinet is the only screen that says how the rival is doing, so the
                button that opens it is where the run says it is worth opening
                (BACKLOG-3 phase 24). */}
            <button
              type="button"
              className={`gear${rival.somebody ? " flagged" : ""}`}
              onClick={onCabinet}
              aria-label={rival.somebody ? `${STRINGS.cabinet.title} — ${STRINGS.rival.wouldWin}` : STRINGS.cabinet.title}
            >
              ☰
            </button>
            <button type="button" className="gear" onClick={onSettings} aria-label={STRINGS.ui.settings}>
              ⚙
            </button>
          </span>
        </div>
        <div className="era">
          <b>{eraInfo?.name ?? `Era ${state.era}`}</b> · {STRINGS.ui.year} {year}
          {state.road && <span className="road-mark"> · {STRINGS.road.mark}</span>}
        </div>
        <MandateBadge state={state} />
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        {roadNote && <p className="road-note">{roadNote}</p>}
        {lesson ? (
          <TeachNote lesson={lesson} state={state} onDismiss={() => onTaught(lesson.id)} />
        ) : (
          (showHint || settings.alwaysHint) && <p className="hint">{STRINGS.ui.hint}</p>
        )}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {said}
        </p>
      </footer>
      {transition !== null && (
        <EraTransition lib={lib} state={state} era={transition} reduceMotion={settings.reduceMotion} onContinue={dismissTransition} />
      )}
      {debug && <Debug state={state} theme={theme} />}
      {/* Shown by the stylesheet on a phone held sideways, and to the eye only: a screen
          reader has no orientation, and the run under it plays the same (BACKLOG-5 phase 32). */}
      <div className="upright" aria-hidden="true">
        <svg className="upright-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="15" y="6" width="18" height="32" rx="3" />
          <path d="M22 33h4" />
          <path d="M8 26a16 16 0 0 0 7 13" />
          <path d="M8 35l7 4-1-8" />
        </svg>
        <b>{STRINGS.ui.upright}</b>
        <span>{STRINGS.ui.uprightBody}</span>
      </div>
    </Frame>
  );
}
