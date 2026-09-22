import { SETTINGS_VERSION } from "../version";

/**
 * Player settings, stored under their own key and version like run and meta state
 * (section 12). Everything here is a preference about how the game is presented; nothing
 * here changes how a run plays, so settings are never part of a seed or a save.
 */
export interface Settings {
  /** Stop the card animations, over and above whatever the OS already asks for. */
  reduceMotion: boolean;
  /** Keep late-Decay card text clean instead of letting it degrade (section 9). */
  plainText: boolean;
  /** Draw the advisor portraits. Off is quieter, and cheaper on an old phone. */
  portraits: boolean;
  /** Show the drag hint under the card, rather than hiding it after the first run. */
  alwaysHint: boolean;
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
  reduceMotion: false,
  plainText: false,
  portraits: true,
  alwaysHint: false,
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
  // v1 is the first shape. An unknown key is ignored and a missing one takes its default,
  // so a settings file from either direction still loads.
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
 * Settings that CSS acts on are published as data attributes on the document root, so a
 * rule can opt out of an animation without any component knowing about it.
 */
export function applySettings(settings: Settings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.toggleAttribute("data-reduce-motion", settings.reduceMotion);
  root.toggleAttribute("data-no-portraits", !settings.portraits);
}
