// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { survivedTo } from "../../src/engine/endings";
import { getCard } from "../../src/engine/library";
import { otherSide } from "../../src/engine/replay";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { exitBand, exitDrift, newRun, rollSetup } from "../../src/engine/state";
import type { Band, GameState, Side } from "../../src/engine/types";
import { CONSEQUENCES_SHOWN, HISTORIES, HISTORY_ORDER, LEGACIES, emptyMeta, foldRun, historyOf, toldByEnding } from "../../src/meta";
import { BOTS, makeContext } from "../../src/sim";
import { Ending } from "../../src/ui/Ending";
import { endThemeOf, themeOf } from "../../src/ui/theme";
import { composeWorld } from "../../src/ui/world";

/**
 * An end screen that does not contradict itself (BACKLOG-11 phase 72): a reign cut short is told
 * as one, what the ending told is not followed up again, and a long reign's end is drawn in the
 * band it locked rather than wherever drift went after.
 */

afterEach(cleanup);
const noop = () => {};
const cfg = library.config;

/** A run the mixed bot plays from this seed, as a player would deal it. */
function played(seed: number): GameState {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s: GameState = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

let found: GameState | null = null;
/** The first dealt run whose ending told one of its legacies: the end of a story it was in. */
function toldRun(): GameState {
  for (let seed = 1; !found && seed <= 600; seed++) {
    const s = played(seed);
    if ([...toldByEnding(library, s)].some((f) => HISTORIES[f])) found = s;
  }
  if (!found) throw new Error("no run in 600 ended a story that left a legacy");
  return found;
}

/** A hand-built run that ended on its last choice, with the choices and flag dates given. */
function ended(endingId: string, choices: [string, Side][], flagSince: Record<string, number>): GameState {
  const s = newRun(library, 11, { align: "left" });
  return {
    ...s,
    cardCount: choices.length,
    choices,
    flags: [...s.flags, ...Object.keys(flagSince)],
    flagSince: { ...s.flagSince, ...flagSince },
    over: { endingId, epilogueKey: "muddle:left:1" },
  };
}

describe("a reign cut short", () => {
  it("says the card it stopped at over its name, and a reign seen through does not", () => {
    const s = newRun(library, 3, { align: "left" });
    const cut = { ...s, cardCount: 41, over: { endingId: "bankruptcy", epilogueKey: "decay:left:2" } };
    render(<Ending lib={library} state={cut} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".kicker")?.textContent).toBe(`${STRINGS.ui.cutShort.replace("{n}", "41")} · ${library.endings.get("bankruptcy")!.title}`);
    // The name stands.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(historyOf(cut, exitBand(library, cut)).title);
    cleanup();

    const done = { ...s, cardCount: 105, over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" } };
    render(<Ending lib={library} state={done} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".kicker")?.textContent).toBe(`${STRINGS.ui.ruleEnds} · ${library.endings.get("finale_muddle")!.title}`);
  });
});

describe("what the ending told", () => {
  it("is what the story that ended the run left on it, and what its last card set", () => {
    // The general unleashed by the story's first card, and the run ended by its last.
    const story = ended("assassination", [["arc_sm1", "left"], ["f", "left"], ["arc_sm3", "right"]], { general_unleashed: 1 });
    expect([...toldByEnding(library, story)]).toEqual(["general_unleashed"]);
    // The stadium, set by the very card that ended the run.
    const games = ended("the_games", [["arc_ga1", "right"], ["arc_ga3", "right"]], { stadium_built: 2 });
    expect([...toldByEnding(library, games)]).toEqual(["stadium_built"]);
  });

  it("is not a legacy some other card left, nor anything when the run did not end on a choice", () => {
    // The same general, let out of the barracks by a card outside the story.
    const elsewhere = ended("assassination", [["mn_barracks_tempt", "right"], ["arc_sm3", "right"]], { general_unleashed: 1 });
    expect(toldByEnding(library, elsewhere).size).toBe(0);
    const broke = { ...ended("bankruptcy", [["arc_sm1", "left"], ["f", "left"]], { general_unleashed: 1 }) };
    expect(toldByEnding(library, broke).size).toBe(0);
    expect(toldByEnding(library, { ...ended("assassination", [["arc_sm1", "left"], ["arc_sm3", "right"]], { general_unleashed: 1 }), choices: null }).size).toBe(0);
  });

  it("keeps the run's name and drops only the follow-ups the ending told", () => {
    const s = toldRun();
    const band = exitBand(library, s);
    const told = toldByEnding(library, s);
    const plain = historyOf(s, band);
    const after = historyOf(s, band, told);
    expect(after.key).toBe(plain.key);
    expect(after.title).toBe(plain.title);
    const carried = HISTORY_ORDER.filter((f) => s.flags.includes(f) && HISTORIES[f] && !(s.inherited?.legacies ?? []).includes(f));
    expect(plain.consequences.some((c) => told.has(c.flag))).toBe(true);
    expect(after.consequences.map((c) => c.flag)).toEqual(carried.filter((f) => !told.has(f)).slice(0, CONSEQUENCES_SHOWN));
    // The profile folds the same history the screen shows.
    const fold = foldRun(library, emptyMeta(), s);
    expect(fold.history!.key).toBe(plain.key);
    expect(fold.history!.consequences).toEqual(after.consequences);
  }, 60_000);

  it("is left out of what became of it and what was left behind, with a road back from where it was set", () => {
    const s = toldRun();
    expect(survivedTo(cfg, s.over!.endingId)).toBe(false);
    const told = toldByEnding(library, s);
    const take = vi.fn();
    render(<Ending lib={library} state={s} fold={foldRun(library, emptyMeta(), s)} onPlayAgain={noop} onCodex={noop} onSettings={noop} onTakeOtherRoad={take} />);
    const became = document.querySelector(".became")?.textContent ?? "";
    for (const f of told) if (LEGACIES[f]) expect(became).not.toContain(LEGACIES[f]!);
    // Each told legacy's card offers its other side, as a follow-up would have.
    const roads = [...new Set([...told].filter((f) => HISTORIES[f]).map((f) => s.flagSince[f]!).filter((at) => at > 0))].sort((a, b) => a - b);
    expect(roads.length).toBeGreaterThan(0);
    for (const at of roads) {
      const [id, side] = s.choices![at - 1]!;
      const label = getCard(library, id)[otherSide(side)].label;
      const button = screen.getAllByRole("button", { name: STRINGS.road.choose.replace("{label}", label) })[0]!;
      fireEvent.click(button);
      expect(take).toHaveBeenLastCalledWith(at - 1);
    }
  }, 60_000);
});

describe("a long reign's end", () => {
  const s = newRun(library, 3, { align: "left", eraCount: cfg.longEraCount });
  const locked = (band: Band, drift: number, look: number): GameState => ({ ...s, era: 5, bandLocked: true, band, drift, look });

  it("is drawn from drift held inside the band it locked, and no other run's is moved", () => {
    expect(exitDrift(library, { ...s, drift: -30 })).toBe(-30);
    expect(exitDrift(library, { ...s, drift: 24.5 })).toBe(24.5);
    expect(exitDrift(library, locked("ascent", -30, -2))).toBe(cfg.bandAscentAt);
    expect(exitDrift(library, locked("ascent", 60, 3))).toBe(60);
    expect(exitDrift(library, locked("decay", 20, 1))).toBe(cfg.bandDecayAt);
    expect(exitDrift(library, locked("muddle", 40, 3))).toBe(cfg.bandAscentAt - 1);
    expect(exitDrift(library, locked("muddle", -40, -3))).toBe(cfg.bandDecayAt + 1);
  });

  it("is shown in a look of its band: never the other side's, never paler than an ordinary end", () => {
    const gold = endThemeOf(library, locked("ascent", -30, -2));
    expect(gold.name).toBe("ascent2");
    expect(gold.band).toBe("ascent");
    expect(gold.decay).toBe(0);
    expect(endThemeOf(library, locked("ascent", 10, 1)).name).toBe("ascent2");
    expect(endThemeOf(library, locked("ascent", 60, 3)).name).toBe("ascent3");
    expect(endThemeOf(library, locked("decay", 20, 1)).name).toBe("decay2");
    expect(endThemeOf(library, locked("muddle", 40, 3)).name).toBe("ascent2");
    const free = { ...s, drift: -30, look: -2 };
    expect(endThemeOf(library, free)).toEqual(themeOf(free, cfg));
  });

  it("puts the band's look and city on the end screen", () => {
    const run = { ...locked("ascent", -30, -2), cardCount: 175, over: { endingId: "finale_long_ascent", epilogueKey: "ascent:left:5" } };
    render(<Ending lib={library} state={run} fold={null} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    expect(document.querySelector(".frame")?.getAttribute("data-theme")).toBe("ascent2");
    expect(document.querySelector(".frame")?.getAttribute("data-band")).toBe("ascent");
    const world = composeWorld({ band: "ascent", drift: cfg.bandAscentAt, align: run.align, opposition: false, flags: run.flags, seed: run.seed, era: run.era });
    expect(document.querySelector(".world-frame desc")?.textContent).toBe(world.description);
  });
});
