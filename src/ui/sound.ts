import { BLOC_KEYS, METER_KEYS, type MeterKey, type Meters } from "../engine/types";

/**
 * Everything the game can say out loud. Synthesized with oscillators rather than shipped as
 * audio files, so the PWA stays small and works offline with no extra fetch
 * (BACKLOG-2 phase 9).
 */
export type Cue = "commit" | "danger" | "arc" | "election" | "era" | "endWell" | "endBadly";

let ctx: AudioContext | null = null;

/**
 * The audio context, created lazily. Browsers refuse to start one outside a user gesture,
 * and the first cue is always a swipe, so there is nothing to arrange.
 */
function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One note: a short envelope so nothing rings on, which on a phone speaker reads as noise. */
function tone(freq: number, ms: number, opts: { type?: OscillatorType; gain?: number; at?: number } = {}): void {
  const audio = context();
  if (!audio) return;
  const t0 = audio.currentTime + (opts.at ?? 0);
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = opts.type ?? "triangle";
  osc.frequency.setValueAtTime(freq, t0);
  const peak = opts.gain ?? 0.12;
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
  osc.connect(amp).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + ms / 1000 + 0.02);
}

/** A pitch per meter, so a run's failures sound different from each other. */
const DANGER_PITCH: Record<MeterKey, number> = {
  base: 392,
  backers: 349,
  public: 440,
  money: 294,
  order: 247,
  inst: 330,
};

const CUES: Record<Cue, (detail?: string) => void> = {
  // The card landing. The two sides differ so a swipe has a direction you can hear.
  commit: (side) => tone(side === "right" ? 150 : 185, 90, { type: "sine", gain: 0.1 }),
  danger: (meter) => {
    const f = DANGER_PITCH[(meter as MeterKey) ?? "public"] ?? 440;
    tone(f, 140, { type: "square", gain: 0.05 });
    tone(f / 2, 220, { type: "triangle", gain: 0.07, at: 0.04 });
  },
  arc: () => {
    tone(196, 160, { type: "sine", gain: 0.09 });
    tone(262, 220, { type: "sine", gain: 0.08, at: 0.12 });
  },
  election: () => {
    tone(523, 90, { gain: 0.08 });
    tone(659, 120, { gain: 0.08, at: 0.08 });
  },
  era: () => {
    tone(147, 260, { type: "sine", gain: 0.1 });
    tone(220, 320, { type: "sine", gain: 0.08, at: 0.18 });
  },
  endWell: () => {
    tone(392, 160, { gain: 0.1 });
    tone(523, 200, { gain: 0.1, at: 0.14 });
    tone(659, 300, { gain: 0.09, at: 0.3 });
  },
  endBadly: () => {
    tone(262, 200, { type: "sawtooth", gain: 0.07 });
    tone(196, 260, { type: "sawtooth", gain: 0.07, at: 0.16 });
    tone(131, 420, { type: "sawtooth", gain: 0.08, at: 0.36 });
  },
};

export function play(cue: Cue, detail?: string): void {
  CUES[cue]?.(detail);
}

/** Haptics where the device has them. Silently absent everywhere else. */
export function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers throw rather than reporting the API as missing.
  }
}

/**
 * Which meters crossed into danger on this choice. Only a crossing makes a sound: a meter
 * that was already low should not keep shouting every card.
 */
export function newlyDangerous(before: Meters, after: Meters, below: number): MeterKey[] {
  const out: MeterKey[] = [];
  for (const k of METER_KEYS) {
    const isBloc = (BLOC_KEYS as readonly string[]).includes(k);
    const bad = (v: number) => v < below || (!isBloc && v > 100 - below);
    if (!bad(before[k]) && bad(after[k])) out.push(k);
  }
  return out;
}
