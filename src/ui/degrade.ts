import { makeRng } from "../engine/rng";

export function hashText(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

const WORD = /^([A-Za-z']+)([.,;:!?]*)$/;

/**
 * Render-time typo transform (section 9). Deterministic for a given text and salt so it
 * never flickers between renders. level 0 returns the text unchanged; level 1 is about
 * one slip per 30 characters. Keep it subtle: the real Decay voice is authored content.
 */
export function degrade(text: string, level: number, salt = 0): string {
  if (level <= 0 || text.length < 12) return text;
  const words = text.split(" ");
  const budget = Math.max(1, Math.round((Math.min(1, level) * text.length) / 30));
  const rng = makeRng(hashText(text) ^ salt);
  const candidates: number[] = [];
  words.forEach((w, i) => {
    const m = WORD.exec(w);
    if (m && (m[1]!.length >= 4 || m[1]!.toLowerCase() === "the")) candidates.push(i);
  });
  if (candidates.length === 0) return text;
  const used = new Set<number>();
  for (let k = 0; k < budget && used.size < candidates.length; k++) {
    let idx = candidates[Math.floor(rng() * candidates.length)]!;
    let guard = 0;
    while (used.has(idx) && guard++ < 12) idx = candidates[Math.floor(rng() * candidates.length)]!;
    if (used.has(idx)) break;
    used.add(idx);
    const m = WORD.exec(words[idx]!)!;
    words[idx] = slip(m[1]!, rng, level) + m[2]!;
  }
  return words.join(" ");
}

function slip(word: string, rng: () => number, level: number): string {
  if (word.toLowerCase() === "the") return word[0] === "T" ? "Teh" : "teh";
  const op = Math.floor(rng() * (level >= 0.5 ? 4 : 3));
  const i = 1 + Math.floor(rng() * (word.length - 2));
  switch (op) {
    case 0:
      return word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
    case 1:
      return word.slice(0, i) + word[i] + word.slice(i);
    case 2:
      return word.slice(0, i) + word.slice(i + 1);
    default:
      return word.toUpperCase();
  }
}
