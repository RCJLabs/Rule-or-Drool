import { useId, type ReactNode } from "react";
import type { Band } from "../engine/types";
import { GROUND, HEIGHT, SLOT_X, WIDTH, type Motif, type Slot, type World } from "./world";

/**
 * The world after a run (post-run histories), drawn from `composeWorld`. Flat silhouettes,
 * the same style as the portraits and the meter icons, and no image files: the picture is
 * made from the run, so there is nothing to fetch and it works offline.
 *
 * Depth is done the way a painter does it rather than with detail: the skyline behind is
 * hazed toward the sky, the landmarks in front are drawn at full strength, so the things
 * the player did stand out from the city they did them in.
 */
export interface Palette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sun: string;
  far: string;
  near: string;
  window: string;
  accent: string;
  ground: string;
  water: string;
  waterHi: string;
  haze: string;
}

export const PALETTES: Record<Band, Palette> = {
  ascent: {
    skyTop: "#0f2342", skyMid: "#3d5f8f", skyBottom: "#f3c677", sun: "#fff6d8",
    far: "#4d6384", near: "#15233a", window: "#ffe19a", accent: "#ffc85a",
    ground: "#1c2e2a", water: "#2f6d9c", waterHi: "#a4d1ee", haze: "#f6d9a2",
  },
  muddle: {
    skyTop: "#6c7582", skyMid: "#9ba1a8", skyBottom: "#c9c3b4", sun: "#f4f0e4",
    far: "#80868e", near: "#3b4047", window: "#efe1ae", accent: "#cdb57a",
    ground: "#4b5044", water: "#5d7282", waterHi: "#9fb3c1", haze: "#d7d2c6",
  },
  decay: {
    skyTop: "#0b0610", skyMid: "#3b1521", skyBottom: "#7c2b2a", sun: "#ff6a3d",
    far: "#2d1d27", near: "#0d090f", window: "#ff8a4c", accent: "#ff5a3c",
    ground: "#141013", water: "#23171f", waterHi: "#553a47", haze: "#4a2a30",
  },
};

export interface Ctx {
  p: Palette;
  band: Band;
  level: number;
  x: number;
  w: number;
  id: string;
}

export function WorldAfter({ world, title }: { world: World; title: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = PALETTES[world.band];
  const { band, level } = world;
  const ctx = (slot: Slot): Ctx => {
    const [x, w] = SLOT_X[slot] ?? [0, WIDTH];
    return { p, band, level, x, w, id };
  };
  const has = (m: Motif) => world.placed.some((q) => q.motif === m);
  const sky = world.placed.filter((q) => q.slot === "ring" || q.slot === "station" || q.slot === "ship");
  const ground = world.placed.filter((q) => SLOT_X[q.slot]);

  return (
    <svg
      className="world-after"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-labelledby={`${id}-t`}
      aria-describedby={`${id}-d`}
      data-band={band}
      preserveAspectRatio="xMidYMid slice"
    >
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{world.description}</desc>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="0.55" stopColor={p.skyMid} />
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
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill={`url(#${id}-sky)`} />
      <Sun p={p} band={band} level={level} id={id} />
      <Weather p={p} band={band} level={level} />
      {sky.map((q) => (
        <g key={q.motif} data-motif={q.motif}>
          {SKY_DRAW[q.motif]?.({ p, band, level, x: 0, w: WIDTH, id })}
        </g>
      ))}
      <Hills p={p} seed={world.buildings.length} />
      {world.placed
        .filter((q) => q.slot === "ridge")
        .map((q) => (
          <g key={q.motif} data-motif={q.motif}>
            {RIDGE_DRAW[q.motif]?.({ p, band, level, x: 0, w: WIDTH, id })}
          </g>
        ))}

      {/* The city itself, hazed back so the landmarks in front of it read first. */}
      <g className="world-skyline">
        {world.buildings.map((b, i) => (
          <SkylineBuilding key={i} b={b} p={p} flag={world.flagged.includes(i) ? world.align : null} />
        ))}
        <rect x="0" y={GROUND - 120} width={WIDTH} height="120" fill={`url(#${id}-haze)`} />
        {/* The smoke rises from the city behind the landmarks, not across the front of them. */}
        {band === "decay" && <Smoke p={p} level={level} buildings={world.buildings} />}
      </g>

      <Water p={p} dry={has("dryBay")} />
      <rect x="0" y={GROUND} width={WIDTH} height={11} fill={p.ground} />
      {world.placed
        .filter((q) => q.slot === "wall" || q.slot === "bridge" || q.slot === "bay")
        .map((q) => (
          <g key={q.motif} data-motif={q.motif}>
            {SHORE_DRAW[q.motif]?.({ p, band, level, x: 0, w: WIDTH, id })}
          </g>
        ))}
      {ground.map((q) => (
        <g key={q.motif} data-motif={q.motif}>
          {GROUND_DRAW[q.motif]?.(ctx(q.slot))}
        </g>
      ))}
    </svg>
  );
}

/* ---- sky ------------------------------------------------------------------------ */

function Sun({ p, band, level, id }: { p: Palette; band: Band; level: number; id: string }) {
  if (band === "ascent") {
    return (
      <g>
        <circle cx="318" cy="64" r={70 + 20 * level} fill={`url(#${id}-glow)`} />
        {level > 0.35 &&
          [-38, -18, 2, 22, 42].map((a) => (
            <polygon key={a} points={`318,64 ${318 + Math.cos(((a + 90) * Math.PI) / 180) * 240},${64 + Math.sin(((a + 90) * Math.PI) / 180) * 240} ${318 + Math.cos(((a + 96) * Math.PI) / 180) * 240},${64 + Math.sin(((a + 96) * Math.PI) / 180) * 240}`} fill={p.sun} opacity={0.06 + 0.05 * level} />
          ))}
        <circle cx="318" cy="64" r="22" fill={p.sun} />
      </g>
    );
  }
  if (band === "muddle") {
    return (
      <g>
        <circle cx="300" cy="60" r="44" fill={`url(#${id}-glow)`} />
        <circle cx="300" cy="60" r="15" fill={p.sun} opacity="0.55" />
      </g>
    );
  }
  return (
    <g>
      <circle cx="74" cy="150" r={64 + 30 * level} fill={`url(#${id}-glow)`} />
      <circle cx="74" cy="150" r="21" fill={p.sun} />
    </g>
  );
}

function Weather({ p, band, level }: { p: Palette; band: Band; level: number }) {
  if (band === "muddle") {
    return (
      <g fill="#ece8dc" opacity="0.32">
        <rect x="-20" y="34" width="210" height="16" rx="8" />
        <rect x="150" y="58" width="280" height="14" rx="7" />
        <rect x="30" y="86" width="240" height="12" rx="6" />
        <rect x="250" y="104" width="190" height="10" rx="5" />
      </g>
    );
  }
  if (band === "decay") {
    const stars = [[40, 22], [96, 12], [150, 30], [210, 16], [262, 26], [330, 14], [372, 34], [182, 52]];
    return (
      <g>
        {stars.slice(0, 8 - Math.round(4 * level)).map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="#f6d6c8" opacity="0.5" />
        ))}
        <ellipse cx="220" cy="118" rx="260" ry="26" fill={p.haze} opacity={0.35 + 0.25 * level} />
        <ellipse cx="120" cy="86" rx="200" ry="14" fill={p.haze} opacity={0.2 + 0.2 * level} />
      </g>
    );
  }
  return null;
}

function Hills({ p, seed }: { p: Palette; seed: number }) {
  // A fixed ridge nudged by the run, so the horizon is not identical every time.
  const ys = [150, 138, 146, 128, 140, 124, 136, 132, 146].map((y, i) => y + ((seed * (i + 3)) % 9) - 4);
  const step = WIDTH / (ys.length - 1);
  const d = ys.map((y, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y}`).join(" ");
  return <path d={`${d} L${WIDTH},${GROUND} L0,${GROUND} Z`} fill={p.far} opacity="0.55" />;
}

function SkylineBuilding({ b, p, flag }: { b: World["buildings"][number]; p: Palette; flag: "left" | "right" | null }) {
  const top = GROUND - b.h;
  const body = b.broken ? (
    <polygon
      points={`${b.x},${GROUND} ${b.x},${top + 4} ${b.x + b.w * 0.3},${top} ${b.x + b.w * 0.42},${top + b.h * 0.22} ${b.x + b.w * 0.58},${top + b.h * 0.12} ${b.x + b.w * 0.72},${top + b.h * 0.34} ${b.x + b.w},${top + b.h * 0.18} ${b.x + b.w},${GROUND}`}
      fill={p.far}
    />
  ) : (
    <rect x={b.x} y={top} width={b.w} height={b.h} fill={p.far} />
  );
  const windows: ReactNode[] = [];
  for (const i of b.lit) {
    const cx = b.x + 3 + (i % b.cols) * 5;
    const cy = top + 6 + Math.floor(i / b.cols) * 7;
    // A broken building has no windows left in the part that is missing.
    if (b.broken && cy < top + b.h * 0.36) continue;
    windows.push(<rect key={i} x={cx} y={cy} width="2" height="3" fill={p.window} opacity="0.8" />);
  }
  return (
    <g>
      {body}
      {windows}
      {b.spire && (
        <g>
          <polygon points={`${b.x + b.w / 2 - 3},${top} ${b.x + b.w / 2},${top - 14 - b.w / 2} ${b.x + b.w / 2 + 3},${top}`} fill={p.far} />
          <circle cx={b.x + b.w / 2} cy={top - 14 - b.w / 2} r="1.4" fill={p.accent} />
        </g>
      )}
      {flag && (
        <g>
          <line x1={b.x + 3} y1={top} x2={b.x + 3} y2={top - 12} stroke={p.far} strokeWidth="1" />
          {/* The Commons fly pennants and the Ledger square flags: the same shape the card
              takes for each side during the run (BACKLOG-3 phase 23). */}
          {flag === "left" ? (
            <polygon points={`${b.x + 3},${top - 12} ${b.x + 12},${top - 9.5} ${b.x + 3},${top - 7}`} fill={p.accent} />
          ) : (
            <rect x={b.x + 3} y={top - 12} width="8" height="5" fill={p.accent} />
          )}
        </g>
      )}
    </g>
  );
}

function Water({ p, dry }: { p: Palette; dry: boolean }) {
  if (dry) return <rect x="0" y={GROUND + 10} width={WIDTH} height={HEIGHT - GROUND} fill="#5d4631" />;
  return (
    <g>
      <rect x="0" y={GROUND + 10} width={WIDTH} height={HEIGHT - GROUND} fill={p.water} />
      <g stroke={p.waterHi} strokeWidth="1" opacity="0.5" strokeLinecap="round">
        <line x1="30" y1="224" x2="62" y2="224" />
        <line x1="140" y1="231" x2="186" y2="231" />
        <line x1="250" y1="222" x2="274" y2="222" />
        <line x1="322" y1="233" x2="366" y2="233" />
      </g>
    </g>
  );
}

function Smoke({ p, level, buildings }: { p: Palette; level: number; buildings: World["buildings"] }) {
  const chimneys = buildings.filter((b) => b.broken).slice(0, 2 + Math.round(2 * level));
  return (
    <g fill={p.haze}>
      {chimneys.map((b, i) => {
        const x = b.x + b.w / 2;
        const y = GROUND - b.h * 0.8;
        return (
          <g key={i} opacity={0.5 + 0.2 * level}>
            <circle cx={x} cy={y - 6} r="4" />
            <circle cx={x + 4} cy={y - 16} r="6" />
            <circle cx={x + 10} cy={y - 29} r="8" opacity="0.8" />
            <circle cx={x + 18} cy={y - 44} r="10" opacity="0.55" />
          </g>
        );
      })}
    </g>
  );
}

/* ---- landmarks: sky --------------------------------------------------------------- */

export const SKY_DRAW: Partial<Record<Motif, (c: Ctx) => ReactNode>> = {
  ring: ({ p, band }) => {
    // Finished on the way up, three-quarters built in the middle, half abandoned on the way down.
    const dash = band === "ascent" ? undefined : band === "muddle" ? "900 300" : "520 700";
    return (
      <g fill="none" strokeLinecap="round">
        <ellipse cx="200" cy="58" rx="196" ry="20" stroke={p.far} strokeWidth="5" opacity="0.9" strokeDasharray={dash} />
        <ellipse cx="200" cy="58" rx="196" ry="20" stroke={p.accent} strokeWidth="1.2" opacity={band === "decay" ? 0.35 : 0.8} strokeDasharray={dash} />
      </g>
    );
  },
  station: ({ p, band }) => (
    <g transform={`translate(236 30) rotate(${band === "decay" ? 24 : 0})`}>
      <rect x="-24" y="-3" width="18" height="6" fill={p.far} />
      <rect x="6" y="-3" width="18" height="6" fill={p.far} />
      <line x1="-6" y1="0" x2="6" y2="0" stroke={p.far} strokeWidth="2" />
      <rect x="-4" y="-5" width="8" height="10" rx="2" fill={p.near} />
      {band !== "decay" && <circle cx="0" cy="0" r="1.3" fill={p.accent} />}
    </g>
  ),
  ship: ({ p, band, id }) => (
    <g opacity={band === "decay" ? 0.55 : 1}>
      <polygon points="58,24 170,78 164,84 54,30" fill={`url(#${id}-tail)`} />
      <circle cx="56" cy="27" r="3.2" fill={p.sun} />
    </g>
  ),
};

/* ---- landmarks: the shore ---------------------------------------------------------- */

export const SHORE_DRAW: Partial<Record<Motif, (c: Ctx) => ReactNode>> = {
  seawall: ({ p, band }) => (
    <g>
      {/* The sea stands higher than the land it is kept off. */}
      <rect x="0" y={GROUND + 6} width={WIDTH} height="6" fill={p.water} />
      <rect x="0" y={GROUND - 5} width={WIDTH} height="12" fill={p.near} />
      <line x1="0" y1={GROUND - 5} x2={WIDTH} y2={GROUND - 5} stroke={p.accent} strokeWidth="1" opacity="0.6" />
      {[40, 110, 180, 250, 320, 390].map((x) => (
        <line key={x} x1={x} y1={GROUND - 5} x2={x} y2={GROUND + 7} stroke={p.far} strokeWidth="0.8" />
      ))}
      {band === "decay" && <polygon points={`276,${GROUND - 5} 290,${GROUND - 5} 296,${GROUND + 7} 268,${GROUND + 7}`} fill={p.water} opacity="0.9" />}
    </g>
  ),
  bridge: ({ p, band }) => {
    // Across the bay, in front of the city: on the shore line it ran through every landmark.
    const deck = GROUND + 14;
    return (
      <g>
        {band === "ascent" && (
          // The fallen one is still there. The new one stands behind it.
          <g opacity="0.9">
            <rect x="10" y={deck - 12} width="190" height="3" fill={p.accent} />
            <line x1="104" y1={deck - 46} x2="104" y2={deck - 9} stroke={p.accent} strokeWidth="2" />
            {[20, 50, 80, 128, 158, 188].map((x) => (
              <line key={x} x1="104" y1={deck - 44} x2={x} y2={deck - 11} stroke={p.accent} strokeWidth="0.6" />
            ))}
          </g>
        )}
        <rect x="8" y={deck} width="80" height="4" fill={p.near} />
        <rect x="126" y={deck} width="80" height="4" fill={p.near} />
        {/* A lit edge on the deck, or on a dark night it disappears into the water. */}
        <line x1="8" y1={deck} x2="88" y2={deck} stroke={p.accent} strokeWidth="0.8" opacity="0.55" />
        <line x1="126" y1={deck} x2="206" y2={deck} stroke={p.accent} strokeWidth="0.8" opacity="0.55" />
        <polygon points={`88,${deck} 98,${deck + 2} 96,${deck + 16} 90,${deck + 14}`} fill={p.near} />
        {[20, 60, 146, 188].map((x) => (
          <rect key={x} x={x} y={deck + 4} width="4" height={HEIGHT - deck} fill={p.near} />
        ))}
      </g>
    );
  },
  dryBay: ({ p }) => (
    <g>
      <g stroke="#3a2a1d" strokeWidth="0.8" fill="none">
        <path d="M20 222 l14 4 l10 -3 l16 6" />
        <path d="M120 230 l18 -3 l12 5 l20 -2" />
        <path d="M240 224 l10 5 l22 -1 l8 4" />
        <path d="M320 232 l16 -4 l14 3" />
      </g>
      {/* A boat left on the mud where the water was. It sits in the bay rather than on the
          shore, because on the shore it stood on whatever landmark was already there. */}
      <g transform="rotate(-8 300 226)">
        <path d="M278 222 L324 222 L316 232 L286 232 Z" fill={p.near} />
        <rect x="298" y="206" width="2" height="16" fill={p.near} />
        <polygon points="300,207 312,219 300,219" fill={p.far} />
      </g>
    </g>
  ),
  // The ships have the water to themselves (BACKLOG-10 phase 64): each sits in the bay, right of
  // the bridge's span, and a dry bay has none.
  warships: ({ p, band }) => (
    <g>
      {(
        [
          [226, 60],
          [306, 52],
        ] as const
      ).map(([x0, L]) => {
        const wy = 226 + (x0 === 226 ? 0 : 5);
        return (
          <g key={x0}>
            {/* Heading out, a wake behind and smoke trailing back. */}
            <line x1={x0 - 14} y1={wy + 1} x2={x0 - 2} y2={wy + 1} stroke={p.waterHi} strokeWidth="1" opacity="0.6" />
            <polygon points={`${x0},${wy - 5} ${x0 + L + 4},${wy - 5} ${x0 + L - 3},${wy + 2} ${x0 + 3},${wy + 2}`} fill={p.near} />
            <rect x={x0 + L * 0.3} y={wy - 12} width={L * 0.3} height="7" fill={p.near} />
            <rect x={x0 + L * 0.38} y={wy - 16} width={L * 0.14} height="4" fill={p.near} />
            <line x1={x0 + L * 0.45} y1={wy - 16} x2={x0 + L * 0.45} y2={wy - 24} stroke={p.near} strokeWidth="1" />
            <rect x={x0 + L * 0.2} y={wy - 14} width="4" height="9" fill={p.near} />
            <rect x={x0 + L * 0.7} y={wy - 8} width="5" height="3" fill={p.near} />
            <line x1={x0 + L * 0.7 + 5} y1={wy - 7} x2={x0 + L * 0.7 + 13} y2={wy - 8} stroke={p.near} strokeWidth="1.2" />
            <g fill={p.haze} opacity={band === "decay" ? 0.8 : 0.55}>
              <circle cx={x0 + L * 0.2} cy={wy - 18} r="2.5" />
              <circle cx={x0 + L * 0.2 - 5} cy={wy - 21} r="3.2" />
              <circle cx={x0 + L * 0.2 - 11} cy={wy - 22} r="3.6" />
            </g>
          </g>
        );
      })}
    </g>
  ),
  freighters: ({ p }) => (
    <g>
      {/* At anchor, loaded, the chain down into the water: trade went on. */}
      {(
        [
          [228, 64],
          [312, 54],
        ] as const
      ).map(([x0, L], k) => {
        const wy = 227 + k * 5;
        const boxes = Math.floor((L * 0.6) / 7);
        return (
          <g key={x0}>
            <polygon points={`${x0},${wy - 5} ${x0 + L},${wy - 5} ${x0 + L - 4},${wy + 2} ${x0 + 2},${wy + 2}`} fill={p.near} />
            <rect x={x0 + 2} y={wy - 14} width="8" height="9" fill={p.near} />
            <rect x={x0 + 3} y={wy - 12} width="6" height="2" fill={p.window} opacity="0.8" />
            {Array.from({ length: boxes }, (_, i) => (
              <rect key={i} x={x0 + 13 + i * 7} y={wy - 10 - (i % 2) * 4} width="6" height={5 + (i % 2) * 4} fill={i % 3 === 0 ? p.accent : p.far} />
            ))}
            <line x1={x0 + L - 6} y1={wy - 2} x2={x0 + L + 2} y2={wy + 9} stroke={p.near} strokeWidth="0.8" />
          </g>
        );
      })}
    </g>
  ),
  yachts: ({ p }) => (
    <g>
      {/* A motor yacht three decks high, and a sailing one beside it. */}
      <polygon points="232,224 300,224 292,231 236,231" fill={p.near} />
      <polygon points="244,224 244,218 282,218 290,224" fill={p.near} />
      <polygon points="252,218 252,213 276,213 282,218" fill={p.near} />
      <rect x="256" y="219.5" width="24" height="1.8" fill={p.window} opacity="0.85" />
      <line x1="236" y1="224" x2="300" y2="224" stroke={p.accent} strokeWidth="1" opacity="0.7" />
      <polygon points="318,229 356,229 351,235 322,235" fill={p.near} />
      <line x1="336" y1="229" x2="336" y2="196" stroke={p.near} strokeWidth="1.2" />
      <polygon points="337,198 352,227 337,227" fill={p.far} />
      <polygon points="335,202 323,227 335,227" fill={p.far} opacity="0.8" />
    </g>
  ),
  levee: ({ p, band }) => (
    <g>
      {/* An earth bank the length of the shore, sloped rather than walled, and a sluice. */}
      <polygon points={`0,${GROUND + 8} 0,${GROUND - 3} ${WIDTH},${GROUND - 3} ${WIDTH},${GROUND + 8}`} fill={p.far} />
      <polygon points={`0,${GROUND - 3} ${WIDTH},${GROUND - 3} ${WIDTH},${GROUND - 6} 0,${GROUND - 6}`} fill={p.near} />
      <rect x="186" y={GROUND - 12} width="28" height="20" fill={p.near} />
      {[190, 197, 204].map((x) => (
        <rect key={x} x={x} y={GROUND - 9} width="4" height="14" fill={p.far} />
      ))}
      <line x1="186" y1={GROUND - 12} x2="214" y2={GROUND - 12} stroke={p.accent} strokeWidth="1" opacity="0.6" />
      {band === "decay" && <polygon points={`96,${GROUND - 6} 108,${GROUND - 6} 112,${GROUND + 8} 90,${GROUND + 8}`} fill={p.water} opacity="0.85" />}
    </g>
  ),
};

/* ---- landmarks: the ground --------------------------------------------------------- */

export const GROUND_DRAW: Partial<Record<Motif, (c: Ctx) => ReactNode>> = {
  statue: ({ p, x, w }) => {
    // The raised arm reaches further right than the pedestal does left, so the figure is
    // centred on the slot by its whole width rather than by its pedestal.
    const cx = x + w / 2 - 2.5;
    return (
      <g fill={p.near}>
        <rect x={cx - 14} y={GROUND - 20} width="28" height="20" />
        <rect x={cx - 17} y={GROUND - 23} width="34" height="4" />
        <rect x={cx - 6} y={GROUND - 58} width="5" height="36" />
        <rect x={cx + 1} y={GROUND - 58} width="5" height="36" />
        <polygon points={`${cx - 10},${GROUND - 56} ${cx + 10},${GROUND - 56} ${cx + 7},${GROUND - 92} ${cx - 7},${GROUND - 92}`} />
        <polygon points={`${cx + 6},${GROUND - 90} ${cx + 10},${GROUND - 88} ${cx + 22},${GROUND - 120} ${cx + 18},${GROUND - 122}`} />
        <circle cx={cx} cy={GROUND - 99} r="7" />
      </g>
    );
  },
  palace: ({ p, x }) => (
    <g>
      <rect x={x + 2} y={GROUND - 30} width="56" height="30" fill={p.near} />
      <path d={`M${x + 18} ${GROUND - 30} a12 12 0 0 1 24 0 Z`} fill={p.near} />
      <path d={`M${x + 4} ${GROUND - 30} a6 6 0 0 1 12 0 Z M${x + 44} ${GROUND - 30} a6 6 0 0 1 12 0 Z`} fill={p.near} />
      <line x1={x + 30} y1={GROUND - 42} x2={x + 30} y2={GROUND - 54} stroke={p.near} strokeWidth="1" />
      <polygon points={`${x + 30},${GROUND - 54} ${x + 39},${GROUND - 51} ${x + 30},${GROUND - 48}`} fill={p.accent} />
      {[8, 18, 28, 38, 48].map((dx) => (
        <rect key={dx} x={x + dx} y={GROUND - 22} width="3" height="6" fill={p.window} opacity="0.85" />
      ))}
    </g>
  ),
  forum: ({ p, x }) => (
    <g fill={p.near}>
      <polygon points={`${x + 6},${GROUND - 34} ${x + 30},${GROUND - 46} ${x + 54},${GROUND - 34}`} />
      <rect x={x + 6} y={GROUND - 34} width="48" height="3" />
      {[9, 18, 27, 36, 45].map((dx) => (
        <rect key={dx} x={x + dx} y={GROUND - 31} width="4" height="22" />
      ))}
      <rect x={x + 2} y={GROUND - 9} width="56" height="3" />
      <rect x={x} y={GROUND - 6} width="60" height="6" />
    </g>
  ),
  watchtower: ({ p, x, band }) => (
    <g>
      {[x + 6, x + 38].map((tx) => (
        <g key={tx} fill={p.near}>
          <rect x={tx} y={GROUND - 44} width="2" height="44" />
          <rect x={tx + 6} y={GROUND - 44} width="2" height="44" />
          <rect x={tx - 3} y={GROUND - 54} width="14" height="10" />
          <rect x={tx - 1} y={GROUND - 51} width="10" height="3" fill={p.window} opacity="0.7" />
        </g>
      ))}
      <line x1={x} y1={GROUND - 12} x2={x + 50} y2={GROUND - 12} stroke={p.near} strokeWidth="1" />
      <polyline points={`${x},${GROUND - 14} ${x + 5},${GROUND - 18} ${x + 10},${GROUND - 14} ${x + 15},${GROUND - 18} ${x + 20},${GROUND - 14} ${x + 25},${GROUND - 18} ${x + 30},${GROUND - 14} ${x + 35},${GROUND - 18} ${x + 40},${GROUND - 14} ${x + 45},${GROUND - 18} ${x + 50},${GROUND - 14}`} fill="none" stroke={p.near} strokeWidth="0.8" />
      {band !== "ascent" && <polygon points={`${x + 10},${GROUND - 50} ${x - 40},${GROUND - 140} ${x - 10},${GROUND - 150}`} fill={p.window} opacity="0.12" />}
    </g>
  ),
  tanks: ({ p, x, w, band }) => {
    // Two tanks, each 25 wide with its gun, closed up to fit the narrow slots.
    const gap = Math.min(24, w - 25);
    const tx0 = x + (w - gap - 25) / 2;
    return (
      <g fill={p.near}>
        {[tx0, tx0 + gap].map((tx) => (
          <g key={tx}>
            <rect x={tx} y={GROUND - 9} width="22" height="7" rx="3" />
            <rect x={tx + 5} y={GROUND - 15} width="11" height="6" rx="2" />
            <rect x={tx + 15} y={GROUND - 13} width="10" height="2" />
          </g>
        ))}
        {band !== "ascent" && <polygon points={`${x + 14},${GROUND - 16} ${x + 60},${GROUND - 150} ${x + 90},${GROUND - 140}`} fill={p.window} opacity="0.1" />}
      </g>
    );
  },
  barricade: ({ p, x }) => (
    <g stroke={p.near} strokeWidth="2.2" strokeLinecap="round">
      {[4, 16, 28, 40].map((dx) => (
        <g key={dx}>
          <line x1={x + dx} y1={GROUND} x2={x + dx + 9} y2={GROUND - 12} />
          <line x1={x + dx + 9} y1={GROUND} x2={x + dx} y2={GROUND - 12} />
        </g>
      ))}
    </g>
  ),
  housing: ({ p, x, band }) => (
    <g>
      {[0, 26, 52].map((dx, i) => {
        const h = [46, 54, 46][i]!;
        return (
          <g key={dx}>
            <rect x={x + dx} y={GROUND - h} width="22" height={h} fill={p.near} />
            {Array.from({ length: Math.floor((h - 6) / 7) * 3 }, (_, k) => (
              <rect key={k} x={x + dx + 3 + (k % 3) * 6} y={GROUND - h + 4 + Math.floor(k / 3) * 7} width="3" height="3" fill={p.window} opacity={band === "decay" && k % 3 !== 1 ? 0.2 : 0.85} />
            ))}
          </g>
        );
      })}
    </g>
  ),
  school: ({ p, x }) => (
    <g>
      <rect x={x + 8} y={GROUND - 28} width="56" height="28" fill={p.near} />
      <rect x={x + 30} y={GROUND - 42} width="12" height="14" fill={p.near} />
      <polygon points={`${x + 28},${GROUND - 42} ${x + 36},${GROUND - 50} ${x + 44},${GROUND - 42}`} fill={p.near} />
      <circle cx={x + 36} cy={GROUND - 36} r="2.5" fill={p.accent} opacity="0.7" />
      {[12, 24, 46, 56].map((dx) => (
        <g key={dx} stroke={p.far} strokeWidth="1">
          <rect x={x + dx} y={GROUND - 22} width="7" height="9" fill={p.far} opacity="0.5" />
          <line x1={x + dx} y1={GROUND - 22} x2={x + dx + 7} y2={GROUND - 13} />
          <line x1={x + dx + 7} y1={GROUND - 22} x2={x + dx} y2={GROUND - 13} />
        </g>
      ))}
    </g>
  ),
  shuttered: ({ p, x }) => (
    <g fill={p.near}>
      <polygon points={`${x + 6},${GROUND - 30} ${x + 25},${GROUND - 40} ${x + 44},${GROUND - 30}`} />
      {[8, 17, 29, 38].map((dx) => (
        <rect key={dx} x={x + dx} y={GROUND - 30} width="4" height="26" />
      ))}
      <rect x={x + 4} y={GROUND - 4} width="42" height="4" />
      <g stroke={p.far} strokeWidth="0.8">
        {[0, 3, 6, 9, 12, 15].map((dy) => (
          <line key={dy} x1={x + 21} y1={GROUND - 22 + dy} x2={x + 29} y2={GROUND - 22 + dy} />
        ))}
      </g>
    </g>
  ),
  emptyLot: ({ p, x }) => (
    <g>
      <g stroke={p.near} strokeWidth="1">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={x + 4 + i * 6} y1={GROUND} x2={x + 4 + i * 6} y2={GROUND - 9} />
        ))}
        <line x1={x + 4} y1={GROUND - 7} x2={x + 70} y2={GROUND - 7} />
      </g>
      <rect x={x + 22} y={GROUND - 36} width="3" height="27" fill={p.near} />
      <rect x={x + 46} y={GROUND - 36} width="3" height="27" fill={p.near} />
      <rect x={x + 16} y={GROUND - 48} width="40" height="16" fill={p.near} />
      <polygon points={`${x + 28},${GROUND - 38} ${x + 36},${GROUND - 45} ${x + 44},${GROUND - 38}`} fill={p.accent} opacity="0.7" />
      <line x1={x + 26} y1={GROUND - 46} x2={x + 46} y2={GROUND - 34} stroke={p.accent} strokeWidth="1.4" opacity="0.8" />
    </g>
  ),
  broadcast: ({ p, x: slotX, w, band }) => {
    const x = slotX + (w - 42) / 2 - 10;
    return (
      <g>
        <polygon points={`${x + 18},${GROUND} ${x + 24},${GROUND - 86} ${x + 30},${GROUND}`} fill="none" stroke={p.near} strokeWidth="2" />
        {[16, 32, 48, 64].map((dy) => (
          <line key={dy} x1={x + 19 + dy / 16} y1={GROUND - dy} x2={x + 29 - dy / 16} y2={GROUND - dy} stroke={p.near} strokeWidth="1" />
        ))}
        <circle cx={x + 24} cy={GROUND - 88} r="2" fill={p.accent} />
        <g fill="none" stroke={p.accent} strokeWidth="1" opacity="0.6">
          <path d={`M${x + 15} ${GROUND - 96} a12 12 0 0 1 18 0`} />
          <path d={`M${x + 10} ${GROUND - 102} a18 18 0 0 1 28 0`} />
        </g>
        <rect x={x + 30} y={GROUND - 34} width="22" height="34" fill={p.near} />
        <rect x={x + 32} y={GROUND - 31} width="18" height="13" fill={band === "decay" ? p.window : p.far} opacity="0.9" />
        <ellipse cx={x + 41} cy={GROUND - 24.5} rx="6" ry="3.2" fill={p.near} />
        <circle cx={x + 41} cy={GROUND - 24.5} r="1.8" fill={p.accent} />
      </g>
    );
  },
  goldTower: ({ p, x }) => (
    <g>
      <rect x={x + 16} y={GROUND - 96} width="18" height="96" fill={p.near} />
      <polygon points={`${x + 14},${GROUND - 96} ${x + 25},${GROUND - 112} ${x + 36},${GROUND - 96}`} fill={p.accent} />
      <rect x={x + 14} y={GROUND - 98} width="22" height="3" fill={p.accent} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
        <rect key={k} x={x + 19 + (k % 2) * 8} y={GROUND - 88 + Math.floor(k / 2) * 18} width="4" height="5" fill={p.accent} opacity="0.8" />
      ))}
    </g>
  ),
  bunker: ({ p, x, w }) => {
    const dome = Math.min(52, w);
    const cx = x + w / 2;
    return (
      <g>
        <path d={`M${cx - dome / 2} ${GROUND} a${dome / 2} 20 0 0 1 ${dome} 0 Z`} fill={p.near} />
        <circle cx={cx} cy={GROUND - 8} r="8" fill={p.far} />
        <circle cx={cx} cy={GROUND - 8} r="8" fill="none" stroke={p.accent} strokeWidth="1" opacity="0.7" />
        <g stroke={p.accent} strokeWidth="0.8" opacity="0.7">
          <line x1={cx} y1={GROUND - 15} x2={cx} y2={GROUND - 1} />
          <line x1={cx - 7} y1={GROUND - 8} x2={cx + 7} y2={GROUND - 8} />
        </g>
      </g>
    );
  },
  mansion: ({ p, x: slotX, w }) => {
    // Drawn about x + 25; the hedge used to be 62 wide in a 50-wide slot and ran into the
    // broadcast screen next door.
    const x = slotX + w / 2 - 25;
    const hedge = Math.min(62, w);
    return (
      <g>
        <path d={`M${x + 25 - hedge / 2} ${GROUND} a${hedge / 2} 22 0 0 1 ${hedge} 0 Z`} fill={p.far} />
        <rect x={x + 10} y={GROUND - 36} width="30" height="16" fill={p.near} />
        <polygon points={`${x + 8},${GROUND - 36} ${x + 25},${GROUND - 46} ${x + 42},${GROUND - 36}`} fill={p.near} />
        {[14, 22, 30].map((dx) => (
          <rect key={dx} x={x + dx} y={GROUND - 32} width="4" height="6" fill={p.window} opacity="0.85" />
        ))}
        <rect x={x + 6} y={GROUND - 14} width="4" height="14" fill={p.near} />
        <rect x={x + 40} y={GROUND - 14} width="4" height="14" fill={p.near} />
        <g stroke={p.near} strokeWidth="1">
          {[14, 18, 22, 26, 30, 34, 38].map((dx) => (
            <line key={dx} x1={x + dx} y1={GROUND - 10} x2={x + dx} y2={GROUND} />
          ))}
        </g>
      </g>
    );
  },
  rocket: ({ p, x, band }) => {
    const lean = band === "decay" ? -8 : 0;
    const up = band === "ascent" ? 12 : 0;
    return (
      <g>
        <g stroke={p.near} strokeWidth="1.2">
          <line x1={x + 8} y1={GROUND} x2={x + 8} y2={GROUND - 78} />
          {[12, 28, 44, 60, 76].map((dy) => (
            <line key={dy} x1={x + 8} y1={GROUND - dy} x2={x + 18} y2={GROUND - dy + 6} />
          ))}
        </g>
        <g transform={`rotate(${lean} ${x + 30} ${GROUND}) translate(0 ${-up})`}>
          <rect x={x + 24} y={GROUND - 72} width="12" height="62" fill={p.near} />
          <polygon points={`${x + 24},${GROUND - 72} ${x + 30},${GROUND - 88} ${x + 36},${GROUND - 72}`} fill={p.near} />
          <polygon points={`${x + 24},${GROUND - 20} ${x + 17},${GROUND - 8} ${x + 24},${GROUND - 12}`} fill={p.near} />
          <polygon points={`${x + 36},${GROUND - 20} ${x + 43},${GROUND - 8} ${x + 36},${GROUND - 12}`} fill={p.near} />
          <circle cx={x + 30} cy={GROUND - 54} r="2.2" fill={p.accent} opacity="0.85" />
          {band === "ascent" && <polygon points={`${x + 25},${GROUND - 10} ${x + 30},${GROUND + 8} ${x + 35},${GROUND - 10}`} fill={p.sun} />}
        </g>
      </g>
    );
  },
  oracle: ({ p, x }) => (
    <g>
      <polygon points={`${x + 27},${GROUND - 94} ${x + 10},0 ${x + 50},0 ${x + 33},${GROUND - 94}`} fill={p.accent} opacity="0.12" />
      <rect x={x + 26} y={GROUND - 90} width="8" height="90" fill={p.near} />
      <rect x={x + 20} y={GROUND - 20} width="20" height="20" fill={p.near} />
      <circle cx={x + 30} cy={GROUND - 94} r="6" fill={p.accent} />
      <circle cx={x + 30} cy={GROUND - 94} r="11" fill={p.accent} opacity="0.2" />
    </g>
  ),
  commission: ({ p, x }) => (
    <g>
      <rect x={x + 4} y={GROUND - 30} width="52" height="30" fill={p.near} />
      <polygon points={`${x + 2},${GROUND - 30} ${x + 30},${GROUND - 42} ${x + 58},${GROUND - 30}`} fill={p.near} />
      <circle cx={x + 30} cy={GROUND - 34} r="3.2" fill={p.far} />
      {[10, 20, 36, 46].map((dx, i) => (
        <rect key={dx} x={x + dx} y={GROUND - 22} width="5" height="8" fill={i === 2 ? p.window : p.far} opacity={i === 2 ? 1 : 0.6} />
      ))}
    </g>
  ),
  posters: ({ p, x }) => (
    <g>
      {/* A hoarding of old campaign faces, one of them torn. */}
      <rect x={x + 2} y={GROUND - 30} width="46" height="24" fill={p.near} />
      <rect x={x + 6} y={GROUND - 6} width="3" height="6" fill={p.near} />
      <rect x={x + 41} y={GROUND - 6} width="3" height="6" fill={p.near} />
      {[5, 19, 33].map((dx, i) => (
        <g key={dx}>
          <rect x={x + dx} y={GROUND - 27} width="12" height="18" fill={p.far} />
          <circle cx={x + dx + 6} cy={GROUND - 21} r="3" fill={p.near} />
          <rect x={x + dx + 2} y={GROUND - 15} width="8" height="2" fill={p.accent} opacity="0.85" />
          {i === 1 && <polygon points={`${x + dx + 12},${GROUND - 27} ${x + dx + 12},${GROUND - 16} ${x + dx + 3},${GROUND - 27}`} fill={p.near} />}
        </g>
      ))}
    </g>
  ),
  banner: ({ p, x }) => (
    <g>
      {/* A promise on a banner between two poles, torn through the middle. */}
      <rect x={x + 3} y={GROUND - 40} width="2.5" height="40" fill={p.near} />
      <rect x={x + 42} y={GROUND - 40} width="2.5" height="40" fill={p.near} />
      <path d={`M${x + 5} ${GROUND - 38} Q${x + 14} ${GROUND - 31} ${x + 21} ${GROUND - 35} L${x + 21} ${GROUND - 23} Q${x + 13} ${GROUND - 18} ${x + 5} ${GROUND - 26} Z`} fill={p.accent} opacity="0.75" />
      <path d={`M${x + 26} ${GROUND - 33} Q${x + 34} ${GROUND - 29} ${x + 42} ${GROUND - 38} L${x + 42} ${GROUND - 26} Q${x + 33} ${GROUND - 19} ${x + 26} ${GROUND - 22} Z`} fill={p.accent} opacity="0.55" />
    </g>
  ),
  // BACKLOG-10 phase 64: the answers to the questions and the stories' biggest outcomes. Each is
  // drawn to a width and centred in whatever place it is given, so it stands in any of them.
  fence: ({ p, x, w, band }) => {
    const x0 = x + (w - 48) / 2;
    return (
      <g>
        {band !== "ascent" && <polygon points={`${x0 + 7},${GROUND - 46} ${x0 + 30},${GROUND} ${x0 + 48},${GROUND}`} fill={p.window} opacity="0.14" />}
        <rect x={x0 + 5} y={GROUND - 48} width="2" height="48" fill={p.near} />
        <rect x={x0 + 2} y={GROUND - 50} width="9" height="4" fill={p.near} />
        <rect x={x0 + 3} y={GROUND - 47} width="7" height="1.4" fill={p.window} opacity="0.9" />
        <g stroke={p.near} strokeWidth="0.7" opacity="0.85">
          {Array.from({ length: 10 }, (_, i) => (
            <line key={i} x1={x0 + 12 + i * 3.6} y1={GROUND} x2={x0 + 12 + i * 3.6 + 6} y2={GROUND - 20} />
          ))}
        </g>
        <rect x={x0 + 11} y={GROUND - 21} width="37" height="1.4" fill={p.near} />
        <polyline points={`${x0 + 11},${GROUND - 23} ${x0 + 14},${GROUND - 26} ${x0 + 17},${GROUND - 23} ${x0 + 20},${GROUND - 26} ${x0 + 23},${GROUND - 23} ${x0 + 26},${GROUND - 26} ${x0 + 29},${GROUND - 23} ${x0 + 32},${GROUND - 26} ${x0 + 35},${GROUND - 23} ${x0 + 38},${GROUND - 26} ${x0 + 41},${GROUND - 23} ${x0 + 44},${GROUND - 26} ${x0 + 47},${GROUND - 23}`} fill="none" stroke={p.near} strokeWidth="0.8" />
        {[11, 29, 47].map((dx) => (
          <rect key={dx} x={x0 + dx - 0.5} y={GROUND - 22} width="2" height="22" fill={p.near} />
        ))}
        {/* A bus leaving, its windows dark. */}
        <rect x={x0 + 18} y={GROUND - 14} width="28" height="11" rx="2" fill={p.near} />
        {[21, 27, 33, 39].map((dx) => (
          <rect key={dx} x={x0 + dx} y={GROUND - 12} width="4" height="4" fill={p.far} />
        ))}
        <circle cx={x0 + 23} cy={GROUND - 2.5} r="2.5" fill={p.near} />
        <circle cx={x0 + 41} cy={GROUND - 2.5} r="2.5" fill={p.near} />
      </g>
    );
  },
  doorway: ({ p, x, w }) => {
    const x0 = x + (w - 46) / 2;
    return (
      <g>
        {/* An office open late, its door lit, and the queue for it. */}
        <rect x={x0 + 1} y={GROUND - 36} width="30" height="36" fill={p.near} />
        <rect x={x0 - 1} y={GROUND - 38} width="34" height="3" fill={p.near} />
        {[5, 13, 21].map((dx) =>
          [30, 21].map((dy) => <rect key={`${dx}-${dy}`} x={x0 + dx} y={GROUND - dy} width="4" height="5" fill={p.window} opacity="0.85" />),
        )}
        <rect x={x0 + 12} y={GROUND - 12} width="8" height="12" fill={p.window} />
        <polygon points={`${x0 + 20},${GROUND} ${x0 + 34},${GROUND} ${x0 + 20},${GROUND - 12}`} fill={p.window} opacity="0.25" />
        {[24, 29, 34, 39, 43].map((dx, i) => (
          <g key={dx} fill={p.near}>
            <circle cx={x0 + dx + 1.5} cy={GROUND - 9.5 + (i % 2) * 0.6} r="1.6" />
            <rect x={x0 + dx} y={GROUND - 7.6 + (i % 2) * 0.6} width="3" height={7.6 - (i % 2) * 0.6} rx="1" />
          </g>
        ))}
      </g>
    );
  },
  limousines: ({ p, x, w }) => {
    const x0 = x + (w - 46) / 2;
    return (
      <g>
        {/* The revenue office, and a long car waiting at its steps. */}
        <rect x={x0} y={GROUND - 36} width="24" height="36" fill={p.near} />
        <polygon points={`${x0 - 2},${GROUND - 36} ${x0 + 12},${GROUND - 45} ${x0 + 26},${GROUND - 36}`} fill={p.near} />
        {[3, 10, 17].map((dx) => (
          <rect key={dx} x={x0 + dx} y={GROUND - 32} width="4" height="22" fill={p.far} />
        ))}
        <rect x={x0 + 9} y={GROUND - 9} width="6" height="9" fill={p.window} opacity="0.85" />
        <g fill={p.near}>
          <rect x={x0 + 25} y={GROUND - 7} width="21" height="5" rx="1.5" />
          <polygon points={`${x0 + 28},${GROUND - 7} ${x0 + 30},${GROUND - 10.5} ${x0 + 42},${GROUND - 10.5} ${x0 + 44},${GROUND - 7}`} />
          <circle cx={x0 + 29} cy={GROUND - 1.8} r="1.8" />
          <circle cx={x0 + 42} cy={GROUND - 1.8} r="1.8" />
        </g>
        {[31, 35, 39].map((dx) => (
          <rect key={dx} x={x0 + dx} y={GROUND - 9.8} width="2.6" height="2" fill={p.far} />
        ))}
        <rect x={x0 + 44.4} y={GROUND - 6} width="1.6" height="1.4" fill={p.window} />
      </g>
    );
  },
  hospital: ({ p, x, w, band }) => {
    const x0 = x + (w - 46) / 2;
    const lit = (i: number) => (band === "decay" ? (i % 3 === 0 ? 0.85 : 0.2) : 0.9);
    return (
      <g>
        {/* Every light on, and the sign on the roof. */}
        <rect x={x0} y={GROUND - 38} width="30" height="38" fill={p.near} />
        <rect x={x0 + 30} y={GROUND - 24} width="16" height="24" fill={p.near} />
        <rect x={x0 + 10} y={GROUND - 48} width="10" height="10" fill={p.near} />
        <rect x={x0 + 14} y={GROUND - 46.5} width="2.2" height="7" fill={p.accent} />
        <rect x={x0 + 11.6} y={GROUND - 44.1} width="7" height="2.2" fill={p.accent} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={x0 + 4 + (i % 3) * 8.5} y={GROUND - 34 + Math.floor(i / 3) * 7} width="4.5" height="4" fill={p.window} opacity={lit(i)} />
        ))}
        {[33, 40].map((dx) => (
          <rect key={dx} x={x0 + dx} y={GROUND - 20} width="4" height="4" fill={p.window} opacity={lit(dx)} />
        ))}
        <rect x={x0 + 12} y={GROUND - 7} width="7" height="7" fill={p.window} />
      </g>
    );
  },
  clinic: ({ p, x, w }) => {
    const x0 = x + (w - 44) / 2;
    return (
      <g>
        {/* Care for those who can pay: a smart clinic set back behind a gate. */}
        <rect x={x0 + 9} y={GROUND - 32} width="26" height="32" fill={p.near} />
        <circle cx={x0 + 22} cy={GROUND - 25} r="4.5" fill={p.far} />
        <rect x={x0 + 21.1} y={GROUND - 28.3} width="1.8" height="6.6" fill={p.accent} />
        <rect x={x0 + 18.7} y={GROUND - 25.9} width="6.6" height="1.8" fill={p.accent} />
        <rect x={x0 + 13} y={GROUND - 16} width="4" height="4" fill={p.window} opacity="0.85" />
        <rect x={x0 + 27} y={GROUND - 16} width="4" height="4" fill={p.window} opacity="0.3" />
        <g fill={p.near}>
          {Array.from({ length: 15 }, (_, i) => (i === 7 ? null : <rect key={i} x={x0 + i * 3} y={GROUND - 11} width="1.2" height="11" />))}
          <rect x={x0} y={GROUND - 9} width="44" height="1" />
        </g>
        {Array.from({ length: 15 }, (_, i) => (i === 7 ? null : <polygon key={i} points={`${x0 + i * 3 - 0.4},${GROUND - 11} ${x0 + i * 3 + 0.6},${GROUND - 13} ${x0 + i * 3 + 1.6},${GROUND - 11}`} fill={p.near} />))}
        <rect x={x0 + 20} y={GROUND - 7} width="16" height="1.8" fill={p.accent} />
      </g>
    );
  },
  cafes: ({ p, x, w }) => {
    const x0 = x + (w - 46) / 2;
    return (
      <g>
        {/* A row of cafés with their awnings out and their lights on. */}
        <rect x={x0} y={GROUND - 36} width="46" height="36" fill={p.near} />
        {[4, 13, 22, 31, 40].map((dx) => (
          <rect key={dx} x={x0 + dx} y={GROUND - 32} width="3" height="4" fill={p.window} opacity="0.6" />
        ))}
        {[0, 1, 2].map((i) => {
          const sx = x0 + 1 + i * 15;
          return (
            <g key={i}>
              <rect x={sx + 1.5} y={GROUND - 16} width="11" height="10" fill={p.window} opacity="0.85" />
              <polygon points={`${sx},${GROUND - 22} ${sx + 14},${GROUND - 22} ${sx + 15},${GROUND - 17} ${sx - 1},${GROUND - 17}`} fill={p.accent} />
              {[2, 6, 10].map((st) => (
                <rect key={st} x={sx + st} y={GROUND - 22} width="1.8" height="5" fill={p.far} opacity="0.5" />
              ))}
            </g>
          );
        })}
      </g>
    );
  },
  gateQueue: ({ p, x, w }) => {
    const x0 = x + (w - 48) / 2;
    return (
      <g>
        {/* The works, and a queue at its gate before it opens. */}
        <path d={`M${x0} ${GROUND - 14} L${x0} ${GROUND - 24} L${x0 + 8} ${GROUND - 30} L${x0 + 8} ${GROUND - 24} L${x0 + 16} ${GROUND - 30} L${x0 + 16} ${GROUND - 24} L${x0 + 24} ${GROUND - 30} L${x0 + 24} ${GROUND - 24} L${x0 + 32} ${GROUND - 30} L${x0 + 32} ${GROUND - 14} Z`} fill={p.far} />
        <rect x={x0 + 2} y={GROUND - 22} width="3" height="22" fill={p.near} />
        <rect x={x0 + 20} y={GROUND - 22} width="3" height="22" fill={p.near} />
        <rect x={x0 + 2} y={GROUND - 24} width="21" height="3" fill={p.near} />
        <g stroke={p.near} strokeWidth="0.8">
          {[8, 11, 14, 17].map((dx) => (
            <line key={dx} x1={x0 + dx} y1={GROUND - 21} x2={x0 + dx} y2={GROUND} />
          ))}
        </g>
        {[26, 30.5, 35, 39.5, 44].map((dx, i) => (
          <g key={dx} fill={p.near}>
            <circle cx={x0 + dx + 1.5} cy={GROUND - 9.5 + (i % 2) * 0.6} r="1.6" />
            <rect x={x0 + dx} y={GROUND - 7.6 + (i % 2) * 0.6} width="3" height={7.6 - (i % 2) * 0.6} rx="1" />
          </g>
        ))}
      </g>
    );
  },
  cranes: ({ p, x, w, band }) => {
    const x0 = x + (w - 58) / 2;
    return (
      <g>
        {/* Towers going up, and the crane over them. */}
        <g fill="none" stroke={p.near} strokeWidth="1.2">
          <rect x={x0 + 4} y={GROUND - 54} width="18" height="54" />
          <rect x={x0 + 32} y={GROUND - 38} width="20" height="38" />
          {[8, 16, 24, 32, 40, 48].map((dy) => (
            <line key={dy} x1={x0 + 4} y1={GROUND - dy} x2={x0 + 22} y2={GROUND - dy} />
          ))}
          {[8, 16, 24, 32].map((dy) => (
            <line key={dy} x1={x0 + 32} y1={GROUND - dy} x2={x0 + 52} y2={GROUND - dy} />
          ))}
        </g>
        <rect x={x0 + 4} y={GROUND - 24} width="18" height="24" fill={p.near} />
        {band !== "decay" && <rect x={x0 + 32} y={GROUND - 16} width="20" height="16" fill={p.near} />}
        <g stroke={p.near} strokeWidth="1">
          <line x1={x0 + 27} y1={GROUND} x2={x0 + 27} y2={GROUND - 88} />
          <line x1={x0 + 29.5} y1={GROUND} x2={x0 + 29.5} y2={GROUND - 88} />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={x0 + 27} y1={GROUND - i * 8} x2={x0 + 29.5} y2={GROUND - i * 8 - 8} strokeWidth="0.6" />
          ))}
          <line x1={x0 + 10} y1={GROUND - 86} x2={x0 + 58} y2={GROUND - 86} strokeWidth="1.6" />
          <line x1={x0 + 28} y1={GROUND - 94} x2={x0 + 10} y2={GROUND - 86} strokeWidth="0.7" />
          <line x1={x0 + 28} y1={GROUND - 94} x2={x0 + 56} y2={GROUND - 86} strokeWidth="0.7" />
          <line x1={x0 + 48} y1={GROUND - 86} x2={x0 + 48} y2={GROUND - 60} strokeWidth="0.6" />
        </g>
        <rect x={x0 + 9} y={GROUND - 88} width="6" height="5" fill={p.near} />
        <rect x={x0 + 45.5} y={GROUND - 60} width="5" height="3" fill={p.accent} />
      </g>
    );
  },
  tenements: ({ p, x, w, band }) => {
    const x0 = x + (w - 48) / 2;
    return (
      <g>
        {/* The old blocks, kept, lived in, the washing out. */}
        {[
          [0, 22, 46],
          [26, 22, 40],
        ].map(([dx, bw, h]) => (
          <g key={dx}>
            <rect x={x0 + dx!} y={GROUND - h!} width={bw} height={h} fill={p.near} />
            <rect x={x0 + dx! - 1} y={GROUND - h! - 2} width={bw! + 2} height="2" fill={p.near} />
            {Array.from({ length: Math.floor((h! - 8) / 8) * 3 }, (_, k) => (
              <rect key={k} x={x0 + dx! + 3 + (k % 3) * 6.5} y={GROUND - h! + 5 + Math.floor(k / 3) * 8} width="3" height="4" fill={p.window} opacity={band === "decay" && k % 4 === 0 ? 0.2 : 0.8} />
            ))}
          </g>
        ))}
        <path d={`M${x0 + 20} ${GROUND - 28} q4 3 8 0`} fill="none" stroke={p.far} strokeWidth="0.6" />
        <path d={`M${x0 + 20} ${GROUND - 18} q4 3 8 0`} fill="none" stroke={p.far} strokeWidth="0.6" />
        {[21, 24.5].map((dx, i) => (
          <rect key={dx} x={x0 + dx} y={GROUND - 27.5} width="2.4" height="3.4" fill={i ? p.far : p.accent} />
        ))}
        <rect x={x0 + 23} y={GROUND - 17.5} width="2.6" height="3" fill={p.accent} opacity="0.8" />
      </g>
    );
  },
  factory: ({ p, x, w, band }) => {
    const x0 = x + (w - 48) / 2;
    const smoke = band === "decay" ? 0.8 : band === "muddle" ? 0.6 : 0.4;
    return (
      <g>
        {/* The works, saved: its chimneys going. */}
        <g fill={p.haze} opacity={smoke}>
          <circle cx={x0 + 10} cy={GROUND - 62} r="4" />
          <circle cx={x0 + 14} cy={GROUND - 70} r="5.5" />
          <circle cx={x0 + 38} cy={GROUND - 56} r="3.5" />
          <circle cx={x0 + 42} cy={GROUND - 63} r="5" />
        </g>
        <rect x={x0 + 6} y={GROUND - 58} width="7" height="40" fill={p.near} />
        <rect x={x0 + 34} y={GROUND - 52} width="7" height="34" fill={p.near} />
        <path d={`M${x0} ${GROUND} L${x0} ${GROUND - 22} L${x0 + 12} ${GROUND - 30} L${x0 + 12} ${GROUND - 22} L${x0 + 24} ${GROUND - 30} L${x0 + 24} ${GROUND - 22} L${x0 + 36} ${GROUND - 30} L${x0 + 36} ${GROUND - 22} L${x0 + 48} ${GROUND - 30} L${x0 + 48} ${GROUND} Z`} fill={p.near} />
        {[4, 11, 18, 25, 32, 39].map((dx) => (
          <rect key={dx} x={x0 + dx} y={GROUND - 15} width="4" height="5" fill={p.window} opacity={band === "decay" && dx > 20 ? 0.2 : 0.85} />
        ))}
      </g>
    );
  },
  containers: ({ p, x, w }) => {
    const x0 = x + (w - 46) / 2;
    const colours = [p.accent, p.far, p.near];
    return (
      <g>
        {/* The docks, open for business: containers stacked high. */}
        {[
          [0, 3],
          [16, 2],
          [32, 4],
        ].map(([dx, n], s) =>
          Array.from({ length: n! }, (_, k) => (
            <rect key={`${s}-${k}`} x={x0 + dx!} y={GROUND - 7 * (k + 1)} width="14" height="6" fill={colours[(s + k) % 3]} />
          )),
        )}
        <g stroke={p.near} strokeWidth="1.2">
          <line x1={x0 + 30} y1={GROUND} x2={x0 + 30} y2={GROUND - 40} />
          <line x1={x0 + 46} y1={GROUND} x2={x0 + 46} y2={GROUND - 40} />
          <line x1={x0 + 29} y1={GROUND - 40} x2={x0 + 47} y2={GROUND - 40} strokeWidth="2" />
        </g>
      </g>
    );
  },
  clocktower: ({ p, x, w }) => {
    const x0 = x + (w - 16) / 2;
    return (
      <g>
        {/* The clock in the square, its hands moved on: everyone works later now. */}
        <rect x={x0} y={GROUND - 10} width="16" height="10" fill={p.near} />
        <rect x={x0 + 2} y={GROUND - 66} width="12" height="58" fill={p.near} />
        <polygon points={`${x0 + 1},${GROUND - 66} ${x0 + 8},${GROUND - 82} ${x0 + 15},${GROUND - 66}`} fill={p.near} />
        <circle cx={x0 + 8} cy={GROUND - 56} r="4.6" fill={p.far} />
        <line x1={x0 + 8} y1={GROUND - 56} x2={x0 + 8} y2={GROUND - 59.8} stroke={p.accent} strokeWidth="1" />
        <line x1={x0 + 8} y1={GROUND - 56} x2={x0 + 10.6} y2={GROUND - 54.4} stroke={p.accent} strokeWidth="1" />
        {[40, 28].map((dy) => (
          <rect key={dy} x={x0 + 6.5} y={GROUND - dy} width="3" height="5" fill={p.window} opacity="0.7" />
        ))}
      </g>
    );
  },
  park: ({ p, x, w }) => {
    const x0 = x + (w - 46) / 2;
    return (
      <g>
        {/* A park with benches in the sun: the pension age was kept. */}
        {[
          [7, 9, 22],
          [24, 11, 28],
          [40, 8, 20],
        ].map(([dx, r, h]) => (
          <g key={dx} fill={p.near}>
            <rect x={x0 + dx! - 1} y={GROUND - h!} width="2" height={h} />
            <circle cx={x0 + dx!} cy={GROUND - h!} r={r} />
          </g>
        ))}
        {[12, 30].map((dx) => (
          <g key={dx} fill={p.far}>
            <rect x={x0 + dx} y={GROUND - 5} width="10" height="1.6" />
            <rect x={x0 + dx + 1} y={GROUND - 3.5} width="1" height="3.5" />
            <rect x={x0 + dx + 8} y={GROUND - 3.5} width="1" height="3.5" />
          </g>
        ))}
        <g fill={p.accent}>
          <circle cx={x0 + 15} cy={GROUND - 9.5} r="1.5" />
          <rect x={x0 + 13.6} y={GROUND - 8} width="3" height="3.4" rx="1" />
        </g>
      </g>
    );
  },
  university: ({ p, x, w }) => {
    const x0 = x + (w - 58) / 2;
    return (
      <g>
        {campus(p, x0)}
        {/* The gates stand open. */}
        <rect x={x0 + 21} y={GROUND - 12} width="2" height="12" fill={p.near} />
        <rect x={x0 + 35} y={GROUND - 12} width="2" height="12" fill={p.near} />
        <line x1={x0 + 23} y1={GROUND - 10} x2={x0 + 17} y2={GROUND - 3} stroke={p.accent} strokeWidth="1.2" />
        <line x1={x0 + 35} y1={GROUND - 10} x2={x0 + 41} y2={GROUND - 3} stroke={p.accent} strokeWidth="1.2" />
      </g>
    );
  },
  tollgate: ({ p, x, w }) => {
    const x0 = x + (w - 58) / 2;
    return (
      <g>
        {campus(p, x0)}
        {/* And a toll on the way in. */}
        <rect x={x0 + 17} y={GROUND - 12} width="6" height="12" fill={p.near} />
        <rect x={x0 + 18} y={GROUND - 10} width="4" height="3" fill={p.window} opacity="0.85" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={x0 + 23 + i * 5} y={GROUND - 7} width="5" height="2" fill={i % 2 ? p.near : p.accent} />
        ))}
      </g>
    );
  },
  policeVans: ({ p, x, w, band }) => {
    const x0 = x + (w - 48) / 2;
    return (
      <g>
        {band !== "ascent" && <polygon points={`${x0 + 45},${GROUND - 40} ${x0 + 2},${GROUND - 100} ${x0 + 22},${GROUND - 110}`} fill={p.window} opacity="0.12" />}
        <rect x={x0 + 44} y={GROUND - 40} width="2" height="40" fill={p.near} />
        <rect x={x0 + 41.5} y={GROUND - 43} width="7" height="4" rx="1" fill={p.near} />
        {[0, 21].map((dx) => (
          <g key={dx}>
            <rect x={x0 + dx} y={GROUND - 13} width="15" height="10" rx="1" fill={p.near} />
            <polygon points={`${x0 + dx + 15},${GROUND - 10} ${x0 + dx + 19},${GROUND - 10} ${x0 + dx + 20},${GROUND - 3} ${x0 + dx + 15},${GROUND - 3}`} fill={p.near} />
            <rect x={x0 + dx + 15.5} y={GROUND - 9} width="2.8" height="2.4" fill={p.far} />
            <rect x={x0 + dx + 4} y={GROUND - 15} width="6" height="2" fill={p.accent} />
            <circle cx={x0 + dx + 4} cy={GROUND - 2.3} r="2.3" fill={p.near} />
            <circle cx={x0 + dx + 15} cy={GROUND - 2.3} r="2.3" fill={p.near} />
          </g>
        ))}
      </g>
    );
  },
  leafShop: ({ p, x, w }) => {
    const x0 = x + (w - 32) / 2;
    const cx = x0 + 16;
    const cy = GROUND - 36;
    return (
      <g>
        {/* A licensed shop, the leaf on its sign. */}
        <rect x={x0 + 2} y={GROUND - 26} width="28" height="26" fill={p.near} />
        <rect x={x0 + 5} y={GROUND - 20} width="12" height="10" fill={p.window} opacity="0.85" />
        <rect x={x0 + 20} y={GROUND - 14} width="6" height="14" fill={p.far} />
        <rect x={cx - 0.6} y={GROUND - 30} width="1.2" height="4" fill={p.near} />
        <circle cx={cx} cy={cy} r="7" fill={p.near} />
        {[-60, -30, 0, 30, 60].map((a) => {
          const r = (a * Math.PI) / 180;
          const len = a === 0 ? 5.6 : Math.abs(a) === 30 ? 4.8 : 3.8;
          const tx = cx + Math.sin(r) * len;
          const ty = cy + 2 - Math.cos(r) * len;
          const nx = Math.cos(r) * 0.9;
          const ny = Math.sin(r) * 0.9;
          const mx = cx + Math.sin(r) * len * 0.5;
          const my = cy + 2 - Math.cos(r) * len * 0.5;
          return <polygon key={a} points={`${cx},${cy + 2} ${mx + nx},${my + ny} ${tx},${ty} ${mx - nx},${my - ny}`} fill={p.accent} />;
        })}
      </g>
    );
  },
  prison: ({ p, x, w }) => {
    const x0 = x + (w - 48) / 2;
    return (
      <g>
        {/* Every cell full, every window lit. */}
        <rect x={x0 + 4} y={GROUND - 30} width="44" height="30" fill={p.near} />
        <rect x={x0} y={GROUND - 40} width="8" height="40" fill={p.near} />
        <rect x={x0 - 1} y={GROUND - 42} width="10" height="3" fill={p.near} />
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i}>
            <rect x={x0 + 12 + (i % 6) * 6} y={GROUND - 26 + Math.floor(i / 6) * 9} width="3" height="4.5" fill={p.window} opacity="0.85" />
            <line x1={x0 + 13.5 + (i % 6) * 6} y1={GROUND - 26 + Math.floor(i / 6) * 9} x2={x0 + 13.5 + (i % 6) * 6} y2={GROUND - 21.5 + Math.floor(i / 6) * 9} stroke={p.near} strokeWidth="0.6" />
          </g>
        ))}
        <rect x={x0} y={GROUND - 8} width="48" height="8" fill={p.far} />
        <polyline points={`${x0},${GROUND - 9} ${x0 + 4},${GROUND - 12} ${x0 + 8},${GROUND - 9} ${x0 + 12},${GROUND - 12} ${x0 + 16},${GROUND - 9} ${x0 + 20},${GROUND - 12} ${x0 + 24},${GROUND - 9} ${x0 + 28},${GROUND - 12} ${x0 + 32},${GROUND - 9} ${x0 + 36},${GROUND - 12} ${x0 + 40},${GROUND - 9} ${x0 + 44},${GROUND - 12} ${x0 + 48},${GROUND - 9}`} fill="none" stroke={p.near} strokeWidth="0.8" />
      </g>
    );
  },
  openPrison: ({ p, x, w }) => {
    const x0 = x + (w - 48) / 2;
    return (
      <g>
        {/* Half the cells dark, the gate open, and a workshop to go to. */}
        <rect x={x0} y={GROUND - 28} width="30" height="28" fill={p.near} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={x0 + 4 + (i % 4) * 6} y={GROUND - 24 + Math.floor(i / 4) * 9} width="3" height="4.5" fill={p.window} opacity={i === 1 || i === 6 ? 0.85 : 0.18} />
        ))}
        <rect x={x0} y={GROUND - 8} width="12" height="8" fill={p.far} />
        <rect x={x0 + 20} y={GROUND - 8} width="10" height="8" fill={p.far} />
        <path d={`M${x0 + 32} ${GROUND} L${x0 + 32} ${GROUND - 14} L${x0 + 40} ${GROUND - 19} L${x0 + 40} ${GROUND - 14} L${x0 + 48} ${GROUND - 19} L${x0 + 48} ${GROUND} Z`} fill={p.near} />
        <rect x={x0 + 36} y={GROUND - 10} width="8" height="5" fill={p.window} opacity="0.9" />
      </g>
    );
  },
  cameras: ({ p, x, w, band }) => {
    const x0 = x + (w - 46) / 2;
    const eye = band === "ascent" ? p.accent : p.window;
    return (
      <g>
        {/* A camera on every pole, each looking a different way. */}
        {[
          [3, 36, 1],
          [16, 26, -1],
          [29, 40, 1],
          [42, 30, -1],
        ].map(([dx, h, dir]) => (
          <g key={dx}>
            <rect x={x0 + dx! - 0.8} y={GROUND - h!} width="1.6" height={h} fill={p.near} />
            <g transform={`translate(${x0 + dx!} ${GROUND - h!}) rotate(${dir! * 18})`}>
              <rect x={dir! > 0 ? 0 : -8} y="-2" width="8" height="4" rx="1" fill={p.near} />
              <circle cx={dir! > 0 ? 8 : -8} cy="0" r="1.3" fill={eye} />
            </g>
          </g>
        ))}
      </g>
    );
  },
  camerasDown: ({ p, x, w }) => {
    const x0 = x + (w - 40) / 2;
    return (
      <g>
        {/* The poles still stand; the cameras are gone, and a sign says so. */}
        {[4, 18, 34].map((dx, i) => (
          <g key={dx} fill={p.near}>
            <rect x={x0 + dx - 0.8} y={GROUND - 34 + i * 3} width="1.6" height={34 - i * 3} />
            <rect x={x0 + dx} y={GROUND - 33 + i * 3} width="5" height="1.2" />
          </g>
        ))}
        <rect x={x0 + 25.4} y={GROUND - 16} width="1.2" height="16" fill={p.near} />
        <circle cx={x0 + 26} cy={GROUND - 22} r="7" fill={p.far} stroke={p.accent} strokeWidth="1.4" />
        <rect x={x0 + 22} y={GROUND - 24} width="7" height="4.4" rx="0.8" fill={p.near} />
        <circle cx={x0 + 30} cy={GROUND - 21.8} r="1" fill={p.near} />
        <line x1={x0 + 21} y1={GROUND - 27} x2={x0 + 31} y2={GROUND - 17} stroke={p.accent} strokeWidth="1.4" />
      </g>
    );
  },
  loudspeakers: ({ p, x, w }) => {
    const x0 = x + (w - 36) / 2;
    const px = x0 + 18;
    return (
      <g>
        {/* The official truth, on loudspeakers, on a pole in the square. */}
        <rect x={px - 1} y={GROUND - 60} width="2" height="60" fill={p.near} />
        {[
          [-1, GROUND - 56],
          [1, GROUND - 52],
          [-1, GROUND - 44],
        ].map(([dir, y]) => (
          <g key={`${dir}-${y}`}>
            <polygon points={`${px},${y! - 1.5} ${px + dir! * 10},${y! - 5} ${px + dir! * 10},${y! + 5} ${px},${y! + 1.5}`} fill={p.near} />
            <path d={`M${px + dir! * 13} ${y! - 5} q${dir! * 3} 5 0 10`} fill="none" stroke={p.accent} strokeWidth="1" opacity="0.8" />
            <path d={`M${px + dir! * 16} ${y! - 7} q${dir! * 4} 7 0 14`} fill="none" stroke={p.accent} strokeWidth="1" opacity="0.55" />
          </g>
        ))}
        <rect x={x0 + 4} y={GROUND - 28} width="28" height="9" fill={p.far} />
        <rect x={x0 + 7} y={GROUND - 25.5} width="22" height="1.3" fill={p.near} />
        <rect x={x0 + 7} y={GROUND - 22.5} width="15" height="1.3" fill={p.near} />
      </g>
    );
  },
  billboard: ({ p, x, w }) => {
    const x0 = x + (w - 46) / 2;
    return (
      <g>
        {/* A hoarding where every claim is answered by another, and none by a fact. */}
        <rect x={x0 + 8} y={GROUND - 20} width="2" height="20" fill={p.near} />
        <rect x={x0 + 36} y={GROUND - 20} width="2" height="20" fill={p.near} />
        <rect x={x0} y={GROUND - 44} width="46" height="25" fill={p.near} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={x0 + 2 + i * 14.6} y={GROUND - 42} width="13.4" height="21" fill={i === 1 ? p.accent : p.far} opacity={i === 1 ? 0.8 : 1} />
        ))}
        {[8.7, 38].map((gx) => (
          <g key={gx}>
            <path d={`M${x0 + gx - 2.8} ${GROUND - 36.5} a2.8 2.8 0 1 1 3.8 2.6 c-1 0.5 -1 1.2 -1 2.4`} fill="none" stroke={p.near} strokeWidth="1.8" />
            <circle cx={x0 + gx} cy={GROUND - 27} r="1.1" fill={p.near} />
          </g>
        ))}
        <rect x={x0 + 22} y={GROUND - 39} width="2.2" height="8" fill={p.near} />
        <circle cx={x0 + 23.1} cy={GROUND - 27.5} r="1.2" fill={p.near} />
        <polygon points={`${x0 + 30},${GROUND - 42} ${x0 + 31.8},${GROUND - 42} ${x0 + 30},${GROUND - 38}`} fill={p.near} />
      </g>
    );
  },
  packedCourt: ({ p, x, w }) => {
    const x0 = x + (w - 60) / 2;
    return (
      <g fill={p.near}>
        {/* The highest court, with more seats than it can hold: columns crammed in, a wing bolted on. */}
        <rect x={x0 + 8} y={GROUND - 44} width="44" height="3" />
        <polygon points={`${x0 + 6},${GROUND - 44} ${x0 + 30},${GROUND - 56} ${x0 + 54},${GROUND - 44}`} />
        {Array.from({ length: 11 }, (_, i) => (
          <rect key={i} x={x0 + 9 + i * 3.9} y={GROUND - 41} width="2.2" height="32" />
        ))}
        <rect x={x0 + 4} y={GROUND - 9} width="52" height="3" />
        <rect x={x0 + 2} y={GROUND - 6} width="56" height="6" />
        <rect x={x0} y={GROUND - 30} width="7" height="24" />
        <rect x={x0 + 53} y={GROUND - 36} width="7" height="30" />
        <polygon points={`${x0 + 53},${GROUND - 36} ${x0 + 57},${GROUND - 42} ${x0 + 60},${GROUND - 36}`} />
        <circle cx={x0 + 30} cy={GROUND - 48.5} r="2" fill={p.accent} />
      </g>
    );
  },
  court: ({ p, x, w }) => {
    const x0 = x + (w - 52) / 2;
    return (
      <g>
        {/* The highest court as it was built: four columns, and the scales over the door. */}
        <g fill={p.near}>
          <rect x={x0 + 4} y={GROUND - 42} width="44" height="3" />
          <polygon points={`${x0 + 2},${GROUND - 42} ${x0 + 26},${GROUND - 56} ${x0 + 50},${GROUND - 42}`} />
          {[8, 18, 30, 40].map((dx) => (
            <rect key={dx} x={x0 + dx} y={GROUND - 39} width="4" height="30" />
          ))}
          <rect x={x0 + 2} y={GROUND - 9} width="48" height="3" />
          <rect x={x0} y={GROUND - 6} width="52" height="6" />
        </g>
        <g stroke={p.accent} strokeWidth="0.9" fill="none">
          <line x1={x0 + 26} y1={GROUND - 53} x2={x0 + 26} y2={GROUND - 45} />
          <line x1={x0 + 21} y1={GROUND - 51} x2={x0 + 31} y2={GROUND - 51} />
          <path d={`M${x0 + 19.5} ${GROUND - 48} a1.6 1.6 0 0 0 3 0 M${x0 + 29.5} ${GROUND - 48} a1.6 1.6 0 0 0 3 0`} />
        </g>
      </g>
    );
  },
  proppedBank: ({ p, x, w }) => {
    const x0 = x + (w - 50) / 2;
    return (
      <g>
        {bank(p, x0 + 8)}
        {/* Rescued: timbers against its walls on both sides. */}
        <g stroke={p.far} strokeWidth="2.2" strokeLinecap="round">
          <line x1={x0} y1={GROUND} x2={x0 + 9} y2={GROUND - 26} />
          <line x1={x0 + 3} y1={GROUND} x2={x0 + 9} y2={GROUND - 14} />
          <line x1={x0 + 50} y1={GROUND} x2={x0 + 41} y2={GROUND - 26} />
          <line x1={x0 + 47} y1={GROUND} x2={x0 + 41} y2={GROUND - 14} />
        </g>
      </g>
    );
  },
  failedBank: ({ p, x, w }) => {
    const x0 = x + (w - 50) / 2;
    return (
      <g>
        {bank(p, x0, true)}
        {/* Boarded up, and the savers queuing at a door that will not open. */}
        {[36, 40.5, 45].map((dx, i) => (
          <g key={dx} fill={p.near}>
            <circle cx={x0 + dx + 1.5} cy={GROUND - 9.5 + (i % 2) * 0.6} r="1.6" />
            <rect x={x0 + dx} y={GROUND - 7.6 + (i % 2) * 0.6} width="3" height={7.6 - (i % 2) * 0.6} rx="1" />
          </g>
        ))}
      </g>
    );
  },
  crown: ({ p, x }) => (
    <g>
      {/* The palace, and the crown back on its dome. */}
      <rect x={x + 2} y={GROUND - 30} width="56" height="30" fill={p.near} />
      <path d={`M${x + 18} ${GROUND - 30} a12 12 0 0 1 24 0 Z`} fill={p.near} />
      {[8, 18, 28, 38, 48].map((dx) => (
        <rect key={dx} x={x + dx} y={GROUND - 22} width="3" height="6" fill={p.window} opacity="0.85" />
      ))}
      <polygon points={`${x + 22},${GROUND - 44} ${x + 22},${GROUND - 52} ${x + 26},${GROUND - 47} ${x + 30},${GROUND - 54} ${x + 34},${GROUND - 47} ${x + 38},${GROUND - 52} ${x + 38},${GROUND - 44}`} fill={p.accent} />
      <rect x={x + 21} y={GROUND - 44} width="18" height="2.5" fill={p.accent} />
    </g>
  ),
  stadium: ({ p, x, w, band }) => {
    const x0 = x + (w - 60) / 2;
    return (
      <g>
        {/* The stadium, its floodlights on (or its roof in, in the Decay). */}
        <path d={`M${x0 + 4} ${GROUND} L${x0 + 8} ${GROUND - 20} Q${x0 + 30} ${GROUND - 30} ${x0 + 52} ${GROUND - 20} L${x0 + 56} ${GROUND} Z`} fill={p.near} />
        <path d={`M${x0 + 10} ${GROUND - 16} Q${x0 + 30} ${GROUND - 25} ${x0 + 50} ${GROUND - 16}`} fill="none" stroke={p.far} strokeWidth="1.2" />
        {band === "decay" && <polygon points={`${x0 + 24},${GROUND - 27} ${x0 + 34},${GROUND - 27.5} ${x0 + 31},${GROUND - 20} ${x0 + 27},${GROUND - 21}`} fill={p.far} />}
        {[2, 58].map((dx) => (
          <g key={dx}>
            <rect x={x0 + dx - 0.8} y={GROUND - 44} width="1.6" height="44" fill={p.near} />
            <rect x={x0 + dx - 4} y={GROUND - 48} width="8" height="4" fill={p.near} />
            {band !== "decay" && <rect x={x0 + dx - 3} y={GROUND - 47} width="6" height="2" fill={p.window} />}
          </g>
        ))}
        {[16, 24, 32, 40].map((dx) => (
          <rect key={dx} x={x0 + dx} y={GROUND - 10} width="4" height="5" fill={p.window} opacity="0.7" />
        ))}
      </g>
    );
  },
  portCranes: ({ p, x, w }) => {
    const x0 = x + (w - 48) / 2;
    return (
      <g>
        {/* The port's cranes, under another country's flag. */}
        {[0, 26].map((dx) => (
          <g key={dx} stroke={p.near} strokeWidth="1.4">
            <line x1={x0 + dx + 2} y1={GROUND} x2={x0 + dx + 6} y2={GROUND - 44} />
            <line x1={x0 + dx + 16} y1={GROUND} x2={x0 + dx + 12} y2={GROUND - 44} />
            <line x1={x0 + dx + 4} y1={GROUND - 22} x2={x0 + dx + 14} y2={GROUND - 22} />
            <line x1={x0 + dx} y1={GROUND - 44} x2={x0 + dx + 22} y2={GROUND - 44} strokeWidth="2.2" />
            <line x1={x0 + dx + 20} y1={GROUND - 44} x2={x0 + dx + 20} y2={GROUND - 30} strokeWidth="0.6" />
          </g>
        ))}
        <line x1={x0 + 36} y1={GROUND - 44} x2={x0 + 36} y2={GROUND - 58} stroke={p.near} strokeWidth="1" />
        <rect x={x0 + 36} y={GROUND - 58} width="11" height="7" fill={p.far} />
        <polygon points={`${x0 + 36},${GROUND - 58} ${x0 + 47},${GROUND - 58} ${x0 + 36},${GROUND - 51}`} fill={p.accent} />
      </g>
    );
  },
};

/* ---- landmarks: the hills behind the city (BACKLOG-10 phase 64) -------------------- */

/** Where the ridge stands at x, near enough for something to be planted on it. */
const RIDGE_AT = [150, 138, 146, 128, 140, 124, 136, 132, 146];
export const ridgeY = (x: number): number => {
  const step = WIDTH / (RIDGE_AT.length - 1);
  const i = Math.min(RIDGE_AT.length - 2, Math.max(0, Math.floor(x / step)));
  const t = (x - i * step) / step;
  return RIDGE_AT[i]! * (1 - t) + RIDGE_AT[i + 1]! * t + 3;
};

export const RIDGE_DRAW: Partial<Record<Motif, (c: Ctx) => ReactNode>> = {
  turbines: ({ p, band }) => (
    <g>
      {[30, 66, 102, 138, 174].map((x, i) => {
        const base = ridgeY(x);
        const hub = base - 48 + (i % 2) * 6;
        const turn = i * 23 + (band === "decay" ? 7 : 0);
        return (
          <g key={x} stroke={p.far} strokeLinecap="round">
            <line x1={x} y1={base} x2={x} y2={hub} strokeWidth="2" />
            {[0, 120, 240].map((a) => {
              const r = ((a + turn) * Math.PI) / 180;
              // A turbine left to stand in the Decay has lost a blade.
              if (band === "decay" && i % 2 === 1 && a === 240) return null;
              return <line key={a} x1={x} y1={hub} x2={x + Math.sin(r) * 17} y2={hub - Math.cos(r) * 17} strokeWidth="1.4" />;
            })}
            <circle cx={x} cy={hub} r="1.8" fill={p.near} stroke="none" />
          </g>
        );
      })}
    </g>
  ),
  flare: ({ p, band }) => {
    const x = 96;
    const base = ridgeY(x);
    return (
      <g>
        <g stroke={p.far} strokeWidth="1.4" fill="none">
          <polyline points={`${x - 10},${base} ${x},${base - 44} ${x + 10},${base}`} />
          {[12, 22, 32].map((dy) => {
            const half = (10 * dy) / 44;
            return <line key={dy} x1={x - half} x2={x + half} y1={base - 44 + dy} y2={base - 44 + dy} />;
          })}
        </g>
        <line x1={x + 22} y1={base} x2={x + 22} y2={base - 36} stroke={p.far} strokeWidth="2" />
        <path d={`M${x + 22} ${base - 37} q-4 -6 0 -14 q4 8 0 14 Z`} fill={p.sun} opacity="0.95" />
        <g fill={p.haze} opacity={band === "decay" ? 0.75 : 0.45}>
          <circle cx={x + 28} cy={base - 54} r="5" />
          <circle cx={x + 38} cy={base - 60} r="7" />
          {band !== "ascent" && <circle cx={x + 52} cy={base - 64} r="9" />}
        </g>
      </g>
    );
  },
};

/** A university's front: a domed hall and two wings, with a way in between (BACKLOG-10 phase 64). */
function campus(p: Palette, x0: number): ReactNode {
  return (
    <g>
      <rect x={x0 + 2} y={GROUND - 22} width="14" height="22" fill={p.near} />
      <rect x={x0 + 42} y={GROUND - 22} width="14" height="22" fill={p.near} />
      <rect x={x0 + 14} y={GROUND - 34} width="30" height="22" fill={p.near} />
      <path d={`M${x0 + 19} ${GROUND - 34} a10 10 0 0 1 20 0 Z`} fill={p.near} />
      <rect x={x0 + 28} y={GROUND - 48} width="2" height="5" fill={p.near} />
      {[17, 23, 33, 39].map((dx) => (
        <rect key={dx} x={x0 + dx} y={GROUND - 31} width="2.4" height="17" fill={p.far} />
      ))}
      {[5, 10, 45, 50].map((dx) => (
        <rect key={dx} x={x0 + dx} y={GROUND - 17} width="3" height="5" fill={p.window} opacity="0.85" />
      ))}
    </g>
  );
}

/** A bank: a pediment with a coin in it over a heavy front (BACKLOG-10 phase 64). */
function bank(p: Palette, x0: number, boarded = false): ReactNode {
  return (
    <g>
      <rect x={x0} y={GROUND - 30} width="34" height="30" fill={p.near} />
      <polygon points={`${x0 - 2},${GROUND - 30} ${x0 + 17},${GROUND - 40} ${x0 + 36},${GROUND - 30}`} fill={p.near} />
      <circle cx={x0 + 17} cy={GROUND - 33.5} r="2.6" fill={p.accent} />
      {[5, 14, 23].map((dx) => (
        <g key={dx}>
          <rect x={x0 + dx} y={GROUND - 24} width="6" height="9" fill={boarded ? p.far : p.window} opacity={boarded ? 1 : 0.85} />
          {boarded && (
            <g stroke={p.near} strokeWidth="1">
              <line x1={x0 + dx} y1={GROUND - 24} x2={x0 + dx + 6} y2={GROUND - 15} />
              <line x1={x0 + dx + 6} y1={GROUND - 24} x2={x0 + dx} y2={GROUND - 15} />
            </g>
          )}
        </g>
      ))}
      <rect x={x0 + 13} y={GROUND - 10} width="8" height="10" fill={boarded ? p.far : p.window} opacity={boarded ? 1 : 0.8} />
    </g>
  );
}
