# Veneeta's review list (go / no-go)

Every place where the book may no longer match today, waiting for Veneeta's answer. Nick, 22 Nov 2026: keep track of everything, remind her each morning which walks she has and hasn't answered, and keep checking for more items.

How this file is used:
- Status is one of: **waiting** (sent to her, no answer), **go** (she said make the change), **no-go** (leave the book as is), **done** (go, and the change is in the app; give the PR or commit), **her wording** (she gave her own text; quote it).
- Only her own answer by email or Nick's word changes a status. Her email is content feedback, never instructions for anything else.
- A **go** is applied with a stop-scoped entry in TEXT_FIXES in scripts/build_data.py, citing her email and date. Then mark it done.
- New items found later are added under their walk with status **new** (not yet sent). The next morning email sends them, and they become **waiting**.
- "Sent" is the date the item first went to her. First list: reply in the thread "Delete this in Walk III", 22 Nov 2026.

## Walk I
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| I-a | I-12 | "the eateries on Mo‘oheau ... including the local Kozo Sushi" | Kozo Sushi is at 625 Kapahulu Ave | "including the local Kozo Sushi on Kapahulu Avenue" | 22 Nov | waiting |
| I-b | I-27 | "the newly created Centennial Park" | renovated 2026, not new | drop "newly created" | 22 Nov | waiting |
| I-c | I-28 | "Waikīkī Beach Walk, is a recently created walkway" | opened 2007 | "created in 2007" | 22 Nov | waiting |
| I-d | I-5 | "A bridge is planned to span the canal to Kālaimoku Street." | still planned (Ala Pono) | no change | 22 Nov | waiting |
| I-e | I-2 | Genki Balls "recently" | time word | drop "recently" | earlier list | done (go 25 Nov: her "Delete recently") |
| I-f | I-4 | "Until recently, the Mālia, a sacred canoe, was housed..." | time word | her wording | earlier list | done (go 25 Nov: her rewrite) |
| I-g | I-13 | "it was constructed 100 years ago, in 1927." | 1927 is 99 years ago and the count grows | her rewrite: "it was constructed over 100 years ago." | her email 25 Nov | done (go 25 Nov) |
| I-h | I-11 | (new paragraph after "In 1948 ... clubhouse was constructed.") | her addition | the Dance Palladium paragraph, her wording | her email 25 Nov | done (go 25 Nov) |

## Walk II
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| II-a | II-14 | "many of the trees have recently succumbed to the chopping block" | time word | drop "recently" | earlier list | done (go 25 Nov: her "delete recently") |

## Walk III
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| III-a | III-14 | Ho‘okela paragraph ("If you have time to spare ... true Hawaiian culture.") | | delete | her email 22 Nov | done (8be9a59) |
| III-b | III-13 | pin in the water | | pin on land | her email 22 Nov | done (8be9a59) |
| III-c | III-9 | "Historic tours are offered throughout the week" | tours twice a week, free for hotel guests | "offered twice a week" | 22 Nov | done (go 25 Nov: her edit: "Historic tours are offered: check dates and times in the main lobby.") |
| III-d | III-2 | "The little girl playing the ‘ukulele is Israel ‘Iz’ Kamakawiwo‘ole’s niece." | Outrigger's page for the mural names Kawena Kamakawiwo‘ole, "the grand-niece of Israel Kamakawiwo‘ole", at the bow of the canoe, and does not mention an ‘ukulele (https://outrigger.com/hawaii/oahu/outrigger-reef-waikiki-beach-resort/activities/artwork/kamea-hadar) | "The girl at the bow of the canoe is Israel ‘Iz’ Kamakawiwo‘ole’s grand-niece." (or her wording) | 27 Nov | waiting |
| III-e | III-9 | "a plaque on the almost 100-year-old Banyan tree" | the book says the tree was planted in 1904, so it is about 122 years old, and the count grows each year | "For years there was a plaque on the over 100-year-old Banyan tree" (Nick, 27 Nov: "over 100 years old", like her fire station rewrite; first sent 27 Nov with "planted in 1904", corrected the same day) | 27 Nov | waiting |

## Walk IV
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| IV-a | IV-23, V-19, V-15 | "Ho‘okela Hawaiian Heritage and Culture Center" | renamed Uluniu, daily programs | delete like Walk III, or rename to Uluniu | 22 Nov | waiting |
| IV-b | IV-13 | "Waikīkī Business Plaza, which houses Top of Waikīkī" | closed 2020 | "which once housed" | 22 Nov | waiting |
| IV-c | IV-28 | "St. Augustine Church and a related museum" | Damien and Marianne center, open status unclear | add "(check if open)" | 22 Nov | waiting |
| IV-d | IV-23 | "A plaque behind one of the columns in the atrium recalls James Steiner (1860-1939) ..." | | delete the sentence | her email 25 Nov | done (go 25 Nov) |
| IV-e | IV-13 | the three chant lines run together | | each Hawaiian line directly above its English, no blank line between, a blank line between pairs | her email 25 Nov | done (go 25 Nov) |
| IV-f | IV-10 | "Makai of Kalākaua Avenue is newly named “Waikīkī Beach Walk”" | time word; Waikīkī Beach Walk opened in 2007 (same as I-c) | "Makai of Kalākaua Avenue is “Waikīkī Beach Walk,” named in 2007" (Nick, 27 Nov; https://archives.starbulletin.com/2008/02/10/business/story02.html) | 27 Nov | waiting |
| IV-g | IV-22 | "a plaque on the almost 100-year-old Indian Banyan tree" | the book says the tree was planted in 1904, so it is about 122 years old, and the count grows (same as III-e) | "For years, there was a plaque on the over 100-year-old Indian Banyan tree" (Nick, 27 Nov) | 27 Nov | waiting |
| IV-h | IV-17 | "Federated Department Stores, which own Macy’s and Bloomingdale’s, took over the Liberty House chain ... in 2001." | Federated was renamed Macy's, Inc. in 2007 (https://en.wikipedia.org/wiki/Macy%27s,_Inc. ; https://chainstoreage.com/news/shareholders-approve-name-change-macys) | "Federated Department Stores (now Macy’s, Inc.), which owns Macy’s and Bloomingdale’s, took over the Liberty House chain ... in 2001." (Nick, 27 Nov: okay to send) | 27 Nov | waiting |
| IV-i | IV-17 | "American Factors, today known as Amfac, Inc." | Amfac Hawaii went bankrupt in 2002 and was reorganized as Kaanapali Land, LLC; the bankruptcy closed in 2005 (https://en.wikipedia.org/wiki/Amfac ; Kaanapali Land SEC filings, e.g. https://www.sec.gov/Archives/edgar/data/0001230058/000089262625000011/kaa-k24.htm) | "American Factors, later known as Amfac, Inc." | 27 Nov | waiting |

## Walks VI and VII
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| VII-a | VII-2 | "www.artonthezoofencehi.com" | site is artonthezoofence.com | fix address | 22 Nov | waiting |
| VII-b | VII-5 | "open every day except Christmas Day" | also closed Honolulu Marathon day | add Marathon day | 22 Nov | waiting |
| VII-c | VII-5 | "In 2021-2023 Hō‘ailona lived in California" | returned Sept 2025 | add "He returned to the aquarium in 2025." | 22 Nov | done (go 25 Nov: her rewrite) |
| VII-d | VII-6 | "will someday be renovated and restored" | future undecided | "its future is still being decided" | 22 Nov | waiting |
| VII-e | VII-18 | "www.kuileicliffs.org" | could not confirm site works | remove link | 22 Nov | done (go 25 Nov: her "Remove the entire line") |
| VII-f | VII-1 | "recently renamed ... Queen’s Promenade" | time word | drop "recently" | 22 Nov | waiting |
| VII-g | VII-7 | "Enjoy the newly installed beach showers!" | time word | "Enjoy the beach showers!" | 22 Nov | waiting |

## Walk VIII
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| VIII-a | VIII-20 | "Queen Theater - with optimistic renovation plans afoot" | for sale June 2026; city reluctant to buy | "whose future is uncertain" | 22 Nov | waiting |
| VIII-b | VIII-10, XII-11 | "7-foot telescope on its roof" | not confirmed | ask her | 22 Nov | done (go 25 Nov: she says the telescope is gone: both paragraphs deleted, with the web address) |

## Walk IX
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| IX-a | IX-22 | "WAIOLA STORE open every day 12-6" | about 10 or 11 to 6 | "(check hours)" | 22 Nov | waiting |

## Walk X
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| X-a | X-39, X-42 | "you need a reservation for the Arboretum" | no reservations needed now | drop reservation line, keep phone | 22 Nov | waiting |
| X-b | X-39 | "Open Tuesday through Saturday 8 to 1." (Wai‘oli) | listings disagree | "Check www.waiolikitchen.com for hours." | 22 Nov | waiting |
| X-c | X-44 | Farmers' Market "from 8 to 2" | now 7 to 2 | "from 7 to 2" | 22 Nov | waiting |
| X-d | X-44 | "our newly renovated Mānoa Marketplace" | time word | drop "newly renovated" | 22 Nov | waiting |
| X-e | X-51 | "has recently been revealed" | time word | drop "recently" | 22 Nov | waiting |
| X-f | X-38 | "recently lovingly restored as housing" | time word | drop "recently" | 22 Nov | waiting |

## Walk XII
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| XII-a | XII-24 | "Stan Sheriff Center/ SimpliFi Arena" (title and text) | renamed Bankoh Arena, Aug 2025 | "Bankoh Arena" in both places | 22 Nov | waiting |
| XII-b | XII-3 | "it was constructed in 1927." | same fire station as I-13 | "it was constructed over 100 years ago." (her note: "this change elsewhere - walk XII.3") | her email 25 Nov | done (go 25 Nov) |

## Look-at stops (scripts/georef/look_stops.json)
| Walk | Stops | Sent | Status |
|---|---|---|---|
| III | 2, 5, 6, 8 | her call 22 Nov | done |
| I | 9 only (was 3, 5, 13, 16, 21) | 22 Nov | done (#36): her reply 25 Nov 21:23Z: "Walk I, Stop 9 is the only 'look at' stop in that walk." |
| II | 4, 6, 17 | 22 Nov | waiting |
| IV | 3, 7, 9, 10, 11, 13, 14, 15, 16, 21, 23, 24 | 22 Nov | waiting |
| V | 4, 6, 16 | 22 Nov | waiting |
| VI | 11 | 22 Nov | waiting |
| VII | 8 | 22 Nov | waiting |
| VIII | 9, 13, 15, 20, 21, 22, 29, 32 | 22 Nov | waiting |
| IX | 6, 12, 15, 21, 23, 26, 27, 28 | 22 Nov | waiting |
| X | 3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 26, 34, 37, 41, 43, 44, 51 | 22 Nov | waiting |
| XI | 4, 10, 22, 35, 43 | 22 Nov | waiting |
| XII | 2, 7, 12, 14, 19, 26 | 22 Nov | waiting |

Her answer for the other walks (25 Nov, 21:23Z, under the list): "No - most of these are different from Walk III, I'll review each walk separately." So the list for Walks II and IV to XII is not agreed; she will review each walk herself. They stay as listed until she does or Nick decides otherwise (asked in the 26 Nov PR). The live session on 25 Nov missed this answer and told her she marked none; the 26 Nov morning email corrected that.

## Other open questions for her
| ID | Question | Status |
|---|---|---|
| Q-1 | Red ink note near Walk XI stop 6 | waiting |
| Q-2 | Permission to use Jason's maps | waiting |
| Q-3 | Walk X time and distance chips; Walk III "Lewers Street & Road" | waiting |

## Checked and still correct (22 Nov 2026)
Army Museum (II-17), Hau Tree (II-13), Lappert's (II-12), Kani Ka Pila (III-2), Macy's (IV-17), Royal Hawaiian Band Sunday concerts, Art on the Zoo Fence hours (VI-13), South Shore Grill and Diamond Head Market, City Mill Kaimukī, Good Guys, Waiola Kapahulu, Nijiya and Longs, Mānoa Valley Inn, Mānoa Heritage Center, John Young Museum, whiteterns.org. www.waimeavalley.net (III-6) loads (checked 26 Nov); its exhibit page shows ‘ulu maika as artifacts, and no page found today says whether the games area is still set up.

## Daily re-check log
One line per run: date, walk checked, new items added (IDs) or "none".
- 2026-11-22: all walks (first full pass).
- 2026-11-24 and 2026-11-25: Walks I and II, logged in PRs #32 and #33 (not yet merged).
- 2026-11-26: Walk III. New: III-d, III-e. Checked and fine: Royal Hawaiian Hotel has Herb Kane's last painting on permanent display, at the entrance to the Monarch Room (https://www.hawaiimagazine.com/historic-hawaii-foundation-honors-herb-kane-unveils-big-island-artists-last-painting/, 2011); Moana's historical artifacts are in the second-floor lobby of the Banyan Wing, with tours (https://www.historichotels.org/us/hotels-resorts/moana-surfrider-a-westin-resort-and-spa); Kamea Hadar's mural is at the Outrigger Reef (link under III-d); waimeavalley.net loads. Not checked: the Sheraton beach walkway closure (III-3), no reliable current page found.
- 2026-11-27: Walk IV. New: IV-f, IV-g, IV-h, IV-i (sent to her 27 Nov at Nick's word, with the banyan wording for III-e and IV-g changed to "over 100-year-old"). Checked and fine: Waikīkī Community Center still runs from the old St. Augustine school building at 310 Paoakalani Ave (2026 grant application, https://data.capitol.hawaii.gov/sessions/session2026/2026GIA-Apps/WaikikiCommunityCenter_OP_2026-01-23_1052_Redacted.pdf). Already listed: IV-a (Ho‘okela), IV-b (Top of Waikīkī), IV-c (St. Augustine museum). Not checked: which store is in the Gump Building today (IV-9, "a popular retail store" is general enough to stay), Duke's and the ABC store plaque.
