import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { STRINGS } from "../content/strings";
import type { Card, CardSource, Side } from "../engine/types";
import { Portrait } from "./Portrait";

interface Props {
  card: Card;
  text: string;
  /**
   * The text as a screen reader should hear it, when the look is mangling what is on
   * screen: "Teh pension fund" is a joke for the eye and a stumble read aloud
   * (BACKLOG-5 phase 30).
   */
  spokenText?: string;
  speakerName: string;
  roleLabel: string;
  /** The speaker's trait, if it scales the effects of this card. */
  traitName?: string;
  advisorId: string;
  seed: number;
  /**
   * Why this card is here (BACKLOG-3 phase 19). A bill gets a folded corner because it has
   * been somewhere; a habit gets a stack behind it because it is not the first of its kind.
   * Everything else is dealt and looks it.
   */
  from?: CardSource | null;
  /** Keyboard peek: shows the choice for that side without a pointer. */
  peek: Side | null;
  /** Set once a choice is committed; the card flies off that way. */
  leaving: Side | null;
  onDrag: (side: Side | null) => void;
  onCommit: (side: Side) => void;
  /**
   * Take focus when this card arrives: the first card of a run, and the first after an era,
   * when whatever had focus has just gone. A screen reader otherwise loses its place.
   */
  focusOnMount?: boolean;
}

const DEAD_ZONE = 8;

/** Distance in px a drag must cover to commit. Pure so tests can pin it. */
export function commitThreshold(cardWidth: number): number {
  return Math.max(72, cardWidth * 0.28);
}

export function CardView({ card, text, spokenText, speakerName, roleLabel, traitName, advisorId, seed, from, peek, leaving, onDrag, onCommit, focusOnMount }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const nameId = `speaker${useId().replace(/\W/g, "")}`;
  useEffect(() => {
    if (focusOnMount) ref.current?.focus({ preventScroll: true });
    // Once, as the card arrives; a later render is the same card.
  }, []);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const threshold = () => commitThreshold(ref.current?.offsetWidth ?? 320);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (leaving) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const d = e.clientX - drag.current.x;
    setDx(d);
    onDrag(Math.abs(d) < DEAD_ZONE ? null : d < 0 ? "left" : "right");
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (Math.abs(dx) >= threshold()) onCommit(dx < 0 ? "left" : "right");
    else {
      setDx(0);
      onDrag(null);
    }
  };

  const t = threshold();
  const visualDx = leaving ? (leaving === "left" ? -1 : 1) * 900 : dragging ? dx : peek ? (peek === "left" ? -0.55 : 0.55) * t : 0;
  const side: Side | null = visualDx < -DEAD_ZONE ? "left" : visualDx > DEAD_ZONE ? "right" : null;
  const reveal = Math.min(1, Math.abs(visualDx) / t);
  const classes = ["card", "card-enter"];
  if (card.type === "election") classes.push("election");
  if (from === "queue") classes.push("card-bill");
  if (from === "habit") classes.push("card-habit");
  if (dragging) classes.push("dragging");
  else if (leaving) classes.push("leaving");
  else classes.push("settling");

  return (
    <div
      ref={ref}
      className={classes.join(" ")}
      style={{ transform: `translateX(${visualDx}px) rotate(${visualDx / 22}deg)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      data-card={card.id}
      data-from={from ?? undefined}
      role="group"
      aria-labelledby={nameId}
      tabIndex={-1}
    >
      {/* The mark is drawn in CSS and says nothing out loud, so the one thing it does say
          has to be said here for anyone who cannot see it. */}
      {(from === "queue" || from === "habit") && (
        <span className="sr-only">{from === "queue" ? STRINGS.ui.cameBack : STRINGS.ui.aHabit}</span>
      )}
      <div className="card-labels" aria-hidden={side === null}>
        <span className="card-label" style={{ opacity: side === "left" ? reveal : 0 }}>
          {card.left.label}
        </span>
        <span className="card-label" style={{ opacity: side === "right" ? reveal : 0 }}>
          {card.right.label}
        </span>
      </div>
      <div className="speaker">
        <Portrait role={card.speaker} advisorId={advisorId} seed={seed} />
        <span className="speaker-name" id={nameId}>
          {speakerName}
        </span>
        <span className="speaker-role">
          {roleLabel}
          {traitName && <b className="speaker-trait">{traitName}</b>}
        </span>
      </div>
      {spokenText && spokenText !== text ? (
        <>
          <p className="card-text" aria-hidden="true">
            {text}
          </p>
          <p className="sr-only">{spokenText}</p>
        </>
      ) : (
        <p className="card-text">{text}</p>
      )}
    </div>
  );
}
