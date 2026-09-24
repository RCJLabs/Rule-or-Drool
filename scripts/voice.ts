/**
 * The deck's voice, counted (BACKLOG-7 phase 47). Prints the phrases `src/content/voice.ts`
 * watches against their ceilings, the phrases the deck repeats most, and the cards carrying
 * a phrase grouped by file, so an edit pass can go straight to them. It reports and never
 * fails: `validate:mvp` is what holds the ceilings.
 *
 *   npm run voice                   the watched phrases, the most repeated, and the cards
 *                                   carrying a phrase that is over its ceiling
 *   npm run voice -- "a phrase"     the cards carrying that phrase, by file
 *   npm run voice -- --all          the cards carrying every watched phrase
 *   npm run voice -- --top 40       more of the most repeated phrases (20 by default)
 */
import { carrying, VOICE, type VoicePhrase } from "../src/content/voice";
import type { Card } from "../src/engine/types";
import { loadRoot } from "../src/validate/load";

interface Args {
  phrase: string | null;
  all: boolean;
  top: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { phrase: null, all: false, top: 20 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--all") args.all = true;
    else if (a === "--top") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 1) throw new Error("--top expects a whole number");
      args.top = n;
    } else if (a === "--help" || a === "-h") {
      console.log("see the header comment in scripts/voice.ts");
      process.exit(0);
    } else if (a.startsWith("--")) throw new Error(`unknown argument: ${a}`);
    else args.phrase = a;
  }
  return args;
}

/**
 * Words that make up most sentences and say nothing about a voice. A phrase made only of
 * these ("of the", "it is") is left out of the most-repeated list.
 */
const PLAIN = new Set(
  (
    "a an the and or but if of to in on at by for from with as into onto than then so " +
    "is are was were be been being has have had do does did will would can could should may might must " +
    "it its this that these those there here it's that's " +
    "you your yours they them their we our us he him his she her i me my " +
    "not no all any some every each one two three more most much many very just also only still " +
    "who what which when where why how"
  ).split(" "),
);

const words = (text: string): string[] => text.toLowerCase().replace(/[^a-z' ]+/g, " ").split(/\s+/).filter(Boolean);

/** Phrases of two to four words, by how many cards carry each. */
function repeated(cards: readonly Card[], top: number): [string, number][] {
  const count = new Map<string, number>();
  for (const c of cards) {
    const w = words(c.text);
    const seen = new Set<string>();
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= w.length; i++) {
        const g = w.slice(i, i + n);
        if (g.every((x) => PLAIN.has(x))) continue;
        seen.add(g.join(" "));
      }
    }
    for (const g of seen) count.set(g, (count.get(g) ?? 0) + 1);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, top);
}

const cut = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function main(): void {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`voice: ${(e as Error).message}`);
    process.exit(2);
  }
  const { content, files, fileCount } = loadRoot("src/content");
  const cards = content.cards;
  const fileOf = (c: Card) => files.get(`card:${c.id}`) ?? "?";
  const out: string[] = [];

  const list = (p: Pick<VoicePhrase, "phrase" | "match">) => {
    const hits = carrying(cards, p);
    out.push(`"${p.phrase}": ${hits.length} card${hits.length === 1 ? "" : "s"}`);
    const byFile = new Map<string, Card[]>();
    for (const c of hits) byFile.set(fileOf(c), [...(byFile.get(fileOf(c)) ?? []), c]);
    for (const [file, cs] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      out.push(`  ${file}`);
      for (const c of cs) out.push(`    ${c.id.padEnd(30)} ${cut(c.text.replace(/\s+/g, " "), 100)}`);
    }
    out.push("");
  };

  if (args.phrase) {
    const escaped = args.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    list({ phrase: args.phrase, match: new RegExp(`\\b${escaped}\\b`, "i") });
    console.log(out.join("\n"));
    return;
  }

  out.push(`rule-or-drool voice: ${cards.length} cards in ${fileCount} files`);
  out.push("");
  out.push("== watched (src/content/voice.ts) ==");
  for (const p of VOICE) {
    const n = carrying(cards, p).length;
    const over = n > p.ceiling ? `over by ${n - p.ceiling}` : `${p.ceiling - n} to spare`;
    out.push(`${p.phrase.padEnd(34)} ${String(n).padStart(4)} cards   ceiling ${String(p.ceiling).padStart(3)}   ${over}`);
  }
  out.push("");
  out.push(`== the phrases in the most cards (2-4 words, leaving out ones made only of words like "of the") ==`);
  for (const [g, n] of repeated(cards, args.top)) out.push(`${String(n).padStart(4)}  ${g}`);
  out.push("");
  const shown = VOICE.filter((p) => args.all || carrying(cards, p).length > p.ceiling);
  if (shown.length) {
    out.push(args.all ? "== the cards carrying each watched phrase ==" : "== the cards carrying a phrase over its ceiling ==");
    for (const p of shown) list(p);
  } else out.push("Every watched phrase is under its ceiling. --all lists their cards anyway.");
  console.log(out.join("\n"));
}

main();
