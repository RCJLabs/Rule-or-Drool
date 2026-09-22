// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, applySettings, loadSettings, migrateSettings, saveSettings } from "../../src/ui/settings";
import { SETTINGS_VERSION } from "../../src/version";

describe("settings", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips, and an empty profile takes the defaults", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    const mine = { ...DEFAULT_SETTINGS, reduceMotion: true, portraits: false };
    saveSettings(mine);
    expect(loadSettings()).toEqual(mine);
  });

  it("survives junk, a future version, and a partial file", () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings({ v: SETTINGS_VERSION + 1, reduceMotion: true })).toEqual(DEFAULT_SETTINGS);
    // A key that does not exist yet is ignored; a missing one takes its default.
    expect(migrateSettings({ v: SETTINGS_VERSION, plainText: true, somethingNew: 7 })).toEqual({
      ...DEFAULT_SETTINGS,
      plainText: true,
    });
    // A field of the wrong type does not poison the rest.
    expect(migrateSettings({ v: SETTINGS_VERSION, reduceMotion: "yes", plainText: true }).reduceMotion).toBe(false);
  });

  it("publishes the CSS-facing settings on the document root", () => {
    applySettings({ ...DEFAULT_SETTINGS, reduceMotion: true, portraits: false });
    expect(document.documentElement.hasAttribute("data-reduce-motion")).toBe(true);
    expect(document.documentElement.hasAttribute("data-no-portraits")).toBe(true);
    applySettings(DEFAULT_SETTINGS);
    expect(document.documentElement.hasAttribute("data-reduce-motion")).toBe(false);
    expect(document.documentElement.hasAttribute("data-no-portraits")).toBe(false);
  });

  it("keeps a run out of the settings file", () => {
    // Settings are presentation only: nothing here may end up in a seed or a save.
    saveSettings({ ...DEFAULT_SETTINGS, plainText: true });
    const raw = JSON.parse(localStorage.getItem("rod.settings")!);
    expect(Object.keys(raw).sort()).toEqual([...Object.keys(DEFAULT_SETTINGS), "v"].sort());
  });

  it("starts with sound on, because a muted feature is one nobody hears", () => {
    // The mute is one tap away on every screen, which is the trade this default makes.
    expect(DEFAULT_SETTINGS.sound).toBe(true);
    expect(DEFAULT_SETTINGS.haptics).toBe(true);
  });

  it("remembers a mute across sessions", () => {
    saveSettings({ ...DEFAULT_SETTINGS, sound: false, haptics: false });
    expect(loadSettings().sound).toBe(false);
    expect(loadSettings().haptics).toBe(false);
  });
});
