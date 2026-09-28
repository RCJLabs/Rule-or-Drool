// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { deckStamp } from "../../src/engine/deck";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { replayTo } from "../../src/engine/replay";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { alongside, encodeRunCode, encodeRunResult, lastAlongside, resultOf, setupOf, type RunCode } from "../../src/meta";
import { BOTS, makeContext, noisy } from "../../src/sim";
import { pickTurningPoints, turningPoints } from "../../src/sim/turning";
import { App } from "../../src/ui/App";
import { theirRunFor } from "../../src/ui/along";
import { Ending } from "../../src/ui/Ending";
import { Play } from "../../src/ui/Play";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";

/**
 * What they did (BACKLOG-14 phase 89): on a run someone sent, the line by the party says after
 * each answer whether the player chose as they did, and the end counts it and leads with where
 * parting from them mattered.
 */

const noop = () => {};
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(cleanup);

const CODE: RunCode = { seed: 2024, align: "left", modifiers: [], unlocked: [], mandates: [] };

function played(salt: number, code: RunCode = CODE): GameState {
  const bot = noisy(BOTS.eyes, 0.2);
  const rng = makeRng(code.seed ^ salt);
  let s = newRun(library, code.seed, setupOf(code));
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

const mine = played(0x1234567);
const theirs = played(0x7654321);
const challenge = { ...resultOf(library, theirs)!, deck: deckStamp(library) };

function play(state: GameState, sent: GameState | null = theirs) {
  return (
    <Play
      lib={library}
      state={state}
      transition={null}
      onChoose={noop}
      onDismissTransition={noop}
      debug={false}
      settings={DEFAULT_SETTINGS}
      onSettings={noop}
      onCabinet={noop}
      onTaught={noop}
      theirs={sent}
    />
  );
}
const note = () => document.querySelector(".vs-note")?.textContent ?? null;
const heard = () => document.querySelector("footer .sr-only[aria-live]")?.textContent ?? "";

describe("the line by the party", () => {
  it("says, once a card they met is answered, whether the player chose as they did", () => {
    const seen = { same: 0, other: 0, none: 0 };
    for (let k = 1; k <= 30; k++) {
      const at = replayTo(library, mine, k)!;
      const last = lastAlongside(at, theirs);
      render(play(at));
      if (!last) {
        expect(note(), `card ${k}`).toBeNull();
        seen.none++;
      } else if (last.mine === last.theirs) {
        expect(note(), `card ${k}`).toBe(STRINGS.vs.noteSame);
        seen.same++;
      } else {
        expect(note(), `card ${k}`).toBe(STRINGS.vs.noteOther);
        seen.other++;
      }
      cleanup();
    }
    expect(seen.same).toBeGreaterThan(0);
    expect(seen.other).toBeGreaterThan(0);
  });

  it("is heard with the next card, and never before the answer", () => {
    // Before any answer there is nothing to say.
    render(play(replayTo(library, mine, 0)!));
    expect(note()).toBeNull();
    cleanup();
    const together = alongside(mine, theirs);
    for (const want of [true, false]) {
      const a = together.find((x) => (x.mine === x.theirs) === want && x.k > 0)!;
      const { rerender } = render(play(replayTo(library, mine, a.k)!));
      rerender(play(replayTo(library, mine, a.k + 1)!));
      expect(heard()).toContain(want ? STRINGS.vs.spokenSame : STRINGS.vs.spokenOther);
      cleanup();
    }
  });

  it("is only heard out of office, where the party's chip leaves it no room, and is not there on the other road or without their run", () => {
    const k = alongside(mine, theirs).find((a) => a.k > 0)!.k + 1;
    const at = replayTo(library, mine, k)!;
    const { rerender } = render(play({ ...replayTo(library, mine, k - 1)!, opposition: { since: k - 1, returnAt: null } }));
    rerender(play({ ...at, opposition: { since: k - 1, returnAt: null } }));
    expect(note()).toBeNull();
    expect(heard()).toMatch(new RegExp(`${STRINGS.vs.spokenSame}|${STRINGS.vs.spokenOther}`));
    cleanup();
    render(play({ ...at, road: { first: mine, at: 0 } }));
    expect(note()).toBeNull();
    cleanup();
    render(play(at, null));
    expect(note()).toBeNull();
  });
});

describe("their run, dealt again for the play screen", () => {
  it("is the run they played, and none from another deck, without their sides, or on the other road", () => {
    const at = replayTo(library, mine, 10)!;
    expect(theirRunFor(library, at, challenge)?.choices).toEqual(theirs.choices);
    expect(theirRunFor(library, at, { ...challenge, deck: "zzzzzzzz" })).toBeNull();
    expect(theirRunFor(library, at, { ...challenge, sides: null })).toBeNull();
    expect(theirRunFor(library, { ...at, road: { first: mine, at: 3 } }, challenge)).toBeNull();
    expect(theirRunFor(library, at, null)).toBeNull();
  });
});

describe("the offer", () => {
  it("says the line will be there when the link carries their sides and this deck, and not otherwise", () => {
    const offered = (vs: string, deck: string) => {
      cleanup();
      localStorage.clear();
      window.history.replaceState({}, "", `/?run=${encodeRunCode(CODE)}&vs=${vs}&deck=${deck}`);
      render(<App />);
      return within(screen.getByRole("region", { name: STRINGS.share.offerTitle })).queryByText(STRINGS.share.offerAlong) !== null;
    };
    expect(offered(encodeRunResult(challenge), deckStamp(library))).toBe(true);
    expect(offered(encodeRunResult(challenge), "zzzzzzzz")).toBe(false);
    // Sides that do not deal their run again here: the ending they claim is not where these lead.
    const elsewhere = [...library.endings.keys()].find((id) => id !== challenge.ending)!;
    expect(offered(encodeRunResult({ ...challenge, ending: elsewhere }), deckStamp(library))).toBe(false);
  });
});

describe("the end of their run", () => {
  it("counts the cards both met, alike and apart", () => {
    render(<Ending lib={library} state={mine} fold={null} challenge={challenge} onPlayAgain={noop} onCodex={noop} onSettings={noop} />);
    const together = alongside(mine, theirs);
    const same = together.filter((a) => a.mine === a.theirs).length;
    expect(document.querySelector(".versus-along")?.textContent).toBe(
      STRINGS.vs.along
        .replace("{n}", String(together.length))
        .replace("{same}", String(same))
        .replace("{apart}", String(together.length - same)),
    );
  });

  it("leads where it turned with the cards where they chose the other side, and says so on each", async () => {
    // The first pair of runs on these codes where parting from them turned the receiver's run.
    let found: { me: GameState; them: GameState } | null = null;
    for (const seed of [2024, 7, 11, 42, 99, 123, 500, 777]) {
      const code = { ...CODE, seed };
      const me = played(0x1234567, code);
      const them = played(0x7654321, code);
      const apart = new Set(
        alongside(me, them)
          .filter((a) => a.mine !== a.theirs)
          .map((a) => a.k),
      );
      if (pickTurningPoints(turningPoints(library, me)!, me, library, 3, apart).some((p) => apart.has(p.k))) {
        found = { me, them };
        break;
      }
    }
    expect(found).not.toBeNull();
    const { me, them } = found!;
    const apart = new Set(
      alongside(me, them)
        .filter((a) => a.mine !== a.theirs)
        .map((a) => a.k),
    );
    const all = turningPoints(library, me)!;
    const shown = pickTurningPoints(all, me, library, 3, apart);
    render(
      <Ending
        lib={library}
        state={me}
        fold={null}
        challenge={{ ...resultOf(library, them)!, deck: deckStamp(library) }}
        onPlayAgain={noop}
        onCodex={noop}
        onSettings={noop}
        onTakeOtherRoad={noop}
      />,
    );
    await waitFor(() => expect(document.querySelector(".turning-count")?.textContent).not.toBe(STRINGS.turning.working), { timeout: 30_000 });
    const items = [...document.querySelectorAll(".turning li p")].map((p) => p.textContent);
    expect(items).toHaveLength(shown.length);
    shown.forEach((p, i) =>
      expect(items[i]!.startsWith(apart.has(p.k) ? STRINGS.turning.apart.split("{label}")[0]! : STRINGS.turning.chose.split("{label}")[0]!)).toBe(true),
    );
    // Where they parted comes first: no point where they chose alike is shown over one where they did not.
    const partedKnockOn = all.filter((p) => p.knockOn && apart.has(p.k)).length;
    expect(shown.filter((p) => apart.has(p.k)).length).toBe(Math.min(3, partedKnockOn));
    const m = all.filter((p) => apart.has(p.k)).length;
    expect([...document.querySelectorAll(".turning-most")].map((p) => p.textContent)).toContain(
      m === 1 ? STRINGS.turning.partedOne : STRINGS.turning.parted.replace("{n}", String(m)),
    );
  });
});
