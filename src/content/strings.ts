/**
 * Display strings. Data keys are `left` / `right`; every player-facing name lives here.
 * Title, country and party names are OPEN in TRANSFER.md, so these are placeholders.
 */
export const STRINGS = {
  title: "Rule or Drool",
  tagline: "The easy choice now is the ruinous choice later.",
  country: "the Republic",
  parties: { left: "the Commons", right: "the Ledger" },
  partyBlurbs: {
    left: "Movements, unions, committees. Your people want everything fixed by Friday.",
    right: "Donors, generals, the old families. Your people want it kept the way it was.",
  },
  meters: { mood: "Mood", money: "Money", order: "Order", inst: "Institutions" },
  /** Plain, dumb, dumber. Later stages of Decay swap these in (section 9). */
  meterLabels: {
    mood: ["Mood", "Vibes", "VIBEZ!!"],
    money: ["Money", "Cash", "CA$H"],
    order: ["Order", "Cops", "COPS"],
    inst: ["Institutions", "Gov Stuff", "THE SYSTEM"],
  },
  bands: { decay: "Decay", muddle: "Muddle", ascent: "Ascent" },
  eras: [
    { name: "Your term", jump: "The office is yours. The country is watching, for now." },
    { name: "Twenty years on", jump: "Twenty years pass. A successor from your party takes the office you shaped." },
    { name: "Seventy-five years on", jump: "Three generations pass. Your political heirs still hold the office, and the habits you gave them." },
    { name: "Two centuries on", jump: "Two hundred years pass. Nobody remembers your name. Everybody lives with your choices." },
    { name: "Five centuries on", jump: "Five hundred years pass. This is where it was always going." },
  ],
  roles: {
    treasurer: "Treasurer",
    general: "General",
    spin: "Press Secretary",
    chief: "Chief of Staff",
    judge: "Chief Justice",
    scientist: "Chief Scientist",
    tycoon: "Donor",
    organizer: "Organizer",
    rival: "Rival",
  } as Record<string, string>,
  sponsors: {
    adjectives: ["Mega", "Ultra", "Freedom", "Patriot", "Happy", "Turbo", "Golden", "Blast", "Xtreme", "Family"],
    nouns: ["Nachos", "Lotto", "Pills", "Energy Drink", "Payday Loans", "Cola", "Streaming", "Crypto", "Wings", "Slots"],
    suffixes: ["", "", " Plus", " Max", "!", " 2"],
  },
  setupLabels: { crisis: "You inherit", trait: "You are", flaw: "You are also" },
  modifiers: {
    crisis_recession: { name: "A recession", blurb: "The treasury was empty the day you arrived." },
    crisis_pandemic: { name: "A pandemic", blurb: "A fever was already loose in the port cities." },
    crisis_war: { name: "A war", blurb: "You inherit a front, a garrison and a casualty list." },
    crisis_disaster: { name: "A disaster", blurb: "Half a province is still under its own rubble." },
    trait_orator: { name: "An orator", blurb: "You are very good in a room, and it has carried you this far." },
    trait_technocrat: { name: "A technocrat", blurb: "You have read the actual file. People find this unsettling." },
    trait_fixer: { name: "A fixer", blurb: "You know where the money is and who moved it." },
    trait_war_hero: { name: "A war hero", blurb: "The army remembers your name, which cuts both ways." },
    flaw_vain: { name: "Vain", blurb: "You would like this named after you." },
    flaw_greedy: { name: "Greedy", blurb: "You have never once left money on a table." },
    flaw_paranoid: { name: "Paranoid", blurb: "Someone is briefing against you. Probably." },
    flaw_naive: { name: "Naive", blurb: "You assume people mean roughly what they say." },
  } as Record<string, { name: string; blurb: string }>,
  ui: {
    start: "Take office",
    continueRun: "Continue saved run",
    newRun: "New run",
    playAgain: "Play again",
    continueEra: "Continue",
    seed: "Seed",
    shuffle: "Shuffle",
    hint: "Drag the card left or right. On a keyboard: arrows to peek, again to decide.",
    epilogue: "Where it went without you",
    year: "Year",
  },
} as const;
