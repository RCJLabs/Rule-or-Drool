// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { METER_KEYS } from "../../src/engine/types";
import type { Cue } from "../../src/ui/sound";

/**
 * Every cue has to be heard on the device the game is for (BACKLOG-3 phase 22). A phone's
 * micro-speaker has almost no output below its enclosure resonance, and a cue written under
 * it is felt as a tick rather than heard. The phase measured the rendered cues through two
 * cascaded 2nd-order highpasses at 500 Hz, the conservative corner; this holds the synth to
 * the same model from the notes it asks for, so it runs without an audio device.
 *
 * Each oscillator is taken as its waveform's harmonic series (a triangle's odd harmonics at
 * 1/n², a square's at 1/n, every harmonic of a sawtooth at 1/n), weighted by its gain. Envelopes,
 * glides and detuning are left out: they move energy around in time, not out of the band.
 */

interface Voice {
  type: OscillatorType;
  freq: number;
  gain: number;
}
const voices: Voice[] = [];

class FakeParam {
  values: number[] = [];
  setValueAtTime(v: number) {
    this.values.push(v);
    return this;
  }
  exponentialRampToValueAtTime(v: number) {
    this.values.push(v);
    return this;
  }
}
class FakeNode {
  to: FakeNode | null = null;
  connect(next: FakeNode) {
    this.to = next;
    return next;
  }
}
class FakeGain extends FakeNode {
  gain = new FakeParam();
}
class FakeOscillator extends FakeNode {
  type: OscillatorType = "sine";
  frequency = new FakeParam();
  detune = new FakeParam();
  start() {}
  stop() {
    const amp = this.to as FakeGain;
    voices.push({ type: this.type, freq: this.frequency.values[0]!, gain: Math.max(...amp.gain.values) });
  }
}
class FakeContext {
  currentTime = 0;
  state = "running";
  destination = new FakeNode();
  createOscillator() {
    return new FakeOscillator();
  }
  createGain() {
    return new FakeGain();
  }
  resume() {
    return Promise.resolve();
  }
}

const CORNER = 500;
/** Every cue measured loses 3.6-12.2 dB this way; the cues phase 22 replaced lost 26-42. */
const MAX_LOSS_DB = 15;

function harmonics(type: OscillatorType): [number, number][] {
  const out: [number, number][] = [];
  for (let n = 1; n <= 60; n++) {
    if (type === "sine" && n === 1) out.push([n, 1]);
    if (type === "triangle" && n % 2) out.push([n, 1 / (n * n)]);
    if (type === "square" && n % 2) out.push([n, 1 / n]);
    if (type === "sawtooth") out.push([n, 1 / n]);
  }
  return out;
}

/** Power through two 2nd-order Butterworth highpasses at the corner. */
const speaker = (f: number) => {
  const r = (f / CORNER) ** 4;
  return (r / (1 + r)) ** 2;
};

/** How much of what the voices make a phone loses, in dB. */
function lossOnAPhone(vs: readonly Voice[]): number {
  let made = 0;
  let heard = 0;
  for (const v of vs) {
    for (const [n, a] of harmonics(v.type)) {
      const p = (v.gain * a) ** 2;
      made += p;
      heard += p * speaker(n * v.freq);
    }
  }
  return -10 * Math.log10(heard / made);
}

let play: (cue: Cue, detail?: string, level?: number) => void;
beforeAll(async () => {
  (window as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
  ({ play } = await import("../../src/ui/sound"));
});

function voicesOf(cue: Cue, detail?: string, level?: number): Voice[] {
  voices.length = 0;
  play(cue, detail, level);
  return [...voices];
}

describe("every cue on a phone speaker", () => {
  it("would have caught the cues phase 22 replaced", () => {
    // The old card landing, a bare 150 Hz sine, and the old era change.
    expect(lossOnAPhone([{ type: "sine", freq: 150, gain: 0.1 }])).toBeGreaterThan(MAX_LOSS_DB);
    expect(lossOnAPhone([{ type: "sine", freq: 147, gain: 0.1 }, { type: "sine", freq: 220, gain: 0.08 }])).toBeGreaterThan(MAX_LOSS_DB);
  });

  it(`loses under ${MAX_LOSS_DB} dB of every cue, in every version of it`, () => {
    const lost: Record<string, number> = {};
    for (const side of ["left", "right"]) {
      for (const level of [-1, -0.5, 0, 0.5, 1]) lost[`commit ${side} ${level}`] = lossOnAPhone(voicesOf("commit", side, level));
    }
    for (const meter of METER_KEYS) lost[`danger ${meter}`] = lossOnAPhone(voicesOf("danger", meter));
    for (const cue of ["arc", "election", "era", "endWell", "endOut", "endBadly"] as const) lost[cue] = lossOnAPhone(voicesOf(cue));
    const tooQuiet = Object.entries(lost)
      .filter(([, db]) => !(db < MAX_LOSS_DB))
      .map(([cue, db]) => `${cue}: loses ${db.toFixed(1)} dB`);
    expect(tooQuiet).toEqual([]);
  });

  it("keeps a swipe left and a swipe right apart where a phone can hear them", () => {
    // Before phase 22 the two sides differed only as 150 Hz against 185, both under the
    // corner, and through the phone they were 91% the same sound.
    const audible = (side: string) =>
      voicesOf("commit", side, 0)
        .filter((v) => v.freq >= CORNER)
        .map((v) => Math.round(v.freq));
    const left = audible("left");
    const right = audible("right");
    expect(left.length).toBeGreaterThan(0);
    expect(right.length).toBeGreaterThan(0);
    expect(left.filter((f) => right.includes(f))).toEqual([]);
  });
});
