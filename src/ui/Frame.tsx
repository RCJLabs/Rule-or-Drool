import type { CSSProperties, ReactNode } from "react";
import type { PlayerAlign } from "../engine/types";
import { PathChrome, StreamAlerts } from "./PathChrome";
import { sponsorCount, sponsorFor, type Theme } from "./theme";

interface Props {
  theme: Theme;
  /**
   * Which party is in office. A second axis, not a second theme: it changes the card's
   * geometry and one accent mark and takes its colour from whatever path is running, so the
   * two multiply rather than one overwriting the other (BACKLOG-3 phase 23).
   */
  align?: PlayerAlign;
  seed: number;
  /** Changes per card so the stream moves on. */
  n: number;
  /**
   * The run screen fills the viewport exactly and never scrolls: the card shrinks instead,
   * so the meters and the footer are always both on screen. The other screens are documents
   * and scroll like documents (BACKLOG-3 phase 18).
   */
  fill?: boolean;
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
export function Frame({ theme, align, seed, n, fill, children }: Props) {
  const sponsors = sponsorCount(theme);
  const style = { "--decay": theme.decay, "--ascent": theme.ascent } as CSSProperties;
  return (
    <div className="frame" data-theme={theme.name} data-band={theme.band} data-align={align} data-fill={fill ? "" : undefined} style={style}>
      <PathChrome theme={theme} seed={seed} n={n} run={fill} />
      {children}
      <StreamAlerts theme={theme} seed={seed} n={n} />
      {sponsors >= 1 && (
        <div className="sponsor" aria-hidden="true">
          Sponsored by <b>{sponsorFor(seed, n)}</b>
        </div>
      )}
    </div>
  );
}
