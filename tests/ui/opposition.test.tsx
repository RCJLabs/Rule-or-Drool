// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { nearMisses, withNames } from "../../src/engine/endings";
import { LOST_OFFICE_FLAG } from "../../src/engine/opposition";
import { honestCount } from "../../src/engine/resolve";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { countBand } from "../../src/ui/count";
import { Play } from "../../src/ui/Play";
import { runRecord } from "../../src/ui/record";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { LESSONS_BY_ID } from "../../src/ui/teach";

/**
 * Out of office (BACKLOG-10 phase 55): the screen says so, and who holds the office; only the
 * coalition is shown in danger; the return vote reads a kinder bar; the end says a run ended out.
 */

const cfg = library.config;
const deckCard = library.oppositionCards.find((c) => c.align === "any")!;
const returnVote = library.returnVotes.find((c) => c.align === "any")!;

function out(played: number, patch: Partial<GameState> = {}): GameState {
  const s = newRun(library, 7, { align: "left" });
  return {
    ...s,
    cardCount: played,
    current: deckCard.id,
    currentFrom: "opposition",
    flags: [LOST_OFFICE_FLAG],
    opposition: { since: 26, returnAt: cfg.eraLength - 1 },
    ...patch,
  };
}

const noop = () => {};
const show = (state: GameState) =>
  render(<Play lib={library} state={state} transition={null} onChoose={noop} onDismissTransition={noop} debug={false} settings={DEFAULT_SETTINGS} onSettings={noop} onCabinet={noop} onTaught={noop} />);
const said = () => document.querySelector("[aria-live='polite']")!.textContent ?? "";

afterEach(() => cleanup());

describe("out of office, on the table", () => {
  it("says so on the first card, with who holds the office, and aloud", () => {
    const s = out(26);
    const { container } = show(s);
    expect(container.querySelector(".party")!.textContent).toBe(STRINGS.opposition.chip.replace("{party}", STRINGS.parties.left));
    const note = withNames(library, s, STRINGS.opposition.wentOut);
    expect(note).not.toContain("{rival}");
    expect(container.querySelector(".opposition-note")!.textContent).toBe(note);
    expect(said()).toContain(note);
  });

  it("keeps the chip and drops the note after the first card", () => {
    const { container } = show(out(28));
    expect(container.querySelector(".party")!.textContent).toContain(STRINGS.parties.left);
    expect(container.querySelector(".party")!.textContent).not.toBe(STRINGS.parties.left);
    expect(container.querySelector(".opposition-note")).toBeNull();
  });

  it("shows only the coalition in danger, and names only the coalition's endings as near", () => {
    const base = out(28);
    const s = { ...base, meters: { ...base.meters, money: 4, inst: 97, base: 6 } };
    const { container } = show(s);
    const danger = [...container.querySelectorAll(".meter.danger")].map((m) => m.getAttribute("aria-label") ?? "");
    expect(danger).toHaveLength(1);
    expect(nearMisses(library, s, 12).map((n) => n.endingId)).toEqual([cfg.meterEndings.base.low]);
    // In office the same meters are three dangers, and the state's endings are near too.
    const inOffice = { ...s, opposition: null };
    expect(nearMisses(library, inOffice, 12).map((n) => n.endingId)).toContain(cfg.meterEndings.money.low);
  });

  it("puts the return vote to a bar the government has worn down, and the line reads it", () => {
    const bloc = cfg.electionMoodThreshold - cfg.returnSwing;
    const base = out(cfg.eraLength - 1, { current: returnVote.id, currentFrom: "election" });
    const s = { ...base, rivalStanding: cfg.rivalStart, drift: 0, meters: { ...base.meters, base: bloc, backers: bloc, public: bloc } };
    // Won out of office, where the same coalition in office would lose.
    expect(honestCount(library, s).wins).toBe(true);
    expect(honestCount(library, { ...s, opposition: null }).wins).toBe(false);
    const { container } = show(s);
    expect(container.querySelector(".count-line")!.textContent).toBe(STRINGS.count[countBand(honestCount(library, s))]);
  });

  it("teaches what it means, once, and only out of office", () => {
    const lesson = LESSONS_BY_ID.get("opposition")!;
    const s = out(26);
    expect(lesson.when({ state: s, card: deckCard, from: "opposition", restless: null, abolished: false })).toBe(true);
    expect(lesson.when({ state: { ...s, opposition: null }, card: deckCard, from: "deck", restless: null, abolished: false })).toBe(false);
    expect(lesson.body("").length).toBeLessThanOrEqual(163);
  });
});

describe("the record of a run that ended out of office", () => {
  it("says so, and a run in office says nothing of it", () => {
    const ended = { ...out(105), current: null, over: { endingId: `${cfg.finalePrefix}muddle`, epilogueKey: "muddle:left:3" } } as GameState;
    expect(runRecord(library, ended).lines).toContain(STRINGS.opposition.endedOut);
    expect(runRecord(library, { ...ended, opposition: null }).lines).not.toContain(STRINGS.opposition.endedOut);
  });
});
