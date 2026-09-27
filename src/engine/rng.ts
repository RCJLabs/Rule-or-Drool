/**
 * mulberry32: a tiny 32-bit PRNG whose whole state is one int32, so it can live inside
 * GameState and any run can be replayed from its seed.
 */

export interface Roll {
  /** Uniform in [0, 1). */
  value: number;
  /** State to store for the next roll. */
  state: number;
}

/** Turn an arbitrary integer seed into a well-mixed initial state. */
export function seedToState(seed: number): number {
  let h = seed | 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return h | 0;
}

export function nextRandom(state: number): Roll {
  const s = (state + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: s };
}

/** Integer in [min, max] inclusive. */
export function nextInt(state: number, min: number, max: number): { value: number; state: number } {
  const r = nextRandom(state);
  return { value: min + Math.floor(r.value * (max - min + 1)), state: r.state };
}

/**
 * Weighted pick. Returns the index of the chosen item, or -1 when total weight is 0.
 * Consumes exactly one roll.
 */
export function pickWeighted(state: number, weights: readonly number[]): { index: number; state: number } {
  let total = 0;
  for (const w of weights) total += w > 0 ? w : 0;
  const r = nextRandom(state);
  if (total <= 0) return { index: -1, state: r.state };
  let x = r.value * total;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i] ?? 0;
    if (w <= 0) continue;
    x -= w;
    if (x < 0) return { index: i, state: r.state };
  }
  // Floating point slop: return the last positive-weight item.
  for (let i = weights.length - 1; i >= 0; i--) if ((weights[i] ?? 0) > 0) return { index: i, state: r.state };
  return { index: -1, state: r.state };
}

/** A name as a number, the same everywhere (FNV-1a): a card's, a story's, or what a die is for. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h | 0;
}

/**
 * A die that reads only the run's seed, the card count and what it is for (BACKLOG-13 phase 81):
 * the same for every run on the seed at that card, whatever each chose before it. The deal's dice
 * were one stream, so a different choice anywhere moved every roll after it, and two players on
 * one daily met the same cards for about six cards.
 */
export function diceAt(seed: number, at: number, purpose: string): number {
  return nextRandom(seedToState((Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(at + 1, 0x85ebca6b) ^ hashString(purpose)) | 0)).value;
}

// Each id's place for the last seed asked about, before its weight: a draw ranks every card it
// can deal, and a run asks about one seed from its first card to its last.
let rankedSeed: number | null = null;
const ranked = new Map<string, number>();

/**
 * Where a card or a story comes in a seed's order, weighted as the deal weighs it: the higher
 * first. It is the key of weighted sampling without replacement (Efraimidis and Spirakis), u to
 * the power 1/w, compared as its logarithm. Every run on a seed meets the deck in this order, less
 * what it cannot be dealt or has met.
 */
export function rankOf(seed: number, id: string, weight: number): number {
  if (seed !== rankedSeed) {
    rankedSeed = seed;
    ranked.clear();
  }
  let at = ranked.get(id);
  if (at === undefined) {
    const u = nextRandom(seedToState((Math.imul(seed | 0, 0x27d4eb2d) ^ hashString(id)) | 0)).value;
    at = Math.log(u || Number.MIN_VALUE);
    ranked.set(id, at);
  }
  return at / weight;
}

/** A stand-alone stateful generator for code outside the engine (bots, tooling). */
export function makeRng(seed: number): () => number {
  let state = seedToState(seed);
  return () => {
    const r = nextRandom(state);
    state = r.state;
    return r.value;
  };
}
