import type { CSSProperties, ReactNode } from "react";
import { sponsorCount, sponsorFor, type Theme } from "./theme";

interface Props {
  theme: Theme;
  seed: number;
  /** Changes per card so sponsors rotate. */
  n: number;
  children: ReactNode;
}

/**
 * The frame is the trajectory meter (section 9): CSS reads data-theme plus the continuous
 * --decay / --ascent variables; sponsor banners creep in as Decay deepens.
 */
export function Frame({ theme, seed, n, children }: Props) {
  const count = sponsorCount(theme);
  const sponsors = Array.from({ length: count }, (_, i) => sponsorFor(seed, n * 4 + i));
  const style = { "--decay": theme.decay, "--ascent": theme.ascent } as CSSProperties;
  const tickerText = [...sponsors, "BREAKING: everything is fine", ...sponsors].join("  ·  ");
  return (
    <div className="frame" data-theme={theme.name} data-band={theme.band} style={style}>
      {count >= 2 && (
        <div className="ticker" aria-hidden="true">
          <span>{tickerText}  ·  {tickerText}  ·  </span>
        </div>
      )}
      {children}
      {count >= 1 && (
        <div className="sponsor" aria-hidden="true">
          This decision brought to you by <b>{sponsors[0]}</b>
        </div>
      )}
      {count >= 3 && (
        <div className="ad-badge" aria-hidden="true">
          AD
        </div>
      )}
    </div>
  );
}
