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
      <svg viewBox="0 0 40 40" width="40" height="40" className="meter-icon">
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
    case "mood": {
      const mouth = value >= 60 ? "M12 25 Q20 32 28 25" : value <= 40 ? "M12 29 Q20 22 28 29" : "M12 26 L28 26";
      return (
        <>
          <circle cx="20" cy="20" r="17" />
          {details && (
            <>
              <circle cx="14" cy="15" r="2" className="detail" />
              <circle cx="26" cy="15" r="2" className="detail" />
              <path d={mouth} className="detail-stroke" />
            </>
          )}
        </>
      );
    }
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
