import { BANDS, METER_KEYS } from "../engine/types";
import { checkSpec, ID_PATTERN, type Spec } from "../validate/schema";
import { RECORD_FORMAT, RECORD_VERSION, RUN_KINDS, type RecordFile } from "./record";

/**
 * Read a record file back, refusing anything that is not exactly the format (BACKLOG-5
 * phase 31). Unknown fields are errors, as they are for content: the promise made to a
 * tester is that the file holds game state and nothing else, and a reader that skipped
 * fields it did not know would let a file that broke that promise through without a word.
 */

const INT = (min: number, max: number): Spec => ({ kind: "number", integer: true, min, max });
const METERS: Spec = { kind: "array", items: INT(0, 100), length: METER_KEYS.length };
/** A day in front of one card is not a decision, it is a phone left on a table. */
const MS = INT(0, 86_400_000);

const CARD: Spec = {
  kind: "object",
  fields: {
    card: { kind: "string", pattern: ID_PATTERN },
    side: { kind: "enum", values: ["left", "right"] },
    ms: MS,
    looked: { kind: "array", items: MS, length: 2 },
    drift: INT(-100, 100),
    before: METERS,
    after: METERS,
    // Only ever `true`; checked for that below, since the spec has no literals.
    resumed: { kind: "boolean" },
  },
  required: ["card", "side", "ms", "looked", "drift", "before", "after"],
};

const END: Spec = {
  kind: "object",
  fields: { ending: { kind: "string", pattern: ID_PATTERN }, era: INT(1, 99), cards: INT(0, 10_000), band: { kind: "enum", values: BANDS } },
  required: ["ending", "era", "cards", "band"],
};

const RUN: Spec = {
  kind: "object",
  fields: {
    game: { kind: "string", pattern: /^\d{1,3}\.\d{1,3}\.\d{1,3}$/, hint: "a version like 0.43.0" },
    // Whether the game can replay a code depends on its content, which the report checks;
    // here it only has to be one: version, base-36 seed, side, then three lists of ids, and
    // for a long reign (format 2) its era count as well (BACKLOG-5 phase 39).
    code: {
      kind: "string",
      pattern: /^(?:1\.[0-9a-z]{1,8}\.[LR]\.[a-z0-9_~-]+\.[a-z0-9_~-]+\.[a-z0-9_-]+|2\.[0-9a-z]{1,8}\.[LR]\.[a-z0-9_~-]+\.[a-z0-9_~-]+\.[a-z0-9_-]+\.[1-9][0-9]?)$/,
      hint: "a run code",
    },
    kind: { kind: "enum", values: RUN_KINDS },
    run: INT(1, 1_000_000),
    end: { kind: "nullable", spec: END },
    cards: { kind: "array", items: CARD },
  },
  required: ["game", "code", "kind", "run", "end", "cards"],
};

const FILE: Spec = {
  kind: "object",
  fields: {
    format: { kind: "enum", values: [RECORD_FORMAT] },
    v: INT(RECORD_VERSION, RECORD_VERSION),
    meters: { kind: "array", items: { kind: "enum", values: METER_KEYS }, length: METER_KEYS.length },
    runs: { kind: "array", items: RUN },
  },
  required: ["format", "v", "meters", "runs"],
};

export type Parsed = { ok: true; file: RecordFile } | { ok: false; errors: string[] };

/** Most problems one file reports: past this it is not a record with a typo in it. */
const MAX_ERRORS = 12;

export function parseRecord(text: string): Parsed {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`not JSON: ${(e as Error).message}`] };
  }
  const errors: string[] = [];
  const fail = (path: string, message: string) => {
    if (errors.length < MAX_ERRORS) errors.push(`${path || "file"}: ${message}`);
  };
  checkSpec(raw, FILE, "", fail);
  if (errors.length) return { ok: false, errors };
  const file = raw as RecordFile;
  if (file.meters.join() !== METER_KEYS.join()) fail("meters", `expected ${METER_KEYS.join(", ")}, in that order`);
  file.runs.forEach((run, i) =>
    run.cards.forEach((card, j) => {
      if ("resumed" in card && card.resumed !== true) fail(`runs[${i}].cards[${j}].resumed`, "can only be true");
    }),
  );
  return errors.length ? { ok: false, errors } : { ok: true, file };
}
