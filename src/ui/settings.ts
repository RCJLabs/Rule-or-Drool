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
}

export const DEFAULT_SETTINGS: Settings = {
  reduceMotion: false,
  plainText: false,
  portraits: true,
  alwaysHint: false,
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
    if (typeof value === "boolean") out[key] = value;
  }
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
