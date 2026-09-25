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

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  /** Seconds to wait before this note starts. */
  at?: number;
  /** Cents off the written pitch. Two copies a few cents apart beat against each other. */
  detune?: number;
  /** Where the pitch ends up, as a multiple of where it started. Under 1 is a sag. */
  glide?: number;
}

/** One note: a short envelope so nothing rings on, which on a phone speaker reads as noise. */
function tone(freq: number, ms: number, opts: ToneOpts = {}): void {
  const audio = context();
  if (!audio) return;
  const t0 = audio.currentTime + (opts.at ?? 0);
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = opts.type ?? "triangle";
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.glide && opts.glide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * opts.glide, t0 + ms / 1000);
  if (opts.detune) osc.detune.setValueAtTime(opts.detune, t0);
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

/**
 * A phone's micro-speaker has almost no output below its enclosure resonance, so a cue
 * written entirely under it is felt as a tick and never heard as a note. Measured through a
 * two-pole model of that rolloff at 500 Hz, the old `commit` — a 150 Hz sine — lost 24 dB of
 * what it was making, and `era` lost 27. The low notes stay, because on anything with a
 * woofer they are the body of the sound; what is new is a partial high enough to survive
 * (BACKLOG-3 phase 22).
 */
const PHONE_VOICE = 4;
/** A fifth above the voice, which is the interval that sounds like something resolving. */
const PHONE_ANSWER = 6;

const CUES: Record<Cue, (detail?: string, level?: number) => void> = {
  /**
   * The card landing, and the one cue heard on every card. `level` is where the run is
   * heading, -1 deep Decay to +1 deep Ascent, and the gesture is the same either way: the
   * same note, going sour or being answered.
   */
  commit: (side, level = 0) => {
    const down = Math.max(0, -level);
    const up = Math.max(0, level);
    const root = side === "right" ? 150 : 185;
    // The whole cue sags in pitch on the way down and holds on the way up. A note that
    // cannot keep its pitch is the cheapest sound there is, and it costs one ramp.
    const sag = 1 - 0.13 * down + 0.03 * up;
    const len = 95 - 22 * down + 22 * up;
    // The body. Triangle rather than sine so its own harmonics reach a small speaker too.
    tone(root, len - 5, { type: "triangle", gain: 0.085, glide: sag });
    // The voice: 600 Hz one way, 740 the other, which is where a phone is at its loudest.
    // It gives way to the sawtooth below rather than being buried under it, so going badly
    // is a different sound and not just a louder one.
    tone(root * PHONE_VOICE, len, { type: "triangle", gain: 0.07 * (1 - 0.6 * down), glide: sag });
    // Going badly: the same note again, sharp enough to beat against the first and sagging
    // further. Cheap is a beat frequency, not a different tune.
    // A sawtooth carries far more energy through a small speaker than its gain suggests,
    // so it is set low: going badly should be harsher, not louder, on a cue heard every card.
    if (down > 0.02) tone(root * PHONE_VOICE, len, { type: "sawtooth", gain: 0.036 * down, detune: 30, glide: sag * 0.94 });
    // Going well: the same note answered a fifth up, clean and a little longer.
    if (up > 0.02) tone(root * PHONE_ANSWER, 200, { type: "sine", gain: 0.075 * up, at: 0.055 });
  },
  danger: (meter) => {
    const f = DANGER_PITCH[(meter as MeterKey) ?? "public"] ?? 440;
    tone(f, 140, { type: "square", gain: 0.05 });
    tone(f / 2, 220, { type: "triangle", gain: 0.07, at: 0.04 });
  },
  arc: () => {
    tone(196, 160, { type: "sine", gain: 0.09 });
    tone(262, 220, { type: "sine", gain: 0.08, at: 0.12 });
    // The same two notes two octaves up, quietly, so the phrase exists on a phone at all.
    tone(784, 150, { type: "sine", gain: 0.05 });
    tone(1047, 200, { type: "sine", gain: 0.045, at: 0.12 });
  },
  election: () => {
    tone(523, 90, { gain: 0.08 });
    tone(659, 120, { gain: 0.08, at: 0.08 });
  },
  era: () => {
    tone(147, 260, { type: "sine", gain: 0.1 });
    tone(220, 320, { type: "sine", gain: 0.08, at: 0.18 });
    tone(588, 240, { type: "triangle", gain: 0.055 });
    tone(880, 300, { type: "triangle", gain: 0.05, at: 0.18 });
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

/** `level` is only read by the cues that follow the path; the rest ignore it. */
export function play(cue: Cue, detail?: string, level?: number): void {
  CUES[cue]?.(detail, level);
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
export function newlyDangerous(before: Meters, after: Meters, below: number, outOfOffice = false): MeterKey[] {
  const out: MeterKey[] = [];
  for (const k of METER_KEYS) {
    const isBloc = (BLOC_KEYS as readonly string[]).includes(k);
    // Out of office the state is not yours to lose, so only the coalition can be in danger
    // (BACKLOG-10 phase 55).
    if (outOfOffice && !isBloc) continue;
    const bad = (v: number) => v < below || (!isBloc && v > 100 - below);
    if (!bad(before[k]) && bad(after[k])) out.push(k);
  }
  return out;
}
