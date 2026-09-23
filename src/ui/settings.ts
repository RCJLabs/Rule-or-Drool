import { SETTINGS_VERSION } from "../version";
import { degradeLevel, type Theme } from "./theme";

/**
 * Player settings, stored under their own key and version like run and meta state
 * (section 12). Everything here is a preference about how the game is presented; nothing
 * here changes how a run plays, so settings are never part of a seed or a save.
 */
export interface Settings {
  /**
   * One tap for the plain version (BACKLOG-3 phase 21). Turns off everything the two paths
   * put around the card — the stream, the projection, the glows and the saturation push —
   * and implies `plainText`, because a player who needs this does not want the words
   * mangled either. The palettes and the writing stay: they are the game, not the noise.
   */
  readable: boolean;
  /** Stop the card animations, over and above whatever the OS already asks for. */
  reduceMotion: boolean;
  /** Keep late-Decay card text clean instead of letting it degrade (section 9). */
  plainText: boolean;
  /** Draw the advisor portraits. Off is quieter, and cheaper on an old phone. */
  portraits: boolean;
  /** Show the drag hint under the card, rather than hiding it after the first run. */
  alwaysHint: boolean;
  /**
   * Two buttons under the card for the two choices, for anyone who would rather tap than
   * drag (BACKLOG-5 phase 30). The buttons are always there for a screen reader; this only
   * decides whether they are drawn.
   */
  showChoices: boolean;
  /**
   * Keep a record of each run on the device, for a playtest (BACKLOG-5 phase 31): the time
   * each card took, the previews looked at, the side taken. Off unless the player turns it
   * on, and it only ever leaves the device when they send it.
   */
  keepRecord: boolean;
  /** Synthesized cues: the card landing, a meter crossing into danger, a story opening. */
  sound: boolean;
  /** A short buzz on commit and a longer one when something goes wrong, where supported. */
  haptics: boolean;
  /**
   * Lessons the player has already been shown. Each fires once ever rather than once per
   * run, so a second run is not re-explained (BACKLOG-2 phase 10).
   */
  taught: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  readable: false,
  reduceMotion: false,
  plainText: false,
  portraits: true,
  alwaysHint: false,
  showChoices: false,
  keepRecord: false,
  // On by default. A mute is one tap away on every screen, whereas an audio feature that
  // starts silent is one nobody ever hears (BACKLOG-2 phase 9).
  sound: true,
  haptics: true,
  taught: [],
};

const KEY = "rod.settings";

/** Add a case here whenever SETTINGS_VERSION goes up. */
export function migrateSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };
  const data = raw as Partial<Settings> & { v?: number };
  if (typeof data.v !== "number" || data.v > SETTINGS_VERSION) return { ...DEFAULT_SETTINGS };
  // v1 is the first shape; v2 adds `readable`; v3 adds `showChoices`; v4 adds `keepRecord`.
  // An unknown key is ignored and a missing one takes its default, so a settings file from
  // either direction still loads — which is why adding a boolean preference needs a version
  // bump and nothing else.
  const out = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = data[key];
    if (typeof value === "boolean" && typeof DEFAULT_SETTINGS[key] === "boolean") {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  // Not a preference but a record of what has been explained; a stray entry is harmless.
  if (Array.isArray(data.taught)) out.taught = data.taught.filter((x): x is string => typeof x === "string");
  return out;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrateSettings(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...settings, v: SETTINGS_VERSION }));
  } catch {
    // Storage unavailable: the session keeps them, the next one does not.
  }
}

/**
 * How hard the card text may be mangled, once the player has had a say. The plain screen
 * implies clean text: it is one tap for the whole plain version, and a setting that left
 * the words garbled would not be one (BACKLOG-3 phase 21).
 */
export function textLevel(settings: Settings, theme: Theme): number {
  return settings.plainText || settings.readable ? 0 : degradeLevel(theme);
}

/**
 * Settings that CSS acts on are published as data attributes on the document root, so a
 * rule can opt out of an animation without any component knowing about it.
 */
export function applySettings(settings: Settings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.toggleAttribute("data-reduce-motion", settings.reduceMotion);
  root.toggleAttribute("data-no-portraits", !settings.portraits);
  root.toggleAttribute("data-readable", settings.readable);
}
