// @vitest-environment jsdom
import { cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { STRINGS } from "../../src/content/strings";
import { DEFAULT_SETTINGS, migrateSettings } from "../../src/ui/settings";
import { SettingsMenu } from "../../src/ui/SettingsMenu";

/**
 * Music that follows the look (BACKLOG-12 phase 79): what each look sounds like, that a phone can
 * play it and that it stays under the cues, and that it plays only while the play screen is up,
 * the page can be seen and the player has turned it on.
 */

interface Voice {
  type: OscillatorType;
  freq: number;
  gain: number;
}
const voices: Voice[] = [];

class FakeParam {
  values: number[] = [];
  get value() {
    return this.values.at(-1) ?? 1;
  }
  setValueAtTime(v: number) {
    this.values.push(v);
    return this;
  }
  exponentialRampToValueAtTime(v: number) {
    this.values.push(v);
    return this;
  }
  cancelScheduledValues() {
    return this;
  }
}
class FakeNode {
  to: FakeNode | null = null;
  connect(next: FakeNode) {
    this.to = next;
    return next;
  }
  disconnect() {
    this.to = null;
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
    voices.push({ type: this.type, freq: this.frequency.values[0]!, gain: Math.max(...(this.to as FakeGain).gain.values) });
  }
}
class FakeContext {
  static made: FakeContext[] = [];
  currentTime = 0;
  state = "running";
  destination = new FakeNode();
  gains: FakeGain[] = [];
  constructor() {
    FakeContext.made.push(this);
  }
  createOscillator() {
    return new FakeOscillator();
  }
  createGain() {
    const g = new FakeGain();
    this.gains.push(g);
    return g;
  }
  resume() {
    return Promise.resolve();
  }
}

type Music = typeof import("../../src/ui/music");
let m: Music;
beforeAll(async () => {
  (window as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
  m = await import("../../src/ui/music");
});
afterEach(() => {
  m.stopMusic();
  cleanup();
  vi.useRealTimers();
});

const semis = (a: number, b: number) => Math.round(12 * Math.log2(b / a));
/** The arpeggio's three notes of a bar, the lowest first. */
const arpeggio = (stage: number, era = 1, bar = 0) =>
  m
    .barNotes({ stage, era }, bar)
    .filter((n) => n.at > 0 && n.at < 2.5)
    .map((n) => n.freq)
    .sort((a, b) => a - b);

describe("what each look sounds like", () => {
  it("is major as the country climbs, has no third in the Muddle, and is minor, then diminished, as it decays", () => {
    const shape = (stage: number) => {
      const [root, second, third] = arpeggio(stage);
      return [semis(root!, second!), semis(root!, third!)];
    };
    for (const stage of [1, 2, 3]) expect(shape(stage), `stage ${stage}`).toEqual([4, 7]);
    expect(shape(0)).toEqual([5, 7]);
    expect(shape(-1)).toEqual([3, 7]);
    expect(shape(-3)).toEqual([3, 6]);
  });

  it("is clean as the country climbs and sour as it decays, more so the deeper it goes", () => {
    for (const stage of [0, 1, 2, 3]) {
      for (const n of m.barNotes({ stage, era: 1 }, 0)) {
        expect(n.sour, `stage ${stage}`).toBeUndefined();
        expect(n.glide, `stage ${stage}`).toBeUndefined();
      }
    }
    const sour = (stage: number) => m.barNotes({ stage, era: 1 }, 0).filter((n) => n.at > 0);
    expect(sour(1).every((n) => n.type === "sine")).toBe(true);
    expect(sour(0).every((n) => n.type === "triangle")).toBe(true);
    for (const stage of [-1, -2, -3]) expect(sour(stage).every((n) => (n.sour ?? 0) > 0 && (n.glide ?? 1) < 1)).toBe(true);
    expect(sour(-3)[0]!.sour!).toBeGreaterThan(sour(-1)[0]!.sour!);
    expect(sour(-3)[0]!.glide!).toBeLessThan(sour(-1)[0]!.glide!);
  });

  it("reaches higher in the deep Ascent than anywhere else", () => {
    const top = (stage: number) => Math.max(...[0, 1, 2, 3].flatMap((bar) => m.barNotes({ stage, era: 1 }, bar).map((n) => n.freq)));
    for (const stage of [-3, -2, -1, 0, 1]) expect(top(2)).toBeGreaterThan(top(stage));
    const sparkle = (stage: number) => m.barNotes({ stage, era: 1 }, 0).find((n) => n.at > 2.5)?.gain ?? 0;
    expect(sparkle(3)).toBeGreaterThan(sparkle(2));
  });

  it("moves key at each era, and comes round again after the fifth", () => {
    const roots = [1, 2, 3, 4, 5, 6].map((era) => m.barNotes({ stage: 0, era }, 0)[0]!.freq);
    expect(new Set(roots.slice(0, 5)).size).toBe(5);
    expect(roots[5]).toBe(roots[0]);
  });

  it("loops every four bars, the same every time", () => {
    for (const bar of [0, 1, 2, 3]) expect(m.barNotes({ stage: -2, era: 3 }, bar + 4)).toEqual(m.barNotes({ stage: -2, era: 3 }, bar));
  });
});

/** The phone speaker the cues are held to (tests/ui/sound-phone.test.ts): two highpasses at 500 Hz. */
function lossOnAPhone(vs: readonly Voice[]): number {
  const harmonics = (type: OscillatorType): [number, number][] => {
    const out: [number, number][] = [];
    for (let n = 1; n <= 60; n++) {
      if (type === "sine" && n === 1) out.push([n, 1]);
      if (type === "triangle" && n % 2) out.push([n, 1 / (n * n)]);
      if (type === "sawtooth") out.push([n, 1 / n]);
    }
    return out;
  };
  const speaker = (f: number) => {
    const r = (f / 500) ** 4;
    return (r / (1 + r)) ** 2;
  };
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
const voicesOf = (stage: number, era: number, bar: number): Voice[] =>
  m
    .barNotes({ stage, era }, bar)
    .flatMap((n) => [{ type: n.type, freq: n.freq, gain: n.gain }, ...(n.sour ? [{ type: "sawtooth" as const, freq: n.freq, gain: n.gain * 0.35 }] : [])]);

describe("the score on a phone speaker", () => {
  it("loses under 15 dB of every bar, in every look and era, as the cues must", () => {
    const tooQuiet: string[] = [];
    for (let stage = -3; stage <= 3; stage++) {
      for (let era = 1; era <= 5; era++) {
        for (let bar = 0; bar < 4; bar++) {
          const db = lossOnAPhone(voicesOf(stage, era, bar));
          if (!(db < 15)) tooQuiet.push(`stage ${stage} era ${era} bar ${bar}: ${db.toFixed(1)} dB`);
        }
      }
    }
    expect(tooQuiet).toEqual([]);
  });

  it("stays under the cues: at its loudest, half the quietest cue voice", () => {
    let loudest = 0;
    for (let stage = -3; stage <= 3; stage++) for (let bar = 0; bar < 4; bar++) for (const v of voicesOf(stage, 1, bar)) loudest = Math.max(loudest, v.gain);
    expect(loudest * m.MUSIC_GAIN).toBeLessThanOrEqual(0.045 / 2);
  });
});

describe("playing it", () => {
  const audio = () => FakeContext.made.at(-1)!;
  /** The score's own level: the newest gain wired to the speakers, which every note goes through. */
  const busOf = () =>
    audio()
      .gains.filter((g) => g.to === audio().destination)
      .at(-1)!;
  /** Move the audio clock on, and let the score's timer look ahead. */
  const later = (s: number) => {
    audio().currentTime += s;
    vi.advanceTimersByTime(1000);
  };
  beforeEach(() => {
    vi.useFakeTimers();
    voices.length = 0;
  });

  it("schedules a bar ahead into a level of its own that comes in slowly, then a bar more each bar", () => {
    m.setMood({ stage: 0, era: 1 });
    m.startMusic();
    const bus = busOf();
    expect(bus.gain.values).toEqual([0.0001, m.MUSIC_GAIN]);
    // Every note goes through it, so the whole score comes in and goes at once.
    expect(audio().gains.filter((g) => g.to === bus).length).toBe(m.barNotes({ stage: 0, era: 1 }, 0).length);
    vi.advanceTimersByTime(0);
    const first = voices.length;
    expect(first).toBe(m.barNotes({ stage: 0, era: 1 }, 0).length);
    later(m.BAR);
    expect(voices.length).toBe(first + m.barNotes({ stage: 0, era: 1 }, 1).length);
  });

  it("plays the look it is given from the next bar", () => {
    m.setMood({ stage: 1, era: 1 });
    m.startMusic();
    expect(voices.some((v) => v.type === "sawtooth")).toBe(false);
    m.setMood({ stage: -3, era: 1 });
    later(m.BAR);
    expect(voices.some((v) => v.type === "sawtooth")).toBe(true);
  });

  it("fades when it is stopped, and schedules nothing after", () => {
    m.startMusic();
    const bus = busOf();
    m.stopMusic();
    expect(bus.gain.values.at(-1)).toBe(0.0001);
    const n = voices.length;
    later(m.BAR * 3);
    expect(voices.length).toBe(n);
    expect(m.musicPlaying()).toBe(false);
  });

  it("follows the page and the play screen: out when hidden, back when shown, gone when the screen goes", () => {
    const hidden = (h: boolean) => {
      Object.defineProperty(document, "hidden", { value: h, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    const screen = renderHook(({ stage }) => m.useMusic(true, stage, 1), { initialProps: { stage: 0 } });
    expect(m.musicPlaying()).toBe(true);
    hidden(true);
    expect(m.musicPlaying()).toBe(false);
    hidden(false);
    expect(m.musicPlaying()).toBe(true);
    screen.unmount();
    expect(m.musicPlaying()).toBe(false);
  });

  it("never starts while the player has it off", () => {
    renderHook(() => m.useMusic(false, 2, 1));
    expect(m.musicPlaying()).toBe(false);
  });
});

describe("the setting", () => {
  it("is off unless the player turns it on, and a settings file from before it keeps it off", () => {
    expect(DEFAULT_SETTINGS.music).toBe(false);
    expect(migrateSettings({ v: 4, sound: false }).music).toBe(false);
    expect(migrateSettings({ v: 5, music: true }).music).toBe(true);
  });

  it("is a switch of its own in the settings, beside the sound", () => {
    const changed: boolean[] = [];
    render(
      <SettingsMenu
        settings={DEFAULT_SETTINGS}
        onChange={(next) => changed.push(next.music)}
        onClose={() => {}}
        onEraseProgress={() => {}}
        onHowItWorks={() => {}}
      />,
    );
    const box = screen.getByRole("checkbox", { name: new RegExp(STRINGS.music.title) }) as HTMLInputElement;
    expect(box.checked).toBe(false);
    fireEvent.click(box);
    expect(changed).toEqual([true]);
  });
});
