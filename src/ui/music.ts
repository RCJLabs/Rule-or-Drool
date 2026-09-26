import { useEffect } from "react";
import { audioContext } from "./sound";

/**
 * Music that follows the look (BACKLOG-12 phase 79). The look is the only sign of which way the
 * country is going, and it changes fourteen or fifteen times in a careful run; this is a second
 * sense for it, for a player who has stopped reading colour. Made in the browser like the cues,
 * so there is nothing to fetch.
 *
 * A bar is four chords' worth of slow arpeggio over a held note. Which chords depends on the look:
 * major and higher as the country climbs, chords with no third in the Muddle, minor and then
 * darker in Decay, where each note gets a copy a few cents sharp that beats against it and a sag
 * in its pitch, the same sour the card's own cue has. Each era moves the key.
 *
 * Off unless the player turns it on: it plays for as long as a run does, which a phone pays for,
 * and whether it helps anyone is a question for testers, not for a bot.
 */

/** Where the run is, as the score reads it. */
export interface Mood {
  /** The look's stage, -3 deep Decay to +3 deep Ascent, as the frame shows it. */
  stage: number;
  era: number;
}

/** One note of the score. */
export interface Note {
  /** Seconds after its bar starts. */
  at: number;
  freq: number;
  /** Seconds it sounds, the fade included. */
  dur: number;
  type: OscillatorType;
  gain: number;
  /** A second copy this many cents sharp, which beats against the first: the sour of Decay. */
  sour?: number;
  /** Where the pitch ends, as a multiple of where it began. Under 1 is a sag. */
  glide?: number;
}

/** Seconds a bar lasts: slow, so the score sits under the cards rather than over them. */
export const BAR = 3.2;
/** The whole score's level, under the cues: the quietest cue voice peaks at 0.045. */
export const MUSIC_GAIN = 0.4;
/** Seconds the score takes to come in and to go. */
const FADE_IN = 2;
const FADE_OUT = 0.8;

/** The key each era is in, as semitones over D: a change at each era, in a narrow register. */
const ERA_KEYS = [0, 5, 2, 7, 4] as const;
const hz = (semitones: number) => 146.83 * 2 ** (semitones / 12);

/**
 * The four chords a look cycles through, as semitones over the key. Brighter as the country
 * climbs: major, then a seventh, then a ninth. None of it in the Muddle: suspended chords, with no
 * third to say major or minor. Darker as it decays: minor, then a flattened second, then
 * diminished chords a tritone apart.
 */
const CHORDS: Record<number, readonly (readonly number[])[]> = {
  3: [
    [0, 4, 7, 11, 14],
    [7, 11, 14, 18],
    [9, 12, 16, 19],
    [5, 9, 12, 16],
  ],
  2: [
    [0, 4, 7, 11],
    [7, 11, 14],
    [9, 12, 16],
    [5, 9, 12],
  ],
  1: [
    [0, 4, 7],
    [7, 11, 14],
    [9, 12, 16],
    [5, 9, 12],
  ],
  0: [
    [0, 5, 7],
    [5, 10, 12],
    [0, 5, 7],
    [7, 12, 14],
  ],
  [-1]: [
    [0, 3, 7],
    [8, 12, 15],
    [5, 8, 12],
    [7, 10, 14],
  ],
  [-2]: [
    [0, 3, 7],
    [1, 5, 8],
    [5, 8, 12],
    [0, 3, 6],
  ],
  [-3]: [
    [0, 3, 6],
    [1, 4, 7],
    [6, 9, 12],
    [0, 3, 6],
  ],
};

/**
 * The notes of one bar. Pure, so what each look sounds like can be tested without a speaker.
 *
 * The arpeggio sits two octaves over the key, 590–1,200 Hz, where a phone's speaker is at its
 * loudest; the held note is an octave under it and is felt more than heard on a phone, as the
 * cues' low notes are (BACKLOG-3 phase 22).
 */
export function barNotes(mood: Mood, bar: number): Note[] {
  const stage = Math.max(-3, Math.min(3, Math.round(mood.stage)));
  const key = ERA_KEYS[(Math.max(1, mood.era) - 1) % ERA_KEYS.length]!;
  const chord = CHORDS[stage]![bar % 4]!;
  const down = Math.max(0, -stage);
  const up = Math.max(0, stage);
  // Decay: each note sags, further the deeper it goes, and a sharp copy beats against it.
  const glide = down ? 1 - 0.012 * down : undefined;
  const sour = down ? 10 * down + 5 : undefined;
  const type: OscillatorType = up ? "sine" : "triangle";
  const notes: Note[] = [{ at: 0, freq: hz(key + chord[0]!) * 2, dur: BAR * 0.95, type: "triangle", gain: 0.045, ...(glide ? { glide } : {}) }];
  // Up the chord on even bars and down it on odd ones, so the loop does not tick.
  const tones = chord.slice(0, 3);
  const order = bar % 2 ? [...tones].reverse() : tones;
  order.forEach((t, i) =>
    notes.push({ at: 0.35 + 0.8 * i, freq: hz(key + t) * 4, dur: 0.9, type, gain: 0.05, ...(glide ? { glide } : {}), ...(sour ? { sour } : {}) }),
  );
  // High in the Ascent, the chord's top note an octave over the rest, at the end of the bar.
  if (up >= 2) notes.push({ at: 2.75, freq: hz(key + chord[chord.length - 1]!) * 8, dur: 0.7, type: "sine", gain: 0.02 * (up - 1) });
  return notes;
}

/** One note into the score's own level, so the whole of it can come in and go at once. */
function voice(audio: AudioContext, bus: GainNode, start: number, n: Note): void {
  const play = (detune: number, type: OscillatorType, gain: number) => {
    const t0 = start + n.at;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(n.freq, t0);
    if (n.glide) osc.frequency.exponentialRampToValueAtTime(n.freq * n.glide, t0 + n.dur);
    if (detune) osc.detune.setValueAtTime(detune, t0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.25, n.dur / 3));
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
    osc.connect(amp).connect(bus);
    osc.start(t0);
    osc.stop(t0 + n.dur + 0.02);
  };
  play(0, n.type, n.gain);
  // A sawtooth carries through a small speaker far louder than its gain, as the cue's does.
  if (n.sour) play(n.sour, "sawtooth", n.gain * 0.35);
}

/** How often the score looks ahead, and how far: a bar is scheduled before it is due. */
const TICK_MS = 1000;
const LOOKAHEAD = 1.5;

let mood: Mood = { stage: 0, era: 1 };
let running: { bus: GainNode; next: number; bar: number; timer: ReturnType<typeof setInterval> } | null = null;

/** Where the run is now: heard from the next bar. */
export function setMood(next: Mood): void {
  mood = next;
}

function tick(): void {
  const audio = audioContext();
  if (!running || !audio) return;
  while (running.next < audio.currentTime + LOOKAHEAD) {
    for (const n of barNotes(mood, running.bar)) voice(audio, running.bus, running.next, n);
    running.next += BAR;
    running.bar++;
  }
}

/** Bring the score in. Nothing where the browser has no audio. */
export function startMusic(): void {
  if (running) return;
  const audio = audioContext();
  if (!audio) return;
  const bus = audio.createGain();
  bus.gain.setValueAtTime(0.0001, audio.currentTime);
  bus.gain.exponentialRampToValueAtTime(MUSIC_GAIN, audio.currentTime + FADE_IN);
  bus.connect(audio.destination);
  running = { bus, next: audio.currentTime + 0.1, bar: 0, timer: setInterval(tick, TICK_MS) };
  tick();
}

/** Let the score go. What is already scheduled plays out under the fade. */
export function stopMusic(): void {
  if (!running) return;
  const { bus, timer } = running;
  running = null;
  clearInterval(timer);
  const audio = audioContext();
  if (!audio) return;
  bus.gain.cancelScheduledValues(audio.currentTime);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), audio.currentTime);
  bus.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + FADE_OUT);
  setTimeout(() => bus.disconnect(), (FADE_OUT + LOOKAHEAD) * 1000 + 100);
}

export function musicPlaying(): boolean {
  return running !== null;
}

/**
 * The score while the play screen is up and the player has it on. It stops when the page is
 * hidden, which is when a phone is in a pocket, and comes back when the page does.
 */
export function useMusic(on: boolean, stage: number, era: number): void {
  useEffect(() => {
    setMood({ stage, era });
  }, [stage, era]);
  useEffect(() => {
    if (!on || typeof document === "undefined") return;
    const follow = () => (document.hidden ? stopMusic() : startMusic());
    follow();
    document.addEventListener("visibilitychange", follow);
    return () => {
      document.removeEventListener("visibilitychange", follow);
      stopMusic();
    };
  }, [on]);
}
