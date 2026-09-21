import { useId } from "react";
import type { MeterKey } from "../engine/types";

interface Props {
  meter: MeterKey;
  value: number;
  /** 0 hidden, 1 small, 2 medium, 3 large: hints magnitude, never direction (section 9). */
  dot: 0 | 1 | 2 | 3;
  danger: boolean;
  label: string;
}

/** Reigns-style silhouette filled from the bottom to the meter's value. */
export function MeterIcon({ meter, value, dot, danger, label }: Props) {
  const clip = `clip${useId().replace(/\W/g, "")}`;
  const v = Math.max(0, Math.min(100, value));
  const h = (v / 100) * 40;
  return (
    <div className={`meter${danger ? " danger" : ""}`} role="img" aria-label={`${label} ${Math.round(v)} of 100`}>
      <svg viewBox="0 0 40 40" className="meter-icon">
        <defs>
          <clipPath id={clip}>
            <rect x="0" y={40 - h} width="40" height={h} />
          </clipPath>
        </defs>
        <g className="meter-fill" clipPath={`url(#${clip})`}>
          <Shape meter={meter} value={v} details={false} />
        </g>
        <g className="meter-outline">
          <Shape meter={meter} value={v} details />
        </g>
      </svg>
      <span className={`meter-dot dot-${dot}`} aria-hidden="true" />
      <span className="meter-label">{label}</span>
    </div>
  );
}

function Shape({ meter, value, details }: { meter: MeterKey; value: number; details: boolean }) {
  switch (meter) {
    // ---- coalition blocs -------------------------------------------------------------
    case "base": {
      // A crowd: the people who turn up for you. Their faces sour as support drains.
      const brow = value <= 35 ? -2 : 0;
      return (
        <>
          <circle cx="12" cy="16" r="6" />
          <circle cx="28" cy="16" r="6" />
          <circle cx="20" cy="13" r="7.5" />
          <path d="M4 38 C6 28 14 25 20 25 C26 25 34 28 36 38 Z" />
          {details && (
            <>
              <circle cx="17" cy={12 + brow} r="1.6" className="detail" />
              <circle cx="23" cy={12 + brow} r="1.6" className="detail" />
            </>
          )}
        </>
      );
    }
    case "backers":
      // An open hand: the money and the muscle that hold you up.
      return (
        <>
          <path d="M12 38 C6 32 5 24 8 20 L10 22 L10 8 A2.4 2.4 0 0 1 15 8 L15 18 L15 5 A2.4 2.4 0 0 1 20 5 L20 18 L20 7 A2.4 2.4 0 0 1 25 7 L25 18 L25 11 A2.4 2.4 0 0 1 30 11 L30 26 C30 33 27 38 24 38 Z" />
          {details && <path d="M15 20 L15 12 M20 20 L20 10 M25 20 L25 14" className="detail-stroke" />}
        </>
      );
    case "public":
      // A house: everyone else, who notice when the bills change.
      return (
        <>
          <path d="M20 5 L37 19 L33 19 L33 37 L7 37 L7 19 L3 19 Z" />
          {details && (
            <>
              <rect x="16" y="25" width="8" height="12" className="detail" />
              <path d="M11 22 H17 M23 22 H29" className="detail-stroke" />
            </>
          )}
        </>
      );

    // ---- meters that belong to the state ---------------------------------------------
    case "money":
      return (
        <>
          <circle cx="20" cy="20" r="17" />
          {details && (
            <>
              <circle cx="20" cy="20" r="11" className="detail-stroke" />
              <path d="M20 13 V27 M15.5 17.5 H24.5 M15.5 22.5 H24.5" className="detail-stroke" />
            </>
          )}
        </>
      );
    case "order":
      return (
        <>
          <path d="M20 3 L35 9 V19 C35 29 28 35 20 38 C12 35 5 29 5 19 V9 Z" />
          {details && <path d="M20 10 V31 M12 18 H28" className="detail-stroke" />}
        </>
      );
    case "inst":
      return (
        <>
          <path d="M20 3 L37 12 H3 Z" />
          <rect x="5" y="13" width="30" height="4" />
          <rect x="7" y="18" width="5" height="13" />
          <rect x="17.5" y="18" width="5" height="13" />
          <rect x="28" y="18" width="5" height="13" />
          <rect x="3" y="32" width="34" height="5" />
        </>
      );
  }
}
