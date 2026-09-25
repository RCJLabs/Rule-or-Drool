// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { newRun } from "../../src/engine/state";
import type { Card, GameState } from "../../src/engine/types";
import { countLine, type CountBand } from "../../src/ui/count";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";
import { LESSONS_BY_ID } from "../../src/ui/teach";

/**
 * A campaign card says where the count stands before the vote it campaigns for (BACKLOG-10
 * phase 56), in the same bands the election card uses, so the line can be acted on.
 */

const cfg = library.config;
const campaign = library.campaignCards.find((c) => c.align === "any" && !c.text.includes("{rival}"))!;
const vote = library.electionCards.find((c) => c.align === "any" || c.align === "left")!;

/** Two cards before the first vote, with every bloc `short` under the bar and this card on the table. */
function standing(short: number, card: Card = campaign): GameState {
  const s = newRun(library, 9, { align: "left" });
  const bloc = cfg.electionMoodThreshold - short;
  return { ...s, cardCount: cfg.electionInterval - cfg.campaignLead, current: card.id, currentFrom: "campaign", drift: 0, rivalStanding: cfg.rivalStart, meters: { ...s.meters, base: bloc, backers: bloc, public: bloc } };
}

const noop = () => {};
const show = (state: GameState) =>
  render(<Play lib={library} state={state} transition={null} onChoose={noop} onDismissTransition={noop} debug={false} settings={DEFAULT_SETTINGS} onSettings={noop} onCabinet={noop} onTaught={noop} />);
const said = () => document.querySelector("[aria-live='polite']")!.textContent ?? "";

afterEach(() => cleanup());

describe("a campaign card on the table", () => {
  it("says where the count stands, under its text and aloud", () => {
    const { container } = show(standing(2));
    const line = container.querySelector(".card .count-line")!;
    expect(line.textContent).toBe(STRINGS.standing.narrowLoss);
    expect(line.getAttribute("data-band")).toBe("narrowLoss");
    expect(said()).toContain(`${STRINGS.standing.narrowLoss}.`);
  });

  it("reads the count the vote after it will be decided by", () => {
    for (const short of [20, 3, 0, -3, -10, -25]) {
      const s = standing(short);
      const here = countLine(library, s, campaign)!;
      const there = countLine(library, { ...s, current: vote.id, currentFrom: "election" }, vote)!;
      expect([here.band, here.wins], `${short} under`).toEqual([there.band, there.wins]);
    }
  });

  it("is in words, and never longer than the election card's own line", () => {
    for (const band of Object.keys(STRINGS.count) as CountBand[]) {
      expect(STRINGS.standing[band]).not.toMatch(/\d/);
      expect(STRINGS.standing[band].length).toBeLessThanOrEqual(STRINGS.count[band].length);
    }
  });

  it("teaches the campaign, on a campaign card and nowhere else", () => {
    const lesson = LESSONS_BY_ID.get("campaign")!;
    const s = standing(2);
    expect(lesson.when({ state: s, card: campaign, from: "campaign", restless: null })).toBe(true);
    const ordinary = library.content.cards.find((c) => c.type === "event" && !c.campaign && !c.opposition)!;
    expect(lesson.when({ state: { ...s, current: ordinary.id }, card: ordinary, from: "deck", restless: null })).toBe(false);
    expect(lesson.body("").length).toBeLessThanOrEqual(163);
  });
});
