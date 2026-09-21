import { describe, expect, it } from "vitest";
import { ARC_SPEC, CARD_SPEC, EPILOGUE_SPEC, checkSpec, type Spec } from "../../src/validate/schema";

function failures(value: unknown, spec: Spec): string[] {
  const out: string[] = [];
  checkSpec(value, spec, "", (path, message) => out.push(`${path}: ${message}`));
  return out;
}

const goodCard = {
  id: "ok_card",
  type: "event",
  align: "any",
  eras: [1],
  bands: ["muddle"],
  speaker: "chief",
  text: "Fine.",
  cond: { flags: ["a"], meters: { mood: { lt: 40 } } },
  weight: 2,
  oneShot: true,
  left: { label: "A", fx: { mood: 1 }, drift: -1, enqueue: [{ id: "x", delay: 1 }] },
  right: { label: "B", drift: 1, setFlags: ["b"], next: "y", ending: "z" },
};

describe("schema", () => {
  it("accepts a well-formed card", () => {
    expect(failures(goodCard, CARD_SPEC)).toEqual([]);
  });

  it("rejects unknown fields anywhere in the tree", () => {
    expect(failures({ ...goodCard, oneshot: true }, CARD_SPEC)).toEqual(["oneshot: unknown field"]);
    expect(failures({ ...goodCard, left: { label: "A", fx: { happiness: 1 } } }, CARD_SPEC)[0]).toMatch(/^left\.fx\.happiness: unknown key/);
    expect(failures({ ...goodCard, cond: { flgs: [] } }, CARD_SPEC)).toEqual(["cond.flgs: unknown field"]);
  });

  it("reports missing required fields and wrong types with exact paths", () => {
    const { text: _text, ...noText } = goodCard;
    expect(failures(noText, CARD_SPEC)).toEqual(["text: required field is missing"]);
    expect(failures({ ...goodCard, eras: "1" }, CARD_SPEC)[0]).toMatch(/^eras: expected array/);
    expect(failures({ ...goodCard, cond: { meters: { mood: { lt: "40" } } } }, CARD_SPEC)[0]).toMatch(/^cond\.meters\.mood\.lt: expected number/);
    expect(failures({ ...goodCard, left: { label: "" } }, CARD_SPEC)).toEqual(["left.label: must not be empty"]);
  });

  it("enforces enums, id pattern, ranges and uniqueness", () => {
    expect(failures({ ...goodCard, type: "evnt" }, CARD_SPEC)[0]).toMatch(/^type: expected one of/);
    expect(failures({ ...goodCard, id: "Bad-Id" }, CARD_SPEC)[0]).toMatch(/^id: ids are lowercase/);
    expect(failures({ ...goodCard, weight: -1 }, CARD_SPEC)).toEqual(["weight: must be >= 0, got -1"]);
    expect(failures({ ...goodCard, left: { label: "A", enqueue: [{ id: "x", delay: 0 }] } }, CARD_SPEC)).toEqual(["left.enqueue[0].delay: must be >= 1, got 0"]);
    expect(failures({ ...goodCard, left: { label: "A", drift: 1.5 } }, CARD_SPEC)).toEqual(["left.drift: expected integer, got 1.5"]);
    expect(failures({ ...goodCard, eras: [1, 1] }, CARD_SPEC)).toEqual(["eras[1]: duplicate entry 1"]);
    expect(failures({ ...goodCard, eras: [] }, CARD_SPEC)).toEqual(["eras: must not be empty"]);
  });

  it("checks arcs and epilogues", () => {
    expect(failures({ id: "a", align: "any", entry: { eras: [1], bands: ["muddle"] }, weight: 1, cards: ["c"] }, ARC_SPEC)).toEqual([]);
    expect(failures({ id: "a", align: "any", entry: { eras: [1] }, weight: 1, cards: [] }, ARC_SPEC)).toEqual([
      "entry.bands: required field is missing",
      "cards: must not be empty",
    ]);
    expect(failures({ band: "muddle", align: "any", era: 1, text: "x" }, EPILOGUE_SPEC)).toEqual([]);
    expect(failures({ band: "grey", align: "any", era: 0, text: "" }, EPILOGUE_SPEC)).toHaveLength(3);
  });

  it("rejects non-objects", () => {
    expect(failures(null, CARD_SPEC)).toEqual([": expected object, got null"]);
    expect(failures([1], CARD_SPEC)).toEqual([": expected object, got array"]);
  });
});
