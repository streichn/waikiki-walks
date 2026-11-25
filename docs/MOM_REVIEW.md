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

## Walk IV
| ID | Stop | Book text | Finding | Suggested change | Sent | Status |
|---|---|---|---|---|---|---|
| IV-a | IV-23, V-19, V-15 | "Ho‘okela Hawaiian Heritage and Culture Center" | renamed Uluniu, daily programs | delete like Walk III, or rename to Uluniu | 22 Nov | waiting |
| IV-b | IV-13 | "Waikīkī Business Plaza, which houses Top of Waikīkī" | closed 2020 | "which once housed" | 22 Nov | waiting |
| IV-c | IV-28 | "St. Augustine Church and a related museum" | Damien and Marianne center, open status unclear | add "(check if open)" | 22 Nov | waiting |
| IV-d | IV-23 | "A plaque behind one of the columns in the atrium recalls James Steiner (1860-1939) ..." | | delete the sentence | her email 25 Nov | done (go 25 Nov) |
| IV-e | IV-13 | the three chant lines run together | | each Hawaiian line directly above its English, no blank line between, a blank line between pairs | her email 25 Nov | done (go 25 Nov) |

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
| I | 3, 5, 13, 16, 21 | 22 Nov | waiting |
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

## Other open questions for her
| ID | Question | Status |
|---|---|---|
| Q-1 | Red ink note near Walk XI stop 6 | waiting |
| Q-2 | Permission to use Jason's maps | waiting |
| Q-3 | Walk X time and distance chips; Walk III "Lewers Street & Road" | waiting |

## Checked and still correct (22 Nov 2026)
Army Museum (II-17), Hau Tree (II-13), Lappert's (II-12), Kani Ka Pila (III-2), Macy's (IV-17), Royal Hawaiian Band Sunday concerts, Art on the Zoo Fence hours (VI-13), South Shore Grill and Diamond Head Market, City Mill Kaimukī, Good Guys, Waiola Kapahulu, Nijiya and Longs, Mānoa Valley Inn, Mānoa Heritage Center, John Young Museum, whiteterns.org. Not yet checked: www.waimeavalley.net (III-6).

## Daily re-check log
One line per run: date, walk checked, new items added (IDs) or "none".
- 2026-11-22: all walks (first full pass).
