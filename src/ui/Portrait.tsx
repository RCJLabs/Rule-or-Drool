import { makeRng } from "../engine/rng";
import { hashText } from "./degrade";

interface Props {
  role: string;
  advisorId: string;
  seed: number;
  size?: number;
}

const SKIN = ["#f2c9a0", "#e0b088", "#c98f5f", "#a7693d", "#7a4b2a", "#f7dcc0"];
const HAIR = ["#2b1b12", "#5a3a1e", "#a9743a", "#d6b27b", "#6b6b6b", "#e8e4dc", "#b3372c"];
const BG = ["#d8e3ee", "#e9dcc9", "#d9e6d3", "#e8d6e2", "#f0e0c8", "#d6dfe9"];
const INK = "#2a1d15";

const COAT: Record<string, string> = {
  general: "#2f4a3a",
  judge: "#151515",
  scientist: "#f4f4f4",
  tycoon: "#3a2a4a",
  spin: "#24485e",
  chief: "#3a3f4a",
  treasurer: "#4a3a2a",
  organizer: "#7a2e2e",
  rival: "#5b2a5b",
};

/** Brow tilt: positive is angry (inner ends down), negative is raised. */
const BROW: Record<string, number> = { rival: 3, general: 2, organizer: 2, spin: -2, scientist: -1, tycoon: 1 };

const MOUTH: Record<string, string> = {
  smile: "M-9 10 Q0 18 9 10",
  flat: "M-8 12 L8 12",
  frown: "M-9 14 Q0 8 9 14",
  smirk: "M-8 12 Q2 16 9 9",
  pursed: "M-4 12 L4 12",
};
const ROLE_MOUTH: Record<string, string> = {
  spin: "smile",
  general: "flat",
  judge: "flat",
  scientist: "smile",
  tycoon: "smirk",
  organizer: "frown",
  rival: "smirk",
  treasurer: "pursed",
  chief: "flat",
};

/** Procedural SVG portrait per speaker role, varied by seed and advisor (section 9). */
export function Portrait({ role, advisorId, seed, size = 84 }: Props) {
  const rng = makeRng(seed ^ hashText(advisorId));
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)]!;
  const skin = pick(SKIN);
  const hair = pick(HAIR);
  const bg = pick(BG);
  const rx = 24 + Math.floor(rng() * 5);
  const ry = 28 + Math.floor(rng() * 5);
  const gap = 9 + Math.floor(rng() * 4);
  const hairStyle = role === "rival" ? 2 : Math.floor(rng() * 5);
  const tilt = BROW[role] ?? 0;
  const mouth = MOUTH[ROLE_MOUTH[role] ?? "flat"]!;
  const coat = COAT[role] ?? "#444";

  return (
    <svg viewBox="-48 -52 96 104" width={size} height={(size * 104) / 96} className="portrait" aria-hidden="true">
      <circle cx="0" cy="2" r="46" fill={bg} />
      <path d="M-42 54 Q0 20 42 54 Z" fill={coat} />
      <rect x="-8" y={ry - 8} width="16" height="18" fill={skin} />
      <ellipse cx="0" cy="0" rx={rx} ry={ry} fill={skin} />
      <Hair style={hairStyle} color={hair} rx={rx} ry={ry} />
      <circle cx={-gap} cy="-4" r="3" fill={INK} />
      <circle cx={gap} cy="-4" r="3" fill={INK} />
      <line x1={-gap - 5} y1={-11 - tilt} x2={-gap + 5} y2={-11 + tilt} stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <line x1={gap - 5} y1={-11 + tilt} x2={gap + 5} y2={-11 - tilt} stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d={mouth} stroke="#7a3b2e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Accessory role={role} rx={rx} ry={ry} gap={gap} />
    </svg>
  );
}

function Hair({ style, color, rx, ry }: { style: number; color: string; rx: number; ry: number }) {
  const cap = `M${-rx} -6 Q0 ${-ry - 10} ${rx} -6 Q0 ${-ry + 8} ${-rx} -6 Z`;
  switch (style) {
    case 0:
      return null;
    case 1:
      return <path d={cap} fill={color} />;
    case 2:
      return (
        <>
          <path d={cap} fill={color} />
          <path d={`M${-rx} -6 Q${-rx - 6} ${-ry + 14} ${-rx + 6} ${-ry + 2} Z`} fill={color} />
        </>
      );
    case 3:
      return (
        <>
          <path d={cap} fill={color} />
          <circle cx="0" cy={-ry - 6} r="8" fill={color} />
        </>
      );
    default:
      return <polyline points={`${-rx},-8 ${-rx + 6},${-ry - 8} ${-rx + 14},${-ry + 2} ${-4},${-ry - 12} 4,${-ry + 2} 12,${-ry - 9} ${rx - 4},${-ry + 3} ${rx},-8`} fill={color} stroke="none" />;
  }
}

function Accessory({ role, rx, ry, gap }: { role: string; rx: number; ry: number; gap: number }) {
  switch (role) {
    case "general":
      return (
        <>
          <path d={`M${-rx - 2} ${-ry + 6} L${-rx} ${-ry - 10} Q0 ${-ry - 20} ${rx} ${-ry - 10} L${rx + 2} ${-ry + 6} Z`} fill="#2f4a3a" />
          <rect x={-rx - 6} y={-ry + 4} width={2 * rx + 12} height="5" rx="2" fill="#1c2e24" />
          <circle cx="0" cy={-ry - 4} r="3" fill="#e8c547" />
          <rect x="-34" y="36" width="12" height="4" fill="#e8c547" />
          <rect x="22" y="36" width="12" height="4" fill="#e8c547" />
        </>
      );
    case "judge":
      return (
        <>
          {[-14, -2, 10].map((y) => (
            <g key={y}>
              <circle cx={-rx - 2} cy={y} r="7" fill="#f2f0ea" />
              <circle cx={rx + 2} cy={y} r="7" fill="#f2f0ea" />
            </g>
          ))}
          <path d={`M${-rx + 2} ${-ry + 4} Q0 ${-ry - 6} ${rx - 2} ${-ry + 4} Z`} fill="#f2f0ea" />
          <rect x="-8" y={ry + 6} width="7" height="12" fill="#f7f7f7" />
          <rect x="1" y={ry + 6} width="7" height="12" fill="#f7f7f7" />
        </>
      );
    case "scientist":
      return (
        <>
          <circle cx={-gap} cy="-4" r="6.5" fill="none" stroke={INK} strokeWidth="1.6" />
          <circle cx={gap} cy="-4" r="6.5" fill="none" stroke={INK} strokeWidth="1.6" />
          <line x1={-gap + 6.5} y1="-4" x2={gap - 6.5} y2="-4" stroke={INK} strokeWidth="1.6" />
          <path d={`M-12 ${ry + 6} L-4 ${ry + 22} L-18 ${ry + 22} Z`} fill="#dcdcdc" />
          <path d={`M12 ${ry + 6} L4 ${ry + 22} L18 ${ry + 22} Z`} fill="#dcdcdc" />
        </>
      );
    case "tycoon":
      return (
        <>
          <rect x="-17" y={-ry - 28} width="34" height="26" fill="#1a1a1a" />
          <rect x="-27" y={-ry - 5} width="54" height="6" rx="2" fill="#1a1a1a" />
          <rect x="-17" y={-ry - 10} width="34" height="4" fill="#8a1c1c" />
          <line x1="6" y1="12" x2="22" y2="7" stroke="#6b4423" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="23" cy="6.5" r="2" fill="#ff6a00" />
        </>
      );
    case "spin":
      return (
        <>
          <path d={`M${-rx - 4} -4 Q0 ${-ry - 14} ${rx + 4} -4`} fill="none" stroke="#1c1c1c" strokeWidth="3" />
          <rect x={rx - 1} y="-8" width="7" height="12" rx="2" fill="#1c1c1c" />
          <path d={`M${rx + 2} 4 Q${rx - 4} 18 8 16`} fill="none" stroke="#1c1c1c" strokeWidth="2" />
          <circle cx="8" cy="16" r="2.5" fill="#1c1c1c" />
        </>
      );
    case "chief":
      return (
        <>
          <rect x={-gap - 6} y="-9" width="12" height="9" rx="1.5" fill="none" stroke={INK} strokeWidth="1.6" />
          <rect x={gap - 6} y="-9" width="12" height="9" rx="1.5" fill="none" stroke={INK} strokeWidth="1.6" />
          <path d={`M-4 ${ry + 8} L4 ${ry + 8} L2 ${ry + 24} L0 ${ry + 28} L-2 ${ry + 24} Z`} fill="#a1262b" />
        </>
      );
    case "treasurer":
      return (
        <>
          <circle cx={gap} cy="-4" r="7" fill="none" stroke="#b8963c" strokeWidth="1.8" />
          <path d={`M${gap + 6} 0 Q${gap + 14} 14 ${gap + 8} 26`} fill="none" stroke="#b8963c" strokeWidth="1.2" />
          <path d={`M-9 ${ry + 10} L0 ${ry + 14} L-9 ${ry + 18} Z M9 ${ry + 10} L0 ${ry + 14} L9 ${ry + 18} Z`} fill="#5a2d2d" />
        </>
      );
    case "organizer":
      return (
        <>
          <rect x={-rx - 2} y={-ry + 5} width={2 * rx + 4} height="8" fill="#b3372c" />
          <path d={`M${rx} ${-ry + 9} L${rx + 10} ${-ry + 2} L${rx + 8} ${-ry + 14} Z`} fill="#b3372c" />
          <circle cx="-22" cy="42" r="4" fill="#e8c547" />
        </>
      );
    case "rival":
      return (
        <>
          <circle cx="-24" cy="41" r="5.5" fill="#e0e0e0" />
          <circle cx="-24" cy="41" r="2.5" fill="#b3372c" />
        </>
      );
    default:
      return null;
  }
}
