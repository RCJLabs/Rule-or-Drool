/**
 * Structural checks on raw JSON before it is trusted as engine content. A hand-rolled
 * spec DSL keeps this dependency-free and lets every message carry an exact path.
 * Unknown fields are errors: a typo in a generated batch must not silently no-op.
 */
import { ALIGNS, BANDS, CARD_TYPES, METER_KEYS } from "../engine/types";

export type Spec =
  | { kind: "string"; nonEmpty?: boolean; pattern?: RegExp; hint?: string }
  | { kind: "number"; integer?: boolean; min?: number; max?: number }
  | { kind: "boolean" }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "array"; items: Spec; nonEmpty?: boolean; unique?: boolean }
  | { kind: "object"; fields: Record<string, Spec>; required: readonly string[] }
  | { kind: "record"; values: Spec; keys?: readonly string[] };

export type Fail = (path: string, message: string) => void;

function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "string") return JSON.stringify(value.length > 30 ? `${value.slice(0, 27)}...` : value);
  if (typeof value === "object") return "object";
  return `${typeof value} ${String(value)}`;
}

export function checkSpec(value: unknown, spec: Spec, path: string, fail: Fail): void {
  switch (spec.kind) {
    case "string":
      if (typeof value !== "string") return fail(path, `expected string, got ${describe(value)}`);
      if (spec.nonEmpty && value.length === 0) return fail(path, "must not be empty");
      if (spec.pattern && !spec.pattern.test(value)) return fail(path, spec.hint ?? `must match ${spec.pattern}`);
      return;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) return fail(path, `expected number, got ${describe(value)}`);
      if (spec.integer && !Number.isInteger(value)) return fail(path, `expected integer, got ${value}`);
      if (spec.min !== undefined && value < spec.min) return fail(path, `must be >= ${spec.min}, got ${value}`);
      if (spec.max !== undefined && value > spec.max) return fail(path, `must be <= ${spec.max}, got ${value}`);
      return;
    case "boolean":
      if (typeof value !== "boolean") fail(path, `expected boolean, got ${describe(value)}`);
      return;
    case "enum":
      if (typeof value !== "string" || !spec.values.includes(value)) {
        fail(path, `expected one of ${spec.values.map((v) => JSON.stringify(v)).join(", ")}, got ${describe(value)}`);
      }
      return;
    case "array": {
      if (!Array.isArray(value)) return fail(path, `expected array, got ${describe(value)}`);
      if (spec.nonEmpty && value.length === 0) return fail(path, "must not be empty");
      const seen = new Set<string>();
      value.forEach((item, i) => {
        checkSpec(item, spec.items, `${path}[${i}]`, fail);
        if (spec.unique) {
          const key = JSON.stringify(item);
          if (seen.has(key)) fail(`${path}[${i}]`, `duplicate entry ${key}`);
          seen.add(key);
        }
      });
      return;
    }
    case "object": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return fail(path, `expected object, got ${describe(value)}`);
      }
      const obj = value as Record<string, unknown>;
      for (const key of spec.required) if (!(key in obj)) fail(join(path, key), "required field is missing");
      for (const [key, v] of Object.entries(obj)) {
        const field = spec.fields[key];
        if (!field) fail(join(path, key), "unknown field");
        else checkSpec(v, field, join(path, key), fail);
      }
      return;
    }
    case "record": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return fail(path, `expected object, got ${describe(value)}`);
      }
      for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        if (spec.keys && !spec.keys.includes(key)) fail(join(path, key), `unknown key; expected one of ${spec.keys.join(", ")}`);
        else checkSpec(v, spec.values, join(path, key), fail);
      }
      return;
    }
  }
}

function join(path: string, key: string): string {
  return path ? `${path}.${key}` : key;
}

// ---- specs -------------------------------------------------------------------------

export const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
export const ID: Spec = { kind: "string", nonEmpty: true, pattern: ID_PATTERN, hint: "ids are lowercase snake_case: a-z, 0-9 and _" };
const IDS: Spec = { kind: "array", items: ID, unique: true };
const INT: Spec = { kind: "number", integer: true };
const POSITIVE_INT: Spec = { kind: "number", integer: true, min: 1 };
const BOOL: Spec = { kind: "boolean" };
const STR: Spec = { kind: "string" };
const NON_EMPTY: Spec = { kind: "string", nonEmpty: true };
const WEIGHT: Spec = { kind: "number", min: 0 };
const BAND: Spec = { kind: "enum", values: BANDS };
const ALIGN: Spec = { kind: "enum", values: ALIGNS };
const ERAS: Spec = { kind: "array", items: POSITIVE_INT, nonEmpty: true, unique: true };
const BAND_LIST: Spec = { kind: "array", items: BAND, nonEmpty: true, unique: true };
const meterMap = (values: Spec): Spec => ({ kind: "record", keys: METER_KEYS, values });

const COND_FIELDS: Record<string, Spec> = {
  flags: IDS,
  notFlags: IDS,
  meters: meterMap({ kind: "object", required: [], fields: { lt: INT, gt: INT } }),
};

export const COND_SPEC: Spec = { kind: "object", required: [], fields: COND_FIELDS };

export const CHOICE_SPEC: Spec = {
  kind: "object",
  required: ["label"],
  fields: {
    label: NON_EMPTY,
    fx: meterMap(INT),
    drift: INT,
    setFlags: IDS,
    clearFlags: IDS,
    enqueue: { kind: "array", items: { kind: "object", required: ["id", "delay"], fields: { id: ID, delay: POSITIVE_INT } } },
    next: ID,
    ending: ID,
    honest: BOOL,
    electionDelay: POSITIVE_INT,
  },
};

export const CARD_SPEC: Spec = {
  kind: "object",
  required: ["id", "type", "align", "eras", "bands", "speaker", "text", "left", "right"],
  fields: {
    id: ID,
    type: { kind: "enum", values: CARD_TYPES },
    align: ALIGN,
    eras: ERAS,
    bands: BAND_LIST,
    speaker: ID,
    text: STR,
    cond: COND_SPEC,
    weight: WEIGHT,
    oneShot: BOOL,
    arc: ID,
    step: POSITIVE_INT,
    left: CHOICE_SPEC,
    right: CHOICE_SPEC,
  },
};

export const ARC_SPEC: Spec = {
  kind: "object",
  required: ["id", "align", "entry", "weight", "cards"],
  fields: {
    id: ID,
    align: ALIGN,
    entry: { kind: "object", required: ["eras", "bands"], fields: { eras: ERAS, bands: BAND_LIST, ...COND_FIELDS } },
    weight: WEIGHT,
    cards: { kind: "array", items: ID, nonEmpty: true, unique: true },
  },
};

export const ADVISOR_SPEC: Spec = {
  kind: "object",
  required: ["id", "role", "name", "traits"],
  fields: { id: ID, role: ID, name: NON_EMPTY, traits: IDS },
};

export const MODIFIER_SPEC: Spec = {
  kind: "object",
  required: ["id", "kind"],
  fields: {
    id: ID,
    kind: { kind: "enum", values: ["trait", "flaw", "crisis"] },
    meterStart: meterMap(INT),
    flags: IDS,
    arcWeights: { kind: "record", values: WEIGHT },
  },
};

export const ENDING_SPEC: Spec = {
  kind: "object",
  required: ["id", "title", "text"],
  fields: { id: ID, title: NON_EMPTY, text: NON_EMPTY },
};

export const EPILOGUE_SPEC: Spec = {
  kind: "object",
  required: ["band", "align", "era", "text"],
  fields: { band: BAND, align: ALIGN, era: POSITIVE_INT, text: NON_EMPTY },
};
