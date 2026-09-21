// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import { RUN_SAVE_VERSION } from "../../src/version";
import { clearRun, hintSeen, loadRun, markHintSeen, saveRun } from "../../src/ui/save";

describe("save", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a run", () => {
    const s = newRun(library, 42, { align: "right" });
    saveRun(s);
    expect(loadRun()).toEqual(s);
    clearRun();
    expect(loadRun()).toBeNull();
  });

  it("rejects other versions and junk", () => {
    localStorage.setItem("rod.run", JSON.stringify({ v: RUN_SAVE_VERSION + 1, state: newRun(library, 1, { align: "left" }) }));
    expect(loadRun()).toBeNull();
    localStorage.setItem("rod.run", "{not json");
    expect(loadRun()).toBeNull();
    localStorage.setItem("rod.run", JSON.stringify({ v: RUN_SAVE_VERSION, state: { seed: "x" } }));
    expect(loadRun()).toBeNull();
  });

  it("remembers the hint", () => {
    expect(hintSeen()).toBe(false);
    markHintSeen();
    expect(hintSeen()).toBe(true);
  });
});
