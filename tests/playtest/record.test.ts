import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { resolve } from "../../src/engine/resolve";
import { newRun } from "../../src/engine/state";
import { METER_KEYS } from "../../src/engine/types";
import { decodeRunCode, setupOf } from "../../src/meta/runcode";
import { CardClock } from "../../src/playtest/clock";
import { parseRecord } from "../../src/playtest/parse";
import { meterList, openRun, serialize, toFile } from "../../src/playtest/record";
import { advisorPool, crisisOffer } from "../../src/engine/state";
import { beginRun } from "../../src/ui/flow";
import { recordRun } from "./helpers";

describe("the record of a run", () => {
  it("reads back exactly as it was written, and holds the whole run", () => {
    const { run, state } = recordRun(31);
    const text = serialize(toFile([run]));
    const parsed = parseRecord(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.file.runs).toEqual([run]);
    expect(run.end).toEqual({ ending: state.over!.endingId, era: state.era, cards: state.cardCount, band: expect.any(String) });
    expect(run.cards).toHaveLength(state.cardCount);
    // Each card's after is the next card's before: nothing moves the meters between two cards.
    for (let i = 1; i < run.cards.length; i++) expect(run.cards[i]!.before).toEqual(run.cards[i - 1]!.after);
  });

  it("is laid out a card to a line, so a tester can read what they are sending", () => {
    const { run } = recordRun(32);
    const lines = serialize(toFile([run])).trimEnd().split("\n");
    // The file's head, the run's head, one line per card, and the two closings.
    expect(lines).toHaveLength(run.cards.length + 4);
    expect(lines[2]).toMatch(/^\{"card":"[a-z0-9_]+","side":"(left|right)","ms":\d+,/);
  });

  it("carries enough to replay the run: its code starts the same run, and the same sides play the same cards", () => {
    const { run } = recordRun(33);
    const decoded = decodeRunCode(library, run.code);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    let s = newRun(library, decoded.code.seed, setupOf(decoded.code));
    expect(meterList(s.meters)).toEqual(run.cards[0]!.before);
    for (const c of run.cards) {
      s = draw(library, s);
      expect(s.current).toBe(c.card);
      s = resolve(library, s, s.current!, c.side);
    }
    expect(s.over?.endingId).toBe(run.end!.ending);
  });

  it("holds game state and nothing else: every field is one the format names", () => {
    const { run } = recordRun(34);
    const file = JSON.parse(serialize(toFile([{ ...run, cards: run.cards.map((c, i) => (i === 0 ? { ...c, resumed: true as const } : c)) }])));
    expect(Object.keys(file)).toEqual(["format", "v", "meters", "runs"]);
    expect(file.meters).toEqual([...METER_KEYS]);
    // The deck it was dealt from rides beside the version (BACKLOG-8 phase 49).
    expect(Object.keys(file.runs[0])).toEqual(["game", "deck", "code", "kind", "run", "end", "cards"]);
    expect(Object.keys(file.runs[0].end)).toEqual(["ending", "era", "cards", "band"]);
    const cardKeys = new Set(file.runs[0].cards.flatMap((c: object) => Object.keys(c)));
    expect([...cardKeys].sort()).toEqual(["after", "before", "card", "drift", "looked", "ms", "resumed", "side"]);
    // No date, no clock time: durations only. The only strings are ids, the code, the version and the deck.
    expect(serialize(toFile([run]))).not.toMatch(/\d{4}-\d{2}-\d{2}|T\d{2}:\d{2}/);
  });
});

describe("reading a record back", () => {
  const good = () => JSON.parse(serialize(toFile([recordRun(35).run])));
  const refuse = (mutate: (f: any) => void, path: RegExp) => {
    const f = good();
    mutate(f);
    const parsed = parseRecord(JSON.stringify(f));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.join("\n")).toMatch(path);
  };

  it("refuses a field the format does not have, at any level", () => {
    // A reader that skipped unknown fields would pass a file that broke the promise made to
    // the tester, that it holds game state and nothing else.
    refuse((f) => (f.device = "Pixel 7"), /^device: unknown field/m);
    refuse((f) => (f.runs[0].settings = { showChoices: true }), /^runs\[0\]\.settings: unknown field/m);
    refuse((f) => (f.runs[0].cards[3].date = "2026-09-23"), /^runs\[0\]\.cards\[3\]\.date: unknown field/m);
    refuse((f) => (f.runs[0].end.player = "sam"), /^runs\[0\]\.end\.player: unknown field/m);
  });

  it("refuses values out of their range or shape", () => {
    refuse((f) => (f.runs[0].cards[0].ms = -5), /cards\[0\]\.ms: must be >= 0/);
    refuse((f) => (f.runs[0].cards[0].side = "up"), /cards\[0\]\.side: expected one of/);
    refuse((f) => (f.runs[0].cards[0].before = [50, 50]), /cards\[0\]\.before: expected 6 entries/);
    refuse((f) => (f.runs[0].cards[0].resumed = false), /cards\[0\]\.resumed: can only be true/);
    refuse((f) => (f.runs[0].code = "hello"), /runs\[0\]\.code: a run code/);
    refuse((f) => (f.runs[0].kind = "bot"), /runs\[0\]\.kind: expected one of/);
    refuse((f) => (f.meters = [...f.meters].reverse()), /^meters: expected base, backers/m);
    refuse((f) => (f.format = "something-else"), /^format: expected one of/m);
    refuse((f) => (f.v = 2), /^v: must be <= 1/m);
  });

  it("reads a long reign's code, which carries its era count (BACKLOG-5 phase 39)", () => {
    const f = good();
    f.runs[0].code = f.runs[0].code.replace(/^1\./, "2.") + ".5";
    expect(parseRecord(JSON.stringify(f)).ok).toBe(true);
    refuse((g) => (g.runs[0].code = g.runs[0].code + ".5"), /runs\[0\]\.code: a run code/);
    refuse((g) => (g.runs[0].code = g.runs[0].code.replace(/^1\./, "2.")), /runs\[0\]\.code: a run code/);
  });

  it("reads the code of every kind of run the game writes, and the crisis a run passed over", () => {
    // A platform of two promises, a run that took over, one that went looking for an ending, a long
    // reign, a short term and a run that picked its crisis. Until BACKLOG-13 phase 84 the first
    // three made a whole record unreadable: the pattern knew formats 1 and 2, and one promise.
    const rival = advisorPool(library, library.config.rivalRole, "left")[0]!.id;
    const inheritance = { band: "decay" as const, line: 2, legacies: ["seawall"], rival, rivalStanding: 40 };
    const offer = crisisOffer(library, 7, "right")!;
    const runs = [
      beginRun(library, 7, "left", [], ["m_broad", "m_loyal"]),
      beginRun(library, 7, "left", [], [], undefined, inheritance),
      beginRun(library, 7, "right", [], [], undefined, null, "leader_for_life"),
      beginRun(library, 7, "left", [], [], library.config.longEraCount),
      beginRun(library, 7, "left", [], [], library.config.firstTermEras, inheritance, "the_posters"),
      beginRun(library, 7, "right", [], [], undefined, null, null, offer[1]),
    ];
    const recorded = runs.map((s, i) => openRun(s, { kind: "own", run: i + 1, game: "0.92.0" }));
    expect(recorded.map((r) => r.code[0])).toEqual(["1", "3", "4", "2", "4", "1"]);
    const parsed = parseRecord(serialize(toFile(recorded)));
    expect(parsed.ok, parsed.ok ? "" : parsed.errors.join("; ")).toBe(true);
    if (!parsed.ok) return;
    parsed.file.runs.forEach((r, i) => {
      const decoded = decodeRunCode(library, r.code);
      expect(decoded.ok && newRun(library, runs[i]!.seed, setupOf(decoded.code)).modifiers).toEqual(runs[i]!.modifiers);
    });
    expect(parsed.file.runs[5]!.passedOver).toBe(offer[0]);
    expect(parsed.file.runs.slice(0, 5).every((r) => r.passedOver === undefined)).toBe(true);
    refuse((f) => (f.runs[0].passedOver = "A war"), /runs\[0\]\.passedOver/);
  });

  it("says what is wrong with a file that is not JSON", () => {
    const parsed = parseRecord("notes from the playtest");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors[0]).toMatch(/^not JSON/);
  });

  it("takes a run left unfinished, and a record with no runs", () => {
    const { run } = recordRun(36);
    const left = { ...run, end: null, cards: run.cards.slice(0, 5) };
    expect(parseRecord(serialize(toFile([left]))).ok).toBe(true);
    expect(parseRecord(serialize(toFile([]))).ok).toBe(true);
  });
});

describe("the clock in front of a card", () => {
  const fake = () => {
    let t = 1000;
    return { now: () => t, tick: (ms: number) => (t += ms) };
  };

  it("counts only the time the card is in view, and each side's preview within it", () => {
    const f = fake();
    const clock = new CardClock(f.now);
    f.tick(2000);
    clock.setPreview("right");
    f.tick(700);
    clock.setPreview(null);
    f.tick(300);
    clock.setRunning(false); // a menu opens, or the phone is put down
    f.tick(60_000);
    clock.setRunning(true);
    clock.setPreview("left");
    f.tick(250);
    expect(clock.read()).toEqual({ ms: 3250, looked: [250, 700] });
  });

  it("starts stopped when the card arrives out of view, and a preview up while stopped adds nothing", () => {
    const f = fake();
    const clock = new CardClock(f.now, false);
    clock.setPreview("left");
    f.tick(5000);
    clock.setRunning(true);
    f.tick(400);
    expect(clock.read()).toEqual({ ms: 400, looked: [400, 0] });
  });
});
