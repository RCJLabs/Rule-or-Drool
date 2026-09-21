/**
 * Content validator (TRANSFER.md section 8). Exit 1 on any error, or on warnings with
 * --strict; exit 2 on bad usage.
 *
 *   npm run validate -- [--root src/content] [--min-cell 16] [--eras auto|all|1,2,3]
 *                       [--strict] [--quiet] [--no-imports]
 *
 * --eras auto (default) checks only eras that have event cards and warns about the rest;
 * use --eras all as the MVP gate. --no-imports skips the disk-vs-src/content/index.ts
 * cross-check, which otherwise runs whenever --root is the real content directory.
 */
import { resolve } from "node:path";
import { content as imported } from "../src/content";
import { DEFAULT_RULE_OPTIONS, formatIssues, validateRoot, type RuleOptions } from "../src/validate";

interface Args {
  root: string;
  minCell: number;
  eras: RuleOptions["eras"];
  strict: boolean;
  quiet: boolean;
  imports: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { root: "src/content", minCell: DEFAULT_RULE_OPTIONS.minCell, eras: "auto", strict: false, quiet: false, imports: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`missing value for ${a}`);
      return v;
    };
    switch (a) {
      case "--root":
        args.root = next();
        break;
      case "--min-cell":
        args.minCell = Number(next());
        if (!Number.isInteger(args.minCell) || args.minCell < 0) throw new Error("--min-cell expects a non-negative integer");
        break;
      case "--eras": {
        const v = next();
        if (v === "auto" || v === "all") args.eras = v;
        else {
          args.eras = v.split(",").map((s) => Number(s));
          if (args.eras.some((e) => !Number.isInteger(e) || e < 1)) throw new Error("--eras expects auto, all or a list like 1,2,3");
        }
        break;
      }
      case "--strict":
        args.strict = true;
        break;
      case "--quiet":
        args.quiet = true;
        break;
      case "--no-imports":
        args.imports = false;
        break;
      case "--help":
      case "-h":
        console.log("see the header comment in scripts/validate-content.ts");
        process.exit(0);
        break;
      default:
        throw new Error(`unknown argument: ${a}`);
    }
  }
  return args;
}

function main(): void {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`validate-content: ${(e as Error).message}`);
    process.exit(2);
  }
  const isRealRoot = resolve(args.root) === resolve("src/content");
  const report = validateRoot(args.root, {
    minCell: args.minCell,
    eras: args.eras,
    ...(args.imports && isRealRoot ? { imported } : {}),
  });
  const c = report.content;
  console.log(
    `validate-content: ${args.root} (${report.fileCount} files: ${c.cards.length} cards, ${c.arcs.length} arcs, ${c.advisors.length} advisors, ${c.modifiers.length} modifiers, ${c.endings.length} endings, ${c.epilogues.length} epilogues)`,
  );
  const shown = args.quiet ? report.issues.filter((i) => i.level === "error") : report.issues;
  if (shown.length) console.log(formatIssues(shown));
  console.log(`${report.errors} error${report.errors === 1 ? "" : "s"}, ${report.warnings} warning${report.warnings === 1 ? "" : "s"}`);
  if (report.errors > 0 || (args.strict && report.warnings > 0)) process.exit(1);
}

main();
