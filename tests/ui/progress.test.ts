import { afterEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { emptyMeta } from "../../src/meta";
import { progressCode, progressJson, progressSummary, readProgress } from "../../src/ui/progress";
import { DEFAULT_SETTINGS, type Settings } from "../../src/ui/settings";
import { META_SAVE_VERSION, SETTINGS_VERSION } from "../../src/version";
import { playedProfile } from "./profile";

const SETTINGS: Settings = { ...DEFAULT_SETTINGS, reduceMotion: true, showChoices: true, taught: ["meters", "drift"] };

afterEach(() => vi.unstubAllGlobals());

describe("moving progress", () => {
  const meta = playedProfile();

  it("carries a forty-run profile and its settings through a code exactly", async () => {
    const code = await progressCode(meta, SETTINGS);
    expect(code.startsWith("RD1.")).toBe(true);
    // Measured: 7.1 KB of profile was about 2.2 KB of code, short enough to paste. Sixteen
    // questions (BACKLOG-6 phase 41) grew a forty-run profile's story outcomes and legacies:
    // 9.6 KB of profile is now about 3.1 KB of code, still short enough to paste.
    expect(code.length).toBeLessThan(4000);
    const back = await readProgress(code);
    expect(back).toMatchObject({ ok: true });
    if (!back.ok) return;
    expect(back.meta).toEqual(meta);
    expect(back.settings).toEqual(SETTINGS);
  });

  it("and through a file, and a link with the code in it", async () => {
    const fromFile = await readProgress(progressJson(meta, SETTINGS));
    expect(fromFile.ok && fromFile.meta).toEqual(meta);
    const code = await progressCode(meta, SETTINGS);
    const fromLink = await readProgress(`https://rcjlabs.github.io/Rule-or-Drool/#progress=${code}`);
    expect(fromLink.ok && fromLink.meta).toEqual(meta);
  });

  it("still makes a code a reader can take in a browser that cannot compress", async () => {
    vi.stubGlobal("CompressionStream", undefined);
    const code = await progressCode(meta, SETTINGS);
    expect(code.startsWith("RD1u.")).toBe(true);
    const back = await readProgress(code);
    expect(back.ok && back.meta).toEqual(meta);
  });

  it("refuses progress from a newer version of the game, and says which", async () => {
    const newer = (patch: (e: Record<string, any>) => void) => {
      const e = JSON.parse(progressJson(meta, SETTINGS));
      patch(e);
      return readProgress(JSON.stringify(e));
    };
    expect(await newer((e) => ((e.meta.v = META_SAVE_VERSION + 1), (e.game = "0.99.0")))).toEqual({ ok: false, reason: "newer", game: "0.99.0" });
    expect(await newer((e) => (e.settings.v = SETTINGS_VERSION + 1))).toMatchObject({ ok: false, reason: "newer" });
    expect(await newer((e) => (e.v = 2))).toMatchObject({ ok: false, reason: "newer" });
  });

  it("brings an older profile forward the way a saved one is", async () => {
    // A version-4 profile had no histories; the migration gives it an empty collection.
    const e = JSON.parse(progressJson(meta, SETTINGS));
    e.meta.v = 4;
    delete e.meta.histories;
    const back = await readProgress(JSON.stringify(e));
    expect(back.ok && back.meta.histories).toEqual({});
    expect(back.ok && back.meta.runs).toBe(40);
  });

  it("refuses what is not a code", async () => {
    const code = await progressCode(meta, SETTINGS);
    for (const text of ["hello", "RD1.!!!!", code.slice(0, 200), JSON.stringify({ format: "rule-or-drool-playtest", v: 1 }), "{not json"]) {
      expect(await readProgress(text)).toMatchObject({ ok: false, reason: "unreadable" });
    }
  });

  it("will not unpack a code into more than a profile could ever be", async () => {
    // A megabyte of one character compresses to a few kilobytes: small to send, large to open.
    // A valid profile in every other way, so only the size can be what turns it away.
    const bomb = new TextEncoder().encode(`{"format":"rule-or-drool-progress","v":1,"game":"0.45.0","meta":{"v":${META_SAVE_VERSION},"runs":0,"pad":"${"x".repeat(2_000_000)}"},"settings":{"v":${SETTINGS_VERSION}}}`);
    const packed = new Uint8Array(await new Response(new Blob([bomb]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer());
    let s = "";
    for (const b of packed) s += String.fromCharCode(b);
    const code = "RD1." + btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(code.length).toBeLessThan(20_000);
    expect(await readProgress(code)).toEqual({ ok: false, reason: "unreadable" });
  });

  it("says so when this browser cannot open a compressed code", async () => {
    const code = await progressCode(meta, SETTINGS);
    vi.stubGlobal("DecompressionStream", undefined);
    expect(await readProgress(code)).toEqual({ ok: false, reason: "cannotUnpack" });
  });

  it("sums a profile up in the numbers a player would miss", () => {
    expect(progressSummary(library, meta)).toMatchObject({ runs: 40, unlocks: meta.unlocks.length, endingsTotal: library.endings.size });
    expect(progressSummary(library, emptyMeta())).toEqual({ runs: 0, endings: 0, endingsTotal: library.endings.size, unlocks: 0, dailies: 0, streak: 0 });
    // A streak is the thing a replace would lose that no other number shows (BACKLOG-5 phase 38).
    const day = (d: string) => ({ day: d, history: null, ending: "riots", cards: 40 });
    const dailies = [day("2026-09-19"), day("2026-09-21"), day("2026-09-22")];
    expect(progressSummary(library, { ...emptyMeta(), dailies }, "2026-09-23")).toMatchObject({ dailies: 3, streak: 2 });
  });
});
