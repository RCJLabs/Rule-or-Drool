/**
 * Semantic checks on typed content (TRANSFER.md section 8, validator). Pure: takes a
 * Content bundle and options, returns issues. Runs on fixtures in tests and on the real
 * content from the CLI.
 */
import { DEFAULT_CONFIG, type EngineConfig } from "../engine/config";
import { findEpilogue } from "../engine/endings";
import { BROKE_MANDATE_FLAG, MANDATES, MANDATE_FLAG_PREFIX } from "../engine/mandates";
import { fxDeltas } from "../engine/state";
import type { Arc, Card, Choice, Cond, Content } from "../engine/types";
import { BANDS, BLOC_KEYS, METER_KEYS, PLAYER_ALIGNS } from "../engine/types";

/** Content may write and read `mood`, the shorthand across the coalition blocs. */
const FX_KEYS = [...METER_KEYS, "mood"] as const;
/** Conditions can read the rival's pressure too; effects cannot (BACKLOG item 7). */
const COND_KEYS = [...FX_KEYS, "rival", "drift", "tenure"] as const;
import { VOICE, carrying, type VoicePhrase } from "../content/voice";
import { HISTORIES, HISTORY_ORDER, NO_LEGACY } from "../meta/histories";
import { LEGACY_FLAGS } from "../meta/legacies";
import { allUnlockTokens } from "../meta/objectives";
import { Issues, type Issue, type Where } from "./issues";

/** The fewest opposition cards each side may have: an opposition is up to nine cards. */
const OPPOSITION_MIN = 25;
/** The fewest campaign cards each side may have: a long reign campaigns for five votes, two cards each. */
const CAMPAIGN_MIN = 20;

export interface RuleOptions {
  config: EngineConfig;
  /** Minimum eligible event cards per era × band × align cell. */
  minCell: number;
  /** Minimum unlocked crises / traits / flaws a side can draw from at run setup. */
  minSetupPool: number;
  /** Eras to check: a list, "all" (1..eraCount) or "auto" (eras that have any pool card). */
  eras: number[] | "all" | "auto";
  /** Soft limits from the content plan (section 10); warnings. */
  maxText: number;
  maxLabel: number;
  /** Advisor traits the engine knows about (5.8); unknown ones warn. */
  knownTraits: readonly string[];
  /**
   * Unlock tokens objectives can grant (5.10). Content may only `require` one of these, and
   * a token nothing requires is a warning. Pass [] for a content set with no meta layer.
   */
  unlockTokens: readonly string[];
  /** Phrases with a ceiling on the cards that may carry them (BACKLOG-7 phase 47); warnings. */
  voice: readonly VoicePhrase[];
}

export const DEFAULT_RULE_OPTIONS: RuleOptions = {
  config: DEFAULT_CONFIG,
  // cooldownSize + 1: a full cell never needs a cooldown relaxation. MVP should gate higher.
  minCell: DEFAULT_CONFIG.cooldownSize + 1,
  // Four is the point at which a side's opening stops repeating within a few runs.
  minSetupPool: 4,
  eras: "auto",
  maxText: 160,
  maxLabel: 24,
  knownTraits: ["loyal", "corrupt", "competent", "zealot"],
  unlockTokens: allUnlockTokens(),
  voice: VOICE,
};

/**
 * The time a long reign's eras are set at, as a card says it. A card drawn in both of the
 * long reign's eras cannot say which it is in: 64 comebacks drawn in eras 4 and 5 opened "Two
 * centuries on" or "Two centuries after", and read that way in the era headed "Five centuries
 * on" too (BACKLOG-7 phase 47). How long something has lasted ("in two centuries") is not
 * the era's span and is not checked.
 */
const ERA_SPANS: { phrase: string; match: RegExp; era: number }[] = [
  { phrase: "two centuries on", match: /\btwo centuries (on|later|after)\b/i, era: 4 },
  { phrase: "five centuries on", match: /\bfive centuries (on|later|after)\b/i, era: 5 },
];

/** Ending ids the engine can reach without any card naming them. */
export function engineEndings(config: EngineConfig): string[] {
  return [
    ...METER_KEYS.flatMap((k) => [config.meterEndings[k].low, config.meterEndings[k].high]),
    config.electionLossEnding,
    config.rivalEnding,
    config.coupEnding,
    config.cultEnding,
    ...BANDS.map((b) => `${config.finalePrefix}${b}`),
    // A long reign's finales (BACKLOG-5 phase 39), when the config has one.
    ...(config.longEraCount > config.eraCount ? BANDS.map((b) => `${config.longFinalePrefix}${b}`) : []),
  ].filter((id): id is string => typeof id === "string");
}

/** The last era any run can reach: a long reign's, when it is longer (BACKLOG-5 phase 39). */
export function lastEra(config: EngineConfig): number {
  return Math.max(config.eraCount, config.longEraCount);
}

export function resolveEras(content: Content, opts: Pick<RuleOptions, "eras" | "config">): { eras: number[]; empty: number[] } {
  const all = Array.from({ length: lastEra(opts.config) }, (_, i) => i + 1);
  const present = new Set<number>();
  for (const c of content.cards) if (c.type === "event" && (c.weight ?? 1) > 0) for (const e of c.eras) present.add(e);
  const empty = all.filter((e) => !present.has(e));
  if (opts.eras === "all") return { eras: all, empty };
  if (opts.eras === "auto") return { eras: all.filter((e) => present.has(e)), empty };
  return { eras: [...opts.eras].sort((a, b) => a - b), empty };
}

const SIDES = ["left", "right"] as const;

function signVector(choice: Choice): string {
  const signs = METER_KEYS.map((k) => Math.sign(choice.fx?.[k] ?? 0));
  signs.push(Math.sign(choice.drift ?? 0));
  return signs.join(",");
}

export function checkRules(content: Content, options: Partial<RuleOptions> = {}): Issue[] {
  const opts: RuleOptions = { ...DEFAULT_RULE_OPTIONS, ...options };
  const cfg = opts.config;
  const issues = new Issues();

  // ---- indexes and duplicate ids ----------------------------------------------------
  const cards = new Map<string, Card>();
  for (const c of content.cards) {
    if (cards.has(c.id)) issues.error("duplicate-id", `card id "${c.id}" is defined more than once`, { kind: "card", id: c.id });
    else cards.set(c.id, c);
  }
  const arcs = new Map<string, Arc>();
  for (const a of content.arcs) {
    if (arcs.has(a.id)) issues.error("duplicate-id", `arc id "${a.id}" is defined more than once`, { kind: "arc", id: a.id });
    else arcs.set(a.id, a);
  }
  const endings = new Set<string>();
  for (const e of content.endings) {
    if (endings.has(e.id)) issues.error("duplicate-id", `ending id "${e.id}" is defined more than once`, { kind: "ending", id: e.id });
    endings.add(e.id);
  }
  const advisorIds = new Set<string>();
  const roles = new Set<string>();
  for (const a of content.advisors) {
    if (advisorIds.has(a.id)) issues.error("duplicate-id", `advisor id "${a.id}" is defined more than once`, { kind: "advisor", id: a.id });
    advisorIds.add(a.id);
    roles.add(a.role);
    for (const t of a.traits) {
      if (!opts.knownTraits.includes(t)) issues.warn("trait-unknown", `trait "${t}" is not one of ${opts.knownTraits.join(", ")}`, { kind: "advisor", id: a.id, path: "traits" });
    }
  }
  const modifierIds = new Set<string>();
  for (const m of content.modifiers) {
    if (modifierIds.has(m.id)) issues.error("duplicate-id", `modifier id "${m.id}" is defined more than once`, { kind: "modifier", id: m.id });
    modifierIds.add(m.id);
    for (const arcId of Object.keys(m.arcWeights ?? {})) {
      if (!arcs.has(arcId)) issues.error("unknown-ref", `arcWeights names unknown arc "${arcId}"`, { kind: "modifier", id: m.id, path: `arcWeights.${arcId}` });
    }
    // On a card the mood shorthand is right: the coalition moves as one. On a starting
    // position it silently triples a number written when support was a single meter, which
    // is how the flaws stopped being the even trades they were designed as.
    if (m.meterStart && "mood" in m.meterStart) {
      issues.error(
        "meterstart-mood",
        `meterStart uses the mood shorthand, which applies to all three blocs; name the blocs it actually moves`,
        { kind: "modifier", id: m.id, path: "meterStart.mood" },
      );
    }
    // A bend is a rule a run lives under for a whole era, so one that cannot fire, or does
    // nothing, is a rule the player is told about and never meets (BACKLOG-5 phase 35).
    const bent = new Set<number>();
    (m.bends ?? []).forEach((b, i) => {
      const where: Where = { kind: "modifier", id: m.id, path: `bends[${i}]` };
      if (b.era > lastEra(cfg)) issues.warn("era-out-of-range", `bends era ${b.era}, beyond the last era, ${lastEra(cfg)}`, where);
      if (bent.has(b.era)) issues.error("bend-twice", `bends era ${b.era} more than once; put it in one bend`, where);
      bent.add(b.era);
      if (b.passive && !b.passiveEvery) issues.error("bend-no-beat", `passive needs passiveEvery, or it never applies`, where);
      if (!b.passive && b.passiveEvery) issues.warn("bend-no-beat", `passiveEvery with no passive does nothing`, where);
      if (!b.passive && b.volatility === undefined && b.queueScale === undefined) issues.error("bend-empty", `the bend changes nothing about era ${b.era}`, where);
    });
  }
  // Run setup draws one of each kind, so a side with a thin pool opens every run the same
  // way, and an empty one cannot open a run at all (BACKLOG item 4).
  for (const kind of ["crisis", "trait", "flaw"] as const) {
    for (const align of PLAYER_ALIGNS) {
      const n = content.modifiers.filter(
        (m) => m.kind === kind && (m.align === undefined || m.align === align) && !m.requires,
      ).length;
      const where: Where = { kind: "modifier", id: `${kind}:${align}` };
      if (n === 0) issues.error("setup-empty", `a ${align} run has no ${kind} to draw at setup`, where);
      else if (n < opts.minSetupPool) {
        issues.warn("setup-thin", `a ${align} run draws its ${kind} from only ${n}, below ${opts.minSetupPool}`, where);
      }
    }
  }

  const epilogueKeys = new Set<string>();
  for (const e of content.epilogues) {
    const key = `${e.band}:${e.align}:${e.era}`;
    if (epilogueKeys.has(key)) issues.error("duplicate-id", `epilogue ${key} is defined more than once`, { kind: "epilogue", id: key });
    epilogueKeys.add(key);
    if (e.era > lastEra(cfg)) issues.warn("era-out-of-range", `era ${e.era} is beyond the last era, ${lastEra(cfg)}`, { kind: "epilogue", id: key, path: "era" });
  }

  // Unlock gating (5.10): anything that names a `requires` must name a token some
  // objective can actually grant, or it is permanently undrawable.
  const grantable = new Set(opts.unlockTokens);
  const requested = new Set<string>();
  for (const m of content.modifiers) {
    if (!m.requires) continue;
    requested.add(m.requires);
    if (!grantable.has(m.requires)) {
      issues.error("unknown-unlock", `requires "${m.requires}", which no objective grants`, { kind: "modifier", id: m.id, path: "requires" });
    }
  }
  for (const a of content.arcs) {
    if (!a.requires) continue;
    requested.add(a.requires);
    if (!grantable.has(a.requires)) {
      issues.error("unknown-unlock", `requires "${a.requires}", which no objective grants`, { kind: "arc", id: a.id, path: "requires" });
    }
  }
  for (const token of grantable) {
    if (!requested.has(token)) issues.warn("unlock-unused", `objectives grant "${token}" but nothing requires it`);
  }

  const { eras, empty } = resolveEras(content, opts);
  if (opts.eras === "auto") {
    for (const e of empty) issues.warn("era-empty", `era ${e} has no event cards yet, so its cells were not checked (pass eras "all" to require them)`);
  }

  // ---- flags bookkeeping ------------------------------------------------------------
  const flagSets = new Map<string, Where>();
  const flagReads = new Map<string, Where>();
  const flagClears = new Map<string, Where>();
  const note = (map: Map<string, Where>, flag: string, where: Where) => {
    if (!map.has(flag)) map.set(flag, where);
  };
  const checkCond = (cond: Cond | undefined, where: Where, path: string) => {
    if (!cond) return;
    for (const f of cond.flags ?? []) note(flagReads, f, { ...where, path: `${path}.flags` });
    for (const f of cond.notFlags ?? []) note(flagReads, f, { ...where, path: `${path}.notFlags` });
    for (const t of cond.speakerTraits ?? []) {
      if (!opts.knownTraits.includes(t)) issues.warn("trait-unknown", `trait "${t}" is not one of ${opts.knownTraits.join(", ")}`, { ...where, path: `${path}.speakerTraits` });
    }
    const both = (cond.flags ?? []).filter((f) => (cond.notFlags ?? []).includes(f));
    for (const f of both) issues.error("cond-unsatisfiable", `flag "${f}" is required and forbidden at once`, { ...where, path });
    for (const k of COND_KEYS) {
      const m = cond.meters?.[k];
      if (!m) continue;
      const p = `${path}.meters.${k}`;
      // Drift is the one signed reading: -100..100, where everything else is 0..100.
      // drift is signed; tenure counts cards and has no ceiling.
      const floor = k === "drift" ? -100 : 0;
      const ceiling = k === "tenure" ? Number.POSITIVE_INFINITY : 100;
      if (m.lt !== undefined && m.lt <= floor) issues.error("cond-unsatisfiable", `${k} < ${m.lt} can never hold (${k} is ${floor}..100)`, { ...where, path: p });
      if (m.gt !== undefined && m.gt >= ceiling) issues.error("cond-unsatisfiable", `${k} > ${m.gt} can never hold (${k} is ${floor}..100)`, { ...where, path: p });
      if (m.lt !== undefined && m.gt !== undefined && m.lt - m.gt < 2) {
        issues.error("cond-unsatisfiable", `${k} > ${m.gt} and < ${m.lt} leaves no integer value`, { ...where, path: p });
      }
    }
  };

  // ---- per-card checks ---------------------------------------------------------------
  for (const card of content.cards) {
    const where: Where = { kind: "card", id: card.id };

    for (const e of card.eras) {
      if (e > lastEra(cfg)) issues.warn("era-out-of-range", `era ${e} is beyond the last era, ${lastEra(cfg)}; the card is unreachable until more eras ship`, { ...where, path: "eras" });
    }
    if (!roles.has(card.speaker)) issues.error("speaker-unknown", `no advisor has the role "${card.speaker}"`, { ...where, path: "speaker" });
    if (card.text.length > opts.maxText) issues.warn("text-length", `text is ${card.text.length} characters; the plan says under ${opts.maxText}`, { ...where, path: "text" });
    for (const span of ERA_SPANS) {
      const other = card.eras.filter((e) => e !== span.era);
      if (span.match.test(card.text) && other.length) issues.error("era-span", `says "${span.phrase}" and is drawn in era ${other.join(", ")} too`, { ...where, path: "text" });
    }
    checkCond(card.cond, where, "cond");
    // Read against whoever holds the speaking role, so a role with nobody like that makes
    // the card undrawable (BACKLOG-5 phase 35).
    const wanted = card.cond?.speakerTraits ?? [];
    if (wanted.length && !content.advisors.some((a) => a.role === card.speaker && wanted.every((t) => a.traits.includes(t)))) {
      issues.error("cond-unsatisfiable", `nobody who can be ${card.speaker} is ${wanted.join(" and ")}`, { ...where, path: "cond.speakerTraits" });
    }

    if (card.arc) {
      const arc = arcs.get(card.arc);
      if (!arc) issues.error("unknown-ref", `arc "${card.arc}" does not exist`, { ...where, path: "arc" });
      else if (!arc.cards.includes(card.id)) issues.error("arc-membership", `tagged arc "${card.arc}" but that arc's card list does not include it`, { ...where, path: "arc" });
      if (card.type !== "arc") issues.error("arc-membership", `cards that belong to an arc must have type "arc", got "${card.type}"`, { ...where, path: "type" });
    } else if (card.type === "arc") {
      issues.error("arc-membership", `type "arc" requires an arc id`, { ...where, path: "arc" });
    }

    let honest = 0;
    for (const side of SIDES) {
      const ch = card[side];
      if (ch.honest) honest++;
      if (ch.label.length > opts.maxLabel) issues.warn("label-length", `label is ${ch.label.length} characters; the plan says under ${opts.maxLabel}`, { ...where, path: `${side}.label` });
      for (const k of FX_KEYS) {
        if (ch.fx && ch.fx[k] === 0) issues.warn("fx-zero", `${k}: 0 does nothing; drop it`, { ...where, path: `${side}.fx.${k}` });
      }
      if (card.type !== "election" && (ch.honest !== undefined || ch.electionDelay !== undefined)) {
        issues.error("honest-misplaced", `honest / electionDelay only mean something on election cards`, { ...where, path: side });
      }
      if (ch.fireSpeaker && card.speaker === cfg.rivalRole) {
        issues.error("fire-the-rival", `the rival is not yours to replace; fireSpeaker does nothing here`, { ...where, path: `${side}.fireSpeaker` });
      }
      if (ch.fireSpeaker && (content.advisors.filter((a) => a.role === card.speaker).length < 2)) {
        issues.warn("fire-no-replacement", `role "${card.speaker}" has no second advisor, so firing does nothing`, { ...where, path: `${side}.fireSpeaker` });
      }

      (ch.enqueue ?? []).forEach((e, i) => {
        const target = cards.get(e.id);
        const path = `${side}.enqueue[${i}].id`;
        if (!target) issues.error("unknown-ref", `enqueues unknown card "${e.id}"`, { ...where, path });
        else if (target.arc) issues.warn("next-into-arc", `enqueues "${e.id}" which belongs to arc "${target.arc}"; arcs normally start through their entry card`, { ...where, path });
      });
      const nexts: [string, string][] = [
        ...(ch.next ? ([[ch.next, `${side}.next`]] as [string, string][]) : []),
        ...Object.entries(ch.nextByAlign ?? {}).map(([a, id]) => [id, `${side}.nextByAlign.${a}`] as [string, string]),
      ];
      for (const [target_id, path] of nexts) {
        const target = cards.get(target_id);
        if (!target) issues.error("unknown-ref", `next points at unknown card "${target_id}"`, { ...where, path });
        else if (card.arc && target.arc !== card.arc) issues.error("arc-next-outside", `next "${target_id}" is not part of arc "${card.arc}"`, { ...where, path });
        else if (!card.arc && target.arc) issues.warn("next-into-arc", `next jumps into arc "${target.arc}" without entering it through the arc`, { ...where, path });
      }
      if (ch.nextByAlign && !card.arc) {
        issues.error("arc-membership", `nextByAlign only means something inside an arc`, { ...where, path: `${side}.nextByAlign` });
      }
      if (ch.ending && !endings.has(ch.ending)) issues.error("unknown-ref", `ending "${ch.ending}" does not exist`, { ...where, path: `${side}.ending` });

      for (const f of ch.setFlags ?? []) note(flagSets, f, { ...where, path: `${side}.setFlags` });
      for (const f of ch.clearFlags ?? []) note(flagClears, f, { ...where, path: `${side}.clearFlags` });
      for (const f of (ch.setFlags ?? []).filter((x) => (ch.clearFlags ?? []).includes(x))) {
        issues.error("flag-set-and-cleared", `flag "${f}" is set and cleared by the same choice`, { ...where, path: side });
      }
    }

    if (card.type === "election" && honest !== 1) {
      issues.error("election-honest", `election cards need exactly one side marked honest, found ${honest}`, where);
    }
    if (card.type === "ending" && (!card.left.ending || !card.right.ending)) {
      issues.warn("ending-card", `type "ending" cards usually end the run on both sides`, where);
    }
    if (card.type !== "ending" && signVector(card.left) === signVector(card.right)) {
      issues.warn("no-tradeoff", `both choices move every meter and drift in the same direction (no real tradeoff)`, where);
    }
  }

  // ---- delayed consequences ---------------------------------------------------------
  // A consequence may enqueue a further consequence, which is how the easy choice
  // compounds (BACKLOG item 6). A loop in that graph is a run that never stops paying,
  // so it is an error rather than the warning an arc cycle gets: an arc always has a
  // refusal, a queue has no such escape.
  {
    const enqueued = (id: string): string[] => {
      const c = cards.get(id);
      if (!c) return [];
      return SIDES.flatMap((side) => (c[side].enqueue ?? []).map((e) => e.id));
    };
    const color = new Map<string, 1 | 2>();
    const stack: string[] = [];
    const visit = (id: string): string[] | null => {
      color.set(id, 1);
      stack.push(id);
      for (const next of enqueued(id)) {
        if (!cards.has(next)) continue;
        const seen = color.get(next);
        if (seen === 1) return [...stack.slice(stack.indexOf(next)), next];
        if (seen === undefined) {
          const loop = visit(next);
          if (loop) return loop;
        }
      }
      color.set(id, 2);
      stack.pop();
      return null;
    };
    for (const c of content.cards) {
      if (color.has(c.id)) continue;
      const loop = visit(c.id);
      if (loop) {
        issues.error("enqueue-cycle", `enqueue chain loops: ${loop.join(" -> ")}`, { kind: "card", id: loop[0]!, path: "enqueue" });
        break;
      }
    }
  }

  // ---- arcs ---------------------------------------------------------------------------
  for (const arc of content.arcs) {
    const where: Where = { kind: "arc", id: arc.id };
    for (const e of arc.entry.eras) {
      if (e > lastEra(cfg)) issues.warn("era-out-of-range", `entry era ${e} is beyond the last era, ${lastEra(cfg)}`, { ...where, path: "entry.eras" });
    }
    checkCond(arc.entry, where, "entry");
    // Read against whoever speaks the arc's first card, as the draw reads it.
    const opener = cards.get(arc.cards[0] ?? "")?.speaker;
    const asked = arc.entry.speakerTraits ?? [];
    if (asked.length && !content.advisors.some((a) => a.role === opener && asked.every((t) => a.traits.includes(t)))) {
      issues.error("cond-unsatisfiable", `nobody who can be ${opener ?? "its opener"} is ${asked.join(" and ")}, so the arc never starts`, { ...where, path: "entry.speakerTraits" });
    }
    if (arc.weight <= 0) issues.error("arc-dead", `weight 0 means the arc can never start`, { ...where, path: "weight" });

    const members = new Set(arc.cards);
    arc.cards.forEach((id, i) => {
      const c = cards.get(id);
      if (!c) issues.error("unknown-ref", `lists unknown card "${id}"`, { ...where, path: `cards[${i}]` });
      else if (c.arc !== arc.id) issues.error("arc-membership", `lists card "${id}" which is tagged arc "${c.arc ?? "none"}"`, { ...where, path: `cards[${i}]` });
    });

    const entry = arc.cards[0];
    if (entry === undefined) continue;
    const reached = new Set<string>();
    const stack = [entry];
    let hasExit = false;
    while (stack.length) {
      const id = stack.pop()!;
      if (reached.has(id)) continue;
      reached.add(id);
      const c = cards.get(id);
      if (!c) continue;
      for (const side of SIDES) {
        const ch = c[side];
        const targets = [ch.next, ...Object.values(ch.nextByAlign ?? {})].filter((x): x is string => !!x);
        if (ch.ending || targets.length === 0) hasExit = true;
        for (const t of targets) if (members.has(t)) stack.push(t);
      }
    }
    for (const id of arc.cards) {
      if (!reached.has(id)) issues.error("arc-unreachable", `card "${id}" cannot be reached from the entry card "${entry}"`, { ...where, path: "cards" });
    }
    if (!hasExit) issues.error("arc-no-exit", `no reachable choice leaves the arc (every side has a next and no ending)`, where);

    // Cycle detection over reachable members.
    const color = new Map<string, 1 | 2>();
    const visit = (id: string): boolean => {
      color.set(id, 1);
      const c = cards.get(id);
      for (const side of SIDES) {
        const ch = c?.[side];
        for (const n of [ch?.next, ...Object.values(ch?.nextByAlign ?? {})].filter((x): x is string => !!x)) {
          if (!members.has(n) || !reached.has(n)) continue;
          const col = color.get(n);
          if (col === 1) return true;
          if (col === undefined && visit(n)) return true;
        }
      }
      color.set(id, 2);
      return false;
    };
    if (visit(entry)) issues.warn("arc-cycle", `next pointers form a loop; make sure a refusal can always end it`, where);

    // A question (BACKLOG-6 phase 40) asks a policy plainly and does not score it: the answer
    // moves who is pleased and who pays, and only how it is carried out moves drift. So its
    // first card carries none, and every card after it asks the honest and the fast way.
    if (arc.question !== undefined) {
      const asking = cards.get(entry);
      for (const side of SIDES) {
        if (asking && (asking[side].drift ?? 0) !== 0) {
          issues.error("question-drift", `a question's first card carries no drift; how it is carried out does`, { kind: "card", id: entry, path: `${side}.drift` });
        }
      }
      for (const id of arc.cards.slice(1)) {
        const c = cards.get(id);
        const l = c?.left.drift ?? 0;
        const r = c?.right.drift ?? 0;
        if (c && !(l !== 0 && r !== 0 && Math.sign(l) !== Math.sign(r))) {
          issues.error("question-method", `after a question, each card asks the honest way and the fast way: drift on both sides, of opposite signs`, { kind: "card", id });
        }
      }
    }
  }

  // Each side asks every question, in its own words: a question only one side is asked is
  // that side's policy being scored after all.
  {
    const askedBy = new Map<string, Set<string>>();
    for (const a of content.arcs) {
      if (a.question === undefined) continue;
      const sides = askedBy.get(a.question) ?? new Set<string>();
      for (const s of a.align === "any" ? SIDES : [a.align]) sides.add(s);
      askedBy.set(a.question, sides);
    }
    for (const [q, sides] of askedBy) {
      for (const s of SIDES) if (!sides.has(s)) issues.error("question-one-sided", `question "${q}" is never asked of the ${s}`, { kind: "arc", id: q, path: "question" });
    }
  }

  // ---- reachability: cards, then endings ----------------------------------------------
  const reachable = new Set<string>();
  const queue: string[] = [];
  const seed = (id: string) => {
    if (!reachable.has(id)) {
      reachable.add(id);
      queue.push(id);
    }
  };
  for (const c of content.cards) {
    if ((c.type === "event" || c.type === "election") && (c.weight ?? 1) > 0) seed(c.id);
  }
  for (const a of content.arcs) {
    const entry = a.cards[0];
    if (a.weight > 0 && a.entry.eras.length > 0 && a.entry.bands.length > 0 && entry !== undefined) seed(entry);
  }
  // The engine, not a card, sends the card that follows a broken promise (phase 16).
  for (const m of MANDATES) if (cards.has(m.brokeCard)) seed(m.brokeCard);
  while (queue.length) {
    const c = cards.get(queue.pop()!);
    if (!c) continue;
    for (const side of SIDES) {
        for (const e of c[side].enqueue ?? []) if (cards.has(e.id)) seed(e.id);
      for (const n of [c[side].next, ...Object.values(c[side].nextByAlign ?? {})]) {
        if (n && cards.has(n)) seed(n);
      }
    }
  }
  for (const c of content.cards) {
    if (reachable.has(c.id) || c.arc) continue;
    const why = c.type === "event" || c.type === "election" ? "weight is 0" : `type "${c.type}" is never drawn from the pool`;
    issues.error("card-unreachable", `can never be drawn: ${why} and nothing enqueues or points at it`, { kind: "card", id: c.id });
  }

  const reachableEndings = new Set(engineEndings(cfg));
  for (const id of reachable) {
    const c = cards.get(id);
    for (const side of SIDES) if (c?.[side].ending) reachableEndings.add(c[side].ending);
  }
  for (const id of engineEndings(cfg)) {
    if (!endings.has(id)) issues.error("ending-missing", `the engine can end a run with "${id}" but no ending defines it`, { kind: "ending", id });
  }
  for (const e of content.endings) {
    if (!reachableEndings.has(e.id)) issues.error("ending-unreachable", `no reachable card and no engine rule can end the run with it`, { kind: "ending", id: e.id });
  }

  // A run opens in `startBand` and the band only recomputes at an era boundary, so for the
  // whole of the first era that is the band. A card written for era 1 alone in any other
  // band is not thin, it is unreachable, and the draw will never once offer it. Twenty-seven
  // shipped cards were in exactly that state (BACKLOG-3 phase 20).
  const FIRST_ERA = 1;
  for (const c of content.cards) {
    if (c.type !== "event" || (c.weight ?? 1) === 0) continue;
    if (!c.eras.every((e) => e === FIRST_ERA)) continue;
    if (c.bands.includes(cfg.startBand)) continue;
    issues.error(
      "card-era1-band",
      `only era ${FIRST_ERA}, and its bands (${c.bands.join(", ")}) exclude "${cfg.startBand}" — era ${FIRST_ERA} is always "${cfg.startBand}", so this can never be drawn`,
      { kind: "card", id: c.id },
    );
  }

  // ---- flags ----------------------------------------------------------------------------
  for (const a of content.arcs) checkCond(a.entry, { kind: "arc", id: a.id }, "entry");
  for (const m of content.modifiers) for (const f of m.flags ?? []) note(flagSets, f, { kind: "modifier", id: m.id, path: "flags" });
  // The engine sets these two itself: which promise the run was taken on, and that it has
  // been broken. A card may read either without any card setting it (phase 16).
  const mandateIds = new Set(MANDATES.map((m) => m.id));
  const engineReads = new Set([cfg.electionsAbolishedFlag]);
  // The codex reads every named legacy, so a flag that is only there to be remembered is
  // read even when no card asks about it. Unlike `engineReads` this is one-way: a legacy
  // nothing sets is a shipped-content question, answered by its own test, not something
  // to warn about in every fixture (BACKLOG-2 phase 14).
  const codexReads = LEGACY_FLAGS;
  // The engine sets one flag per advisor trait sitting in the cabinet (5.8), so content
  // may read `advisor_<trait>` without any card setting it.
  const traitsInPlay = new Set(content.advisors.flatMap((a) => a.traits));
  const engineSets = (f: string) => f.startsWith(cfg.advisorFlagPrefix);
  for (const [f, where] of flagSets) {
    if (!flagReads.has(f) && !engineReads.has(f) && !codexReads.has(f)) issues.error("flag-unread", `flag "${f}" is set but nothing reads it`, where);
  }
  for (const [f, where] of flagReads) {
    if (f === BROKE_MANDATE_FLAG) continue;
    if (f.startsWith(MANDATE_FLAG_PREFIX)) {
      const name = f.slice(MANDATE_FLAG_PREFIX.length);
      if (!mandateIds.has(name)) issues.error("flag-unset", `no mandate is called "${name}", so "${f}" is never set`, where);
      continue;
    }
    if (engineSets(f)) {
      // The engine sets one per trait in the cabinet and one per person in it, so a card
      // may be written for a named advisor as well as for a kind of one (phase 15).
      const name = f.slice(cfg.advisorFlagPrefix.length);
      if (!traitsInPlay.has(name) && !advisorIds.has(name)) {
        issues.error("flag-unset", `no advisor has the trait or id "${name}", so "${f}" is never set`, where);
      }
      continue;
    }
    if (!flagSets.has(f)) issues.error("flag-unset", `flag "${f}" is read but nothing sets it`, where);
  }
  for (const f of engineReads) {
    if (!flagSets.has(f)) issues.warn("flag-unset", `the engine reads flag "${f}" but no content sets it`);
  }
  for (const [f, where] of flagClears) {
    if (!flagSets.has(f)) issues.error("flag-cleared-unset", `flag "${f}" is cleared but nothing sets it`, where);
  }

  // ---- coverage: cells, elections, epilogues ----------------------------------------------
  const pool = content.cards.filter((c) => c.type === "event" && !c.opposition && !c.campaign && (c.weight ?? 1) > 0);
  const electionCards = content.cards.filter((c) => c.type === "election" && !c.opposition && (c.weight ?? 1) > 0);
  for (const era of eras) {
    for (const band of BANDS) {
      for (const align of PLAYER_ALIGNS) {
        const fits = (c: Card) => c.eras.includes(era) && c.bands.includes(band) && (c.align === align || c.align === "any");
        const n = pool.filter(fits).length;
        if (n < opts.minCell) issues.error("cell-thin", `era ${era} × ${band} × ${align}: ${n} eligible event cards, minimum ${opts.minCell}`);
        const unconditional = electionCards.filter((c) => fits(c) && !c.cond?.flags?.length && !c.cond?.meters);
        if (unconditional.length === 0) issues.error("election-missing", `era ${era} × ${band} × ${align}: no unconditional election card, so a due election could be skipped`);
        if (!findEpilogue({ epilogues: content.epilogues }, band, align, era)) {
          issues.error("epilogue-missing", `no epilogue resolves for band ${band}, align ${align}, era ${era}`);
        }
      }
    }
  }

  // The opposition deals from its own deck, in any era and band, and ends in a return vote
  // (BACKLOG-10 phase 55): each side needs enough of the one and an unconditional one of the other.
  // Content with no opposition at all keeps the old rule, a lost vote ends the run, so only a
  // deck that has one is held to covering both sides.
  for (const align of content.cards.some((c) => c.opposition) ? PLAYER_ALIGNS : []) {
    const mine = (c: Card) => c.opposition && (c.align === align || c.align === "any");
    const deck = content.cards.filter((c) => mine(c) && c.type === "event" && (c.weight ?? 1) > 0);
    if (deck.length < OPPOSITION_MIN) issues.error("opposition-thin", `${align}: ${deck.length} opposition cards, minimum ${OPPOSITION_MIN}`);
    const votes = content.cards.filter((c) => mine(c) && c.type === "election" && !c.cond?.flags?.length && !c.cond?.meters);
    if (votes.length === 0) issues.error("return-vote-missing", `${align}: no unconditional return vote, so an opposition could end without one`);
  }
  for (const c of content.cards) {
    if (!c.opposition) continue;
    if (c.type !== "event" && c.type !== "election") issues.error("opposition-type", `only an event or an election can be dealt in opposition, not "${c.type}"`, { kind: "card", id: c.id });
    if (c.arc) issues.error("opposition-arc", "a story card cannot be dealt in opposition: stories pause there", { kind: "card", id: c.id });
  }

  // The campaign deals from its own deck in the cards before a vote in office (BACKLOG-10 phase
  // 56). A campaign card is a choice of how to win the vote, so both sides lift the coalition, and
  // the side that drifts toward Decay lifts it at least as far: the easy campaign is the one that
  // works today. Content with no campaign keeps the ordinary deal before a vote.
  for (const align of content.cards.some((c) => c.campaign) ? PLAYER_ALIGNS : []) {
    const deck = content.cards.filter((c) => c.campaign && c.type === "event" && (c.weight ?? 1) > 0 && (c.align === align || c.align === "any"));
    if (deck.length < CAMPAIGN_MIN) issues.error("campaign-thin", `${align}: ${deck.length} campaign cards, minimum ${CAMPAIGN_MIN}`);
  }
  for (const c of content.cards) {
    if (!c.campaign) continue;
    const where: Where = { kind: "card", id: c.id };
    if (c.type !== "event") issues.error("campaign-type", `only an event can be dealt in a campaign, not "${c.type}"`, where);
    if (c.arc) issues.error("campaign-arc", "a story card cannot be dealt in a campaign", where);
    if (c.opposition) issues.error("campaign-opposition", "a card belongs to the campaign or the opposition, not both", where);
    const lift = (ch: Choice) => BLOC_KEYS.reduce((n, b) => n + (fxDeltas(ch.fx)[b] ?? 0), 0);
    for (const side of ["left", "right"] as const) {
      if (lift(c[side]) <= 0) issues.error("campaign-flat", `${side} does not lift the coalition, and a campaign card is a choice of how to win the vote`, { ...where, path: side });
    }
    const [honest, easy] = (c.left.drift ?? 0) >= (c.right.drift ?? 0) ? [c.left, c.right] : [c.right, c.left];
    if (lift(easy) < lift(honest)) issues.error("campaign-backwards", "the honest side lifts the coalition further than the side that drifts toward Decay", where);
  }

  checkHistories(issues);
  // ---- voice ----------------------------------------------------------------------------
  // The deck as a whole, since a phrase is only a habit across many cards (BACKLOG-7 phase 47).
  for (const p of opts.voice) {
    const n = carrying(content.cards, p).length;
    if (n > p.ceiling) issues.warn("voice-ceiling", `"${p.phrase}" is in ${n} cards; its ceiling is ${p.ceiling} (npm run voice lists them)`);
  }

  return issues.items;
}

/**
 * Every legacy needs a history, or the run that is defined by it ends with no name; every
 * title has to be different, or "198 histories" is a count and not a collection. The
 * order has to hold each legacy exactly once, because it is how a run's defining decision is
 * picked and a legacy missing from it could never define anything (post-run histories).
 */
function checkHistories(issues: Issues): void {
  const legacies = [...LEGACY_FLAGS];
  for (const f of legacies) {
    if (!HISTORIES[f]) issues.error("history-missing", `legacy "${f}" has no history, so a run it defines has no name`);
  }
  if (!HISTORIES[NO_LEGACY]) issues.error("history-missing", `no fallback history for a run that leaves no legacy`);
  for (const f of Object.keys(HISTORIES)) {
    if (f !== NO_LEGACY && !LEGACY_FLAGS.has(f)) issues.error("history-orphan", `history "${f}" is for a flag that is not a legacy`);
  }
  const seen = new Set<string>();
  for (const f of HISTORY_ORDER) {
    if (seen.has(f)) issues.error("history-order", `"${f}" appears twice in the history order`);
    seen.add(f);
  }
  for (const f of legacies) if (!seen.has(f)) issues.error("history-order", `legacy "${f}" is missing from the history order, so it can never define a run`);
  const titles = new Map<string, string>();
  const named = (t: string, where: string) => {
    const clash = titles.get(t);
    if (clash) issues.error("history-duplicate", `"${t}" names both ${clash} and ${where}`);
    else titles.set(t, where);
  };
  for (const [f, h] of Object.entries(HISTORIES)) {
    for (const band of BANDS) {
      if (!h.after?.[band]?.trim()) issues.error("history-text", `history "${f}" has no "after" line for ${band}`);
      // The long view names a run that lived past its third era (BACKLOG-5 phase 39).
      const long = h.long?.[band]?.trim();
      if (!long) issues.error("history-text", `history "${f}" has no long-view title for ${band}`);
      else named(long, `${f}:${band}:long`);
      for (const align of PLAYER_ALIGNS) {
        const t = h.titles?.[band]?.[align]?.trim();
        if (!t) {
          issues.error("history-text", `history "${f}" has no title for ${band} × ${align}`);
          continue;
        }
        named(t, `${f}:${band}:${align}`);
      }
    }
  }
}
