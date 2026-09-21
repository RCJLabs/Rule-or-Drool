export type Level = "error" | "warn";
export type ItemKind = "card" | "arc" | "advisor" | "modifier" | "ending" | "epilogue" | "file";

export interface Issue {
  level: Level;
  /** Stable machine-readable code, e.g. "unknown-ref". */
  code: string;
  message: string;
  kind?: ItemKind;
  id?: string;
  /** Path inside the item, e.g. "right.enqueue[0].id". */
  path?: string;
  /** Relative file path, filled in by the loader when the item came from disk. */
  file?: string;
}

export interface Where {
  kind?: ItemKind;
  id?: string;
  path?: string;
  file?: string;
}

/** Tiny collector so rules read as `issues.error(code, message, where)`. */
export class Issues {
  readonly items: Issue[] = [];

  error(code: string, message: string, where: Where = {}): void {
    this.items.push({ level: "error", code, message, ...where });
  }

  warn(code: string, message: string, where: Where = {}): void {
    this.items.push({ level: "warn", code, message, ...where });
  }

  get errors(): number {
    return this.items.filter((i) => i.level === "error").length;
  }

  get warnings(): number {
    return this.items.filter((i) => i.level === "warn").length;
  }
}

export function countIssues(issues: readonly Issue[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const i of issues) if (i.level === "error") errors++; else warnings++;
  return { errors, warnings };
}
