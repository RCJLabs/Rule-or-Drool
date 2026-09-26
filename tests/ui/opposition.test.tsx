// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { nearMisses, withNames } from "../../src/engine/endings";
import { getCard } from "../../src/engine/library";
import { LOST_OFFICE_FLAG, WON_BACK_FLAG } from "../../src/engine/opposition";
import { honestCount, resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { causeLine } from "../../src/ui/cause";
import { countBand } from "../../src/ui/count";
import { Ending } from "../../src/ui/Ending";
import { Play } from "../../src/ui/Play";
import { emptyMeta, foldRun } from "../../src/meta";
import { historyOf } from "../../src/meta/histories";
import { LEGACIES } from "../../src/meta/legacies";
import { BOTS, makeContext } from "../../src/sim";
import { runRecord, timeline } from "../../src/ui/record";
import { endCue } from "../../src/ui/useGame";
import { composeCountry, composeWorld } from "../../src/ui/world";
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

describe("the end of a run that went out of office", () => {
  const ended = (patch: Partial<GameState> = {}) =>
    ({ ...out(105), current: null, over: { endingId: `${cfg.finalePrefix}muddle`, epilogueKey: "muddle:left:3" }, ...patch }) as GameState;

  it("says under the ending that it was seen from the opposition benches, and does not say it again in the record", () => {
    // BACKLOG-11 phase 70: the finale was read, and played, as if the office had been kept.
    expect(causeLine(library, ended())).toBe(withNames(library, ended(), STRINGS.cause.out));
    expect(runRecord(library, ended()).lines.join(" ")).not.toContain("opposition benches");
    expect(causeLine(library, ended({ opposition: null, flags: [] }))).toBeNull();
  });

  it("says in the record how a run that went out came back, and a run that never went out says nothing of it", () => {
    const back = ended({ opposition: null, flags: [LOST_OFFICE_FLAG, WON_BACK_FLAG] });
    expect(runRecord(library, back).lines).toContain(STRINGS.record.office.back);
    const taken = ended({ opposition: null, flags: [LOST_OFFICE_FLAG] });
    expect(runRecord(library, taken).lines).toContain(STRINGS.record.office.taken);
    const never = runRecord(library, ended({ opposition: null, flags: [] })).lines;
    for (const line of Object.values(STRINGS.record.office)) expect(never).not.toContain(line);
  });
});

describe("what happened out of office, told (BACKLOG-11 phase 70)", () => {
  it("flies the rival's flags over the end picture of a run that ended out of office, as the country under the card did", () => {
    const world = (opposition: boolean) => composeWorld({ band: "muddle", drift: 0, align: "left", opposition, flags: [], seed: 3, era: 3 });
    expect(world(false).align).toBe("left");
    expect(world(true).align).toBe("right");
    expect(composeCountry({ stage: 0, drift: 0, align: "left", opposition: true, flags: [], seed: 3 }).office).toBe("right");
  });

  it("says it on the end screen: under the ending, and in the flags over the picture", () => {
    const over = { ...out(105), current: null, over: { endingId: `${cfg.finalePrefix}muddle`, epilogueKey: "muddle:left:3" } } as GameState;
    render(<Ending lib={library} state={over} fold={foldRun(library, emptyMeta(), over)} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".ending-cause")?.textContent).toBe(withNames(library, over, STRINGS.cause.out));
    // A run of the Commons that ended out of office: the Ledger's square flags, not its pennants.
    expect(document.querySelectorAll('.world-after [data-flag="right"]').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.world-after [data-flag="left"]').length).toBe(0);
    cleanup();
    render(<Ending lib={library} state={{ ...over, opposition: null }} fold={foldRun(library, emptyMeta(), { ...over, opposition: null })} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".ending-cause")).toBeNull();
    expect(document.querySelectorAll('.world-after [data-flag="left"]').length).toBeGreaterThan(0);
  });

  it("ends a run seen through out of office on a sound of its own", () => {
    const over = { ...out(105), current: null, over: { endingId: `${cfg.finalePrefix}muddle`, epilogueKey: "muddle:left:3" } } as GameState;
    expect(endCue(library, over)).toBe("endOut");
    expect(endCue(library, { ...over, opposition: null })).toBe("endWell");
    expect(endCue(library, { ...over, over: { endingId: "bankruptcy", epilogueKey: "decay:left:3" } })).toBe("endBadly");
  });

  it("puts the office lost, or won back, among the decisions history follows up on in nearly every run that went out", () => {
    let went = 0;
    let told = 0;
    let dated = 0;
    for (let i = 0; i < 400; i++) {
      const seed = 70_000 + i;
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s: GameState = newRun(library, seed, rollSetup(library, seed, i % 2 ? "left" : "right", []));
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        s = resolve(library, s, card.id, BOTS.informed(makeContext(library, s, card, rng, { danger: 25 })));
      }
      if (!s.flags.includes(LOST_OFFICE_FLAG)) continue;
      went++;
      const followed = historyOf(s, exitBand(library, s)).consequences.map((c) => c.flag);
      if (followed.includes(LOST_OFFICE_FLAG) || followed.includes(WON_BACK_FLAG)) told++;
      if (timeline(library, s, "").some((m) => m.text === LEGACIES[LOST_OFFICE_FLAG] && m.at === s.flagSince[LOST_OFFICE_FLAG])) dated++;
    }
    expect(went).toBeGreaterThan(100);
    // At 68th and 71st of history's 74, the two were followed up on in 31% of these runs.
    expect(told / went).toBeGreaterThanOrEqual(0.9);
    expect(dated / went).toBeGreaterThanOrEqual(0.9);
  }, 60_000);
});
