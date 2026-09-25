import { memo, useId, useRef, type ReactNode } from "react";
import { GROUND, HEIGHT, STRIP, WIDTH, stripSlotX, type Country, type Motif, type Placed } from "./world";
import { GROUND_DRAW, PALETTES, RIDGE_DRAW, SHORE_DRAW, SKY_DRAW, type Ctx } from "./WorldAfter";

/**
 * The country on the play screen (BACKLOG-10 phase 64): a strip of the world the end screen
 * draws, under the card, with the landmarks standing as the run builds them.
 *
 * It is the end picture's world at the end picture's scale, 1100 wide rather than 400, and the
 * screen fixes its height and crops its sides. The ground slots are spread across the middle
 * 840, which a phone always shows; what is only drawn once in the picture (the water's things,
 * the hills', the sky's) is drawn once here, in the middle, with the hills repeated under it
 * so a turbine still stands on one.
 *
 * A landmark new since the last card rises out of the ground, or fades in if it does not stand
 * on it. One already standing when the strip first drew does not, so continuing a run is not
 * a parade.
 */

const W = STRIP.width;
/** The picture's own things, the bay's and the sky's, are drawn once, under the middle. */
const MIDDLE = (W - WIDTH) / 2;
/** And the sky's are brought down into the part of the sky the strip shows. */
const SKY_DOWN = 70;

interface Props {
  country: Country;
}

export const CountryStrip = memo(function CountryStrip({ country }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = PALETTES[country.band];
  const { band, level } = country;
  const fresh = useFresh(country.placed);
  const ctx = (x: number, w: number): Ctx => ({ p, band, level, x, w, id });
  const of = (slots: readonly string[]) => country.placed.filter((q) => slots.includes(q.slot));
  const dry = country.placed.some((q) => q.motif === "dryBay");
  const rise = (q: Placed, body: ReactNode) => (fresh.has(q.motif) ? <g className="rising">{body}</g> : body);

  return (
    <svg
      className="country"
      viewBox={`0 ${STRIP.top} ${W} ${HEIGHT - STRIP.top}`}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label={country.description}
      data-band={band}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyMid} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={p.sun} stopOpacity={band === "muddle" ? 0.35 : 0.8} />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.haze} stopOpacity="0" />
          <stop offset="1" stopColor={p.haze} stopOpacity={band === "ascent" ? 0.35 : 0.45} />
        </linearGradient>
        <linearGradient id={`${id}-tail`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.95" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </linearGradient>
        {/* A landmark rises out of the ground, not through it. */}
        <clipPath id={`${id}-above`}>
          <rect x="0" y="0" width={W} height={GROUND + 0.5} />
        </clipPath>
      </defs>

      <rect x="0" y={STRIP.top} width={W} height={HEIGHT - STRIP.top} fill={`url(#${id}-sky)`} />
      <StripSun band={band} level={level} id={id} />
      {of(["ring", "station", "ship"]).map((q) => (
        <g key={q.motif} data-motif={q.motif} transform={q.slot === "ring" ? undefined : `translate(${MIDDLE} ${SKY_DOWN})`}>
          {rise(q, q.slot === "ring" ? <StripRing band={band} p={p} /> : SKY_DRAW[q.motif]?.(ctx(0, WIDTH)))}
        </g>
      ))}
      {/* The picture's hills, one after another, one of them under the middle. */}
      {[MIDDLE - WIDTH, MIDDLE, MIDDLE + WIDTH].map((dx) => (
        <path key={dx} transform={`translate(${dx} 0)`} d={HILLS} fill={p.far} opacity="0.55" />
      ))}
      {of(["ridge"]).map((q) => (
        <g key={q.motif} data-motif={q.motif} transform={`translate(${MIDDLE} 0)`}>
          {rise(q, RIDGE_DRAW[q.motif]?.(ctx(0, WIDTH)))}
        </g>
      ))}

      <g className="country-city">
        {country.towers.map((t, i) => (
          <Tower key={i} t={t} fill={p.far} accent={p.accent} flag={country.flagged.includes(i) ? country.office : null} />
        ))}
        <rect x="0" y={GROUND - 120} width={W} height="120" fill={`url(#${id}-haze)`} />
      </g>

      <rect x="0" y={GROUND + 10} width={W} height={HEIGHT - GROUND} fill={dry ? "#5d4631" : p.water} />
      <rect x="0" y={GROUND} width={W} height={11} fill={p.ground} />
      {of(["wall", "bridge", "bay"]).map((q) =>
        // A wall runs the length of the shore; everything else in the water is drawn once.
        q.slot === "wall" ? (
          <g key={q.motif} data-motif={q.motif}>
            {rise(
              q,
              [MIDDLE - WIDTH, MIDDLE, MIDDLE + WIDTH].map((dx) => (
                <g key={dx} transform={`translate(${dx} 0)`}>
                  {SHORE_DRAW[q.motif]?.(ctx(0, WIDTH))}
                </g>
              )),
            )}
          </g>
        ) : (
          <g key={q.motif} data-motif={q.motif} transform={`translate(${MIDDLE} 0)`}>
            {rise(q, SHORE_DRAW[q.motif]?.(ctx(0, WIDTH)))}
          </g>
        ),
      )}
      <g clipPath={`url(#${id}-above)`}>
        {country.placed.map((q) => {
          const at = stripSlotX(q.slot);
          if (!at) return null;
          return (
            <g key={q.motif} data-motif={q.motif}>
              {rise(q, GROUND_DRAW[q.motif]?.(ctx(at[0], at[1])))}
            </g>
          );
        })}
      </g>
    </svg>
  );
});

/**
 * The landmarks new since the placed list last changed. Kept until it changes again, so a card
 * being dragged, which draws the strip again, does not cut a landmark's rise short; and empty
 * on the strip's first drawing, so continuing a run does not raise everything at once.
 */
function useFresh(placed: readonly Placed[]): ReadonlySet<Motif> {
  const key = placed.map((q) => q.motif).join(" ");
  const last = useRef<{ key: string; motifs: ReadonlySet<Motif>; fresh: ReadonlySet<Motif> } | null>(null);
  if (!last.current) last.current = { key, motifs: new Set(placed.map((q) => q.motif)), fresh: new Set() };
  else if (last.current.key !== key) {
    const before = last.current.motifs;
    last.current = { key, motifs: new Set(placed.map((q) => q.motif)), fresh: new Set(placed.map((q) => q.motif).filter((m) => !before.has(m))) };
  }
  return last.current.fresh;
}

/** The picture's ridge, as a path 400 wide, repeated under the strip. */
const HILLS = (() => {
  const ys = [150, 138, 146, 128, 140, 124, 136, 132, 146];
  const step = WIDTH / (ys.length - 1);
  return `${ys.map((y, i) => `${i === 0 ? "M" : "L"}${i * step},${y}`).join(" ")} L${WIDTH},${GROUND} L0,${GROUND} Z`;
})();

function StripSun({ band, level, id }: { band: Country["band"]; level: number; id: string }) {
  const p = PALETTES[band];
  // Low and red on the way down, high and gold on the way up, and a pale disc in between; the
  // same suns as the picture's, brought down into the sky the strip shows.
  // The Decay's sun is low, so it sets between the landmarks rather than behind one.
  const [cx, cy, r, glow] = band === "ascent" ? [MIDDLE + 318, 112, 14, 46 + 14 * level] : band === "decay" ? [MIDDLE - 92, 158, 14, 44 + 20 * level] : [MIDDLE + 300, 108, 10, 32];
  return (
    <g>
      <circle cx={cx} cy={cy} r={glow} fill={`url(#${id}-glow)`} />
      <circle cx={cx} cy={cy} r={r} fill={p.sun} opacity={band === "muddle" ? 0.55 : 1} />
    </g>
  );
}

/** The ring across the whole strip's sky: finished, three-quarters built, or half abandoned. */
function StripRing({ band, p }: { band: Country["band"]; p: (typeof PALETTES)["muddle"] }) {
  const dash = band === "ascent" ? undefined : band === "muddle" ? "2400 800" : "1400 1900";
  return (
    <g fill="none" strokeLinecap="round">
      <ellipse cx={W / 2} cy="104" rx={W / 2 - 6} ry="16" stroke={p.far} strokeWidth="3.5" opacity={band === "decay" ? 0.6 : 0.9} strokeDasharray={dash} />
      <ellipse cx={W / 2} cy="104" rx={W / 2 - 6} ry="16" stroke={p.accent} strokeWidth="1.2" opacity={band === "decay" ? 0.35 : 0.8} strokeDasharray={dash} />
    </g>
  );
}

function Tower({ t, fill, accent, flag }: { t: Country["towers"][number]; fill: string; accent: string; flag: "left" | "right" | null }) {
  const top = GROUND - t.h;
  return (
    <g>
      {t.broken ? (
        <polygon
          points={`${t.x},${GROUND} ${t.x},${top + 4} ${t.x + t.w * 0.3},${top} ${t.x + t.w * 0.42},${top + t.h * 0.22} ${t.x + t.w * 0.58},${top + t.h * 0.12} ${t.x + t.w * 0.72},${top + t.h * 0.34} ${t.x + t.w},${top + t.h * 0.18} ${t.x + t.w},${GROUND}`}
          fill={fill}
        />
      ) : (
        <rect x={t.x} y={top} width={t.w} height={t.h} fill={fill} />
      )}
      {t.spire && (
        <g>
          <polygon points={`${t.x + t.w / 2 - 3},${top} ${t.x + t.w / 2},${top - 14 - t.w / 2} ${t.x + t.w / 2 + 3},${top}`} fill={fill} />
          <circle cx={t.x + t.w / 2} cy={top - 14 - t.w / 2} r="1.4" fill={accent} />
        </g>
      )}
      {flag && (
        <g>
          <line x1={t.x + 3} y1={top} x2={t.x + 3} y2={top - 12} stroke={fill} strokeWidth="1" />
          {/* Whoever holds the office flies its flag: the Commons a pennant, the Ledger a square
              flag, the same shapes the picture at the end uses. */}
          {flag === "left" ? (
            <polygon points={`${t.x + 3},${top - 12} ${t.x + 12},${top - 9.5} ${t.x + 3},${top - 7}`} fill={accent} />
          ) : (
            <rect x={t.x + 3} y={top - 12} width="8" height="5" fill={accent} />
          )}
        </g>
      )}
    </g>
  );
}
