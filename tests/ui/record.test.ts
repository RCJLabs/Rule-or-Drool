import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { runRecord, timeline } from "../../src/ui/record";

const base = () => newRun(library, 11, rollSetup(library, 11, "left", []));
// Omit rather than intersect: Partial<GameState> already carries a full `stats`, so an
// intersection asks for every counter rather than the two a case is about.
type Over = Omit<Partial<GameState>, "stats"> & { stats?: Partial<GameState["stats"]> };
const at = (over: Over): GameState => {
  const b = base();
  return { ...b, ...over, stats: { ...b.stats, ...(over.stats ?? {}) } } as GameState;
};
const rec = (over: Parameters<typeof at>[0]) => runRecord(library, at(over));

/**
 * `finale_muddle` is 64.2% of a competent player's endings and drew two texts — the epilogue
 * is keyed band:align:era and a finale always has era 3. Measured over 1,925 of them, two
 * runs read the same 50.0% of the time before this and 0.07% after (BACKLOG-3 phase 27).
 */
describe("the record of a reign", () => {
  it("counts both kinds of election without mangling a plural", () => {
    // "You won 1 votes honestly and counted 1 others twice" is how this goes wrong.
    expect(rec({ stats: { electionsHonest: 1, electionsCheated: 1 } }).lines[0]).toBe(
      "You won one vote honestly and counted one other twice.",
    );
    expect(rec({ stats: { electionsHonest: 3, electionsCheated: 2 } }).lines[0]).toBe(
      "You won 3 votes honestly and counted 2 others twice.",
    );
    expect(rec({ stats: { electionsHonest: 1, electionsCheated: 0 } }).lines[0]).toBe(
      "You won one vote honestly, and counted nothing twice.",
    );
    expect(rec({ stats: { electionsHonest: 0, electionsCheated: 2 } }).lines[0]).toBe(STRINGS.record.votes.neverClean);
    expect(rec({ stats: { electionsHonest: 0, electionsCheated: 0 } }).lines[0]).toBe(STRINGS.record.votes.none);
  });

  it("does not count the rival as somebody who stayed", () => {
    // The rival holds a cabinet slot from the first day and was never yours to keep.
    const since = Object.fromEntries(Object.keys(base().cabinetSince).map((r) => [r, 0]));
    const line = rec({ cabinetSince: since, stats: { firedAdvisors: ["adv_vole"] } }).lines[1]!;
    expect(line).toContain(`${Object.keys(since).length - 1} of the people`);
  });

  it("says nobody was let go without inventing a number", () => {
    expect(rec({ stats: { firedAdvisors: [] } }).lines[1]).toBe(STRINGS.record.room.nobody);
  });

  it("does not say everyone who started was there when the room changed without a firing", () => {
    // Each era after the first appoints someone (BACKLOG-10 phase 61), and the rival can take
    // someone (phase 65): nobody let go is then not everyone still there.
    const since = { ...base().cabinetSince, chief: 40 };
    const originals = Object.entries(since).filter(([r, at]) => at === 0 && r !== library.config.rivalRole).length;
    expect(rec({ cabinetSince: since, stats: { firedAdvisors: [] } }).lines[1]).toBe(STRINGS.record.room.nobodyChanged.replace("{k}", String(originals)));
  });

  it("says how many went over to the rival, by the rival's name", () => {
    const b = base();
    const rival = library.advisorsById.get(b.cabinet[library.config.rivalRole]!)!.name;
    const one = rec({ flags: [...b.flags, "rival_poached", "poached_adv_vole"] }).lines;
    expect(one).toContain(STRINGS.record.room.poachedOne.replace("{rival}", rival));
    const two = rec({ flags: [...b.flags, "rival_poached", "poached_adv_vole", "poached_adv_ferris"] }).lines;
    expect(two).toContain(STRINGS.record.room.poachedMany.replace("{n}", "2").replace("{rival}", rival));
    expect(rec({}).lines.some((l) => l.includes(rival) && l.includes("went over"))).toBe(false);
  });

  it("puts who went over to the rival on the timeline, when they went", () => {
    const b = base();
    const rival = library.advisorsById.get(b.cabinet[library.config.rivalRole]!)!.name;
    const vole = library.advisorsById.get("adv_vole")!.name;
    const run = at({ cardCount: 60, flags: [...b.flags, "rival_poached", "poached_adv_vole"], flagSince: { ...b.flagSince, rival_poached: 31, poached_adv_vole: 31 } });
    const moment = timeline(library, run, "The end").find((m) => m.text === STRINGS.timeline.poached.replace("{who}", vole).replace("{rival}", rival));
    expect(moment).toMatchObject({ at: 31, kind: "decision" });
  });

  it("names what the country carries, and says so plainly when it carries nothing", () => {
    const some = rec({ flags: ["cheated_election", "schools_starved", "east_talks"] });
    expect(some.carried).toEqual(["An election was counted twice", "The schools were starved"]);
    expect(some.lines[2]).toBe("The country is still carrying 2 things you did to it.");
    const none = rec({ flags: ["east_talks"] });
    expect(none.carried).toEqual([]);
    expect(none.lines[2]).toBe(STRINGS.record.carrying.nothing);
    expect(rec({ flags: ["seawall"] }).lines[2]).toBe(STRINGS.record.carrying.one);
  });

  it("reads differently for two runs that did different things", () => {
    const a = rec({ stats: { electionsHonest: 2, electionsCheated: 0, firedAdvisors: [] }, flags: ["seawall"] });
    const b = rec({ stats: { electionsHonest: 0, electionsCheated: 3, firedAdvisors: ["adv_vole", "adv_ferris"] }, flags: ["purge_begun", "media_captured"] });
    expect(a.lines).not.toEqual(b.lines);
    expect(a.carried).not.toEqual(b.carried);
  });
});
