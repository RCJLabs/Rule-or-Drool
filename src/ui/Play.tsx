import { useCallback, useEffect, useState } from "react";
import { STRINGS } from "../content/strings";
import { getCard, type Library } from "../engine/library";
import { preview } from "../engine/preview";
import type { GameState, Side } from "../engine/types";
import { CardView } from "./CardView";
import { Debug } from "./Debug";
import { EraTransition } from "./EraTransition";
import { Frame } from "./Frame";
import { MetersBar } from "./Meters";
import { degrade } from "./degrade";
import { yearInEra } from "./flow";
import { hintSeen, markHintSeen } from "./save";
import { degradeLevel, themeFor } from "./theme";

interface Props {
  lib: Library;
  state: GameState;
  transition: number | null;
  onChoose: (side: Side) => void;
  onDismissTransition: () => void;
  debug: boolean;
  onNudgeDrift?: (delta: number) => void;
}

const LEAVE_MS = 260;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Play({ lib, state, transition, onChoose, onDismissTransition, debug, onNudgeDrift }: Props) {
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
        reducedMotion() ? 0 : LEAVE_MS,
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

  const previewSide = dragSide ?? peek;
  const projected = card && previewSide && !leaving ? preview(lib, state, card, previewSide) : null;

  const advisorId = card ? (state.cabinet[card.speaker] ?? "") : "";
  const advisor = card ? lib.advisorsByRole.get(card.speaker)?.find((a) => a.id === advisorId) : undefined;
  const roleLabel = card ? (STRINGS.roles[card.speaker] ?? card.speaker) : "";
  const eraInfo = STRINGS.eras[state.era - 1];
  const year = yearInEra(state, lib.config.eraLength);
  const progress = Math.min(1, Math.max(0, (year - 1) / lib.config.eraLength));

  return (
    <Frame theme={theme} seed={state.seed} n={state.cardCount}>
      <MetersBar meters={state.meters} preview={projected} theme={theme} align={state.align} />
      <main className="stage">
        {card && (
          <CardView
            key={`${card.id}:${state.cardCount}`}
            card={card}
            text={degrade(card.text, degradeLevel(theme), state.seed)}
            speakerName={advisor?.name ?? roleLabel}
            roleLabel={roleLabel}
            advisorId={advisorId}
            seed={state.seed}
            peek={peek}
            leaving={leaving}
            onDrag={setDragSide}
            onCommit={commit}
          />
        )}
      </main>
      <footer className="status">
        <div className="era">
          <b>{eraInfo?.name ?? `Era ${state.era}`}</b> · {STRINGS.ui.year} {year}
        </div>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        {showHint && <p className="hint">{STRINGS.ui.hint}</p>}
      </footer>
      {transition !== null && <EraTransition era={transition} onContinue={onDismissTransition} />}
      {debug && <Debug state={state} theme={theme} />}
    </Frame>
  );
}
