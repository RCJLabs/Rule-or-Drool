import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import { LESSONS, lessonBody, lessonFor } from "../../src/ui/teach";
import { STRINGS } from "../../src/content/strings";
import type { GameState } from "../../src/engine/types";

const at = (patch: Partial<GameState> = {}): GameState => ({ ...newRun(library, 5, { align: "left" }), ...patch });

describe("teaching by playing", () => {
  it("opens with what the six meters are, on the very first card", () => {
    const s = at({ current: "a01_surplus", cardCount: 0 });
    expect(lessonFor(library, s, [])?.id).toBe("meters");
  });

  it("never repeats one the player has had", () => {
    const s = at({ current: "a01_surplus", cardCount: 0 });
    expect(lessonFor(library, s, ["meters"])?.id).not.toBe("meters");
  });

  it("points at a delayed card as the player's own doing", () => {
    // q_debt_called has weight 0: it can only be here because something queued it.
    const s = at({ current: "q_debt_called", cardCount: 30 });
    expect(lessonFor(library, s, ["meters", "hidden"])?.id).toBe("delayed");
  });

  it("names the bloc that is unhappy, on the side the player leads", () => {
    const s = at({ current: "a01_surplus", cardCount: 30, meters: { ...newRun(library, 5, { align: "left" }).meters, backers: 20 } });
    const lesson = lessonFor(library, s, ["meters", "hidden"]);
    expect(lesson?.id).toBe("bloc");
    expect(lessonBody(lesson!, s)).toContain(STRINGS.blocNames.left.backers);
    // The same state on the other side names that side's people instead.
    const right = { ...s, align: "right" as const };
    expect(lessonBody(lesson!, right)).toContain(STRINGS.blocNames.right.backers);
  });

  it("says nothing once the run is over, or with no card on the table", () => {
    expect(lessonFor(library, at({ current: null }), [])).toBeNull();
    expect(lessonFor(library, at({ current: "a01_surplus", over: { endingId: "riots", epilogueKey: "decay:left:1" } }), [])).toBeNull();
  });

  it("shows one at a time, and every lesson is reachable", () => {
    // A card that satisfies several conditions still teaches only the first outstanding one.
    const busy = at({ current: "arc_rv1", cardCount: 0 });
    expect(lessonFor(library, busy, [])?.id).toBe("meters");
    expect(lessonFor(library, busy, ["meters"])?.id).toBe("arc");
    // And no lesson is written that nothing can trigger.
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });
});
