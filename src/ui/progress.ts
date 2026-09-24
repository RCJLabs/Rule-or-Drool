import type { Library } from "../engine/library";
import { codexProgress, migrateMeta, streakOf, todayKey, type MetaState, type SetAside } from "../meta";
import { APP_VERSION, META_SAVE_VERSION, SETTINGS_VERSION } from "../version";
import { migrateSettings, type Settings } from "./settings";

/**
 * Moving a profile from one address to another (BACKLOG-5 phase 33). Storage belongs to one
 * browser at one address, so the Play app, another browser, or the game at a new domain
 * each start from nothing. This carries the profile (the codex, the unlocks, the history)
 * and the settings, lessons already given included. A run in progress stays where it is,
 * and so does a playtest record, which has its own way out.
 *
 * Two forms of the same thing:
 * - a file, as plain JSON, which any browser can read back;
 * - a code to copy, compressed: a forty-run profile is 7.1 KB of JSON and 2.2 KB of code.
 *   `RD1.` marks a compressed code; `RD1u.` one from a browser that could not compress.
 *
 * Reading refuses anything from a newer version of the game rather than guessing at it, and
 * brings an older profile forward through the same migration a saved one goes through.
 */
export const PROGRESS_FORMAT = "rule-or-drool-progress";
export const PROGRESS_VERSION = 1;
const PACKED = "RD1.";
const PLAIN = "RD1u.";
/**
 * Far past any real profile (forty runs are 7.1 KB), and a stop for a code built to unpack
 * into something that would take the tab down: a link is a thing anyone can send.
 */
const MAX_BYTES = 1_000_000;

interface Envelope {
  format: typeof PROGRESS_FORMAT;
  v: number;
  game: string;
  meta: MetaState;
  settings: Settings & { v: number };
}

export function progressJson(meta: MetaState, settings: Settings): string {
  const envelope: Envelope = { format: PROGRESS_FORMAT, v: PROGRESS_VERSION, game: APP_VERSION, meta, settings: { ...settings, v: SETTINGS_VERSION } };
  return JSON.stringify(envelope);
}

/**
 * A profile set aside (BACKLOG-8 phase 50), in the same envelope, so reading it back goes the
 * way bringing any progress here goes: shown beside what is here, refused if it is from a
 * newer version, and put in place only when asked. It carries the settings here, so bringing
 * it back leaves them as they are. The envelope names no version of the game, since the
 * profile does not say which one saved it. Null when it is not JSON at all, and only the raw
 * text can be handed on.
 */
export function asideJson(aside: SetAside, settings: Settings): string | null {
  let meta: unknown;
  try {
    meta = JSON.parse(aside.raw);
  } catch {
    return null;
  }
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  return JSON.stringify({ format: PROGRESS_FORMAT, v: PROGRESS_VERSION, meta, settings: { ...settings, v: SETTINGS_VERSION } });
}

const toBase64Url = (bytes: Uint8Array): string => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromBase64Url = (text: string): Uint8Array => {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

/** Bytes through a (de)compression stream and back, with nothing but the streams themselves. */
async function through(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(bytes);
      c.close();
    },
  });
  const reader = source.pipeThrough(stream as TransformStream<Uint8Array, Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (let r = await reader.read(); !r.done; r = await reader.read()) {
    size += r.value.length;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error("too large");
    }
    chunks.push(r.value);
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** The code to copy. Compressed where the browser can; the reader takes either. */
export async function progressCode(meta: MetaState, settings: Settings): Promise<string> {
  const bytes = new TextEncoder().encode(progressJson(meta, settings));
  if (typeof CompressionStream === "undefined") return PLAIN + toBase64Url(bytes);
  return PACKED + toBase64Url(await through(bytes, new CompressionStream("deflate")));
}

export type Readout =
  | { ok: true; meta: MetaState; settings: Settings; game: string }
  /** `newer`: made by a later version of the game, which this one will not guess at. */
  | { ok: false; reason: "unreadable" | "newer" | "cannotUnpack"; game?: string };

/**
 * A code, a file's text, or a link with the code in it, read back. Nothing is written: the
 * caller shows what would be replaced and asks first.
 */
export async function readProgress(input: string): Promise<Readout> {
  let text = input.trim();
  if (text.length > MAX_BYTES) return { ok: false, reason: "unreadable" };
  const inLink = text.indexOf("#progress=");
  if (inLink >= 0) text = decodeURIComponent(text.slice(inLink + "#progress=".length));
  let json: string;
  try {
    if (text.startsWith("{")) json = text;
    else if (text.startsWith(PLAIN)) json = new TextDecoder().decode(fromBase64Url(text.slice(PLAIN.length)));
    else if (text.startsWith(PACKED)) {
      if (typeof DecompressionStream === "undefined") return { ok: false, reason: "cannotUnpack" };
      json = new TextDecoder().decode(await through(fromBase64Url(text.slice(PACKED.length)), new DecompressionStream("deflate")));
    } else return { ok: false, reason: "unreadable" };
  } catch {
    return { ok: false, reason: "unreadable" };
  }

  let data: Partial<Envelope>;
  try {
    data = JSON.parse(json) as Partial<Envelope>;
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (!data || data.format !== PROGRESS_FORMAT || typeof data.v !== "number" || !data.meta || typeof data.meta !== "object") {
    return { ok: false, reason: "unreadable" };
  }
  const game = typeof data.game === "string" ? data.game : undefined;
  const settingsV = typeof data.settings?.v === "number" ? data.settings.v : 0;
  if (data.v > PROGRESS_VERSION || (data.meta.v ?? 0) > META_SAVE_VERSION || settingsV > SETTINGS_VERSION) return { ok: false, reason: "newer", game };
  const meta = migrateMeta(data.meta);
  if (!meta) return { ok: false, reason: "unreadable" };
  return { ok: true, meta, settings: migrateSettings(data.settings ?? {}), game: game ?? "" };
}

/** What a profile amounts to, in the numbers a player would miss. */
export interface ProgressSummary {
  runs: number;
  endings: number;
  endingsTotal: number;
  unlocks: number;
  /** Dailies played, and the streak running (BACKLOG-5 phase 38). */
  dailies: number;
  streak: number;
}

export function progressSummary(lib: Library, meta: MetaState, today: string = todayKey()): ProgressSummary {
  const p = codexProgress(lib, meta);
  const streak = streakOf(meta.dailies, today).current;
  return { runs: meta.runs, endings: p.endingsSeen, endingsTotal: p.endingsTotal, unlocks: meta.unlocks.length, dailies: meta.dailies.length, streak };
}
