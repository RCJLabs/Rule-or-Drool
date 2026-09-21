/**
 * Reads a content root from disk, schema-checks every JSON file and assembles a Content
 * bundle from the items that passed. Items that fail schema are reported and dropped so
 * the semantic rules never see malformed data.
 */
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import type { Advisor, Arc, Card, Content, Ending, Epilogue, Modifier } from "../engine/types";
import { Issues, type Issue, type ItemKind } from "./issues";
import { ADVISOR_SPEC, ARC_SPEC, CARD_SPEC, ENDING_SPEC, EPILOGUE_SPEC, MODIFIER_SPEC, checkSpec, type Spec } from "./schema";

export interface Loaded {
  root: string;
  content: Content;
  issues: Issue[];
  /** `${kind}:${id}` -> relative file path, for every item seen on disk (valid or not). */
  files: Map<string, string>;
  /** Number of JSON files read. */
  fileCount: number;
}

export const REQUIRED_FILES = ["advisors.json", "modifiers.json", "endings.json", "epilogues.json"] as const;

function listJson(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const abs = resolve(entry.parentPath ?? (entry as unknown as { path: string }).path, entry.name);
    out.push(relative(root, abs).split(sep).join("/"));
  }
  return out.sort();
}

export function loadRoot(rootArg: string): Loaded {
  const root = resolve(rootArg);
  const issues = new Issues();
  const files = new Map<string, string>();
  const content: Content = { cards: [], arcs: [], advisors: [], modifiers: [], endings: [], epilogues: [] };

  const seenFiles = new Set<string>();
  const jsonFiles = listJson(root);

  function loadArray<T>(raw: unknown, spec: Spec, kind: ItemKind, file: string, keyOf: (item: T) => string): T[] {
    const list = Array.isArray(raw) ? raw : raw !== null && typeof raw === "object" && kind === "arc" ? [raw] : null;
    if (!list) {
      issues.error("schema", `expected an array of ${kind}s`, { kind: "file", id: file, file });
      return [];
    }
    const out: T[] = [];
    list.forEach((item, i) => {
      const rawId = item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : null;
      const id = rawId ?? (kind === "epilogue" && item && typeof item === "object" ? epilogueId(item as Record<string, unknown>) : `#${i}`);
      let failed = false;
      checkSpec(item, spec, "", (path, message) => {
        failed = true;
        issues.error("schema", message, { kind, id, path, file });
      });
      files.set(`${kind}:${id}`, file);
      if (!failed) {
        const typed = item as T;
        files.set(`${kind}:${keyOf(typed)}`, file);
        out.push(typed);
      }
    });
    return out;
  }

  for (const file of jsonFiles) {
    seenFiles.add(file);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(resolve(root, file), "utf8"));
    } catch (e) {
      issues.error("json-syntax", (e as Error).message, { kind: "file", id: file, file });
      continue;
    }
    if (file.startsWith("cards/")) content.cards.push(...loadArray<Card>(raw, CARD_SPEC, "card", file, (c) => c.id));
    else if (file.startsWith("arcs/")) content.arcs.push(...loadArray<Arc>(raw, ARC_SPEC, "arc", file, (a) => a.id));
    else if (file === "advisors.json") content.advisors.push(...loadArray<Advisor>(raw, ADVISOR_SPEC, "advisor", file, (a) => a.id));
    else if (file === "modifiers.json") content.modifiers.push(...loadArray<Modifier>(raw, MODIFIER_SPEC, "modifier", file, (m) => m.id));
    else if (file === "endings.json") content.endings.push(...loadArray<Ending>(raw, ENDING_SPEC, "ending", file, (e) => e.id));
    else if (file === "epilogues.json") content.epilogues.push(...loadArray<Epilogue>(raw, EPILOGUE_SPEC, "epilogue", file, (e) => epilogueId(e)));
    else issues.error("file-unclassified", `not a content file: expected cards/**, arcs/** or one of ${REQUIRED_FILES.join(", ")}`, { kind: "file", id: file, file });
  }
  for (const required of REQUIRED_FILES) {
    if (!seenFiles.has(required)) issues.error("file-missing", `${required} is missing`, { kind: "file", id: required, file: required });
  }

  return { root, content, issues: issues.items, files, fileCount: jsonFiles.length };
}

export function epilogueId(e: { band?: unknown; align?: unknown; era?: unknown }): string {
  return `${String(e.band)}:${String(e.align)}:${String(e.era)}`;
}
