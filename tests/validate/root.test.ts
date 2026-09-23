import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { content } from "../../src/content";
import { formatIssues, validateRoot } from "../../src/validate";

const codesOf = (issues: { level: string; code: string }[]) => [...new Set(issues.map((i) => `${i.level}:${i.code}`))].sort();

describe("validateRoot: shipped content", () => {
  it("passes clean, with every era covered", () => {
    const report = validateRoot("src/content", { imported: content });
    expect(codesOf(report.issues)).toEqual([]);
    expect(report.content.cards.length).toBe(content.cards.length);
  });

  it("covers all three eras at the default cell minimum", () => {
    const report = validateRoot("src/content", { eras: "all" });
    expect(report.issues.filter((i) => i.code === "cell-thin")).toEqual([]);
  });

  it("meets the phase 5 MVP cell target with no warnings", () => {
    const report = validateRoot("src/content", { eras: "all", minCell: 25 });
    expect(report.issues).toEqual([]);
  });

  it("holds the MVP content scope from section 10", () => {
    // The deck a side draws from day to day. A card written for one crisis or one named
    // advisor has to serve both sides, because crises and the cabinet are nobody's politics
    // (content.test.ts), so counting those would move this share with every crisis or face
    // added without changing what either side draws (BACKLOG-5 phase 35).
    const personal = (c: (typeof content.cards)[number]) => (c.cond?.flags ?? []).some((f) => f.startsWith("crisis_") || f.startsWith("advisor_adv_"));
    const events = content.cards.filter((c) => c.type === "event" && (c.weight ?? 1) > 0 && !personal(c));
    const any = events.filter((c) => c.align === "any").length;
    expect(content.cards.length).toBeGreaterThanOrEqual(300);
    expect(content.arcs.length).toBeGreaterThanOrEqual(12);
    expect(content.endings.length).toBeGreaterThanOrEqual(20);
    expect(content.advisors.length).toBeGreaterThanOrEqual(12);
    for (const kind of ["crisis", "trait", "flaw"] as const) {
      expect(content.modifiers.filter((m) => m.kind === kind).length, kind).toBeGreaterThanOrEqual(4);
    }
    // Section 10: about half the cards should be alignment-neutral.
    expect(any / events.length).toBeGreaterThan(0.4);
    expect(any / events.length).toBeLessThan(0.6);
  });

  it("cross-checks disk against the imported bundle", () => {
    const stripped = { ...content, cards: content.cards.filter((c) => c.id !== "a01_school_budget") };
    const extra = { ...content, endings: [...content.endings, { id: "ghost", title: "g", text: "g" }] };
    expect(codesOf(validateRoot("src/content", { imported: stripped }).issues)).toContain("error:not-imported");
    expect(codesOf(validateRoot("src/content", { imported: extra }).issues)).toContain("error:not-on-disk");
  });
});

describe("validateRoot: broken fixture", () => {
  const report = validateRoot("tests/fixtures/broken", { eras: [1], minCell: 1, unlockTokens: [] });

  it("fails loudly", () => {
    expect(report.errors).toBeGreaterThan(20);
  });

  it("hits every rule the fixture was built to trip", () => {
    const codes = codesOf(report.issues);
    for (const expected of [
      "error:json-syntax",
      "error:file-unclassified",
      "error:schema",
      "error:duplicate-id",
      "error:unknown-ref",
      "error:flag-unread",
      "error:flag-unset",
      "error:flag-cleared-unset",
      "error:flag-set-and-cleared",
      "error:arc-unreachable",
      "error:arc-no-exit",
      "error:arc-membership",
      "error:arc-next-outside",
      "error:arc-dead",
      "error:ending-unreachable",
      "error:ending-missing",
      "error:card-unreachable",
      "error:election-honest",
      "error:election-missing",
      "error:honest-misplaced",
      "error:speaker-unknown",
      "error:cond-unsatisfiable",
      "error:epilogue-missing",
      "warn:no-tradeoff",
      "warn:text-length",
      "warn:label-length",
      "warn:trait-unknown",
      "warn:fx-zero",
      "warn:era-out-of-range",
      "warn:arc-cycle",
    ]) {
      expect(codes, expected).toContain(expected);
    }
  });

  it("attaches file names and drops schema-failed items from the typed bundle", () => {
    const schema = report.issues.filter((i) => i.code === "schema");
    expect(schema.every((i) => i.file === "cards/era1/bad.json")).toBe(true);
    expect(schema.map((i) => i.id)).toContain("typo_card");
    expect(report.content.cards.some((c) => c.id === "typo_card")).toBe(false);
    expect(report.issues.find((i) => i.code === "json-syntax")?.file).toBe("cards/era1/syntax.json");
    const text = formatIssues(report.issues);
    expect(text).toMatch(/^ERROR/);
    expect(text).toContain("cards/era1/bad.json");
  });

  it("reports missing required files", () => {
    const dir = mkdtempSync(join(tmpdir(), "rod-validate-"));
    mkdirSync(join(dir, "cards"));
    writeFileSync(join(dir, "cards", "x.json"), "[]");
    const r = validateRoot(dir, { eras: [1], minCell: 0, unlockTokens: [] });
    expect(r.issues.filter((i) => i.code === "file-missing").map((i) => i.id).sort()).toEqual(["advisors.json", "endings.json", "epilogues.json", "modifiers.json"]);
  });
});

describe("validate-content CLI", () => {
  const tsx = join(process.cwd(), "node_modules", ".bin", "tsx");
  const cli = (...args: string[]) => spawnSync(tsx, ["scripts/validate-content.ts", ...args], { encoding: "utf8", timeout: 60000 });

  // Five runs of the CLI, each starting tsx and loading the whole deck: 2.5s here, and a CI
  // runner is slower. Each spawn has its own 60s limit; the test needs one to match.
  it.skipIf(!existsSync(tsx))("exits 0 on the shipped content and 1 on the broken fixture or the MVP gate", () => {
    const ok = cli();
    expect(ok.status, ok.stdout + ok.stderr).toBe(0);
    expect(ok.stdout).toMatch(/0 errors, 0 warnings/);

    const broken = cli("--root", "tests/fixtures/broken", "--eras", "1", "--min-cell", "1");
    expect(broken.status).toBe(1);
    expect(broken.stdout).toMatch(/^ERROR/m);

    const mvp = cli("--eras", "all", "--min-cell", "25", "--strict");
    expect(mvp.status, mvp.stdout + mvp.stderr).toBe(0);

    // The cell gate still bites when a cell really is thin.
    const gate = cli("--eras", "all", "--min-cell", "400", "--quiet");
    expect(gate.status).toBe(1);
    expect(gate.stdout).toContain("cell-thin");

    expect(cli("--bogus").status).toBe(2);
  }, 60000);
});
