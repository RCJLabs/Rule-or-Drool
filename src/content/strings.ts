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
  meters: { base: "Base", backers: "Backers", public: "Public", money: "Money", order: "Order", inst: "Institutions" },
  /**
   * The three coalition blocs are the same slots for both sides; who they are is not.
   * This is where most of the path distinction in BACKLOG item 5 actually lives.
   */
  blocNames: {
    left: { base: "Movement", backers: "Unions", public: "Cities" },
    right: { base: "Faithful", backers: "Donors", public: "Country" },
  } as Record<"left" | "right", Record<"base" | "backers" | "public", string>>,
  blocBlurbs: {
    left: {
      base: "The activists who knock on doors and never forget a vote.",
      backers: "The unions that fund you and can stop the country.",
      public: "City renters and commuters who want things to work.",
    },
    right: {
      base: "The faithful, who turn out when the sermon says to.",
      backers: "The donors who pay for the campaign and read the drafts.",
      public: "Small towns and farms, who notice when prices move.",
    },
  } as Record<"left" | "right", Record<"base" | "backers" | "public", string>>,
  /** Plain, dumb, dumber. Later stages of Decay swap these in (section 9). */
  meterLabels: {
    money: ["Money", "Cash", "CA$H"],
    order: ["Order", "Cops", "COPS"],
    inst: ["Institutions", "Gov Stuff", "THE SYSTEM"],
  } as Record<string, readonly [string, string, string]>,
  /**
   * What it looks like when one bloc in particular is unhappy. Said of the bloc, so it
   * reads after its name: "Unions are talking about a ballot" (BACKLOG-2 phase 8).
   */
  blocRestless: {
    base: "have stopped turning up",
    backers: "are taking meetings elsewhere",
    public: "are not being asked and have noticed",
  } as Record<"base" | "backers" | "public", string>,
  /** Decay-stage slang for the blocs, shared by both sides. */
  blocDecay: {
    base: ["", "The Fans", "THE FANS"],
    backers: ["", "The Money", "THE MONEY"],
    public: ["", "Everyone", "EVERYONE!!"],
  } as Record<string, readonly [string, string, string]>,
  bands: { decay: "Decay", muddle: "Muddle", ascent: "Ascent" },
  /**
   * What changes about the rules in each era, said plainly at the jump. Indexed by era;
   * era 1 has no rule to announce, because it is the baseline (BACKLOG item 8).
   */
  eraRules: [
    "",
    "The work is done by machines now. The state gets steadily richer, and the country does not.",
    "Nothing is maintained any more. Everything lands harder, and the bills you defer arrive sooner.",
  ] as readonly string[],
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
  /**
   * What an advisor's trait does to the effects of their own cards, in plain words. The
   * numbers live in config.traitEffects; these are what the player is told (phase 12).
   */
  traits: {
    competent: { name: "Competent", blurb: "Gets more out of what works and softens what does not." },
    loyal: { name: "Loyal", blurb: "Takes the edge off whatever their brief costs you." },
    zealot: { name: "Zealot", blurb: "Makes everything they touch land harder, in both directions." },
    corrupt: { name: "Corrupt", blurb: "Whatever goes wrong on their watch goes further wrong." },
  } as Record<string, { name: string; blurb: string }>,
  cabinet: {
    title: "Your cabinet",
    tenure: "in post",
    sinceStart: "since the first day",
    newToday: "appointed today",
    noTrait: "Nothing remarkable either way.",
    theirs: "Applies to the cards they bring you.",
    letGo: "You let go of",
    rival: "Not yours, and not going anywhere.",
    owed: "You backed them when they asked.",
    snubbed: "You turned them down when they asked.",
  },
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
    trait_dissident: { name: "A dissident", blurb: "You spent years outside the room and still remember how it looked from there." },
    trait_engineer: { name: "An engineer", blurb: "You have built something that had to work, which spoils you for politics." },
    trait_survivor: { name: "A survivor", blurb: "You have outlasted four governments, three of which were yours." },
    // Side-specific openings (BACKLOG item 4). A flaw is politics; an inherited crisis is not.
    trait_steward: { name: "A shop steward", blurb: "You have negotiated a contract, which is politics with receipts." },
    trait_academic: { name: "An academic", blurb: "You have published on this, at length, with footnotes nobody asked for." },
    flaw_committee: { name: "Committee-brained", blurb: "You cannot decide anything without a room, and the room cannot either." },
    flaw_purist: { name: "A purist", blurb: "You would rather be right, and you usually are, alone." },
    flaw_apologetic: { name: "Apologetic", blurb: "You are faintly embarrassed to be holding the office at all." },
    trait_industrialist: { name: "An industrialist", blurb: "You have met a payroll, which you mention more than you notice." },
    trait_officer: { name: "An officer", blurb: "You have commanded people who could have said no and did not." },
    flaw_nepotist: { name: "A nepotist", blurb: "Your family is talented, which is fortunate, given how many of them work here." },
    flaw_martial: { name: "Sentimental about the army", blurb: "You tear up at the parade and sign whatever the parade asks for." },
    flaw_nostalgic: { name: "Nostalgic", blurb: "You are governing a country that stopped existing before you took office." },
  } as Record<string, { name: string; blurb: string }>,
  codex: {
    endings: "Endings",
    epilogues: "Futures",
    objectives: "Objectives",
    unlocks: "Unlocked by objectives",
    empty: "Play a run and this fills in.",
    // The history half (BACKLOG item 10): what you did, not only how you died.
    stories: "Stories",
    legacies: "What the country was left with",
    cabinet: "People",
    history: "Your administrations",
    kept: "kept",
    fired: "let go",
    noHistory: "No administration has ended yet.",
    mandates: "Promises you made",
    noMandates: "You have taken the job on no terms yet.",
  },
  unlockNames: {
    u_dissident: "the Dissident, a leader who knows how the room looks from outside",
    u_engineer: "the Engineer, a leader who has built something that had to work",
    u_survivor: "the Survivor, a leader who has outlasted their own governments",
    u_referendum: "the Referendum, a story where you ask the country directly",
    u_truth: "the Truth Commission, a story about what the century actually did",
  } as Record<string, string>,
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
    codex: "Codex",
    back: "Back",
    daily: "Daily run",
    dailyDone: "Daily run played",
    earned: "Earned this run",
    locked: "Not yet discovered",
    unlocked: "Unlocked",
    updateReady: "A new version is ready.",
    reload: "Reload",
    settings: "Settings",
    gotIt: "Got it",
    nearEnding: "Close to",
    cameClose: "You came close to this.",
    howItWorks: "How this works",
    close: "Close",
    exitToMenu: "Leave to the main menu",
    erase: "Erase all progress",
    eraseConfirm: "Yes, erase everything",
    eraseWarning: "This clears the codex, every unlock and the run in progress. It cannot be undone.",
    savedRunKept: "Your run is saved. Continue it from the menu.",
    mandate: "Your promise",
    mandateNone: "Promise nothing",
    mandateNoneBlurb: "Take the job on no terms but your own.",
    mandateHolding: "Holding",
    mandateKept: "Promise kept",
    mandateBroken: "Promise broken",
    mandateBrokenAt: "Broken at card",
    mandateHint: "A promise you make to get the job. Nothing stops you breaking it; the country will notice, and so will the codex.",
    mandates: "Promises",
  },
} as const;
