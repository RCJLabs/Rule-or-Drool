// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { draw } from "../../src/engine/draw";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { LEGACY_FLAGS } from "../../src/meta";
import { CountryStrip } from "../../src/ui/CountryStrip";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { GROUND, MOTIFS, SLOT_X, STRIP, composeCountry, composeWorld, stripSlotX, type Slot } from "../../src/ui/world";
import { GROUND_DRAW, RIDGE_DRAW, SHORE_DRAW, SKY_DRAW } from "../../src/ui/WorldAfter";

/**
 * The country on the play screen (BACKLOG-10 phase 64): the landmarks the end screen draws, in
 * a strip under the card, standing as the run builds them. Where the strip fits and what it
 * costs the card is measured in the browser audits; what belongs here is what it shows.
 */

afterEach(() => cleanup());

const base = { stage: 0, drift: 0, align: "left" as const, opposition: false, flags: [] as string[], seed: 7 };
const motifs = (flags: string[]) => composeCountry({ ...base, flags }).placed.map((p) => p.motif);

describe("what the country shows", () => {
  it("draws every answer to a question, and every legacy that changes the country", () => {
    // Every flag a question's cards can leave the country carrying.
    const answers = new Set<string>();
    for (const arc of library.content.arcs.filter((a) => a.question)) {
      for (const id of arc.cards) {
        const card = library.cards.get(id)!;
        for (const f of [...(card.left.setFlags ?? []), ...(card.right.setFlags ?? [])]) if (LEGACY_FLAGS.has(f)) answers.add(f);
      }
    }
    expect(answers.size).toBe(32);
    for (const f of answers) expect(MOTIFS[f], f).toBeDefined();
    // What is left undrawn happened to the reign, or is too small a thing to stand in a city:
    // losing and winning back the count, the honours list, the printing, the building code.
    const undrawn = [...LEGACY_FLAGS].filter((f) => !MOTIFS[f]).sort();
    expect(undrawn).toEqual(["codes_enforced", "honours_sold", "lost_office", "money_printed", "won_it_back"]);
  });

  it("has a drawing and words for every landmark, in the part of the world it stands in", () => {
    const tables: Record<string, Record<string, unknown>> = {
      ring: SKY_DRAW,
      station: SKY_DRAW,
      ship: SKY_DRAW,
      ridge: RIDGE_DRAW,
      wall: SHORE_DRAW,
      bridge: SHORE_DRAW,
      bay: SHORE_DRAW,
    };
    for (const [flag, { motif, slots }] of Object.entries(MOTIFS)) {
      expect(STRINGS.world.landmarks[motif], `${flag}: ${motif} has no words`).toBeTruthy();
      for (const slot of slots) expect((tables[slot] ?? GROUND_DRAW)[motif], `${flag}: ${motif} has no drawing for ${slot}`).toBeDefined();
    }
  });

  it("shows under the card exactly the landmarks the picture at the end will", () => {
    const flags = ["went_to_war", "universal_care", "seawall", "ring_started", "zoning_cleared", "habit_skim", "carbon_priced", "court_packed"];
    const end = composeWorld({ band: "muddle", drift: 0, align: "left", flags, seed: 7, era: 3 });
    expect(composeCountry({ ...base, flags }).placed).toEqual(end.placed);
    expect(motifs(["went_to_war"])).toEqual(["warships"]);
    expect(motifs(["carbon_priced"])).toEqual(["turbines"]);
  });

  it("says what it shows, for anyone who cannot see it", () => {
    expect(composeCountry(base).description).toBe(STRINGS.countryNow.empty);
    const said = composeCountry({ ...base, flags: ["seawall", "universal_care"] }).description;
    expect(said).toContain(STRINGS.world.landmarks.seawall);
    expect(said).toContain(STRINGS.world.landmarks.hospital);
  });
});

describe("the city under the card", () => {
  const at = (stage: number, drift: number, seed = 7) => composeCountry({ ...base, stage, drift, seed });

  it("stays where it is from card to card, whatever the look does", () => {
    const places = (c: ReturnType<typeof at>) => c.towers.map((t) => [t.x, t.w]);
    const calm = at(0, 0);
    for (const [stage, drift] of [[1, 12], [3, 50], [-2, -25], [-3, -60]] as const) expect(places(at(stage, drift))).toEqual(places(calm));
    expect(at(0, 0)).toEqual(calm);
    expect(places(at(0, 0, 8))).not.toEqual(places(calm));
    // It runs the width of the strip.
    expect(calm.towers[0]!.x).toBeLessThanOrEqual(0);
    expect(calm.towers.at(-1)!.x + calm.towers.at(-1)!.w).toBeGreaterThanOrEqual(STRIP.width - 40);
  });

  it("builds taller on the way up and breaks on the way down, and keeps some sky above it", () => {
    const mean = (c: ReturnType<typeof at>) => c.towers.reduce((n, t) => n + t.h, 0) / c.towers.length;
    const up = at(3, 60);
    const down = at(-3, -60);
    const calm = at(0, 0);
    expect(mean(up)).toBeGreaterThan(mean(calm) * 1.3);
    expect(mean(calm)).toBeGreaterThan(mean(down));
    expect(down.towers.some((t) => t.broken)).toBe(true);
    expect(up.towers.some((t) => t.spire)).toBe(true);
    expect(calm.towers.some((t) => t.broken || t.spire)).toBe(false);
    // The Ascent's towers stop short of the strip's top, so the landmarks in front still read.
    expect(Math.max(...up.towers.map((t) => t.h))).toBeLessThan(GROUND - STRIP.top - 10);
  });

  it("follows the look, not the band: a run that has turned shows it at once", () => {
    expect(at(-1, -10).band).toBe("decay");
    expect(at(1, 10).band).toBe("ascent");
    expect(at(0, 7).band).toBe("muddle");
  });

  it("flies the flags of whoever holds the office", () => {
    expect(composeCountry(base).office).toBe("left");
    expect(composeCountry({ ...base, opposition: true }).office).toBe("right");
    expect(composeCountry({ ...base, align: "right", opposition: true }).office).toBe("left");
    expect(composeCountry(base).flagged).toHaveLength(3);
  });

  it("stands every ground landmark in the part of the strip every phone shows", () => {
    for (const slot of Object.keys(SLOT_X) as Slot[]) {
      const [x, w] = stripSlotX(slot)!;
      expect(x, slot).toBeGreaterThanOrEqual(STRIP.safe[0]);
      expect(x + w, slot).toBeLessThanOrEqual(STRIP.safe[1]);
    }
  });
});

describe("the strip", () => {
  const strip = (flags: string[]) => <CountryStrip country={composeCountry({ ...base, flags })} />;
  const rising = () => [...document.querySelectorAll("[data-motif]")].filter((g) => g.querySelector(".rising")).map((g) => g.getAttribute("data-motif"));

  it("is an image named by what it shows", () => {
    render(strip(["seawall", "universal_care"]));
    const svg = document.querySelector("svg.country")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe(composeCountry({ ...base, flags: ["seawall", "universal_care"] }).description);
    expect([...svg.querySelectorAll("[data-motif]")].map((g) => g.getAttribute("data-motif")).sort()).toEqual(["hospital", "seawall"]);
  });

  it("raises a landmark as it is built, not the ones already standing", () => {
    const { rerender } = render(strip(["seawall"]));
    // Taking a run up again is not a parade: what stood before is simply there.
    expect(rising()).toEqual([]);
    rerender(strip(["seawall", "universal_care"]));
    expect(rising()).toEqual(["hospital"]);
    // Drawn again with nothing new, as when the card is dragged: the rise is not cut short.
    rerender(strip(["seawall", "universal_care"]));
    expect(rising()).toEqual(["hospital"]);
    rerender(strip(["seawall", "universal_care", "went_to_war"]));
    expect(rising()).toEqual(["warships"]);
  });
});

describe("on the play screen", () => {
  const noop = () => {};
  const live = () => document.querySelector("[aria-live='polite']")!.textContent ?? "";
  const play = (state: GameState) => (
    <Play lib={library} state={state} transition={null} onChoose={noop} onDismissTransition={noop} debug={false} settings={DEFAULT_SETTINGS} onSettings={noop} onCabinet={noop} onTaught={noop} />
  );

  it("is drawn under the card, and says aloud what the last card built", () => {
    const first = draw(library, newRun(library, 21, { align: "left" }));
    const s1 = { ...first, flags: [...first.flags, "ring_started"] };
    const { rerender } = render(play(s1));
    expect(document.querySelector("svg.country")).not.toBeNull();
    // What stood already is in the strip's own words, not announced as new.
    expect(live()).not.toContain(STRINGS.countryNow.rose.split("{")[0]!);
    const s2 = { ...s1, cardCount: s1.cardCount + 1, flags: [...s1.flags, "seawall"] };
    rerender(play(s2));
    expect(live()).toContain(STRINGS.countryNow.rose.replace("{landmark}", STRINGS.world.landmarks.seawall!));
    expect(live()).not.toContain(STRINGS.countryNow.rose.replace("{landmark}", STRINGS.world.landmarks.ring!));
  });
});
