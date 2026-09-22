// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PathChrome, StreamGutters } from "../../src/ui/PathChrome";
import { STAGE_AT, themeFor } from "../../src/ui/theme";

/**
 * The two paths (BACKLOG-3 phase 18). These guard the shape of the ladder and the rule that
 * makes the look survivable — everything the path draws is decoration, and decoration never
 * covers anything you read or tap. Where it actually lands on screen is geometry and is
 * checked in the browser against the built bundle, not here.
 */
afterEach(() => cleanup());

const at = (drift: number) => themeFor(drift);

describe("the stream, on the way down", () => {
  it("arrives in three stages rather than all at once", () => {
    const show = (drift: number) => {
      const { container } = render(<PathChrome theme={at(drift)} seed={3} n={7} />);
      const gut = render(<StreamGutters theme={at(drift)} seed={3} n={7} />);
      return {
        live: !!container.querySelector(".stream-live"),
        alerts: container.querySelectorAll(".stream-alert").length,
        goal: !!container.querySelector(".stream-goal"),
        chat: gut.container.querySelectorAll(".stream-chat p").length,
        emotes: gut.container.querySelectorAll(".stream-emotes span").length,
      };
    };
    expect(show(-STAGE_AT[0] + 1)).toMatchObject({ live: false, chat: 0, alerts: 0 });
    expect(show(-STAGE_AT[0])).toMatchObject({ live: true, chat: 0, alerts: 0, goal: false });
    const two = show(-STAGE_AT[1]);
    expect(two).toMatchObject({ live: true, alerts: 1, goal: false, emotes: 0 });
    expect(two.chat).toBeGreaterThan(0);
    const three = show(-STAGE_AT[2]);
    expect(three).toMatchObject({ live: true, alerts: 2, goal: true });
    expect(three.emotes).toBeGreaterThan(0);
    expect(three.chat).toBeGreaterThan(two.chat);
  });

  it("says the same thing twice for the same card, and something else for the next", () => {
    const text = (n: number) => render(<StreamGutters theme={at(-40)} seed={11} n={n} />).container.textContent;
    expect(text(4)).toBe(text(4));
    expect(text(4)).not.toBe(text(5));
  });

  it("is decoration: hidden from a screen reader and never a target", () => {
    const { container } = render(<PathChrome theme={at(-40)} seed={1} n={1} />);
    const gut = render(<StreamGutters theme={at(-40)} seed={1} n={1} />);
    expect(container.querySelector(".stream")?.getAttribute("aria-hidden")).toBe("true");
    for (const el of gut.container.children) expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("button")).toBeNull();
    expect(gut.container.querySelector("button")).toBeNull();
  });
});

describe("the projection, on the way up", () => {
  it("deepens rather than getting louder, and brings no stream with it", () => {
    const panes = (drift: number) => {
      const { container } = render(<PathChrome theme={at(drift)} seed={3} n={7} />);
      return {
        panes: container.querySelectorAll(".holo-pane").length,
        plinth: !!container.querySelector(".holo-plinth"),
        stream: !!container.querySelector(".stream-live"),
      };
    };
    expect(panes(STAGE_AT[0] - 1)).toMatchObject({ panes: 0, plinth: false });
    expect(panes(STAGE_AT[0])).toMatchObject({ panes: 0, plinth: true, stream: false });
    expect(panes(STAGE_AT[1])).toMatchObject({ panes: 1, plinth: true });
    expect(panes(STAGE_AT[2])).toMatchObject({ panes: 2, plinth: true });
  });

  it("has no gutters, because nothing is shouting", () => {
    expect(render(<StreamGutters theme={at(60)} seed={1} n={1} />).container.childElementCount).toBe(0);
  });
});
