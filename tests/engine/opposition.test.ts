import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { LOST_OFFICE_FLAG, WON_BACK_FLAG } from "../../src/engine/opposition";
import { preview } from "../../src/engine/preview";
import { electionBar, losingEnding, resolve } from "../../src/engine/resolve";
import { honestWins, newRun } from "../../src/engine/state";
import type { GameState, Side } from "../../src/engine/types";
import { migrateRun } from "../../src/ui/save";

/**
 * BACKLOG-10 phase 55: the first honest vote a run loses sends it into opposition until the
 * era ends, where a return vote decides whether it comes back. A second lost vote ends it.
 */

const cfg = library.config;
const vote = getCard(library, "e_rig");
const honest: Side = vote.left.honest ? "left" : "right";
const cheat: Side = honest === "left" ? "right" : "left";

/** A run in era `era` with the given card on the table after `played` cards, and every bloc at `bloc`. */
function at(card: string, played: number, bloc: number, era = Math.floor(played / cfg.eraLength) + 1, patch: Partial<GameState> = {}): GameState {
  const s = newRun(library, 7, { align: "left" });
  return { ...s, era, cardCount: played, current: card, currentFrom: "election", drift: 0, rivalStanding: cfg.rivalStart, nextElectionAt: played, meters: { ...s.meters, base: bloc, backers: bloc, public: bloc }, ...patch };
}

/** The same run, out of office since `since`, with the return vote on the table. */
function returning(bloc: number, patch: Partial<GameState> = {}): GameState {
  const ret = library.returnVotes.find((c) => c.align === "any")!;
  const s = at(ret.id, cfg.eraLength - 1, bloc, 1, { flags: [LOST_OFFICE_FLAG], opposition: { since: 26, returnAt: cfg.eraLength - 1 }, ...patch });
  return s;
}

const low = cfg.electionMoodThreshold - 6;

describe("losing the count", () => {
  it("puts the run out of office the first time, and holds the rest of the era for it", () => {
    const before = at(vote.id, 25, low, 1, { queue: [{ id: "opb_tax_cut", dueAt: 30 }] });
    expect(preview(library, before, vote, honest)).toMatchObject({ endingId: null, outOfOffice: true });
    const after = resolve(library, before, vote.id, honest);
    expect(after.over).toBeNull();
    // Out since the vote, which was card 26; back, if at all, on the era's last card.
    expect(after.opposition).toEqual({ since: 26, returnAt: cfg.eraLength - 1 });
    expect(after.flags).toContain(LOST_OFFICE_FLAG);
    // The bills wait for whoever holds the office next: moved on by the cards left in the era.
    expect(after.queue).toEqual([{ id: "opb_tax_cut", dueAt: 30 + (cfg.eraLength - 26) }]);
  });

  it("ends the run the second time, as every lost vote used to", () => {
    const before = at(vote.id, 60, low, 2, { flags: [LOST_OFFICE_FLAG] });
    const after = resolve(library, before, vote.id, honest);
    expect(after.over?.endingId).toBe(losingEnding(library, before));
    expect(after.opposition).toBeNull();
  });

  it("is not lost by a vote that is won, or cheated", () => {
    expect(resolve(library, at(vote.id, 25, 70), vote.id, honest).opposition).toBeNull();
    expect(resolve(library, at(vote.id, 25, low), vote.id, cheat).opposition).toBeNull();
  });
});

describe("what the run counts of it (BACKLOG-11 phase 66)", () => {
  it("counts a lost count as honest and lost, and not as a win", () => {
    const out = resolve(library, at(vote.id, 25, low), vote.id, honest);
    expect(out.stats).toMatchObject({ electionsHonest: 1, electionsLost: 1, electionsCheated: 0 });
    expect(honestWins(out.stats)).toBe(0);
    const ended = resolve(library, at(vote.id, 60, low, 2, { flags: [LOST_OFFICE_FLAG] }), vote.id, honest);
    expect(ended.stats).toMatchObject({ electionsHonest: 1, electionsLost: 1 });
  });

  it("counts a count won, at an ordinary vote and at the return vote, as a win", () => {
    const won = resolve(library, at(vote.id, 25, 70), vote.id, honest);
    expect(won.stats).toMatchObject({ electionsHonest: 1, electionsLost: 0 });
    expect(honestWins(won.stats)).toBe(1);
    const s = returning(cfg.electionMoodThreshold - cfg.returnSwing);
    const back = resolve(library, s, s.current!, getCard(library, s.current!).left.honest ? "left" : "right");
    expect(honestWins(back.stats)).toBe(1);
    const lost = returning(cfg.electionMoodThreshold - cfg.returnSwing - 3);
    expect(resolve(library, lost, lost.current!, getCard(library, lost.current!).left.honest ? "left" : "right").stats.electionsLost).toBe(1);
  });

  it("does not cost the rival standing when they win it, as a count you win does", () => {
    const own = vote[honest].rival ?? 0;
    expect(resolve(library, at(vote.id, 25, low), vote.id, honest).rivalStanding).toBe(cfg.rivalStart + own);
    expect(resolve(library, at(vote.id, 25, 70), vote.id, honest).rivalStanding).toBe(cfg.rivalStart - cfg.rivalHonestLoss + own);
  });

  it("never counts a cheated vote as lost", () => {
    const cheated = resolve(library, at(vote.id, 25, low), vote.id, cheat);
    expect(cheated.stats).toMatchObject({ electionsHonest: 0, electionsLost: 0, electionsCheated: 1 });
  });
});

describe("out of office", () => {
  it("deals from the opposition's deck, then the return vote on the era's last card", () => {
    let s = resolve(library, at(vote.id, 25, cfg.electionMoodThreshold - 2), vote.id, honest);
    expect(s.opposition).not.toBeNull();
    const dealt: string[] = [];
    while (s.opposition && !s.over && s.era === 1) {
      s = draw(library, s);
      const card = getCard(library, s.current!);
      dealt.push(`${card.type}:${card.opposition ? "opp" : "ordinary"}:${s.currentFrom}`);
      // Stand again, honestly, at the return vote; the side that keeps the coalition otherwise.
      const side: Side = card.type === "election" ? (card.left.honest ? "left" : "right") : preview(library, s, card, "left").meters.base >= preview(library, s, card, "right").meters.base ? "left" : "right";
      s = resolve(library, s, card.id, side);
    }
    expect(dealt.slice(0, -1).every((d) => d === "event:opp:opposition")).toBe(true);
    expect(dealt.at(-1)).toBe("election:opp:election");
    expect(dealt).toHaveLength(cfg.eraLength - 26);
  });

  it("can be ended by the coalition, not by the state, which is held off its edges", () => {
    const card = library.oppositionCards.find((c) => (c.left.fx?.money ?? 0) === 0 && (c.left.fx?.base ?? 0) < 0)!;
    const out = { ...at(card.id, 28, 50, 1, { flags: [LOST_OFFICE_FLAG], opposition: { since: 26, returnAt: 34 }, currentFrom: "opposition" }) };
    // The treasury at nothing and the institutions at the ceiling are the government's to answer for.
    const broke = { ...out, meters: { ...out.meters, money: 0, inst: 100 } };
    const kept = resolve(library, broke, card.id, "left");
    expect(kept.over).toBeNull();
    expect([kept.meters.money, kept.meters.inst]).toEqual([1, 99]);
    // A bloc at nothing has left you, in office or out.
    const leaving = { ...out, meters: { ...out.meters, base: 1 } };
    expect(resolve(library, leaving, card.id, "left").over?.endingId).toBe(cfg.meterEndings.base.low);
  });
});

describe("the return vote", () => {
  it("brings the run back when the count clears a bar the government has worn down", () => {
    const s = returning(cfg.electionMoodThreshold - cfg.returnSwing);
    expect(electionBar(library, s)).toBe(cfg.electionMoodThreshold - cfg.returnSwing);
    const back = resolve(library, s, s.current!, getCard(library, s.current!).left.honest ? "left" : "right");
    expect(back.over).toBeNull();
    expect(back.opposition).toBeNull();
    expect(back.flags).toContain(WON_BACK_FLAG);
    // The vote was the era's last card: the next era begins, in office.
    expect(back.era).toBe(2);
  });

  it("ends the run when the count is lost again", () => {
    const s = returning(cfg.electionMoodThreshold - cfg.returnSwing - 3);
    const card = getCard(library, s.current!);
    const lost = resolve(library, s, card.id, card.left.honest ? "left" : "right");
    expect(lost.over?.endingId).toBe(losingEnding(library, s));
  });

  it("does not hand the office back already lost on its own card (BACKLOG-11 phase 66)", () => {
    // The state is held off its edges out of office. Either side of the return vote can push
    // it past them: the honest side spends and builds, the short way tears down.
    const s = returning(cfg.electionMoodThreshold);
    const card = getCard(library, s.current!);
    for (const side of ["left", "right"] as const) {
      const fx = card[side].fx ?? {};
      const edge = { ...s, meters: { ...s.meters, money: (fx.money ?? 0) < 0 ? 1 : 50, inst: (fx.inst ?? 0) > 0 ? 99 : 1, order: (fx.order ?? 0) < 0 ? 1 : 50 } };
      expect(preview(library, edge, card, side).endingId, side).toBeNull();
      const back = resolve(library, edge, card.id, side);
      expect([back.over, back.opposition], side).toEqual([null, null]);
      expect(back.era, side).toBe(2);
    }
  });

  it("can be taken the short way, back in office at a cheat's price", () => {
    const s = returning(10);
    const card = getCard(library, s.current!);
    const side: Side = card.left.honest ? "right" : "left";
    const back = resolve(library, s, card.id, side);
    expect([back.over, back.opposition]).toEqual([null, null]);
    expect(back.flags).not.toContain(WON_BACK_FLAG);
    expect(back.drift).toBe(card[side].drift);
    expect(back.stats.electionsCheated).toBe(1);
  });
});

describe("the era's end", () => {
  it("has no return vote in the run's last era, which ends in its finale with the run still out", () => {
    const last = cfg.eraCount;
    let s = resolve(library, at(vote.id, (last - 1) * cfg.eraLength + 25, cfg.electionMoodThreshold - 2, last), vote.id, honest);
    expect(s.opposition?.returnAt).toBeNull();
    while (!s.over) {
      s = draw(library, s);
      const card = getCard(library, s.current!);
      expect(card.opposition, card.id).toBe(true);
      expect(card.type).toBe("event");
      s = resolve(library, s, card.id, preview(library, s, card, "left").meters.base >= preview(library, s, card, "right").meters.base ? "left" : "right");
    }
    expect(s.over?.endingId.startsWith(cfg.finalePrefix)).toBe(true);
    expect(s.opposition).not.toBeNull();
  });

  it("brings a successor back when the vote was the era's last card", () => {
    const s = resolve(library, at(vote.id, cfg.eraLength - 1, low), vote.id, honest);
    expect([s.over, s.opposition, s.era]).toEqual([null, null, 2]);
    expect(s.flags).toContain(LOST_OFFICE_FLAG);
  });
});

describe("a run saved before opposition", () => {
  it("resumes in office, and so does the first road a second road holds", () => {
    const { opposition: _gone, ...old } = newRun(library, 3, { align: "right" });
    const road = { first: old as GameState, at: 4 };
    const migrated = migrateRun(12, { ...(old as GameState), road })!;
    expect(migrated.opposition).toBeNull();
    expect(migrated.road?.first.opposition).toBeNull();
  });
});
