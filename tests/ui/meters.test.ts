import { describe, expect, it } from "vitest";
import { RESTLESS_BELOW, restlessBloc } from "../../src/ui/Meters";
import { meters } from "../helpers";

describe("naming the unhappy bloc", () => {
  it("says nothing while the coalition holds together", () => {
    expect(restlessBloc(meters())).toBeNull();
    expect(restlessBloc(meters({ base: RESTLESS_BELOW }))).toBeNull();
  });

  it("names the worst one, not just any low one", () => {
    expect(restlessBloc(meters({ base: 20 }))).toBe("base");
    expect(restlessBloc(meters({ base: 20, backers: 10 }))).toBe("backers");
    // A low state meter is not a bloc and never gets named here.
    expect(restlessBloc(meters({ money: 2, order: 3 }))).toBeNull();
  });

  it("is about the coalition coming apart, not about being low overall", () => {
    // All three equally low is a different problem, and the worst is still named.
    expect(restlessBloc(meters({ mood: 20 }))).toBe("base");
    // One bloc adrift while the others are fine is the case worth surfacing.
    expect(restlessBloc(meters({ base: 80, backers: 12, public: 75 }))).toBe("backers");
  });
});
