import type { Library } from "../engine/library";
import { collectsEnding, longReignOpen } from "./objectives";
import type { MetaState } from "./types";

/**
 * A clue to every ending (BACKLOG-10 phase 58). The audit of v0.64.0 found a good player finding
 * 4 of 77 endings in 50 runs: 71 of them end a run before its finale, and a good player rarely
 * ends early, so nothing told them what there was to aim at. A clue says what an ending is made
 * of, in fragments, never its title: enough to know it when the story comes, not a list of steps.
 *
 * Kept out of the content, so the words can change without moving the deck (BACKLOG-8 phase 49).
 */
export const CLUES: Readonly<Record<string, string>> = {
  riots: "The wider public, out of patience entirely.",
  personality_cult: "Every one of your groups, adoring you at once.",
  bankruptcy: "A treasury spent down to nothing.",
  oligarchy: "Money piled up until it runs the country.",
  anarchy: "Order drained away to nothing.",
  police_state: "Order kept until it is all there is.",
  state_collapse: "The state's institutions left to wither away.",
  paralysis: "Institutions built up until they cannot move.",
  election_loss: "An honest count lost, and then another.",
  coup: "No more votes, and order and the state left to slide.",
  finale_decay: "A whole reign survived, on the way down.",
  finale_muddle: "A whole reign survived, going nowhere much.",
  finale_ascent: "A whole reign survived, on the way up.",
  finale_long_decay: "Two centuries survived, on the way down.",
  finale_long_muddle: "Two centuries survived, going nowhere much.",
  finale_long_ascent: "Two centuries survived, on the way up.",
  blackmailed: "A skimmed fund, your signatures on it, and a ministry for the one who knows.",
  impeachment: "An inquiry, a chamber, and a vote on you that you let happen.",
  assassination: "A general with a title for you, and your refusal.",
  exile: "A province gone its own way, and a house by a lake.",
  leader_for_life: "A general with a title for you, and your acceptance.",
  stepped_down: "A successor trained, and handed the office at once.",
  purge_consumed: "A register of the uncommitted, with your own name on it.",
  abandoned_base: "Your most loyal supporters, no longer turning up.",
  abandoned_backers: "The people who pay for you, taking their money elsewhere.",
  rival_wins: "A rival grown strong, and a count you lose to them.",
  last_signature: "A war for an old ally, and a peace that needs you gone.",
  contempt: "A court's orders, and a government that ignores them.",
  receivership: "A tax spent before it arrived, and lenders at the budget.",
  took_responsibility: "A care list that cost a life, and your name put to it.",
  general_strike: "Your own unions on strike, and you breaking them.",
  condemned: "Frozen rents, a block unfit to live in, and a list it is kept off.",
  blackout: "Power plants closed before the wind was ready, and a cold week.",
  last_shift: "The last factory closing, and you at the gate for the workers.",
  grey_march: "A pension fund borrowed from, and pensioners kept in the dark.",
  in_those_words: "Debts cancelled by decree, and what you knew, said on camera.",
  new_management: "Dealers given licences, and then the ports.",
  breakout: "Prisons closed faster than the guards were paid.",
  emergency: "A camera network no one voted for, made legal overnight.",
  the_correction: "A law against false stories, and the one that was true.",
  crowded_bench: "A packed court, and a race to pack it further.",
  bank_run: "Failing banks, savers not told, and queues at every door.",
  continuity: "A postponed vote, a loyal deputy, and no more term limits.",
  the_quiet: "The last free paper bought, and the silence enjoyed.",
  victory_declared: "A fever survived, and a celebration instead of an inquiry.",
  the_posters: "Water saved, and the money spent reminding everyone who saved it.",
  model_choice: "A machine that is always right, even about the election.",
  family_firm: "Your family in the ministries, and one of them named to follow you.",
  the_blessing: "The registry handed to the bishops, and the cardinal's favour asked.",
  closed_counties: "Eleven counties for six families, and the land registry shut.",
  country_decided: "The constitution put to the country, and its answer accepted.",
  clean_hands: "A commission with full powers, and every name it finds pursued.",
  town_council: "Cities that govern themselves, and your blessing on it.",
  job_you_wanted: "The engineers' machine, flying, with their names on it.",
  given_back: "A split movement, and the party handed to the half you threw out.",
  the_recount: "An honest census, a court's doubts, and a count done again.",
  the_ribbon: "A levee opened for the cameras before the tests were done.",
  the_asset: "A foreign agent left in place, and paid in policy.",
  the_games: "A great sporting show, and a stadium's profits guaranteed.",
  the_wheelbarrows: "Money printed until the army is paid in bread.",
  the_grain_barons: "A failed harvest, a trading firm, and your name on the sacks.",
  the_inspectors: "Schools that fell in a quake, and your resignation over who passed them.",
  the_numbers: "A crooked lottery kept going, and a winner's silence bought.",
  first_minister: "A charming heir, a crown restored, and you serving under it.",
  published_terms: "Secret loan terms, and the office handed to the lender's choice.",
  the_captain: "A football star in the cabinet, and named to follow you.",
  empty_chair: "A debate rigged in your favour, and you not in it.",
  the_saboteurs: "A dark grid, an emergency, and a traitor behind every flicker.",
  the_centenary: "The republic's hundredth year, and your promise to go.",
  peoples_bank: "Members' savings lent to your campaign, and the branches shut.",
  next_generation: "A youth wing's ballot against you, left to stand.",
  the_last_act: "A comedy about you, driven underground and made a crime.",
  the_signal_report: "A rail crash report, and your resignation, meant.",
  the_foundation: "A family charity that marks the schools, then sets the exams.",
  honours_list: "Honours sold, and the newspaper that proved it taken to court.",
  leased_coast: "The port leased for a lifetime, and then the airport.",
  clear_cut: "The national forest given away, and the hills cut bare.",
};

/** How many clues the codex offers at a time: one, so it points somewhere without making a list (it was three in v0.66.2). */
export const RUMOURS_AT_ONCE = 1;

/** Endings stated only in stories that wait on an unlock, with the unlocks that open them. Worked out once per library. */
const WAITS = new WeakMap<Library, ReadonlyMap<string, readonly string[]>>();
function waitsOn(lib: Library): ReadonlyMap<string, readonly string[]> {
  const known = WAITS.get(lib);
  if (known) return known;
  const needs = new Map<string, string>();
  for (const arc of lib.arcs.values()) if (arc.requires) for (const id of arc.cards) needs.set(id, arc.requires);
  const from = new Map<string, (string | undefined)[]>();
  for (const card of lib.content.cards) for (const side of [card.left, card.right]) if (side.ending) from.set(side.ending, [...(from.get(side.ending) ?? []), needs.get(card.id)]);
  const waits = new Map<string, readonly string[]>();
  for (const [id, reqs] of from) if (reqs.every((r) => r !== undefined)) waits.set(id, [...new Set(reqs as string[])]);
  WAITS.set(lib, waits);
  return waits;
}

/**
 * Whether a run this profile could start now can end this way. The long reign's finales wait for
 * the long reign to open, and two stories wait for an unlock; a clue to either would send a player
 * after something the deal cannot give them yet.
 */
export function withinReach(lib: Library, meta: MetaState, id: string): boolean {
  if (id.startsWith(lib.config.longFinalePrefix)) return longReignOpen(meta);
  const waits = waitsOn(lib).get(id);
  return !waits || waits.some((u) => meta.unlocks.includes(u));
}

/**
 * The endings the codex has a clue out for: ones not found, not already named as near, and within
 * reach, `n` at a time, moving on with every run played, so the codex keeps something to aim at
 * without becoming a list to work down.
 */
export function rumours(lib: Library, meta: MetaState, n = RUMOURS_AT_ONCE): string[] {
  const open = [...lib.endings.keys()].filter((id) => collectsEnding(id) && !(meta.endings[id] ?? 0) && !meta.nearMissed.includes(id) && CLUES[id] && withinReach(lib, meta, id));
  if (open.length <= n) return open;
  const from = meta.runs % open.length;
  return [...open.slice(from), ...open.slice(0, from)].slice(0, n);
}
