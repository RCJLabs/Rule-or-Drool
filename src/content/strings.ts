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
  /**
   * The rival, in words rather than a bar (BACKLOG-3 phase 24). The rungs are the engine's
   * own thresholds: below where they start costing you votes, above it, halfway to being
   * able to win, and able to win.
   */
  rival: {
    states: [
      "A backbencher nobody quotes.",
      "Getting column inches.",
      "The obvious alternative.",
      "Ready to take the office off you.",
    ],
    takingNone: "Taking nothing off you yet.",
    taking: "Taking {n} points of the vote you would otherwise have.",
    wouldWin: "Lose a ballot now and it is theirs by name.",
    costs: { behind: "As things stand you would lose one." },
  },
  /**
   * The record of a reign, assembled from what the run did (BACKLOG-3 phase 27). Written so
   * that every combination reads as a sentence: the counts are in the strings rather than
   * concatenated onto them, because "You won 1 votes" is how this goes wrong.
   */
  record: {
    title: "What you did with it",
    /* Two half-sentences rather than one template: the honest count and the cheated count
       both need a plural, and "counted 1 others twice" is how that goes wrong. */
    votes: {
      wonOne: "You won one vote honestly",
      wonMany: "You won {n} votes honestly",
      cheatedOne: "counted one other twice",
      cheatedMany: "counted {n} others twice",
      clean: "{won}, and counted nothing twice.",
      mixed: "{won} and {cheated}.",
      neverClean: "You never won a vote you had not arranged first.",
      none: "No vote was held while the office was yours.",
    },
    room: {
      nobody: "You let nobody go. Everyone who started with you was there at the end.",
      someOne: "You let one of the cabinet go; {k} of the people who started with you were still in the room.",
      someMany: "You let {n} of the cabinet go; {k} of the people who started with you were still in the room.",
      allOne: "You let one of the cabinet go, and nobody who started with you was there at the end.",
      allMany: "You let {n} of the cabinet go, and nobody who started with you was there at the end.",
    },
    carrying: {
      nothing: "The country is carrying nothing it cannot put down.",
      one: "The country is still carrying one thing you did to it.",
      many: "The country is still carrying {n} things you did to it.",
    },
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
    histories: "What history called you",
    historiesShort: "Histories",
    noHistories: "History has not made up its mind about you yet.",
    unwritten: "{n} more are still unwritten.",
    cabinet: "People",
    history: "Your administrations",
    kept: "kept",
    fired: "let go",
    noHistory: "No administration has ended yet.",
    mandates: "Promises you made",
    noMandates: "You have taken the job on no terms yet.",
  },
  /**
   * The stream the Decay path is broadcast on (BACKLOG-3 phase 18). Generic on purpose:
   * a line written for one card would be better and would mean writing 526 of them, and a
   * line that is about no card in particular is at least honestly about the audience
   * rather than the country, which is the joke.
   */
  stream: {
    chat: [
      "do it do it do it",
      "my aunt is on that list",
      "keep it civil",
      "LMAO four thousand",
      "he's not even reading it",
      "chat is this real",
      "this is the best one yet",
      "who is paying for the generator",
      "first time seeing this W",
      "ratio",
      "my rent went up again btw",
      "the other one was better",
      "nobody in this chat votes",
      "somebody clip that",
      "second channel is up",
      "we've seen this exact thing before",
      "why is nobody talking about the roads",
      "he's going to pick the left one",
      "he's going to pick the right one",
      "the mods are asleep",
      "this used to be a news programme",
      "bring back the old format",
      "genuinely how is this legal",
      "I only watch for the meters",
    ] as readonly string[],
    names: [
      "krow_88", "quietvoter", "del_ta", "MOD", "nine_lives", "handsome_pete",
      "ash_in_the_pan", "VOTECOUNTER", "brrr", "onlyhere4drama", "mrs_pollard", "xX_ledger_Xx",
    ] as readonly string[],
    emotes: ["KEKW", "LULW", "OMEGALUL", "PogU", "Sadge", "COPIUM", "🔥", "💀", "📉"] as readonly string[],
    /** `{who}` is a sponsor name; these are the alerts that interrupt a card. */
    alerts: [
      "{who} gifted 50 subs — \u201cmake the hard call\u201d",
      "{who} gifted 200 subs",
      "{who} tipped £500 — \u201cdo it live\u201d",
      "{who} is now the top donor this month",
      "{who} raided the channel with 2,100 viewers",
      "{who} tipped £50 — \u201cnobody remembers the careful ones\u201d",
    ] as readonly string[],
    live: "LIVE",
    watching: "watching",
    subGoal: "SUB GOAL",
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
    cameBack: "This card came back: an earlier choice sent it.",
    aHabit: "This card is here because you have made the same choice several times.",
    impliedBy: "Already on: the plain screen does this.",
    eraKicker: "Era {n}",
    carried: "The country is left with",
    andMore: "and {n} more",
    owed: "{n} decisions are still owed.",
    owedOne: "One decision is still owed."
  },
} as const;
