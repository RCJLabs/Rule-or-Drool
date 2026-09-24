# The voice pass (BACKLOG-7 phase 47)

Every card whose text the pass changed: 281 cards in 68 files. Only the text changed.
Every effect, drift, flag, condition and link is as it was, and so is every seeded run.

The new texts are drafts, like the old ones, and are yours to edit. Where a phrase was the
joke, it stayed: 29 cards still say "would like", 52 "nobody" and 17 "your century".
`npm run voice` lists those, and `npm run voice -- "a phrase"` the cards carrying any phrase.

The 64 comebacks drawn in eras 4 and 5 are a fix as well as an edit. They opened "Two
centuries on" or "Two centuries after", which was wrong in the era headed "Five centuries on".
The validator now rejects a card that names one of the long reign's eras and is drawn in the
other.

## cards/arcs/cabinet_plot.json

- `arc_cp2`
  - was: Now that you are both in it, {advisor} would like a larger share, and a nephew in the ministry of transport.
  - now: Now that you are both in it, {advisor} expects a larger share, and a nephew in the ministry of transport.

## cards/arcs/concordat.json

- `arc_co1`
  - was: The bishops would like the marriage registry back. They held it until 1907, which they consider recent.
  - now: The bishops have asked for the marriage registry back. They held it until 1907, which they consider recent.

## cards/arcs/impeachment.json

- `arc_im2`
  - was: The inquiry has found the transfers. Two are yours. Your lawyers mention a privilege nobody has claimed since the war.
  - now: The inquiry has found the transfers. Two are yours. Your lawyers mention a privilege last claimed before the war.

## cards/arcs/moonshot.json

- `arc_ms3`
  - was: A donor's firm would like the launch contract. It has never built anything that left the ground.
  - now: A donor's firm has put in for the launch contract. It has never built anything that left the ground.

## cards/arcs/press.json

- `arc_pr2r`
  - was: The paper needs an editor. The friend who bought it would like to seat his own board. Its own journalists would settle for a charter.
  - now: The paper needs an editor. The friend who bought it means to seat his own board. Its own journalists would settle for a charter.

## cards/arcs/referendum.json

- `arc_re2`
  - was: The campaign has turned ugly and the state broadcaster is yours. Funding both sides equally is a choice nobody would blame you for skipping.
  - now: The campaign has turned ugly and the state broadcaster is yours. Funding both sides equally is a choice you would not be blamed for skipping.

## cards/arcs/succession.json

- `arc_su2r`
  - was: Your successor is ready, and the elders would like to confirm them by acclamation, in your presence, using your microphone.
  - now: Your successor is ready, and the elders plan to confirm them by acclamation, in your presence, using your microphone.

## cards/arcs/truth.json

- `arc_tr1`
  - was: A commission into the century's abuses. Full powers means subpoenas and testimony. A limited review means a report nobody reads.
  - now: A commission into the century's abuses. Full powers means subpoenas and testimony. A limited review means a report that goes unread.

## cards/bands.json

- `a01_surplus`
  - was: There is a surplus. This has not happened in living memory and nobody has a procedure for it.
  - now: There is a surplus. This has not happened in living memory, and the treasury has no procedure for it.
- `d08_archive`
  - was: The land archive has been wet since spring. Nobody can now prove who owns the eastern valleys, including you.
  - now: The land archive has been wet since spring. The eastern valleys now belong to whoever says so, including you.

## cards/bills.json

- `b_quiet_word`
  - was: The quiet word you had has become the way it is done, and nobody can point to where it was decided.
  - now: The quiet word you had has become the way it is done, and no minute says where it was decided.

## cards/blocs.json

- `w_l_base`
  - was: The branch meeting took an hour and nobody moved a motion. They used to argue until midnight.
  - now: The branch meeting took an hour and not one motion was moved. They used to argue until midnight.

## cards/chains.json

- `q2_creditors`
  - was: Nobody will lend to you at a price you want to say out loud. The one bank that will has conditions, and a flag.
  - now: No lender will offer a price you want to say out loud. The one bank that will has conditions, and a flag.
- `q2_inquiry`
  - was: The inspectors you blamed have kept their emails. A committee would like to read them aloud.
  - now: The inspectors you blamed have kept their emails. A committee plans to read them aloud.

## cards/comebacks.json

- `back_banks_bailed_2`
  - was: The banks rescued with public money are profitable again. Their boards would like the public's seat on each board removed.
  - now: The banks rescued with public money are profitable again. Their boards propose to remove the public's seat on each.
- `back_banks_bailed_45`
  - was: Two centuries on, the rescued banks own the treasury's building and rent it back. The rent has never once been late.
  - now: The rescued banks own the treasury's building and rent it back. The rent has never once been late.
- `back_banks_bailed_45d`
  - was: Two centuries on, the banks have been rescued nine times. The rescue has a ministry of its own, and a bank.
  - now: The banks have been rescued nine times. The rescue has a ministry of its own, and a bank.
- `back_banks_failed_45`
  - was: Two centuries on, the failed bank is a museum where savers' letters are read aloud. A bank has offered to sponsor it.
  - now: The failed bank is a museum where savers' letters are read aloud. A bank has offered to sponsor it.
- `back_banks_failed_45d`
  - was: Two centuries on, nobody trusts a bank, so the militias hold the savings. The interest is paid in protection.
  - now: Banks lost the country's trust long ago, so the militias hold the savings. The interest is paid in protection.
- `back_cameras_banned_45`
  - was: Two centuries on, ours is the last country where nobody's face is on file. Tourists come to walk down a street unrecorded.
  - now: Ours is the last country with no faces on file. Tourists come to walk down a street unrecorded.
- `back_cameras_banned_45d`
  - was: Two centuries on, the ban on scanners is enforced by scanners, which check that nobody is carrying one.
  - now: The ban on scanners is enforced by scanners, which check that no one is carrying one.
- `back_cameras_everywhere_45`
  - was: Two centuries on, the scanners still run on every street, and nobody has looked at the footage in a hundred years.
  - now: The scanners still run on every street. The footage has not been looked at in a hundred years.
- `back_cameras_everywhere_45d`
  - was: Two centuries on, the scanners sell every face they see to whoever bids. Children are taught to walk with their heads down.
  - now: The scanners sell every face they see to whoever bids. Children are taught to walk with their heads down.
- `back_carbon_priced_45`
  - was: Two centuries on, the price on carbon is so old nobody remembers the smoke. A party promises to abolish it as unnecessary.
  - now: The price on carbon is so old that the smoke is out of living memory. A party promises to abolish it as unnecessary.
- `back_carbon_priced_45d`
  - was: Two centuries on, the carbon price is paid in credits the credit firm prints itself. The air has not noticed either way.
  - now: The carbon price is paid in credits the credit firm prints itself. The air has not noticed either way.
- `back_care_market_45`
  - was: Two centuries on, the richest live to a hundred and forty. Everyone else has the old average, and a good view of the difference.
  - now: The richest live to a hundred and forty. Everyone else has the old average, and a good view of the difference.
- `back_care_market_45d`
  - was: Two centuries on, care is sold by subscription tier. The cheapest tier covers everything except illness.
  - now: Care has long been sold by subscription tier. The cheapest tier covers everything except illness.
- `back_court_left_45`
  - was: Two centuries on, the highest court has nine seats, as it always had, and a waiting list of a hundred years for a case.
  - now: The highest court has nine seats, as it always had, and a waiting list of a hundred years for a case.
- `back_court_left_45d`
  - was: Two centuries on, the highest court still sits, in a building nobody else uses. Its rulings are read aloud to an empty square.
  - now: The highest court still sits, alone in its building. Its rulings are read aloud to an empty square.
- `back_court_packed_45`
  - was: Two centuries on, the highest court has a thousand seats and meets in a stadium. Its rulings take a season.
  - now: The highest court has a thousand seats and meets in a stadium. Its rulings take a season.
- `back_court_packed_45d`
  - was: Two centuries on, a seat on the highest court is auctioned every spring. The court has ruled the auction lawful, unanimously.
  - now: A seat on the highest court is auctioned every spring. The court has ruled the auction lawful, unanimously.
- `back_debt_cancelled_45`
  - was: Two centuries on, the day student debt was cancelled is a holiday. Nobody works, and nobody can say what a student loan was.
  - now: The day student debt was cancelled is a public holiday. The shops close, and the young cannot say what a student loan was.
- `back_debt_cancelled_45d`
  - was: Two centuries on, degrees are free and worth exactly that. The one university left sells certificates by the metre.
  - now: Degrees are free and worth exactly that. The one university left sells certificates by the metre.
- `back_debt_kept_45`
  - was: Two centuries on, a student loan has passed down five generations. A court is asked whether a debt can be inherited from so far back.
  - now: A student loan has passed down the generations. A court is asked whether a debt can be inherited from so far back.
- `back_debt_kept_45d`
  - was: Two centuries on, debts are inherited like surnames. A newborn owes a great-great-grandmother's tuition, with interest.
  - now: Debts are inherited like surnames. A newborn owes an ancestor's tuition, with centuries of interest.
- `back_drugs_crackdown_45`
  - was: Two centuries on, the plant the crackdown was about is extinct in the wild. It survives in one botanical garden, under guard.
  - now: The plant the crackdown was about is extinct in the wild. It survives in one botanical garden, under guard.
- `back_drugs_crackdown_45d`
  - was: Two centuries on, the drug squads are a dynasty. The commander's great-grandfather seized the first crop, and the family still sells it.
  - now: The drug squads are a dynasty. The commander's ancestor seized the first crop, and the family still sells it.
- `back_drugs_legalised_2`
  - was: The tax on legal drugs pays for the clinics now. The firms that sell them would like to advertise again, for the tax's sake.
  - now: The tax on legal drugs pays for the clinics now. The firms that sell them ask to advertise again, for the tax's sake.
- `back_drugs_legalised_45`
  - was: Two centuries on, a family firm has sold legal drugs for nine generations. It has applied to be a national treasure.
  - now: A family firm has sold legal drugs since the law changed. It has applied to be a national treasure.
- `back_drugs_legalised_45d`
  - was: Two centuries on, the legal drug firms sponsor the schools, the courts and the weather report.
  - now: The legal drug firms sponsor the schools, the courts and the weather report.
- `back_gas_drilled_45`
  - was: Two centuries on, the drilled valley has sunk three metres. The lake that filled it is the most popular in the country.
  - now: The drilled valley sank three metres long ago. The lake that filled it is the most popular in the country.
- `back_gas_drilled_45d`
  - was: Two centuries on, the drilled valley still burns in places. The fires are a tourist attraction, with a gift shop.
  - now: The drilled valley still burns in places. The fires are a tourist attraction, with a gift shop.
- `back_justice_reformed_45`
  - was: Two centuries on, the last prison is a hotel. Guests pay extra for the cells, and complain about the beds.
  - now: The last prison is a hotel. Guests pay extra for the cells, and complain about the beds.
- `back_justice_reformed_45d`
  - was: Two centuries on, the halfway houses are run by the grandchildren of the men who once filled the prisons. They are very well run, and very dear.
  - now: The halfway houses are run by the descendants of the men who once filled the prisons. They are very well run, and very dear.
- `back_mass_deportation_45`
  - was: Two centuries on, the deportation lists are public. Half the country has found a grandparent on one.
  - now: The deportation lists were opened long ago. Half the country has found an ancestor on one.
- `back_mass_deportation_45d`
  - was: Two centuries on, the deportation lists are a subscription service. For a fee it will tell you whether your grandparents counted.
  - now: The old deportation lists are a subscription service. For a fee it will tell you whether your ancestors counted.
- `back_no_truth_law_45`
  - was: Two centuries on, nobody trusts any picture. Disputes are settled by asking the oldest person present.
  - now: No picture has been trusted for generations. Disputes are settled by asking the oldest person present.
- `back_no_truth_law_45d`
  - was: Two centuries on, every event has six versions and a sponsor for each. Viewers at home vote for the one that happened.
  - now: Every event has six versions and a sponsor for each. Viewers at home vote for the one that happened.
- `back_papers_granted_45`
  - was: Two centuries on, every family has a story of how it got its papers. Several of the stories involve the same great-grandmother.
  - now: Every family tells a story of how it got its papers. A suspicious number of the stories involve the same ancestor.
- `back_papers_granted_45d`
  - was: Two centuries on, citizenship papers trade like coins, and the oldest fetch the most. Most of ours are forged in the ministry.
  - now: Citizenship papers trade like antique coins, and the oldest fetch the most. Most of ours are forged in the ministry.
- `back_pension_age_kept_45`
  - was: Two centuries on, the pension age has never moved and people live twice as long. Pensioners are the largest employer of pensioners.
  - now: The pension age has never moved, and people live twice as long. Pensioners are the largest employer of pensioners.
- `back_pension_age_kept_45d`
  - was: Two centuries on, the pensions are paid out by a lottery, and the pensioners are its only players.
  - now: Pensions are paid out by lottery, and the pensioners are its only players.
- `back_pension_age_raised_3`
  - was: The later pension age saved what it promised. The treasury has found the savings, and would like to spend them on something else.
  - now: The later pension age saved what it promised. The treasury has found the savings, and has plans for them that are not pensions.
- `back_pension_age_raised_45`
  - was: Two centuries on, people live to a hundred and twenty and retire at a hundred. Nobody remembers what the argument was about.
  - now: People live to a hundred and twenty and retire at a hundred. What the argument was about has passed out of memory.
- `back_pension_age_raised_45d`
  - was: Two centuries on, the pension age is a hundred and ten, and the few who reach it are paid in commemorative coins.
  - now: The pension age is a hundred and ten, and the few who reach it are paid in commemorative coins.
- `back_rents_controlled_45`
  - was: Two centuries on, one family has paid the same controlled rent since the day it was set. Its flat is the smallest museum in the country.
  - now: One family has paid the same controlled rent since the day it was set. Its flat is the smallest museum in the country.
- `back_rents_controlled_45d`
  - was: Two centuries on, the controlled flats trade on an exchange. The rent is the only thing about them that never changes.
  - now: The controlled flats trade on an exchange. The rent is the only thing about them that has never changed.
- `back_stayed_out_45`
  - was: Two centuries after we stayed out, the ally's descendants want their version of it in our history lessons.
  - now: Centuries after we stayed out, the ally's descendants want their version of it in our history lessons.
- `back_stayed_out_45d`
  - was: Two centuries on, the ally's heirs run the lottery that pays our pensions. They draw our numbers last, every week.
  - now: The ally's heirs run the lottery that pays our pensions. They have drawn our numbers last every week for generations.
- `back_tariffs_raised_3`
  - was: The neighbours have kept their tariffs on us since we raised ours. Nobody remembers who started it, only who pays.
  - now: The neighbours have kept their tariffs on us since we raised ours. Who started it is forgotten; who pays is not.
- `back_tariffs_raised_45`
  - was: Two centuries on, the tariff wall is a real wall, and a tourist attraction. The factory behind it makes souvenirs of the wall.
  - now: The tariff wall became a real wall, and then a tourist attraction. The factory behind it makes souvenirs of the wall.
- `back_tariffs_raised_45d`
  - was: Two centuries on, the tariffs protect one factory, which makes the forms for the tariffs.
  - now: The tariffs protect a single factory these days. It makes the forms for the tariffs.
- `back_top_rate_cut_45`
  - was: Two centuries on, the treasury still pays interest on the tax cut. A child has asked the minister what it bought.
  - now: The treasury is still paying interest on the old tax cut. A child has asked the minister what it bought.
- `back_top_rate_cut_45d`
  - was: Two centuries on, the richest family pays less tax than its gardener. The gardener has started a channel about it, with a sponsor.
  - now: The richest family still pays less tax than its gardener. The gardener has started a channel about it, with a sponsor.
- `back_top_rate_raised_45`
  - was: Two centuries on, the tax on the very rich is older than any fortune in the country. One family means to outlast it.
  - now: The tax on the very rich has outlived every fortune in the country. One family means to be the first to outlast it.
- `back_top_rate_raised_45d`
  - was: Two centuries on, the tax on the very rich is collected by a firm the very rich own. It reports record compliance.
  - now: The very rich pay their tax to a collection firm the very rich own. It reports record compliance.
- `back_tough_sentences_45`
  - was: Two centuries on, the police outnumber the crimes. They patrol in pairs, looking for one.
  - now: The police have long outnumbered the crimes. They patrol in pairs, looking for one.
- `back_tough_sentences_45d`
  - was: Two centuries on, a third of the country guards the other two thirds. Nobody remembers which third started it.
  - now: A third of the country guards the other two thirds. The records of which third started it were lost long ago.
- `back_trade_opened_45`
  - was: Two centuries on, nothing sold here is made here. A campaign to make one thing, anything, has a waiting list of volunteers.
  - now: Nothing sold here has been made here for generations. A campaign to make one thing, anything, has a waiting list of volunteers.
- `back_trade_opened_45d`
  - was: Two centuries on, the trade tribunal sits in the old chamber of our parliament, and rents it back to us on the days it is free.
  - now: The trade tribunal sits in the old chamber of our parliament, and rents it back to us on the days it is free.
- `back_truth_law_45`
  - was: Two centuries on, the truth panel still meets. Its oldest ruling, that the moon is not a lamp, is under appeal.
  - now: The truth panel still meets. Its oldest ruling, that the moon is not a lamp, is under appeal.
- `back_truth_law_45d`
  - was: Two centuries on, the truth panel rules on the weather, the scores and the past. Its rulings go out before the events.
  - now: The truth panel rules on the weather, the scores and the past. Its rulings go out before the events.
- `back_universal_care_45`
  - was: Two centuries on, the health service is the oldest thing in the country that still works. Someone wants to sell it, for its own good.
  - now: The health service is the oldest thing in the country that still works. Someone wants to sell it, for its own good.
- `back_universal_care_45d`
  - was: Two centuries on, care is still free, and the queue for it is a reality show. The winners are seen first.
  - now: Care is still free after all these centuries, and the queue for it is a reality show. The winners are seen first.
- `back_wage_left_45`
  - was: Two centuries on, wages are set at an auction every morning. The court is asked whether a person may bid below nothing.
  - now: Wages are set at an auction every morning. The court has been asked whether a person may bid below nothing.
- `back_wage_left_45d`
  - was: Two centuries on, jobs are auctioned by the hour to whoever works cheapest. The cheapest bidder this year was a machine, bidding for its owner.
  - now: Jobs are auctioned by the hour to whoever works cheapest. The cheapest bidder this year was a machine, bidding for its owner.
- `back_wage_raised_45`
  - was: Two centuries on, nobody earns the minimum wage, and it is still the most argued-about number in the country.
  - now: No one has earned the minimum wage in living memory. It is still the most argued-about number in the country.
- `back_wage_raised_45d`
  - was: Two centuries on, the minimum wage is paid in a currency only the company shop accepts. The law was never repealed, only redeemed.
  - now: The minimum wage is paid in a currency only the company shop accepts. The law was never repealed, only redeemed.
- `back_went_to_war_45`
  - was: Two centuries on, the ally's war has a museum. Nobody can agree what the last room should say.
  - now: The ally's war has a museum. Its curators still cannot agree what the last room should say.
- `back_went_to_war_45d`
  - was: Two centuries on, the ally's war is a streaming drama. Its sponsor wants a different ending, and has offered to pay for it.
  - now: The ally's war is a streaming drama these days. Its sponsor wants a different ending, and has offered to pay for it.
- `back_zoning_cleared_45`
  - was: Two centuries on, the towers of the building boom are listed monuments. Nobody may fix them, and nobody will move out.
  - now: The towers of the old building boom are listed monuments. They may not be fixed, and their tenants will not move out.
- `back_zoning_cleared_45d`
  - was: Two centuries on, the boom-years towers house a million people and no inspectors. The top floors are sold as views of the collapse.
  - now: The boom-years towers house a million people and no inspectors. The top floors are sold as views of the collapse.

## cards/consequences.json

- `q_cousin_ruling`
  - was: Your cousin on the high court has issued a ruling. It is eleven words long and nobody can tell what it permits.
  - now: Your cousin on the high court has issued a ruling. It is eleven words long, and what it permits is anyone's guess.

## cards/edges.json

- `o_curfew`
  - was: The curfew was for six weeks and has run for three years. Nobody can remember voting for the extension.
  - now: The curfew was for six weeks and has run for three years. There is no record of a vote on the extension.

## cards/elections/left.json

- `el_l_turnout`
  - was: The machine in the three strongholds can deliver turnout figures nobody will audit. It has done so before, quietly.
  - now: The machine in the three strongholds can deliver turnout figures no auditor will see. It has done so before, quietly.

## cards/era1/any2.json

- `a23_whistleblower`
  - was: A clerk has documents showing the procurement fraud. She would like protection. The fraud is in your ministry.
  - now: A clerk has documents showing the procurement fraud. She needs protection. The fraud is in your ministry.
- `a24_foreign_base`
  - was: A larger country would like a base on your coast. It offers money, protection and an opinion on your elections.
  - now: A larger country is after a base on your coast. It offers money, protection and an opinion on your elections.
- `a34_land_registry`
  - was: Nobody can prove who owns the old quarter. Everyone there has been paying rent to someone for a century.
  - now: The deeds to the old quarter are lost. Everyone there has been paying rent to someone for a century.
- `a40_emergency_decree`
  - was: There is a decree power from a war nobody remembers. It has never been repealed, and it would save you a vote.
  - now: There is a decree power from a forgotten war. It has never been repealed, and it would save you a vote.

## cards/era1/any3.json

- `a102_insult_law`
  - was: An old law makes it a crime to insult the head of state. Nobody has used it in sixty years, and your minister would like to.
  - now: An old law makes it a crime to insult the head of state. It has not been used in sixty years, and your minister is keen to.
- `a53_lottery_surplus`
  - was: The lottery's good-causes fund has a surplus. The good causes would like it, and so would a marginal constituency.
  - now: The lottery's good-causes fund has a surplus. The good causes have claimed it, and so has a marginal constituency.
- `a72_forecast`
  - was: The weather service wants a new supercomputer. The old one predicted last month's storm, and nobody read the forecast.
  - now: The weather service wants a new supercomputer. The old one predicted last month's storm, and the forecast went unread.

## cards/era1/any4.json

- `a110_bus_pass`
  - was: Pensioners ride the buses free. The bus company proposes to honour the pass only on the routes nobody uses.
  - now: Pensioners ride the buses free. The bus company proposes to honour the pass only on the empty routes.
- `a113_summer_pools`
  - was: Nine public pools are shut for repairs nobody has paid for. Summer is six weeks away, and the river is no place to swim.
  - now: Nine public pools are shut for repairs no budget covers. Summer is six weeks away, and the river is no place to swim.
- `a136_ministers_pay`
  - was: Ministers' pay has been frozen for twelve years, which polls well. Nobody who needs a salary applies for the job any more.
  - now: Ministers' pay has been frozen for twelve years, which polls well. Only people who do not need a salary apply for the job any more.
- `a138_state_vineyard`
  - was: The state owns a vineyard nobody remembers buying. Its wine is served at every official dinner, and its accounts at none.
  - now: The state owns a vineyard it has no record of buying. Its wine is served at every official dinner, and its accounts at none.

## cards/era1/gated.json

- `g_debt_collateral`
  - was: The creditors will roll the debt over for one more year. As collateral, they would like the state pension fund.
  - now: The creditors will roll the debt over for one more year. As collateral, they have named the state pension fund.

## cards/era1/left3.json

- `l37_founders_statue`
  - was: The movement's founders would like a statue in the main square. Three of them are still alive and arguing about the pose.
  - now: The movement's founders have asked for a statue in the main square. Three of them are still alive and arguing about the pose.
- `l40_housekeeper`
  - was: The minister for fair pay has a housekeeper on less than the minimum wage. The housekeeper would like to talk to the press.
  - now: The minister for fair pay has a housekeeper on less than the minimum wage. The housekeeper has called the press.
- `l59_pension_guarantee`
  - was: The unions' pension fund wants a state guarantee. It is well run, and would like to stay that way at your expense.
  - now: The unions' pension fund wants a state guarantee. It is well run, and intends to stay that way at your expense.

## cards/era1/left4.json

- `l72_housing_points`
  - was: The council housing list runs on points nobody understands. Party members seem to understand them very well.
  - now: The council housing list runs on points no tenant understands. Party members seem to understand them very well.
- `l80_manifesto_costing`
  - was: The manifesto was never costed. The treasury has costed it now, and would like to know which half you meant.
  - now: The manifesto was never costed. The treasury has costed it now, and needs to know which half you meant.

## cards/era1/queued.json

- `q_debt_called`
  - was: The loan has come due, along with the part of it nobody read aloud.
  - now: The loan has come due, along with the part of it that was never read aloud.

## cards/era1/right2.json

- `r15_veterans_club`
  - was: The officers' association would like a say in promotions. It says this would protect standards.
  - now: The officers' association is seeking a say in promotions. It says this would protect standards.

## cards/era1/right3.json

- `r37_museum_son`
  - was: A donor's son would like to run the national museum. He has visited a museum, and has opinions about the lighting.
  - now: A donor's son has applied to run the national museum. He has visited a museum, and has opinions about the lighting.
- `r40_water_cannon`
  - was: The police would like water cannon for the capital. There has not been a riot, which the police say proves the need.
  - now: The police have requested water cannon for the capital. There has not been a riot, which the police say proves the need.
- `r47_chamber_bill`
  - was: The chamber of commerce has written a bill for you. It is very well drafted, and the chamber would like it back if you change a word.
  - now: The chamber of commerce has written a bill for you. It is very well drafted, and the chamber will take it back if you change a word.
- `r48_estate_hunt`
  - was: Hunting on the old royal estate was banned a century ago. The families would like it back, for tradition and for the pheasants.
  - now: Hunting on the old royal estate was banned a century ago. The families want it back, for tradition and for the pheasants.
- `r55_national_dish`
  - was: A foreign actor mocked the national dish on a talk show. The ministry would like to summon the ambassador.
  - now: A foreign actor mocked the national dish on a talk show. The ministry is itching to summon the ambassador.
- `r65_monarchists`
  - was: A society would like the Republic to have a king. Nobody has proposed a particular king, and several families have one ready.
  - now: A society is campaigning for the Republic to have a king. No particular king has been proposed, and several families have one ready.

## cards/era1/right4.json

- `r74_fenced_beach`
  - was: A hotel group has fenced off the best beach on the coast, with a permit from your ministry. Nobody there recognises the signature.
  - now: A hotel group has fenced off the best beach on the coast, with a permit from your ministry. The signature on it is a mystery to your staff.

## cards/era2/any2.json

- `b21_ghost_workers`
  - was: The payroll has nine thousand names nobody can find. Removing them means admitting they were there for years.
  - now: The payroll has nine thousand names that match no one alive. Removing them means admitting they were there for years.
- `b27_surveillance_deal`
  - was: A foreign firm offers a city-wide camera network free of charge. It would like to keep a copy of the footage.
  - now: A foreign firm offers a city-wide camera network free of charge. Its one condition is a copy of the footage.

## cards/era2/any3.json

- `b46_synthetic_meat`
  - was: Grown meat is cheaper than the animal now. The farmers who still raise animals would like a law saying it is not meat.
  - now: Grown meat is cheaper than the animal now. The farmers who still raise animals are lobbying for a law saying it is not meat.
- `b47_drone_police`
  - was: Police drones cover the whole capital. Crime is down, and so is attendance at protests, which nobody planned.
  - now: Police drones cover the whole capital. Crime is down, and so is attendance at protests, which was not part of the plan.
- `b48_ai_judges`
  - was: A model can clear the small-claims backlog in a week. It is right nearly every time, and nobody can say which time it is not.
  - now: A model can clear the small-claims backlog in a week. It is right nearly every time, and there is no telling which time it is not.
- `b55_seed_vault`
  - was: The national seed vault is flooding. The seeds in it are the only copies of four hundred crops, most of which nobody eats.
  - now: The national seed vault is flooding. The seeds in it are the only copies of four hundred crops, most of them long off the menu.
- `b69_ascent_quiet_budget`
  - was: The budget balances, nothing is on fire, and the opposition has nothing to say. Your party would like to spend the surplus before it is noticed.
  - now: The budget balances, nothing is on fire, and the opposition has nothing to say. Your party is itching to spend the surplus before it is noticed.
- `b70_ascent_trust`
  - was: Trust in the government is the highest it has been in a century. Your press secretary is worried that nobody is checking any more.
  - now: Trust in the government is the highest it has been in a century. Your press secretary is worried that the checking has stopped.

## cards/era2/any4.json

- `b79_printed_meals`
  - was: A firm can print a school meal from powder for a tenth of the price of food. The school kitchens would like to know what the powder is.
  - now: A firm can print a school meal from powder for a tenth of the price of food. The school kitchens have one question: what is the powder?
- `b81_machine_poet`
  - was: A machine has won the national poetry prize. The judges did not know, and the machine's owner would like the prize money.
  - now: A machine has won the national poetry prize. The judges did not know, and the machine's owner has claimed the prize money.
- `b94_ascent_seventy_percent`
  - was: Satisfaction with the government stands at seventy per cent, a record. The pollsters would like to stop asking while it lasts.
  - now: Satisfaction with the government stands at seventy per cent, a record. The pollsters suggest they stop asking while it lasts.

## cards/era2/left3.json

- `bl29_illness_model`
  - was: The health model can predict who will be ill next year. The movement would like to use it, and to promise not to.
  - now: The health model can predict who will be ill next year. The movement is eager to use it, and to promise not to.
- `bl31_union_machines`
  - was: Through their funds, the unions own a third of the country's machines. They would like to be consulted before the machines are taxed.
  - now: Through their funds, the unions own a third of the country's machines. They expect to be consulted before the machines are taxed.
- `bl37_founders_address`
  - was: The movement's founder is ninety and would like to address congress for three hours. Last year's address ran to four.
  - now: The movement's founder is ninety and has asked to address congress for three hours. Last year's address ran to four.

## cards/era2/right3.json

- `br23_guarded_districts`
  - was: Private security guards the rich districts and the state guards the rest. The rest would like to know which one is cheaper.
  - now: Private security guards the rich districts and the state guards the rest. The rest are wondering which one is cheaper.
- `br27_toll_roads`
  - was: A firm owns every road toll in the south. It would like to own the roads, since it already maintains them, in theory.
  - now: A firm owns every road toll in the south. It proposes to own the roads, since it already maintains them, in theory.
- `br35_border_patrols`
  - was: The border towns have formed volunteer patrols. They wear the flag and a very old uniform, and would like to be paid.
  - now: The border towns have formed volunteer patrols. They wear the flag and a very old uniform, and expect to be paid.
- `br41_philanthropy`
  - was: Philanthropy funds every museum, park and orchestra now, beautifully. Nobody can remember what the state used to fund.
  - now: Philanthropy funds every museum, park and orchestra now, beautifully. What the state used to fund has been forgotten.
- `br42_lend_a_judge`
  - was: The rule of law here is admired abroad. A foreign leader would like to learn how it is done, and to borrow a judge.
  - now: The rule of law here is admired abroad. A foreign leader has asked to learn how it is done, and to borrow a judge.
- `br44_portrait_frames`
  - was: A law requires your portrait in every office. The painter's studio would like the exclusive contract, and larger frames.
  - now: A law requires your portrait in every office. The painter's studio is angling for the exclusive contract, and larger frames.

## cards/era2/right4.json

- `br47_patriot_feed`
  - was: A patriotic feed is now the most watched in the country. It would like all of the state's advertising.
  - now: A patriotic feed is now the most watched in the country. It is bidding for all of the state's advertising.
- `br53_ascent_competition`
  - was: Small firms are thriving, and the large ones complain of the competition. They would like a regulator to protect them from it.
  - now: Small firms are thriving, and the large ones complain of the competition. They are lobbying for a regulator to protect them from it.

## cards/era3/any.json

- `c01_forgotten_code`
  - was: The water system runs on code nobody alive can read. It has worked for sixty years, which is the worrying part.
  - now: The water system runs on code no living programmer can read. It has worked for sixty years, which is the worrying part.
- `c07_deep_archive`
  - was: Historians want the sealed files from your century opened. Some of them are about you personally.
  - now: Historians want the sealed files from your term opened. Some of them are about you personally.

## cards/era3/any2.json

- `c28_pension_age`
  - was: People live thirty years longer than when the pension was designed. Nobody has moved the age since.
  - now: People live thirty years longer than when the pension was designed. The age has not moved since.

## cards/era3/any3.json

- `c34_old_reactor`
  - was: The reactor that powers the north was built to last fifty years. It is ninety, and its manual is in a language nobody reads.
  - now: The reactor that powers the north was built to last fifty years. It is ninety, and its manual is in a dead language.
- `c35_untouchable_code`
  - was: The interior ministry runs on software written before anyone now alive was hired. It works, and nobody is allowed to touch it.
  - now: The interior ministry runs on software written before anyone now alive was hired. It works, and touching it is forbidden.
- `c36_card_law`
  - was: A law of your century says every citizen must carry a card. The cards stopped being issued forty years ago.
  - now: A law you signed says every citizen must carry a card. The cards stopped being issued forty years ago.
- `c38_last_paper`
  - was: Nobody under forty has read a newspaper. The last one would like a state subsidy, and would like to keep criticising the state.
  - now: No one under forty has read a newspaper. The last one wants a state subsidy, and to keep criticising the state.
- `c39_pension_promises`
  - was: The pension promises of your century are coming due. There are two workers for every pensioner, and both are tired.
  - now: The pension promises you made are coming due. There are two workers for every pensioner, and both are tired.
- `c46_heat_belt_date`
  - was: The heat belt has moved another hundred kilometres north. The towns in its way would like a date, and a direction.
  - now: The heat belt has moved another hundred kilometres north. The towns in its way are owed a date, and a direction.
- `c50_new_antibiotics`
  - was: The old antibiotics stopped working, slowly, over thirty years. A new class is ready, and its maker would like thirty years' profit.
  - now: The old antibiotics stopped working, slowly, over thirty years. A new class is ready, and its maker expects thirty years' profit.
- `c51_old_munitions`
  - was: The old bases are empty, and full of munitions nobody catalogued. Children have started collecting them.
  - now: The old bases are empty, and full of uncatalogued munitions. Children have started collecting them.
- `c52_finance_rent`
  - was: The state still pays rent on the finance ministry building to a family who bought the lease in your century.
  - now: The state still pays rent on the finance ministry building to a family who bought the lease in your day.
- `c53_anniversary_committee`
  - was: An anniversary of your time in office is coming. The committee would like to know whether it is being celebrated or examined.
  - now: An anniversary of your time in office is coming. The committee needs to know whether it is being celebrated or examined.
- `c54_abolished_crime`
  - was: Half the laws are enforced by machines nobody switched off. One is still fining people for a crime that was abolished.
  - now: Half the laws are enforced by machines left switched on. One is still fining people for a crime that was abolished.
- `c56_one_crew`
  - was: The water mains your century laid are failing a street at a time. The repair crews are one crew, and it is old.
  - now: The water mains you laid are failing a street at a time. The repair crews are one crew, and it is old.
- `c58_lost_map`
  - was: A border dispute from your century has flared again, over a line on a map nobody can find the original of.
  - now: A border dispute from your term has flared again, over a line on a map whose original has been lost.
- `c62_endowment_generation`
  - was: The endowment your century built pays for most of the state now. A generation has grown up never having paid for anything.
  - now: The endowment you built pays for most of the state now. A generation has grown up never having paid for anything.
- `c63_polite_debate`
  - was: Public debate is so polite now that nobody can tell the parties apart. Turnout has fallen to a third, courteously.
  - now: Public debate is so polite now that the parties cannot be told apart. Turnout has fallen to a third, courteously.
- `c64_young_judge`
  - was: The courts have not been overruled in fifty years. A young judge would like to overrule one, and has written it beautifully.
  - now: The courts have not been overruled in fifty years. A young judge means to overrule one, and has written it beautifully.
- `c66_wedding_anthem`
  - was: The anthem is sung before every broadcast, advert and funeral. A campaign would like it sung before weddings too.
  - now: The anthem is sung before every broadcast, advert and funeral. A campaign is pressing for it to be sung before weddings too.
- `c68_named_months`
  - was: The state sells naming rights to the months. March is a bank, and a soft drink would like April.
  - now: The state sells naming rights to the months. March is a bank, and a soft drink has bid for April.

## cards/era3/any4.json

- `c72_old_banknotes`
  - was: Banknotes from your first era are still legal tender, and one family kept a warehouse of them. It would like them changed at the old rate.
  - now: Banknotes from your first era are still legal tender, and one family kept a warehouse of them. It demands they be changed at the old rate.
- `c76_century_loan`
  - was: A loan taken for the first orbital launch is still being repaid. The lender's heirs would like the rest now, in one payment.
  - now: A loan taken for the first orbital launch is still being repaid. The lender's heirs are calling in the rest now, in one payment.
- `c77_war_tax`
  - was: A tax raised for one year to pay for a war is in its two hundredth year. Nobody can name the war, or the enemy.
  - now: A tax raised for one year to pay for a war is in its two hundredth year. The war is forgotten, and so is the enemy.
- `c84_ascent_honest_adverts`
  - was: Adverts must be true now, by law. The advertising industry has shrunk to four people and a dog, and would like a rescue.
  - now: Adverts must be true now, by law. The advertising industry has shrunk to four people and a dog, and is pleading for a rescue.
- `c85_ascent_idle_police`
  - was: Crime is so low that the police have begun enforcing the rules nobody reads: jaywalking, humming and uneven hedges.
  - now: Crime is so low that the police have begun enforcing the forgotten rules: jaywalking, humming and uneven hedges.
- `c88_decay_drone_census`
  - was: The state counts its people by drone now, since nobody opens the door. The drones count anyone who waves as loyal.
  - now: The state counts its people by drone now, since no door opens to a census taker. The drones count anyone who waves as loyal.

## cards/era3/left2.json

- `cl03_committee_of_committees`
  - was: A decision now requires forty signatures. Nobody can name a decision that was improved by the last thirty.
  - now: A decision now requires forty signatures. There is no known decision the last thirty improved.
- `cl06_universal_everything`
  - was: Nine universal programmes. Four work. Nobody has been able to say which four out loud since the 2090s.
  - now: Nine universal programmes. Four work. Which four has not been said out loud since the 2090s.
- `cl10_work_quota`
  - was: With most work automated, the state assigns the rest. The assignments are fair and nobody chose any of them.
  - now: With most work automated, the state assigns the rest. The assignments are fair, and not one of them was chosen.
- `cl13_virtue_score`
  - was: Citizens are rated on community contribution. The rating decides housing. Nobody remembers agreeing to it.
  - now: Citizens are rated on community contribution. The rating decides housing. When it was agreed is unclear.

## cards/era3/left3.json

- `cl17_old_songs`
  - was: The movement's songs are sung at every meeting. Nobody knows what half the words mean, and one verse is about a factory that is now a park.
  - now: The movement's songs are sung at every meeting. Half the words have lost their meaning, and one verse is about a factory that is now a park.
- `cl24_pension_country`
  - was: The unions' pension funds own most of the country now. They would like it run for pensioners, and the pensioners agree.
  - now: The unions' pension funds own most of the country now. They would run it for pensioners, and the pensioners agree.
- `cl25_endless_room`
  - was: The general assembly meets online now, forever, in a room nobody can close. It has passed nine thousand motions, most of them about itself.
  - now: The general assembly meets online now, forever, in a room that cannot be closed. It has passed nine thousand motions, most of them about itself.
- `cl26_monthly_recalls`
  - was: A law of your century lets any hundred citizens recall any official. Most officials now serve for about a month.
  - now: Your recall law lets any hundred citizens remove any official. Most officials now serve for about a month.
- `cl33_goals_met`
  - was: The movement's work is done, a historian writes. Every goal it set in your century has been met, and it is still setting goals.
  - now: The movement's work is done, a historian writes. Every goal it set in your day has been met, and it is still setting goals.
- `cl37_impure_founding`
  - was: The purity committee has declared the movement's founding documents impure, and would like to redraft the founding, retroactively.
  - now: The purity committee has declared the movement's founding documents impure, and proposes to redraft the founding, retroactively.

## cards/era3/left4.json

- `cl43_carved_slogan`
  - was: The movement's slogans are carved on every public building. A new generation would like to revise one, which is now a crime.
  - now: The movement's slogans are carved on every public building. A new generation is set on revising one, which is now a crime.
- `cl45_ascent_secret_targets`
  - was: The plan has hit every target for a decade. The planners would like the targets kept secret, so that they can go on hitting them.
  - now: The plan has hit every target for a decade. The planners have asked for the targets to be kept secret, so that they can go on hitting them.

## cards/era3/legacy.json

- `d02_feed_inheritance`
  - was: The feed you took the dial of now has a dial of its own, and nobody can find the room it is in.
  - now: The feed you took the dial of now has a dial of its own, in a room that cannot be found.
- `d03_ship_name`
  - was: The long ship needs a name and a crew list. Both attract people who would like to be remembered.
  - now: The long ship needs a name and a crew list. Both attract people who hope to be remembered.

## cards/era3/right2.json

- `cr08_charter_towns`
  - was: Charter towns write their own law within limits. Three have quietly amended the limits and nobody checked.
  - now: Charter towns write their own law within limits. Three have quietly amended the limits, unchecked.

## cards/era3/right3.json

- `cr22_old_map`
  - was: The common land your century protected has been sold, plot by plot, under a law nobody read. The villagers have a petition, and a very old map.
  - now: The common land you protected has been sold, plot by plot, under a law no one read. The villagers have a petition, and a very old map.
- `cr24_landed_juries`
  - was: Juries are drawn from landowners, under a law nobody repealed. Most defendants do not own land, and have noticed.
  - now: Juries are drawn from landowners, under a law never repealed. Most defendants do not own land, and have noticed.
- `cr25_fence_to_nowhere`
  - was: The border fence from your century is still maintained, at great cost. There is nothing on the other side of it now but more of us.
  - now: The border fence you built is still maintained, at great cost. There is nothing on the other side of it now but more of us.
- `cr27_hero_quota`
  - was: The official history has one hero per decade. The committee has run out of heroes and would like to appoint some.
  - now: The official history has one hero per decade. The committee has run out of heroes and has decided to appoint some.
- `cr29_weather_forecasts`
  - was: Nobody may criticise the founding family in print. The family would like the law extended to paintings, songs and weather forecasts.
  - now: The founding family may not be criticised in print. It wants the law extended to paintings, songs and weather forecasts.
- `cr31_four_peers`
  - was: A law of your century guarantees a trial by one's peers. The richest citizen's peers are four people, all related.
  - now: A law from your term guarantees a trial by one's peers. The richest citizen's peers are four people, all related.
- `cr34_senseless_clause`
  - was: The courts are admired, the laws are clear, and nobody has amended the constitution in a century. One clause no longer makes sense.
  - now: The courts are admired, the laws are clear, and the constitution has not been amended in a century. One clause no longer makes sense.

## cards/era3/right4.json

- `cr43_heir_police`
  - was: The security firm that polices the north has passed to its founder's grandson. He is fifteen, and would like a parade.
  - now: The security firm that polices the north has passed to its founder's grandson. He is fifteen, and wants a parade.
- `cr45_ascent_stability`
  - was: Most firms are now younger than their founders. The old families call this instability, and would like a subsidy for stability.
  - now: Most firms are now younger than their founders. The old families call this instability, and have applied for a subsidy for stability.

## cards/era3/sides.json

- `q_system_fails`
  - was: The water system stopped. The code that runs it is doing something nobody can name.
  - now: The water system stopped. The code that runs it is doing something without a name.

## cards/era4/any.json

- `f01_unknown_statue`
  - was: A statue in the old square is two hundred years old and nobody knows who it is. A committee would like it to be someone useful.
  - now: A statue in the old square is two hundred years old and its subject is unknown. A committee has proposed that it be someone useful.
- `f02_printer_licence`
  - was: A statute from your century requires a licence to own a printer. Nobody enforced it for a hundred and ninety years. A prosecutor has found it.
  - now: One of your statutes requires a licence to own a printer. It went unenforced for a hundred and ninety years. A prosecutor has found it.
- `f03_new_zeroes`
  - was: Prices carry six more zeroes than in your century. A new currency would tidy the zeroes, and quietly shrink everyone's savings.
  - now: Prices carry six more zeroes than they did in your day. A new currency would tidy the zeroes, and quietly shrink everyone's savings.
- `f04_listed_ministry`
  - was: The ministry your century built is a listed monument. It cannot be heated, rewired or extended, and four thousand people work in it.
  - now: The ministry you built is a listed monument. It cannot be heated, rewired or extended, and four thousand people work in it.
- `f06_machine_brief`
  - was: The ministry's oldest machine has run since your century. Asked whether it may be switched off, it has filed a legal brief, and a good one.
  - now: The ministry's oldest machine has run since your term. Asked whether it may be switched off, it has filed a legal brief, and a good one.
- `f09_harbour_reef`
  - was: The coast your century knew is two kilometres out to sea. The old harbour town is a reef now, with a very popular dive school.
  - now: The coast you knew is two kilometres out to sea. The old harbour town is a reef now, with a very popular dive school.
- `f11_first_name`
  - was: The census finds your name is now the commonest first name in the country. Nobody knows why, and a campaign would like to explain it.
  - now: The census finds your name is now the commonest first name in the country. The reason is a mystery, and a campaign has set out to explain it.
- `f13_voting_app`
  - was: Voting takes eleven seconds on a phone now. Turnout is ninety-eight per cent, and nobody can say who wrote the app.
  - now: Voting takes eleven seconds on a phone now. Turnout is ninety-eight per cent, and the app's author is unknown.
- `f14_moon_embassy`
  - was: The settlement on the moon has opened an embassy in the capital. It would like the building next to the parliament, and a vote.
  - now: The settlement on the moon has opened an embassy in the capital. It has requested the building next to the parliament, and a vote.
- `f16_heat_dome`
  - was: A heat dome sits over the south every August now. The army has the only water trucks, and would like to run the south for the month.
  - now: A heat dome sits over the south every August now. The army has the only water trucks, and offers to run the south for the month.
- `f17_church_bank`
  - was: A loan your century took is still being repaid, to a bank that was bought by another bank that was bought by a church.
  - now: A loan you took out is still being repaid, to a bank that was bought by another bank that was bought by a church.
- `f24_closing_border`
  - was: The northern neighbours have closed their border to people from the heat belt. Yours is next in line, and the army would like to close first.
  - now: The northern neighbours have closed their border to people from the heat belt. Yours is next in line, and the army is ready to close first.
- `f27_valley_apology`
  - was: A court finds your century owes the valley towns an apology. Your party would like it worded so that it does not apologise.
  - now: A court finds that you owe the valley towns an apology. Your party is drafting it so that it does not apologise.
- `f31_old_wing`
  - was: The prisons are nearly empty, except for one wing holding people sentenced under laws from your century that no longer exist.
  - now: The prisons are nearly empty, except for one wing holding people sentenced under your laws, which no longer exist.
- `f39_towed_asteroid`
  - was: A firm has towed a small asteroid into orbit. It is worth more than the national debt, and the firm would like to know who owns the sky.
  - now: A firm has towed a small asteroid into orbit. It is worth more than the national debt, and the firm asks who owns the sky.
- `f44_safe_combination`
  - was: One clerk has held the same post for a hundred and ten years. Nobody else knows the combination to the treasury safe.
  - now: One clerk has held the same post for a hundred and ten years. The combination to the treasury safe is in his head alone.
- `f45_renamed_river`
  - was: The river through the capital was named after a leader of your century. Nobody can remember which, and the mapmakers would like a decision.
  - now: The river through the capital was named after a leader of your day. Which one is lost, and the mapmakers need a decision.
- `f46_forgotten_treaty`
  - was: A treaty from your century lets the neighbours inspect your bases. Nobody has asked in a hundred years. They have asked.
  - now: A treaty you signed lets the neighbours inspect your bases. They have not asked in a hundred years. They have asked.

## cards/era4/bands.json

- `fa4_hobby_parties`
  - was: Nobody needs to work more than ten hours a week. There is an epidemic of hobbies, and three new political parties made of them.
  - now: No job needs more than ten hours a week. There is an epidemic of hobbies, and three new political parties made of them.
- `fa7_shade_controls`
  - was: The solar shade has cooled the planet a degree. The neighbours would like a say in where it points, and one of them has a missile.
  - now: The solar shade has cooled the planet a degree. The neighbours demand a say in where it points, and one of them has a missile.
- `fm1_temporary_bridge`
  - was: The bridge that fell in your century was replaced by a temporary one. It is now the oldest bridge in the country, and still temporary.
  - now: The bridge that fell on your watch was replaced by a temporary one. It is now the oldest bridge in the country, and still temporary.
- `fm2_grandchild_chair`
  - was: An inquiry opened in your century has issued an interim report. Its chair, grandchild of the first chair, would like another decade.
  - now: An inquiry you opened has issued an interim report. Its chair, grandchild of the first chair, has asked for another decade.
- `fm3_train_debate`
  - was: Parliament is debating the trains. It has debated the trains every year since your century, and the trains are late for the debate.
  - now: Parliament is debating the trains. It has debated the trains every year since your term, and the trains are late for the debate.
- `fm4_deficit_birthday`
  - was: The deficit is two hundred years old this week. The treasury would like to mark it quietly. The opposition has made a cake.
  - now: The deficit is two hundred years old this week. The treasury hopes to mark it quietly. The opposition has made a cake.

## cards/era4/legacy.json

- `fx10_proverb`
  - was: The promise your century broke is a proverb, said of landlords and the weather. A school would like to teach where it came from.
  - now: The promise you broke is a proverb, said of landlords and the weather. A school has offered to teach where it came from.
- `fx4_surgeon_plumbers`
  - was: The schools your century starved taught two centuries of children to fix nothing. The last plumbers are paid like surgeons.
  - now: The schools you starved taught two centuries of children to fix nothing. The last plumbers are paid like surgeons.
- `fx5_ten_thousandth_span`
  - was: The ring your century began is still being built. A ceremony marks the laying of the ten thousandth span, again.
  - now: The ring you began is still being built. A ceremony marks the laying of the ten thousandth span, again.
- `fx6_customary_line`
  - was: The skim your century took is a line in the budget now, labelled 'customary'. Nobody can say what it is customary for.
  - now: The skim you took is a line in the budget now, labelled 'customary'. The treasury cannot say what it is customary for.
- `fx8_spare_parts`
  - was: The long ship your century launched has sent its first message home in two hundred years. It asks for spare parts, and complains.
  - now: The long ship you launched has sent its first message home in two hundred years. It asks for spare parts, and complains.

## cards/era4/sides.json

- `fl3_wage_formula`
  - was: A machine sets every wage in the country by a formula your century wrote. The formula has never been wrong, or read.
  - now: A machine sets every wage in the country by a formula you wrote. The formula has never been wrong, or read.
- `fl5_halo`
  - was: The first organisers are painted on the union halls now, with haloes. The painter would like to add you, and has the gold leaf ready.
  - now: The first organisers are painted on the union halls now, with haloes. The painter offers to add you, and has the gold leaf ready.
- `fr3_charity_decides`
  - was: Charity does now what the state did in your century. It is generous and efficient, and it decides who deserves it.
  - now: Charity does now what the state did in your day. It is generous and efficient, and it decides who deserves it.
- `fr5_votes_for_sale`
  - was: A court has ruled that a vote is property and may be sold. The donors would like to know the market rate.
  - now: A court has ruled that a vote is property and may be sold. The donors are keen to know the market rate.

## cards/era5/any.json

- `k05_vineyard_vote`
  - was: The climate has settled five degrees warmer than your century. The south is desert, the north is a vineyard, and the vineyard votes.
  - now: The climate has settled five degrees warmer than in your day. The south is desert, the north is a vineyard, and the vineyard votes.
- `k09_seed_vault`
  - was: The seed vault your century sealed is open. Its seeds are for crops that stopped growing here three centuries ago, and a firm wants them.
  - now: The seed vault you sealed is open. Its seeds are for crops that stopped growing here three centuries ago, and a firm wants them.
- `k10_last_form`
  - was: The last paper document in the country is a form your century printed. The head of state must fill it in by hand, once a year.
  - now: The last paper document in the country is a form you had printed. The head of state must fill it in by hand, once a year.
- `k11_found_right`
  - was: A model trained on five centuries of rulings interprets the constitution now. It has found a right nobody wrote down, and a good one.
  - now: A model trained on five centuries of rulings interprets the constitution now. It has found a right that was never written down, and a good one.
- `k16_forgotten_war`
  - was: Historians have found a war your century began that nobody remembers. It never formally ended, and the other side has just remembered.
  - now: Historians have found a war you began and everyone forgot. It never formally ended, and the other side has just remembered.
- `k17_signed_advice`
  - was: The oldest machine in the country gives advice nobody asked for. It is usually right, and it has started signing its name.
  - now: The oldest machine in the country gives unasked-for advice. It is usually right, and it has started signing its name.
- `k18_leisure_tax`
  - was: Most people work four hours a week and are paid in time off. The treasury would like to tax the time off.
  - now: Most people work four hours a week and are paid in time off. The treasury proposes to tax the time off.
- `k27_wire_eating_bird`
  - was: A new bird has evolved in the capital. It eats the old wiring, and it is protected by a law your century wrote.
  - now: A new bird has evolved in the capital. It eats the old wiring, and it is protected by a law you wrote.
- `k29_open_air_farmer`
  - was: Food is grown in towers now. The last farmer in the open air is a hundred and ten, a tourist attraction, and would like a pension.
  - now: Food is grown in towers now. The last farmer in the open air is a hundred and ten, a tourist attraction, and wants a pension.
- `k30_wrong_dam`
  - was: A court hears cases five centuries old. Today: the valley towns against the dam your century built, which is still there, and still wrong.
  - now: A court hears cases five centuries old. Today: the valley towns against the dam you built, which is still there, and still wrong.
- `k35_sold_wind`
  - was: The wind that crosses the plains has been sold. Its owners would like the villages to stop using it to dry their laundry.
  - now: The wind that crosses the plains has been sold. Its owners have told the villages to stop using it to dry their laundry.
- `k43_oldest_witness`
  - was: Letters your grandchildren wrote have been found in an attic. They say a great deal about you, and a publisher would like to print them.
  - now: Letters your grandchildren wrote have been found in an attic. They say a great deal about you, and a publisher means to print them.
- `k45_time_capsule`
  - was: A time capsule from your century has been opened. It holds a letter from you to the future, and the future would like to reply.
  - now: A time capsule from your century has been opened. It holds a letter from you to the future, and the future means to reply.

## cards/era5/bands.json

- `ka2_wanted_problem`
  - was: Every problem your century had is solved. A movement demands a problem, and has started one, as a public service.
  - now: Every problem you had is solved. A movement demands a problem, and has started one, as a public service.
- `ka5_ship_came_back`
  - was: A ship launched from the ring three centuries ago has come home, having found nothing out there. The crew would like their jobs back.
  - now: A ship launched from the ring three centuries ago has come home, having found nothing out there. The crew want their jobs back.
- `kd2_ruin_franchise`
  - was: Tourists pay to see the ruins of the country, which are mostly the country. A firm would like the franchise for the whole thing.
  - now: Tourists pay to see the ruins of the country, which are mostly the country. A firm has bid for the franchise on the whole thing.
- `km2_boxed_government`
  - was: The temporary government your century set up for a crisis is still temporary. Its offices are the oldest in the world, and still in boxes.
  - now: The temporary government you set up for a crisis is still temporary. Its offices are the oldest in the world, and still in boxes.
- `km3_sunset_clauses`
  - was: Every law has a sunset clause and an extension clause. Nobody can say which laws are in force, including the judge.
  - now: Every law has a sunset clause and an extension clause. Which laws are in force is a matter of opinion, including the judge's.

## cards/era5/legacy.json

- `kc2_retiring_machines`
  - was: The machines' union is the oldest union on earth. Its founding members would like to retire, and have asked who will do the work.
  - now: The machines' union is the oldest union on earth. Its founding members are ready to retire, and have asked who will do the work.
- `kx3_wall_for_nobody`
  - was: The seawall your century built is the last thing from then still standing. It holds back the sea from a city that moved away.
  - now: The seawall you built is the last thing from your time still standing. It holds back the sea from a city that moved away.
- `kx6_birthday_signal`
  - was: The first satellite your century put up has been found, still sending a message nobody could decode. It is a birthday greeting.
  - now: The first satellite you put up has been found, still sending a message no code-breaker could read. It is a birthday greeting.
- `kx7_ring_naming`
  - was: The ring your century began is finished, after five hundred years, by a firm that would like its name on it instead of yours.
  - now: The ring you began is finished, after five hundred years, by a firm that has put its own name on it instead of yours.

## cards/era5/sides.json

- `kl3_new_measure`
  - was: An audit finds perfect equality on every measure the movement ever set. It also finds a new measure nobody set, and it is bad.
  - now: An audit finds perfect equality on every measure the movement ever set. It also finds a new measure that no committee set, and it is bad.

## cards/flaws.json

- `g_martial_procurement`
  - was: The army wants a system that does not exist yet, from a firm that has never built one, at a price nobody will say aloud.
  - now: The army wants a system that does not exist yet, from a firm that has never built one, at a price too awkward to say aloud.

## cards/kept.json

- `p15_general_owed`
  - was: {advisor} has held the garrison together for years, would like the parade, and has earned the parade.
  - now: {advisor} has held the garrison together for years, wants the parade, and has earned the parade.
- `p15_judge_owed`
  - was: {advisor} has upheld every one of your laws, and would like one struck down where it deserves it.
  - now: {advisor} has upheld every one of your laws, and asks to strike one down where it deserves it.
- `p15_organizer_owed`
  - was: {advisor} has turned out the vote for you for years and would like the programme to say one true thing.
  - now: {advisor} has turned out the vote for you for years and asks that the programme say one true thing.
- `p15_tycoon_owed`
  - was: {advisor} has paid for a great deal and would like the thing you both know is coming.
  - now: {advisor} has paid for a great deal and expects the thing you both know is coming.

## cards/mandates.json

- `mn_broad_broke`
  - was: One of the three has stopped being asked to things. Nobody decided it, and the room has quietly stopped setting out a chair.
  - now: One of the three has stopped being asked to things. It was never decided, and the room has quietly stopped setting out a chair.
- `mn_clean_broke`
  - was: The footage of you promising it is being played before the footage of the count. They run it twice, so nobody has to remember what you said.
  - now: The footage of you promising it is being played before the footage of the count. They run it twice, so the country need not remember what you said.

## cards/questions/banks.json

- `q_banks_r_a`
  - was: The Donors would like the rescue without conditions, since conditions would upset the markets, which are the Donors.
  - now: The Donors expect the rescue without conditions, since conditions would upset the markets, which are the Donors.
- `q_banks_r_b`
  - was: The failing banks hold the Donors' own deposits. They would like theirs repaid first, before the Country's.
  - now: The failing banks hold the Donors' own deposits. They insist theirs is repaid first, before the Country's.
- `q_banks_r_q`
  - was: Two banks are failing. The Donors want them rescued with public money. The Country would like to know who rescued its farms.
  - now: Two banks are failing. The Donors want them rescued with public money. The Country wonders who rescued its farms.

## cards/questions/cameras.json

- `q_cameras_l_b3`
  - was: The police cameras the ban left alone have grown into a network nobody voted for. The general wants it made legal, under emergency powers.
  - now: The police cameras the ban left alone have grown into a network that was never voted on. The general wants it made legal, under emergency powers.
- `q_cameras_r_a`
  - was: The Donors' firm would like to keep every face it scans. It says the data is perfectly safe, and it is: nobody else can see it.
  - now: The Donors' firm means to keep every face it scans. It says the data is perfectly safe, and it is: nobody else can see it.
- `q_cameras_r_b`
  - was: The ban leaves the border without scanners. The general would like to keep a few there, where nobody will ask.
  - now: The ban leaves the border without scanners. The general plans to keep a few there, where nobody will ask.
- `q_cameras_r_q`
  - was: The Donors' camera firm will put a face scanner on every street, at cost. The Country would rather nobody counted its faces.
  - now: The Donors' camera firm will put a face scanner on every street, at cost. The Country would rather its faces went uncounted.

## cards/questions/care.json

- `q_care_r_b3`
  - was: The towns left out of the vouchers are asking why. The insurers have a word for it they would like you to use.
  - now: The towns left out of the vouchers are asking why. The insurers have a word for it, and hope you will use it.

## cards/questions/debt.json

- `q_debt_l_q`
  - was: The Movement wants student debt cancelled. The Unions' bus drivers would like to know who is cancelling theirs.
  - now: The Movement wants student debt cancelled. The Unions' bus drivers wonder who is cancelling theirs.
- `q_debt_r_b`
  - was: The loans are the Donors'. Their collectors would like permission to take the repayments straight from wages.
  - now: The loans are the Donors'. Their collectors ask permission to take the repayments straight from wages.
- `q_debt_r_q`
  - was: The Faithful's colleges want their graduates' debts forgiven. The Donors lent the money, and would like it back.
  - now: The Faithful's colleges want their graduates' debts forgiven. The Donors lent the money, and expect it back.

## cards/questions/drugs.json

- `q_drugs_l_b3`
  - was: The licensed dealers are the same men, with a logo now. They would like the licences for the ports next.
  - now: The licensed dealers are the same men, with a logo now. They have their eye on the licences for the ports next.
- `q_drugs_r_a`
  - was: The crackdown needs warrants. The police would like to skip them, for speed, and the Faithful would like the speed.
  - now: The crackdown needs warrants. The police propose to skip them, for speed, and the Faithful are keen on the speed.
- `q_drugs_r_b`
  - was: The tobacco firms would like to advertise the new product the way they used to advertise the old one.
  - now: The tobacco firms plan to advertise the new product the way they used to advertise the old one.

## cards/questions/housing.json

- `q_housing_r_a`
  - was: With the rules gone, the Donors' builders would like to inspect their own buildings. It would save a year, and the inspectors' wages.
  - now: With the rules gone, the Donors' builders propose to inspect their own buildings. It would save a year, and the inspectors' wages.

## cards/questions/pensions.json

- `q_pensions_l_b`
  - was: Keeping the age costs money nobody has budgeted. The pension fund has a surplus that could quietly be borrowed from.
  - now: Keeping the age costs money that is not in the budget. The pension fund has a surplus that could quietly be borrowed from.
- `q_pensions_r_a`
  - was: The later age saves a fortune by the next decade. The Donors would like it spent this year, on a tax cut.
  - now: The later age saves a fortune by the next decade. The Donors want it spent this year, on a tax cut.

## cards/questions/speech.json

- `q_speech_l_a4`
  - was: The story the ministry called false was true, and it was about you. The papers would like to know which you will say.
  - now: The story the ministry called false was true, and it was about you. The papers are waiting to hear which you will say.
- `q_speech_r_a`
  - was: The Faithful would like the law to cover lies about the faith as well, which would take in most of the newspapers.
  - now: The Faithful are pressing for the law to cover lies about the faith as well, which would take in most of the newspapers.
- `q_speech_r_b`
  - was: With no law, the Donors' platforms are carrying a video of the opposition leader that nobody has checked. It is doing very well.
  - now: With no law, the Donors' platforms are carrying an unchecked video of the opposition leader. It is doing very well.
- `q_speech_r_b4`
  - was: The second video was fake as well, and it was traced to your office. The papers would like to know which you will say.
  - now: The second video was fake as well, and it was traced to your office. The papers are waiting to hear which you will say.

## cards/questions/top_rate.json

- `q_top_rate_l_a3`
  - was: The hole was noticed after all, by the lenders. They would like a seat at the budget.
  - now: The hole was noticed after all, by the lenders. They want a seat at the budget.
- `q_top_rate_l_b3`
  - was: The tax you spent never arrived. The lenders have, and they would like a seat at the budget.
  - now: The tax you spent never arrived. The lenders have, and they want a seat at the budget.
- `q_top_rate_r_a3`
  - was: Spring came and the growth did not. The lenders have, and they would like a seat at the budget.
  - now: Spring came and the growth did not. The lenders have, and they want a seat at the budget.
- `q_top_rate_r_b3`
  - was: The money you spent never arrived. The lenders have, and they would like a seat at the budget.
  - now: The money you spent never arrived. The lenders have, and they want a seat at the budget.

## cards/questions/trade.json

- `q_trade_l_b`
  - was: The trade deal is ready. Nobody in the Cities read the part that lets foreign firms sue the country over its own laws.
  - now: The trade deal is ready. The Cities skipped the part that lets foreign firms sue the country over its own laws.
- `q_trade_r_b`
  - was: Trade is open. The Donors would like the factory towns' retraining money spent on a campaign explaining that it was good for them.
  - now: Trade is open. The Donors propose spending the factory towns' retraining money on a campaign explaining that it was good for them.

## cards/questions/wage.json

- `q_wage_l_b`
  - was: The Unions' leaders offer to sign a low wage deal for the cafés, where nobody is in a union, in return for a seat on every board.
  - now: The Unions' leaders offer to sign a low wage deal for the cafés, which have no union members, in return for a seat on every board.

## cards/tenure.json

- `p15_loyal_chief`
  - was: {advisor} has outlasted everyone who came in at the same time. Nobody has asked the chief of staff's opinion since the second era.
  - now: {advisor} has outlasted everyone who came in at the same time. The chief of staff has not been asked an opinion since the second era.

## cards/wants.json

- `p15_brenn`
  - was: {advisor} would like the accounts published in full, quarterly, with the embarrassing ones first.
  - now: {advisor} insists on the accounts being published in full, quarterly, with the embarrassing ones first.
- `p15_ferris`
  - was: {advisor} would like to keep the staff he trained, all of them, including the two who briefed against you.
  - now: {advisor} means to keep the staff he trained, all of them, including the two who briefed against you.
- `p15_larkwood`
  - was: {advisor} would like the friendly paper given the interview first, always, as a standing rule.
  - now: {advisor} has made it a standing rule: the friendly paper gets the interview first, always.
- `p35_pike`
  - was: {advisor} can deliver the river wards, every vote, every time. She would like the paving contracts, which is how the river wards are delivered.
  - now: {advisor} can deliver the river wards, every vote, every time. She wants the paving contracts, which is how the river wards are delivered.
