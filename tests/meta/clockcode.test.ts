import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { CLOCK } from "../../src/engine/danger";
import { advisorPool } from "../../src/engine/state";
import { decodeRunCode, encodeRunCode, runCodeOf, setupOf, type RunCode } from "../../src/meta/runcode";
import { parseRecord } from "../../src/playtest/parse";
import { openRun, serialize, toFile } from "../../src/playtest/record";
import { beginRun, beginRunFromCode } from "../../src/ui/flow";

/** A run on the clock, in its code and its record (BACKLOG-13 phase 93). */
describe("a run on the clock's code", () => {
  it("is written in format 5 with the clock's decisions last, and starts the run on the clock again", () => {
    const code: RunCode = { seed: 99, align: "left", modifiers: [], unlocked: [], mandates: [], clock: CLOCK };
    const text = encodeRunCode(code);
    expect(text).toBe(`5.2r.L.-.-.-.-.-.-.${CLOCK}`);
    expect(decodeRunCode(library, text)).toEqual({ ok: true, code });
    const run = beginRunFromCode(library, code);
    expect(run.clock).toBe(CLOCK);
    expect(encodeRunCode(runCodeOf(run))).toBe(text);
    expect(setupOf(code).clock).toBe(CLOCK);
    // Any other run keeps the code it always had.
    expect(encodeRunCode({ ...code, clock: undefined })).toBe("1.2r.L.-.-.-");
  });

  it("keeps a long reign's eras, what it took over and an ending looked for, each in its place", () => {
    const rival = advisorPool(library, library.config.rivalRole, "left")[1]!.id;
    const inheritance = { band: "decay" as const, line: 2, legacies: ["seawall"], rival, rivalStanding: 41 };
    const all: RunCode = {
      seed: 99,
      align: "left",
      modifiers: [],
      unlocked: [],
      mandates: [],
      eraCount: library.config.longEraCount,
      inheritance,
      pursuit: "the_posters",
      clock: CLOCK,
    };
    expect(encodeRunCode(all)).toBe(`5.2r.L.-.-.-.${library.config.longEraCount}.decay~2~${rival}~41~seawall.the_posters.${CLOCK}`);
    expect(decodeRunCode(library, encodeRunCode(all))).toEqual({ ok: true, code: all });
  });

  it("refuses a clock of another length, or none that is a number", () => {
    expect(decodeRunCode(library, `5.abc.L.-.-.-.-.-.-.${CLOCK + 1}`)).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "5.abc.L.-.-.-.-.-.-.-")).toEqual({ ok: false, reason: "format" });
    expect(decodeRunCode(library, "5.abc.L.-.-.-.-.-.-.0")).toEqual({ ok: false, reason: "format" });
    expect(decodeRunCode(library, "5.abc.L.-.-.-.-.-.-")).toEqual({ ok: false, reason: "format" });
    // The ending looked for is checked as format 4 checks it.
    expect(decodeRunCode(library, `5.abc.L.-.-.-.-.-.leader_for_life.${CLOCK}`)).toEqual({ ok: false, reason: "content" });
  });

  it("is read in a playtest record, which a code it did not know would make unreadable", () => {
    const runs = [beginRun(library, 7, "left", [], [], undefined, null, null, null, CLOCK), beginRun(library, 7, "right")];
    const recorded = runs.map((s, i) => openRun(s, { kind: "own", run: i + 1, game: "0.101.0" }));
    expect(recorded.map((r) => r.code[0])).toEqual(["5", "1"]);
    const parsed = parseRecord(serialize(toFile(recorded)));
    expect(parsed.ok, parsed.ok ? "" : parsed.errors.join("; ")).toBe(true);
    if (!parsed.ok) return;
    const decoded = decodeRunCode(library, parsed.file.runs[0]!.code);
    expect(decoded.ok && decoded.code.clock).toBe(CLOCK);
  });
});
