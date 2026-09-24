/**
 * The playtest report (BACKLOG-5 phase 31). Reads the records testers sent from the game
 * (Settings › Keep a record of my runs, then Send my record) and prints what the people did
 * beside what each bot did playing the same runs.
 *
 *   npm run playtests -- [folder] [--min 3] [--look 300] [--top 10]
 *
 * The folder defaults to `playtests/`, which git ignores: the files are other people's
 * play, and this repository is public. Every `.txt` and `.json` in it is read; a file that is
 * not exactly the record format is named and skipped, and the rest are still reported.
 *
 *   --min   decisions a card needs before it can rank as one people hesitate on
 *   --look  milliseconds a preview has to be up to count as looked at
 *   --top   rows in the ranked lists
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { content } from "../src/content";
import { buildLibrary } from "../src/engine";
import { decodeRunCode, setupOf } from "../src/meta/runcode";
import { parseRecord } from "../src/playtest/parse";
import { buildReport, formatReport, gather, type Source } from "../src/playtest/report";
import { traceBot, traceRecorded, type Trace } from "../src/playtest/trace";
import { BOT_NAMES, DEFAULT_RUN_OPTIONS, playRunFrom, type BotName, type RunResult } from "../src/sim";

interface Args {
  dir: string;
  min: number;
  look: number;
  top: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dir: "playtests", min: 3, look: 300, top: 10 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const num = () => {
      const v = Number(argv[++i]);
      if (!Number.isFinite(v) || v < 0) throw new Error(`${a} expects a number`);
      return v;
    };
    if (a === "--min") args.min = num();
    else if (a === "--look") args.look = num();
    else if (a === "--top") args.top = num();
    else if (a === "--help" || a === "-h") {
      console.log("see the header comment in scripts/playtests.ts");
      process.exit(0);
    } else if (a.startsWith("--")) throw new Error(`unknown argument: ${a}`);
    else args.dir = a;
  }
  return args;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(args.dir)) {
    console.error(`No folder at ${args.dir}. Put the record files testers sent in it, or name another folder.`);
    process.exit(1);
  }
  const names = readdirSync(args.dir).filter((f) => /\.(txt|json)$/i.test(f)).sort();
  const sources: Source[] = [];
  for (const name of names) {
    const parsed = parseRecord(readFileSync(join(args.dir, name), "utf8"));
    if (parsed.ok) sources.push({ name, file: parsed.file });
    else console.error(`skipped ${name}:\n  ${parsed.errors.join("\n  ")}`);
  }
  if (!sources.length) {
    console.error(`No record files in ${args.dir} (${names.length} .txt or .json file${names.length === 1 ? "" : "s"} looked at).`);
    process.exit(1);
  }

  const lib = buildLibrary(content);
  const gathered = gather(sources);
  // Each bot plays every finished run a person played, from the same code. A code naming
  // content this version no longer has cannot be replayed, and is left out of the bots' side.
  // The person's run is rebuilt from its code and their sides, for the looks and the votes,
  // when this version still deals it card for card (BACKLOG-7 phase 46).
  const bots = new Map<BotName, RunResult[]>(BOT_NAMES.map((b) => [b, []]));
  const walked = new Map<BotName, Trace[]>(BOT_NAMES.map((b) => [b, []]));
  const people: Trace[] = [];
  let replayed = 0;
  for (const run of gathered.players.flatMap((p) => p.runs)) {
    if (!run.end) continue;
    const decoded = decodeRunCode(lib, run.code);
    if (!decoded.ok) continue;
    replayed++;
    const setup = setupOf(decoded.code);
    for (const bot of BOT_NAMES) {
      bots.get(bot)!.push(playRunFrom(lib, bot, decoded.code.seed, setup, DEFAULT_RUN_OPTIONS));
      walked.get(bot)!.push(traceBot(lib, bot, decoded.code.seed, setup, DEFAULT_RUN_OPTIONS));
    }
    const rebuilt = traceRecorded(lib, run);
    if (rebuilt) people.push(rebuilt);
  }

  const report = buildReport(lib, gathered, bots, { files: sources.length, replayed, lookMs: args.look, minDecisions: args.min }, { people, bots: walked });
  console.log(formatReport(report, args.top));
}

main();
