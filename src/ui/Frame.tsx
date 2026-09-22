import type { CSSProperties, ReactNode } from "react";
import { PathChrome } from "./PathChrome";
import { sponsorCount, sponsorFor, type Theme } from "./theme";

interface Props {
  theme: Theme;
  seed: number;
  /** Changes per card so the stream moves on. */
  n: number;
  children: ReactNode;
}

/**
 * The frame is the trajectory meter (section 9). CSS reads data-theme plus the continuous
 * --decay / --ascent variables; the chrome around the card is the path itself — a livestream
 * on the way down, a projection on the way up (BACKLOG-3 phase 18).
 *
 * The sponsor line survives the rebuild because a stream has to be paid for by somebody, and
 * it is the one piece of decay chrome that was already written.
 */
export function Frame({ theme, seed, n, children }: Props) {
  const sponsors = sponsorCount(theme);
  const style = { "--decay": theme.decay, "--ascent": theme.ascent } as CSSProperties;
  return (
    <div className="frame" data-theme={theme.name} data-band={theme.band} style={style}>
      <PathChrome theme={theme} seed={seed} n={n} />
      {children}
      {sponsors >= 1 && (
        <div className="sponsor" aria-hidden="true">
          Sponsored by <b>{sponsorFor(seed, n)}</b>
        </div>
      )}
    </div>
  );
}
