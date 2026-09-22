import { describe, expect, it } from "vitest";
import { buildLibrary } from "../../src/engine/library";
import { draw, electionDue, tickQueue } from "../../src/engine/draw";
import { resolve } from "../../src/engine/resolve";
import { ev, makeFixture } from "../fixtures/content";
import { lib, play, start, table } from "../helpers";

describe("draw: basics", () => {
  it("is a no-op when a card is already on the table or the run is over", () => {
    const l = lib();
    const onTable = table(start(l), "f01");
    expect(draw(l, onTable)).toBe(onTable);
    const over = start(l, { over: { endingId: "riots", epilogueKey: "x" } });
    expect(draw(l, over)).toBe(over);
  });

  it("sets current, records seen and cooldown, and advances the rng", () => {
    const l = lib({ cooldownSize: 3 });
    let s = start(l);
    const rng0 = s.rngState;
    s = draw(l, s);
    expect(s.current).not.toBeNull();
    expect(s.seen).toEqual([s.current]);
    expect(s.cooldown).toEqual([s.current]);
    expect(s.rngState).not.toBe(rng0);
  });

  it("trims cooldown to the configured size", () => {
    const l = lib({ cooldownSize: 3 });
    const { state } = play(l, start(l), 6);
    expect(state.cooldown).toHaveLength(3);
  });

  it("throws when nothing at all is eligible", () => {
    const l = buildLibrary({ ...makeFixture(), arcs: [], cards: [] });
    expect(() => draw(l, start(l))).toThrow(/no eligible card/);
  });
});

describe("draw: priority order", () => {
  it("draws an election card when one is due", () => {
    const l = lib();
    const s = draw(l, start(l, { nextElectionAt: 0 }));
    expect(s.current).toBe("el_basic");
    expect(electionDue(l, start(l, { nextElectionAt: 0 }))).toBe(true);
  });

  it("does not draw election cards when none is due or elections are abolished", () => {
    const l = lib();
    const { ids } = play(l, start(l), 40);
    expect(ids.some((id) => id.startsWith("el_"))).toBe(false);
    const abolished = start(l, { nextElectionAt: 0, flags: ["elections_abolished"] });
    expect(draw(l, abolished).current).not.toMatch(/^el_/);
  });

  it("gates election variants by cond", () => {
    const l = lib();
    const s = draw(l, start(l, { nextElectionAt: 0, flags: ["want_delay"] }));
    // el_delay has weight 100 against el_basic's 1, so it dominates when eligible.
    expect(["el_basic", "el_delay"]).toContain(s.current);
    let hits = 0;
    for (let seed = 1; seed <= 30; seed++) {
      if (draw(l, start(l, { nextElectionAt: 0, flags: ["want_delay"] }, "left", seed)).current === "el_delay") hits++;
    }
    expect(hits).toBeGreaterThan(20);
  });

  it("serves due queued cards before events, oldest first, and drops stale ones", () => {
    const l = lib();
    const notYet = draw(l, start(l, { cardCount: 2, queue: [{ id: "q1", dueAt: 3 }] }));
    expect(notYet.current).not.toBe("q1");
    expect(notYet.queue).toHaveLength(1);

    const due = draw(l, start(l, { cardCount: 5, queue: [{ id: "chained", dueAt: 5 }, { id: "q1", dueAt: 4 }] }));
    expect(due.current).toBe("q1");
    expect(due.queue).toEqual([{ id: "chained", dueAt: 5 }]);

    const stale = draw(l, start(l, { cardCount: 5, flags: ["averted"], queue: [{ id: "q1", dueAt: 4 }] }));
    expect(stale.current).not.toBe("q1");
    expect(stale.queue).toEqual([]);
  });

  it("puts an election ahead of a due queued card", () => {
    const l = lib();
    const s = draw(l, start(l, { nextElectionAt: 0, queue: [{ id: "q1", dueAt: 0 }] }));
    expect(s.current).toBe("el_basic");
    expect(s.queue).toHaveLength(1);
  });

  it("tickQueue pops the oldest due card and leaves the rest", () => {
    const l = lib();
    const [card, s] = tickQueue(l, start(l, { cardCount: 9, queue: [{ id: "q1", dueAt: 9 }, { id: "chained", dueAt: 20 }] }));
    expect(card?.id).toBe("q1");
    expect(s.queue).toEqual([{ id: "chained", dueAt: 20 }]);
    expect(tickQueue(l, start(l))[0]).toBeNull();
  });
});

describe("draw: eligibility filters", () => {
  it("never shows the other alignment's cards", () => {
    const l = lib();
    const left = play(l, start(l, {}, "left"), 150).ids;
    const right = play(l, start(l, {}, "right"), 150).ids;
    expect(left).not.toContain("ev_right");
    expect(left).toContain("ev_left");
    expect(right).not.toContain("ev_left");
    expect(right).toContain("ev_right");
  });

  it("respects band and era when the strict pool is non-empty", () => {
    const l = lib();
    const ids = play(l, start(l), 200).ids;
    expect(ids).not.toContain("ev_decay");
    expect(ids).not.toContain("ev_era2");
    const decay = play(l, start(l, { band: "decay" }), 200).ids;
    expect(decay).toContain("ev_decay");
  });

  it("honours cond, oneShot and cooldown", () => {
    const l = lib({ cooldownSize: 10 });
    const without = play(l, start(l), 100).ids;
    expect(without).not.toContain("ev_cond");
    const withFlag = play(l, start(l, { flags: ["f1"] }), 100).ids;
    expect(withFlag).toContain("ev_cond");

    expect(without.filter((id) => id === "ev_oneshot")).toHaveLength(1);

    for (let i = 0; i < without.length; i++) {
      const window = without.slice(Math.max(0, i - 10), i);
      expect(window).not.toContain(without[i]);
    }
  });

  it("falls back to wider pools instead of getting stuck", () => {
    const l = buildLibrary({ ...makeFixture(), arcs: [], cards: [ev("only_era2", { eras: [2], bands: ["ascent"] })] }, { eraLength: 1000, electionInterval: 1000 });
    const s = draw(l, start(l));
    expect(s.current).toBe("only_era2");
  });

  it("weights the random pool", () => {
    const heavy = ev("heavy", { weight: 20 });
    const light = ev("light", { weight: 1 });
    const l = buildLibrary({ ...makeFixture(), arcs: [], cards: [heavy, light] }, { eraLength: 1000, electionInterval: 1000, cooldownSize: 0 });
    let heavyCount = 0;
    for (let seed = 1; seed <= 200; seed++) if (draw(l, start(l, {}, "left", seed)).current === "heavy") heavyCount++;
    expect(heavyCount).toBeGreaterThan(170);
  });
});

describe("draw: arcs", () => {
  it("enters an eligible arc when the roll allows and the budget has room", () => {
    const l = lib({ arcEntryProb: 1 });
    const s = draw(l, start(l));
    expect(s.current).toBe("arc_t1");
    expect(s.activeArcs).toEqual([{ id: "arc_t", nextCard: "arc_t1" }]);
    expect(draw(l, start(l, { arcBudget: 0 })).current).not.toBe("arc_t1");
    expect(draw(lib({ arcEntryProb: 0 }), start(l)).current).not.toBe("arc_t1");
  });

  it("follows next pointers with the continue roll, exits on refusal, and never re-enters", () => {
    const l = lib({ arcEntryProb: 1, arcContinueProb: 1 });
    let s = draw(l, start(l));
    s = resolve(l, s, "arc_t1", "left");
    expect(s.activeArcs).toEqual([{ id: "arc_t", nextCard: "arc_t2" }]);
    s = draw(l, s);
    expect(s.current).toBe("arc_t2");
    s = resolve(l, s, "arc_t2", "left");
    s = draw(l, s);
    expect(s.current).toBe("arc_t3");
    s = resolve(l, s, "arc_t3", "right");
    expect(s.activeArcs).toEqual([{ id: "arc_t", nextCard: null }]);
    expect(s.flags).toContain("arc_done");
    const later = play(l, s, 60).ids;
    expect(later.some((id) => id.startsWith("arc_"))).toBe(false);

    let r = draw(l, start(l));
    r = resolve(l, r, "arc_t1", "right");
    expect(r.activeArcs).toEqual([{ id: "arc_t", nextCard: null }]);
  });

  it("does not continue an arc when the roll fails", () => {
    const l = lib({ arcEntryProb: 1, arcContinueProb: 0 });
    let s = draw(l, start(l));
    s = resolve(l, s, "arc_t1", "left");
    const ids = play(l, s, 30).ids;
    expect(ids).not.toContain("arc_t2");
  });

  it("scales arc entry weight by modifiers", () => {
    const l = lib({ arcEntryProb: 1 });
    const s = draw(l, start(l, { modifiers: ["mod_crisis"] }));
    expect(s.current).toBe("arc_t1");
  });
});

describe("draw: alignment affinity", () => {
  /** Two drawable cards, one shared and one left-only, so the ratio is readable. */
  function pair(alignAffinity: number) {
    const fx = makeFixture();
    const content = { ...fx, cards: [...fx.cards.filter((c) => c.type !== "event"), ev("shared"), ev("mine", { align: "left" })] };
    return buildLibrary(content, { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0, alignAffinity });
  }

  function mineShare(alignAffinity: number): number {
    const l = pair(alignAffinity);
    let mine = 0;
    for (let seed = 1; seed <= 400; seed++) if (draw(l, start(l, {}, "left", seed)).current === "mine") mine++;
    return mine / 400;
  }

  it("draws the player's own side more often than the shared deck", () => {
    expect(mineShare(1)).toBeCloseTo(0.5, 1);
    expect(mineShare(4)).toBeGreaterThan(0.7);
  });

  it("leaves the other side's cards out of the pool entirely", () => {
    const l = pair(4);
    const ids = new Set(play(l, start(l, {}, "right"), 40).ids);
    expect(ids.has("mine")).toBe(false);
  });
});

describe("draw: a promise and its reckoning", () => {
  /**
   * A promise queues both endings of itself and lets the conditions decide which one the
   * player is shown (BACKLOG item 6). That works because tickQueue drops every due card
   * whose condition no longer holds, so the losing variant never reaches the table.
   */
  function promised(broke: boolean) {
    const fx = makeFixture();
    const cards = [
      ...fx.cards,
      ev("p_broke", { weight: 0, cond: { flags: ["broke_it"] } }),
      ev("p_kept", { weight: 0, cond: { notFlags: ["broke_it"] } }),
    ];
    const l = buildLibrary({ ...fx, cards }, { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0 });
    const s = start(l, {
      cardCount: 25,
      queue: [
        { id: "p_broke", dueAt: 20 },
        { id: "p_kept", dueAt: 20 },
      ],
      flags: broke ? ["broke_it"] : [],
    });
    return [l, s] as const;
  }

  it("shows the ending that matches what the player did, and only that one", () => {
    for (const broke of [false, true]) {
      const [l, s] = promised(broke);
      const shown: string[] = [];
      let next = s;
      for (let i = 0; i < 4; i++) {
        const [card, after] = tickQueue(l, next);
        next = after;
        if (card) shown.push(card.id);
      }
      expect(shown, `broke=${broke}`).toEqual([broke ? "p_broke" : "p_kept"]);
      expect(next.queue, `broke=${broke} leaves nothing queued`).toEqual([]);
    }
  });

  it("puts the matching reckoning on the table through a normal draw", () => {
    const [l, s] = promised(true);
    expect(draw(l, s).current).toBe("p_broke");
  });
});
