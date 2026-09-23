import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { content } from "../src/content";
import histories from "../src/content/histories.json";
import { STRINGS } from "../src/content/strings";

/**
 * TRANSFER §3: no real people, real parties, or real countries. Archetypes only.
 *
 * The questions (BACKLOG-6 phase 40) name real policies plainly, which makes it easier to
 * reach for the real thing by accident: a country to be the ally, a slogan to be the
 * promise. So everything the game can show is searched for the real ones. Real policies are
 * fine; real slogans are not, since they belong to real parties and date the satire.
 */

const COUNTRIES = `Afghanistan Albania Algeria Andorra Angola Antigua Argentina Armenia Australia Austria
Azerbaijan Bahamas Bahrain Bangladesh Barbados Belarus Belgium Belize Benin Bhutan Bolivia Bosnia Botswana
Brazil Brunei Bulgaria Burkina Burundi Cambodia Cameroon Canada Chad Chile China Colombia Comoros Congo
Croatia Cuba Cyprus Czechia Denmark Djibouti Dominica Ecuador Egypt Eritrea Estonia Eswatini Ethiopia Fiji
Finland France Gabon Gambia Georgia Germany Ghana Greece Grenada Guatemala Guinea Guyana Haiti Honduras
Hungary Iceland India Indonesia Iran Iraq Ireland Israel Italy Jamaica Japan Jordan Kazakhstan Kenya
Kiribati Korea Kosovo Kuwait Kyrgyzstan Laos Latvia Lebanon Lesotho Liberia Libya Liechtenstein Lithuania
Luxembourg Madagascar Malawi Malaysia Maldives Mali Malta Mauritania Mauritius Mexico Micronesia Moldova
Monaco Mongolia Montenegro Morocco Mozambique Myanmar Burma Namibia Nauru Nepal Netherlands Holland
Nicaragua Niger Nigeria Norway Oman Pakistan Palau Palestine Panama Paraguay Peru Philippines Poland
Portugal Qatar Romania Russia Rwanda Samoa Senegal Serbia Seychelles Singapore Slovakia Slovenia Somalia
Spain Sudan Suriname Sweden Switzerland Syria Taiwan Tajikistan Tanzania Thailand Togo Tonga Trinidad
Tunisia Turkey Turkmenistan Tuvalu Uganda Ukraine Britain England Scotland Wales America Uruguay Uzbekistan
Vanuatu Vatican Venezuela Vietnam Yemen Zambia Zimbabwe Soviet USSR`.split(/\s+/);

const PLACES = [
  "Burkina Faso", "Cape Verde", "Costa Rica", "Czech Republic", "Dominican Republic", "El Salvador", "Ivory Coast",
  "New Zealand", "North Korea", "South Korea", "Papua New Guinea", "San Marino", "Saudi Arabia", "Sierra Leone",
  "South Africa", "South Sudan", "Sri Lanka", "United Arab Emirates", "United Kingdom", "United States", "European Union",
];

/** The peoples, too: "the Canadian ally" is Canada with the name filed off. */
const DEMONYMS = `American Americans Russian Russians Chinese Mexican Mexicans Canadian Canadians British French
German Germans Ukrainian Ukrainians Israeli Israelis Iranian Iranians Syrian Syrians Afghan Afghans Iraqi Iraqis
Korean Koreans Japanese Indian Indians Irish Scottish Welsh Italian Italians Spanish Turkish Greek Greeks Swedish
Dutch Brazilian Cuban Venezuelan Palestinian Palestinians Swiss Egyptian Nigerian Pakistani Saudi Vietnamese
English European Europeans African Africans Asian Asians Latino Latinos Hispanic`.split(/\s+/);

/**
 * Faiths are archetypes here as well: the Faithful, a church, a sermon. The jokes are at
 * institutions and the politicians courting them (twa/STORE.md), and a real name would aim
 * them at a real people's belief.
 */
const FAITHS = ["Christian", "Christians", "Muslim", "Muslims", "Islam", "Jewish", "Jews", "Judaism", "Catholic", "Catholics", "Protestant", "Protestants", "Hindu", "Hindus", "Buddhist", "Buddhists", "Sikh", "Sikhs", "Mormon", "Mormons"];

const PARTIES = [
  "Republican", "Republicans", "Democrat", "Democrats", "GOP", "Tory", "Tories", "Labour Party", "Conservative Party",
  "Liberal Democrats", "Lib Dems", "Nazi", "Nazis", "Bolshevik", "Bolsheviks", "Communist Party", "Likud", "Fidesz",
];

const SLOGANS = [
  "build the wall", "great again", "medicare for all", "defund the police", "drain the swamp", "lock her up",
  "yes we can", "read my lips", "no new taxes", "take back control", "get brexit done", "brexit", "hope and change",
  "back the blue", "abolish ice", "black lives matter", "all lives matter", "my body, my choice", "my body my choice",
  "from the river to the sea", "america first", "stop the steal", "drill, baby, drill", "drill baby drill",
  "strong and stable",
];

const PEOPLE = [
  "Trump", "Biden", "Obama", "Clinton", "Reagan", "Thatcher", "Churchill", "Putin", "Xi Jinping", "Hitler", "Stalin",
  "Mussolini", "Lenin", "Mao", "Castro", "Kennedy", "Nixon", "Lincoln", "Merkel", "Macron", "Modi", "Musk", "Bezos",
  "Zuckerberg", "Netanyahu", "Zelensky", "Orban", "Orbán", "Erdogan", "Erdoğan", "Bolsonaro", "Trudeau", "Blair",
  "Corbyn", "Farage", "Pelosi", "DeSantis", "Bush",
];

/** Everything a player can read: cards, endings, epilogues, histories, names, and the UI. */
const everything = [
  JSON.stringify(content.cards),
  JSON.stringify(content.endings),
  JSON.stringify(content.epilogues),
  JSON.stringify(content.advisors),
  JSON.stringify(content.modifiers),
  JSON.stringify(histories),
  JSON.stringify(STRINGS),
  readFileSync(new URL("../src/engine/mandates.ts", import.meta.url), "utf8"),
].join("\n");

const found = (terms: readonly string[]) =>
  terms.filter((t) => new RegExp(`(^|[^\\p{L}])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "iu").test(everything));

describe("the guardrails (TRANSFER §3)", () => {
  it("names no real country, and no real people by nation or faith", () => {
    expect(found([...COUNTRIES, ...PLACES])).toEqual([]);
    expect(found(DEMONYMS)).toEqual([]);
    expect(found(FAITHS)).toEqual([]);
  });

  it("names no real party, and borrows no real slogan", () => {
    expect(found(PARTIES)).toEqual([]);
    expect(found(SLOGANS)).toEqual([]);
  });

  it("names no real politician", () => {
    expect(found(PEOPLE)).toEqual([]);
  });

  it("would catch one if it were there", () => {
    // The search itself, tested: a word inside another word is not a hit.
    const probe = (s: string, t: string) => new RegExp(`(^|[^\\p{L}])${t}($|[^\\p{L}])`, "iu").test(s);
    expect(probe("Our ally, Canada, has been invaded.", "Canada")).toBe(true);
    expect(probe("They promised to build the wall.", "build the wall")).toBe(true);
    expect(probe("The Chadwick report", "Chad")).toBe(false);
    expect(probe("They normalised it.", "Mali")).toBe(false);
  });
});
