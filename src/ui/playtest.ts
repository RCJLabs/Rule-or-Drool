import { STRINGS } from "../content/strings";
import { removeKey, writeKey } from "../meta/storage";
import { serialize, toFile, type RecordedRun } from "../playtest/record";
import { APP_VERSION } from "../version";
import { handFile, type SendOutcome } from "./share";

export type { SendOutcome };

/**
 * Where the playtest record lives on the device (BACKLOG-5 phase 31). Two keys of its own,
 * apart from the save and the profile, so deleting it touches nothing else: the runs
 * already recorded, and the one being played, which is rewritten every card on its own so
 * that a long record is not rewritten on every swipe.
 */
const KEY = "rod.playtest";
const OPEN_KEY = "rod.playtest.open";

/**
 * A run that lasts all three eras is about 15 KB of record, so a full record is about
 * 1.5 MB, inside the 5 MB a browser gives a site's local storage. A hundred runs is past
 * anything a two-week test asks of a tester, and the first runs are the ones worth most, so
 * a full record stops taking runs rather than dropping its oldest.
 */
export const MAX_RECORDED_RUNS = 100;

export const RECORD_FILE_NAME = "rule-or-drool-record.txt";

const runsOf = (raw: string | null): RecordedRun[] => {
  if (!raw) return [];
  const data = JSON.parse(raw) as { runs?: unknown };
  return Array.isArray(data?.runs) ? (data.runs as RecordedRun[]) : [];
};

export function loadRecorded(): RecordedRun[] {
  try {
    return runsOf(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

/**
 * Add a run to the record if there is room. Returns how many runs it holds afterwards. When
 * the storage will not take it, this run is not kept, nothing already kept is lost, and the
 * storage reports it (BACKLOG-8 phase 50).
 */
export function appendRecorded(run: RecordedRun): number {
  const runs = loadRecorded();
  if (runs.length >= MAX_RECORDED_RUNS) return runs.length;
  return writeKey(KEY, JSON.stringify(toFile([...runs, run]))) ? runs.length + 1 : runs.length;
}

export function loadOpen(): RecordedRun | null {
  try {
    const raw = localStorage.getItem(OPEN_KEY);
    const run = raw ? (JSON.parse(raw) as RecordedRun) : null;
    return run && Array.isArray(run.cards) && typeof run.code === "string" ? run : null;
  } catch {
    return null;
  }
}

/** False when the storage would not keep it: the run in progress is not kept past this page. */
export function saveOpen(run: RecordedRun | null): boolean {
  return run ? writeKey(OPEN_KEY, JSON.stringify(run)) : removeKey(OPEN_KEY);
}

export function clearRecorded(): boolean {
  const record = removeKey(KEY);
  return removeKey(OPEN_KEY) && record;
}

/**
 * Hand the record to the share sheet, where the player picks where it goes; where there is
 * no share sheet, save it as a download. The game sends nothing itself. Plain text, because
 * the file types a browser will share include text/plain and not JSON.
 */
export async function sendRecord(runs: readonly RecordedRun[]): Promise<SendOutcome> {
  const file = new File([serialize(toFile(runs))], RECORD_FILE_NAME, { type: "text/plain" });
  const n = String(runs.length);
  const text = (runs.length === 1 ? STRINGS.playtest.shareTextOne : STRINGS.playtest.shareText).replace("{n}", n).replace("{version}", APP_VERSION);
  return handFile(file, { title: STRINGS.playtest.shareTitle, text });
}
