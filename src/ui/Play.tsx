import { withNames } from "../engine/endings";
import { useCallback, useEffect, useState } from "react";
import { STRINGS } from "../content/strings";
import { textLevel, type Settings } from "./settings";
import { lessonFor } from "./teach";
import { TeachNote } from "./TeachNote";
import { getCard, type Library } from "../engine/library";
import { preview } from "../engine/preview";
import type { GameState, Side } from "../engine/types";
import { CardView } from "./CardView";
import { Debug } from "./Debug";
import { EraTransition } from "./EraTransition";
import { Frame } from "./Frame";
import { MandateBadge } from "./MandateBadge";
import { StreamGutters } from "./PathChrome";
import { MetersBar } from "./Meters";
import { degrade } from "./degrade";
import { yearInEra } from "./flow";
import { hintSeen, markHintSeen } from "./save";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  state: GameState;
  transition: number | null;
  onChoose: (side: Side) => void;
  onDismissTransition: () => void;
  debug: boolean;
  onNudgeDrift?: (delta: number) => void;
  settings: Settings;
  onSettings: () => void;
  onCabinet: () => void;
  onTaught: (id: string) => void;
}

const LEAVE_MS = 260;

function reducedMotion(settings: Settings): boolean {
  if (settings.reduceMotion) return true;
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Play({ lib, state, transition, onChoose, onDismissTransition, debug, onNudgeDrift , settings, onSettings, onCabinet, onTaught }: Props) {
  const [peek, setPeek] = useState<Side | null>(null);
  const [dragSide, setDragSide] = useState<Side | null>(null);
  const [leaving, setLeaving] = useState<Side | null>(null);
  const [showHint, setShowHint] = useState(() => !hintSeen());

  const card = state.current ? getCard(lib, state.current) : null;
  const theme = themeFor(state.drift, lib.config);
  const busy = transition !== null || leaving !== null;

  const commit = useCallback(
    (side: Side) => {
      if (busy || !card) return;
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
          onChoose(side);
        },
        reducedMotion(settings) ? 0 : LEAVE_MS,
      );
    },
    [busy, card, onChoose, showHint],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const side: Side = e.key === "ArrowLeft" ? "left" : "right";
        if (peek === side) commit(side);
        else setPeek(side);
      } else if (e.key === "Enter" && peek) {
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
  const eraInfo = STRINGS.eras[state.era - 1];
  const year = yearInEra(state, lib.config.eraLength);
  const progress = Math.min(1, Math.max(0, (year - 1) / lib.config.eraLength));

  return (
    <Frame theme={theme} align={state.align} seed={state.seed} n={state.cardCount} fill>
      <MetersBar lib={lib} state={state} meters={state.meters} preview={projected} theme={theme} align={state.align} />
      <main className="stage">
        <StreamGutters theme={theme} seed={state.seed} n={state.cardCount} />
        {card && (
          <CardView
            key={`${card.id}:${state.cardCount}`}
            card={card}
            text={degrade(withNames(lib, state, card.text, card.speaker), textLevel(settings, theme), state.seed)}
            speakerName={advisor?.name ?? roleLabel}
            roleLabel={roleLabel}
            traitName={advisor?.traits.map((t) => STRINGS.traits[t]?.name).filter(Boolean).join(" · ") || undefined}
            advisorId={advisorId}
            seed={state.seed}
            from={state.currentFrom}
            peek={peek}
            leaving={leaving}
            onDrag={setDragSide}
            onCommit={commit}
          />
        )}
      </main>
      <footer className="status">
        {/* Who is in office, in words as well as in the card's shape (BACKLOG-3 phase 23).
            The shape signature is geometry and says nothing to a screen reader or to anyone
            who cannot pick it out at this size; this says it outright, and takes the party's
            own corner so the two agree. */}
        <div className="office">
          <span className="party">{STRINGS.parties[state.align]}</span>
          <span className="office-tools">
            <button type="button" className="gear" onClick={onCabinet} aria-label={STRINGS.cabinet.title}>
              ☰
            </button>
            <button type="button" className="gear" onClick={onSettings} aria-label={STRINGS.ui.settings}>
              ⚙
            </button>
          </span>
        </div>
        <div className="era">
          <b>{eraInfo?.name ?? `Era ${state.era}`}</b> · {STRINGS.ui.year} {year}
        </div>
        <MandateBadge state={state} />
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        {lesson ? (
          <TeachNote lesson={lesson} state={state} onDismiss={() => onTaught(lesson.id)} />
        ) : (
          (showHint || settings.alwaysHint) && <p className="hint">{STRINGS.ui.hint}</p>
        )}
      </footer>
      {transition !== null && <EraTransition era={transition} onContinue={onDismissTransition} />}
      {debug && <Debug state={state} theme={theme} />}
    </Frame>
  );
}
