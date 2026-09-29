import { DECK_PATTERN } from "../engine/deck";
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

/**
 * A run code of any format the game writes (see runcode.ts): the version, base-36 seed and side,
 * then three lists of ids, a platform's two promises among them; a long reign's or a short term's
 * eras (format 2); what a run took over, after its eras or "-" (format 3); the ending a run went
 * looking for (format 4); and the clock a run was taken on, after the ending or "-" (format 5,
 * BACKLOG-13 phase 93). Formats 3 and 4, and a platform's promises, were refused here until
 * BACKLOG-13 phase 84, which made a whole record unreadable for one such run.
 */
const CODE = (() => {
  const seed = "[0-9a-z]{1,8}\\.[LR]";
  const list = "[a-z0-9_~-]+";
  const lists = `${list}\\.${list}\\.${list}`;
  const eras = "[1-9][0-9]?";
  return new RegExp(
    `^(?:1\\.${seed}\\.${lists}|2\\.${seed}\\.${lists}\\.${eras}|3\\.${seed}\\.${lists}\\.(?:-|${eras})\\.${list}|4\\.${seed}\\.${lists}\\.(?:-|${eras})\\.${list}\\.[a-z0-9_]+|5\\.${seed}\\.${lists}\\.(?:-|${eras})\\.${list}\\.(?:-|[a-z0-9_]+)\\.[1-9][0-9]?)$`,
  );
})();

const RUN: Spec = {
  kind: "object",
  fields: {
    game: { kind: "string", pattern: /^\d{1,3}\.\d{1,3}\.\d{1,3}$/, hint: "a version like 0.43.0" },
    deck: { kind: "string", pattern: DECK_PATTERN, hint: "a deck stamp: eight letters and digits" },
    // Whether the game can replay a code depends on its content, which the report checks;
    // here it only has to be one (CODE, above).
    code: { kind: "string", pattern: CODE, hint: "a run code" },
    // The crisis offered beside the run's and passed over, when the player picked (BACKLOG-13 phase 84).
    passedOver: { kind: "string", pattern: ID_PATTERN },
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
