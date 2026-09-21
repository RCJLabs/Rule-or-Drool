import { describe, expect, it } from "vitest";
import { degrade, hashText } from "../../src/ui/degrade";

const TEXT = "The schools want their budget back. The stadium wants a roof. Same pot, one signature.";

describe("degrade", () => {
  it("leaves text alone at level 0 and for very short strings", () => {
    expect(degrade(TEXT, 0)).toBe(TEXT);
    expect(degrade("Hi there", 1)).toBe("Hi there");
  });

  it("is deterministic for the same text and salt, and varies with salt", () => {
    expect(degrade(TEXT, 0.6, 7)).toBe(degrade(TEXT, 0.6, 7));
    const variants = new Set([0, 1, 2, 3, 4, 5].map((salt) => degrade(TEXT, 0.6, salt)));
    expect(variants.size).toBeGreaterThan(1);
  });

  it("changes something but stays subtle", () => {
    const out = degrade(TEXT, 0.6, 1);
    expect(out).not.toBe(TEXT);
    const a = TEXT.split(" ");
    const b = out.split(" ");
    expect(b).toHaveLength(a.length);
    const changed = a.filter((w, i) => w !== b[i]).length;
    expect(changed).toBeGreaterThanOrEqual(1);
    expect(changed).toBeLessThanOrEqual(3);
    expect(out.endsWith(".")).toBe(true);
  });

  it("keeps punctuation attached to the word it slips", () => {
    const out = degrade("Somebody important said something. Nobody listened.", 1, 3);
    expect(out.match(/[.]/g)?.length).toBe(2);
  });

  it("hashes stably", () => {
    expect(hashText("abc")).toBe(hashText("abc"));
    expect(hashText("abc")).not.toBe(hashText("abd"));
  });
});
