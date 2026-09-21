export * from "./issues";
export * from "./schema";
export * from "./rules";
export * from "./load";

import type { Content } from "../engine/types";
import { countIssues, type Issue } from "./issues";
import { epilogueId, loadRoot, type Loaded } from "./load";
import { checkRules, type RuleOptions } from "./rules";

/** Semantic validation of an in-memory bundle (fixtures, tests). */
export function validateContent(content: Content, options: Partial<RuleOptions> = {}): Issue[] {
  return checkRules(content, options);
}

export interface ValidateRootOptions extends Partial<RuleOptions> {
  /** The bundle the app actually imports; every id on disk must be in it and vice versa. */
  imported?: Content;
}

export interface RootReport extends Loaded {
  errors: number;
  warnings: number;
}

/** Load a content root from disk, run schema and semantic checks, attach file names. */
export function validateRoot(root: string, options: ValidateRootOptions = {}): RootReport {
  const loaded = loadRoot(root);
  const { imported, ...ruleOptions } = options;
  const issues: Issue[] = [...loaded.issues];
  for (const issue of checkRules(loaded.content, ruleOptions)) {
    const file = issue.kind && issue.id ? loaded.files.get(`${issue.kind}:${issue.id}`) : undefined;
    issues.push(file ? { ...issue, file } : issue);
  }
  if (imported) issues.push(...crossCheckImports(loaded, imported));
  const counts = countIssues(issues);
  return { ...loaded, issues, ...counts };
}

/** Catch a content file that exists on disk but was never wired into src/content/index.ts. */
export function crossCheckImports(loaded: Loaded, imported: Content): Issue[] {
  const out: Issue[] = [];
  const check = (kind: "card" | "arc" | "advisor" | "modifier" | "ending" | "epilogue", importedIds: string[]) => {
    const onDisk = new Map<string, string>();
    for (const [key, file] of loaded.files) if (key.startsWith(`${kind}:`)) onDisk.set(key.slice(kind.length + 1), file);
    const importedSet = new Set(importedIds);
    for (const [id, file] of onDisk) {
      if (id.startsWith("#")) continue;
      if (!importedSet.has(id)) out.push({ level: "error", code: "not-imported", message: `exists on disk but src/content/index.ts does not import it`, kind, id, file });
    }
    for (const id of importedSet) {
      if (!onDisk.has(id)) out.push({ level: "error", code: "not-on-disk", message: `is imported by src/content/index.ts but no file under ${loaded.root} defines it`, kind, id });
    }
  };
  check("card", imported.cards.map((c) => c.id));
  check("arc", imported.arcs.map((a) => a.id));
  check("advisor", imported.advisors.map((a) => a.id));
  check("modifier", imported.modifiers.map((m) => m.id));
  check("ending", imported.endings.map((e) => e.id));
  check("epilogue", imported.epilogues.map((e) => epilogueId(e)));
  return out;
}

const LEVEL_ORDER = { error: 0, warn: 1 } as const;

export function sortIssues(issues: readonly Issue[]): Issue[] {
  return [...issues].sort(
    (a, b) =>
      LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
      (a.file ?? "~").localeCompare(b.file ?? "~") ||
      (a.id ?? "").localeCompare(b.id ?? "") ||
      (a.path ?? "").localeCompare(b.path ?? "") ||
      a.code.localeCompare(b.code),
  );
}

export function formatIssues(issues: readonly Issue[]): string {
  const rows = sortIssues(issues).map((i) => [i.level === "error" ? "ERROR" : "WARN", i.file ?? "-", i.id ?? "-", i.path ?? "-", `${i.code}: ${i.message}`]);
  const widths = [5, 0, 0, 0];
  for (const r of rows) for (let c = 1; c < 4; c++) widths[c] = Math.max(widths[c]!, r[c]!.length);
  return rows.map((r) => r.map((cell, c) => (c < 4 ? cell.padEnd(widths[c]!) : cell)).join("  ")).join("\n");
}
