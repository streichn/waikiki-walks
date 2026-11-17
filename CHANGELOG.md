# Changelog

## 2026-11-14 · First build
- Extracted 12 walks and 308 stops from the book PDFs, with photos, fun facts and a glossary.
- Geocoded stops with OpenStreetMap (named places, street corners, estimates); see review/stops_review.csv.
- Expo app: walks, linked map and text, GPS arrival alerts, read-aloud, Live Activity, paywall (Walk IV stops 1 to 5 free), Apple/Google/email sign-in, settings, saved stops, camera identification.
- Web preview published at https://claude.ai/artifact/Pc5t3K8ybk6cqv9NeeVuJm

## 2026-11-14 · Credits, copyright, accounts
- Author name, "For Alice and Ezra" dedication, and © 2026 Veneeta Acson on the welcome, home, about, settings, and a new Credits screen.
- Credits for Island Heritage, photographers, Hawaiʻi State Archives, OpenStreetMap, and fonts.
- Draft privacy policy, terms of use, rights checklist, and publisher permission letter in legal/.
- Cloud sync of progress and saved stops for signed-in walkers (Supabase); database schema in server/schema.sql.

## 2026-11-14 · Accounts done the standard way
- Settings now sync for signed-in walkers (migration server/002_settings_and_policies.sql, already applied).
- Login session stored with AsyncStorage and refreshed only in the foreground, per Supabase's Expo guide.
- Editable display name on the profile; no other personal fields, per Apple's data-minimization rule.
- Plain-language "Your data is stored securely" summary in Settings.
- New docs/DECISIONS.md: how each part is normally built, what we chose, and why, with sources.

## 2026-11-15 · Map like Apple Maps
- Locate button cycles: center on me and follow, follow with heading (map turns as you turn), free map. Dragging the map stops following.
- Map style switch: street, satellite, satellite with street names, and Veneeta's original walk map from the book (pinch to zoom).
- Preview: blue dot with direction cone, follow modes, and the book map viewer.

## 2026-11-15 · Pricing, teasers, simpler map
- Pricing matched to Waikīkī tour apps: 7-day pass $9.99 (never renews) and Yours forever $34.99. No free trial; the free part of Walk IV is the trial.
- Locked stops show the first photo and opening lines, with a one-tap "Unlock for $X" button.
- Explore map: no walk list on top; tap a walk on the map to see only its route and stops.
- Preview: the demo walk starts automatically so the moving blue dot and arrival alerts are visible.

## 2026-11-15 · Smart home card
- The top card on the Walks tab now adapts: continue a walk in progress, start a nearby walk (within about 2.5 km, only if location is already allowed), resume an unfinished walk, the free Walk IV for new users, or the next unfinished walk.
- Preview has a "pretend I'm standing in Waikīkī" toggle to test the nearby card.

## 2026-11-15 · Read-aloud is opt-in, with a clear stop
- Reading each stop aloud on arrival is now off by default; turn it on in Settings.
- The collapsed walk bar shows a stop button while reading. The walk screen's read button shows a stop icon instead of pause.

## 2026-11-15 · One stop per page, and a map sheet like Apple Maps
- Reading a walk: the overview now lists the stops; tapping one opens it as its own page. Swipe sideways or use Previous and Next to move one stop at a time.
- Walking: the map fills the screen and the stop slides up over it in a sheet you can drag or tap to three heights (peek, half, full). The whole stop scrolls inside the sheet. Previous and Next sit at the top of the sheet; larger text.
- Recorded narration (Gemini TTS) plays in the preview when a stop has been recorded; otherwise the device voice is used.

## 2026-11-15 · Veneeta's first feedback: numbered walks, her maps, ending a walk
- Walks are shown as Walk 1 to Walk 12 (the book's Roman numerals stay in the data) and listed in order on the home screen, one per row, instead of grouped side-scrolling rows.
- Veneeta's map from the book is now a main map view: a Street map / Book map switch on the walk map and on the walk screen, with zoom.
- Ending a walk asks: end and save my place, end and start over next time, or keep walking.
- The walk screen has a Map / Both / Text switch alongside the draggable sheet.

## 2026-11-15 · Veneeta's maps matched to real streets; Walk 1 and 4 pins from her maps; 21 missing stops restored
- Each book map is fitted to real street intersections from OpenStreetMap (scripts/georef). Typical fit error 10 to 20 m.
- The book map view now shows numbered stop pins and the walker's blue dot on her map.
- Walk 1 and Walk 4 pins are now placed where her map prints each stop number, snapped to her route line. This fixes Walk 1 stops 1 to 7, which belong along the Ala Wai Canal (Veneeta's comment).
- 21 stops whose headings had been read as text inside the previous stop are restored as their own stops (for example Walk 1 stop 21, ʻĀpuakēhau Stream). 329 stops in all.

## 2026-11-16 · Every book map fitted to roads and shoreline; 215 pins from Veneeta's maps
- Map fit now uses three kinds of landmark: labeled street intersections (firm), major roads from OpenStreetMap matched to her drawn streets, and the shoreline and Ala Wai Canal banks matched to real water (scripts/georef/roads.py, water.py). Share of major-road points landing on her streets rose to 64 to 90 percent per map.
- Stop numbers read off all 11 maps (scripts/georef/map_stops.json); 215 of 334 stops now sit exactly on her printed number, with the arrival circle widened by her number's distance from the route.
- Five more stops the parser had missed are restored from the book's bold headings (scripts/extract/stop_fixes.json): Walk 3 stop 1, Walk 6 stop 1, Walk 9 stop 10, Walk 12 stops 1 and 8.

## 2026-11-16 · Walk progress, start over, read-aloud switch, steadier map
- Each walk card shows Not started, In progress or Stopped at stop N of M with a bar, or Finished.
- "Start this walk over" on the walk page clears that walk's progress.
- A speaker button on the walk screen turns reading each stop aloud on arrival on or off (off by default).
- Arriving at a stop no longer resizes the panel or moves the map; the book map stops scrolling at its bottom edge.
- Demo walk continues onto each stop's exact spot (her printed number) before moving on.

## 2026-11-16 · Headings and captions match the book
- Walk 4 stop 1: the location lines (Waikīkī Gateway Park, Kalākaua Avenue, Kūhiō Avenue) and "King Kalākaua welcomes you to Waikīkī!" were run together into one walking direction. They now show as the stop's location and a heading, as on page 51 of the book.
- Fixed about 35 other stop headings that were split, merged, or picked up stray text (scripts/extract/heading_fixes.json, each checked against the book page).
- Bold lead-in lines that the parser cut mid-sentence are rejoined; short bold sub-headings no longer show as walking directions.
- Restored Walk 4 stop 19 and Walk 11 stop 27, which the book prints inline without a bold heading.
- Home screen and walk covers no longer use book photos with their printed captions cut off at the edge.
- Hawaiian glossary words are underlined only the first time they appear on a stop.
- Guest first: no sign-in prompt at launch. Sign-in stays in Profile.

## 2026-11-16 · Photo captions out of the text; missing stops restored
- About 36 photo captions had been read as body text, some in the middle of a sentence (for example "this cool The Royal Hawaiian Hotel on the ocean. (Hawai‘i State Archives) freshwater stream"). They are now captions under the photos, and they are no longer read aloud. Source list: scripts/extract/captions.py → captions.json.
- Restored Walk 9 stop 2 (Waikīkī-Kapahulu Public Library) and Walk 10 stops 9, 13, 21, 22, 23, 28 and 30, which the book prints inline. Every walk now has every number.
- Walk 9 stop 4 title is "First Hawaiian Bank".

## 2026-11-16 · Walk I pins follow the canal (Veneeta's corrections)
- Stops 3, 4 and 5 now sit on the canal-side walkway, as Veneeta wrote ("Stop 3 through 5 are on the canal"). They had landed inside Ala Wai Community Park.
- Stops 7, 9 and 11, whose numbers her map prints away from the path, now sit on her route between their neighbours, so arrival alerts fire on the way to Date Street. Marked "estimated" with a 50 m arrival circle.
- New scripts/georef/author_fixes.json records each author correction and its source; scripts/georef/build.py applies it.
- Preview: the "pin is a draft" note no longer shows on pins placed from her maps (matches the app).
- New docs/FEEDBACK.md entries for her 16 Nov email.

## 2026-11-16 · Walk X pins from the book's second map; two missed stops restored
- Walk X has two more map pages in the book that the app had not used. The "CONTINUE WALK X" map (part 3, book page 155) is now fitted to real streets (9 street crossings, 9 m average error, 89 percent of road points on her streets) and places 19 stops: 30 to 39 and 44 to 52, from Ka‘ala Street up O‘ahu Avenue to Five Corners and back by Woodlawn Drive and University Avenue. These had been straight-line guesses.
- Walk X stops 28 ("At the glorious Monkey Pod tree") and 30 (the "Chalet") are restored. The book prints their numbers without a bold heading, so the parser had folded them into stops 27 and 29. Their titles are the book's own opening words.
- Mānoa Chinese Cemetery (41) and Lyon Arboretum (43) now use their OpenStreetMap places. They had been thrown out as "too far from the walk's centre" (scripts/extract/far_stops.json lists each exception with the book's words).
- Pins read off her maps are no longer thrown out by the same distance check. This also restores Walk IX stop 3 (Waikīkī Fire Station No. 7) to the spot on her map.
- New scripts/georef/pages.json and pages.py: extra map pages per walk, rendered for fitting only (not shown in the app). The upper-valley page (book part 3, page 5) is too schematic to fit and is not used.

## 2026-11-16 · Waterways from Veneeta's maps on the street map
- The street and satellite maps now show the canal, streams and ponds as her book maps draw them, laid on real streets (her request: "The maps needs the water ways overlays").
- New scripts/georef/waterways.py lifts the waterways off each map and writes assets/waterways/*.png, src/data/waterways.json and src/data/waterways.ts.
- "Waterways from the book" switch in the map style menu, on by default; saved and synced with the other settings.
- Web preview: same layer and switch; map style menu icons are sized correctly.

## 2026-11-17 · Walk VIII pins from the book's second map; arrival on the path for stops printed beside it
- Walk VIII (Kaimukī) runs onto a second map page in the book (part 2, book page 119) that the app had not used. It is now fitted to real streets (11 street crossings, 14 m average error) and places stops 15 to 32 where Veneeta prints their numbers: Waiʻalae Avenue, the puʻu, Ocean View Drive, Makapuʻu Avenue and Diamond Head Road. These had been guesses; stops 18 to 22 were 0.5 to 2.3 km off, and stop 32 (Monsarrat Avenue) sat 1.5 km away near Kapahulu. Stop 22A is a detour, not a separate stop, and is not pinned.
- Stops whose number the book prints well beside the red path (a campus, a park, a hospital) keep the pin where she printed it, and now also get a trigger point: the nearest spot on her path. Arrival alerts fire there, in the foreground and in the background. 37 stops across the walks get one. Before, a widened circle around the pin (at most 90 m) could miss walkers on the path when the number sat more than about 60 m away.
- Proposed web preview: https://claude.ai/artifact/CX5icTb6nXdw6v8StZz1Y6

## 2026-11-17 · Each walk ends where the book ends it
- The last stop of every walk was showing the next walk's map labels ("BEGIN WALK II", "Kālia Rd.", "Walk II Map Key"), the next walk's opening pages and their photos. Walk XII's last stop (Music Building) also carried the book's glossary, reading list, acknowledgements and back cover, with 28 extra photos. These now go where the book puts them.
- Each walk's opening text moves back to its own introduction, so introductions no longer start mid-sentence (Walk II began "Kalamakuaakaipuholua (a.k.a. Kalamakua) in the 1400s."). Map labels at the top of the Walk VIII and Walk X introductions are gone.
- Walk XI stop 1 now shows the book's McCully Street stop. It had been showing Walk XII's Kapahulu Avenue stop. Walk VI stop 1 (Hawaiian Burial Memorial) and Walk XII stop 1 (Kapahulu Avenue) get back their opening paragraphs, and Walk XII stop 1 gets its two photos.
- Walk XI stop 1's pin sits at McCully Street and the Ala Wai Canal, the same spot as Walk I stop 1 on Veneeta's map (Walk XI has no map of its own).
- New scripts/extract/walk_ends.json records where each walk ends in the PDF, checked page by page; build_data.py applies it.
