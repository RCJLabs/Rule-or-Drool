/**
 * Balance harness (TRANSFER.md section 8). Plays N seeded runs per bot headlessly and
 * prints run length, ouster causes, band distribution and the section 8 target checks.
 *
 *   npm run simulate -- [--runs 10000] [--seed 1] [--bot all|random|greedy|saint|mixed]
 *                        [--align alternate|left|right] [--danger 25]
 *                        [--unlocked] [--long] [--set eraMeterPull=0 ...] [--strict]
 *
 * --long plays long reigns, five eras, against their own targets (BACKLOG-5 phase 39).
 * --set overrides any numeric EngineConfig key for the whole batch (quick tuning sweeps).
 * --strict exits 1 when any target misses (for CI once phase 4 tunes content).
 */
import { content } from "../src/content";
import { buildLibrary, DEFAULT_CONFIG, type EngineConfig } from "../src/engine";
import { allUnlockTokens } from "../src/meta/objectives";
import { BOT_NAMES, evaluateLongTargets, evaluateTargets, formatContentStats, formatSummary, formatTargets, quantiles, repeatProfile, simulate, summarize, type BotName, type BotSummary } from "../src/sim";

interface Args {
  runs: number;
  seed: number;
  bots: BotName[];
  align: "alternate" | "left" | "right";
  danger: number;
  strict: boolean;
  unlocked: boolean;
  long: boolean;
  overrides: Partial<EngineConfig>;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { runs: 10000, seed: 1, bots: [...BOT_NAMES], align: "alternate", danger: 25, strict: false, unlocked: false, long: false, overrides: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`missing value for ${a}`);
      return v;
    };
    switch (a) {
      case "--runs":
        args.runs = Number(next());
        break;
      case "--seed":
        args.seed = Number(next());
        break;
      case "--bot": {
        const v = next();
        args.bots = v === "all" ? [...BOT_NAMES] : (v.split(",") as BotName[]);
        for (const b of args.bots) if (!BOT_NAMES.includes(b)) throw new Error(`unknown bot: ${b}`);
        break;
      }
      case "--align": {
        const v = next();
        if (v !== "alternate" && v !== "left" && v !== "right") throw new Error(`bad --align ${v}`);
        args.align = v;
        break;
      }
      case "--danger":
        args.danger = Number(next());
        break;
      case "--strict":
        args.strict = true;
        break;
      case "--unlocked":
        args.unlocked = true;
        break;
      case "--long":
        args.long = true;
        break;
      case "--set": {
        const [k, v] = next().split("=");
        if (!k || v === undefined || !(k in DEFAULT_CONFIG) || typeof DEFAULT_CONFIG[k as keyof EngineConfig] !== "number") {
          throw new Error(`--set expects <numeric config key>=<number>, got ${k}=${v}`);
        }
        (args.overrides as Record<string, number>)[k] = Number(v);
        break;
      }
      case "--help":
      case "-h":
        console.log("see header comment in scripts/simulate.ts");
        process.exit(0);
        break;
      default:
        throw new Error(`unknown argument: ${a}`);
    }
  }
  return args;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const lib = buildLibrary(content, args.overrides);

  console.log(
    `rule-or-drool balance harness: ${args.runs} runs per bot, seed ${args.seed}, align ${args.align}, danger ${args.danger}, unlocks ${args.unlocked ? "all" : "none"}${args.long ? `, long reigns (${lib.config.longEraCount} eras)` : ""}`,
  );
  if (Object.keys(args.overrides).length) console.log(`config overrides: ${JSON.stringify(args.overrides)}`);
  console.log(
    `config: eras ${lib.config.eraCount} x ${lib.config.eraLength} cards, election every ${lib.config.electionInterval} (mood < ${lib.config.electionMoodThreshold} loses), bands at ±${lib.config.bandAscentAt}, volatility ${JSON.stringify(lib.config.volatility)}, era meter pull ${lib.config.eraMeterPull}`,
  );
  console.log(formatContentStats(lib));
  console.log();

  const t0 = performance.now();
  const unlocked = args.unlocked ? allUnlockTokens() : [];
  const eraCount = args.long ? lib.config.longEraCount : undefined;
  const results = simulate(lib, { runs: args.runs, seed: args.seed, bots: args.bots, align: args.align, danger: args.danger, maxCards: 1000, unlocked, eraCount });
  const elapsed = (performance.now() - t0) / 1000;

  const summaries = new Map<BotName, BotSummary>();
  for (const bot of args.bots) {
    const s = summarize(bot, results.get(bot) ?? []);
    summaries.set(bot, s);
    console.log(formatSummary(s));
    console.log();
  }

  const targets = args.long ? evaluateLongTargets(summaries, lib.config.longEraCount) : evaluateTargets(summaries);
  console.log(formatTargets(targets, args.long ? "long reign targets (BACKLOG-5 phase 39)" : undefined));
  const misses = targets.filter((t) => !t.info && !t.pass);
  console.log();
  console.log(`${targets.filter((t) => !t.info).length - misses.length} pass, ${misses.length} miss. ${(args.runs * args.bots.length).toLocaleString()} runs in ${elapsed.toFixed(1)}s.`);
  // Fixed players rather than --runs and --seed, so the numbers compare across decks: forty
  // players from seed 300,000, the way BACKLOG-6 measured what phase 44 set out to bring down.
  const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
  const tenth = repeatProfile(lib, { players: 40, run: 10, seedBase: 300_000 });
  const twentieth = repeatProfile(lib, { players: 40, run: 20, seedBase: 300_000 });
  console.log(
    `cards already seen (median of 40 players, mixed bot): tenth run ${pct(quantiles(tenth.all).median)} (want at most 65%), ` +
      `its first era ${pct(quantiles(tenth.byEra.get(1)!).median)} (at most 60%); twentieth run ${pct(quantiles(twentieth.all).median)} (at most 85%)`,
  );
  if (args.strict && misses.length > 0) process.exit(1);
}

main();
