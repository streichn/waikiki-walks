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

## 2026-11-17 · Side trips in a highlighted box; map labels out of the text (Veneeta's Walk I notes)
- The book's purple-line side trips (for example 413 Seaside Avenue and Centennial Park at Walk 1 stop 27) now show in a lavender "Side trip" box beside the main walk text, in the app and the preview.
- "413 Seaside Avenue ... with the" now continues straight into "Moongate entryway..." instead of breaking across a photo caption.
- Street names, stop numbers and compass words copied off the map pages ("BEGIN WALK II 1 2 10 11 13A ...") are removed from the stop text on every walk.
- More photo captions caught (small 6.3 pt captions such as "Be sure to follow the Helumoa Walk (III) to visit with Gabby.").
- Stray control characters removed from text.

- Walk 1 stops 7, 8 and 9 ('Iolani School, the Mānoa-Pālolo Drainage Canal, the ridges and valleys) now line up along Date Street on the golf-course side, as Veneeta asked: they are things to talk about from the walk, not places to walk to. New scripts/georef/pin_overrides.json holds author-chosen pin spots; her printed numbers stay where the book prints them.

## 2026-11-17 · The street map mirrors her book maps (Nick)
- Rule: a stop gets a pin, an arrival alert, and a distance only if one of Veneeta's book maps prints its number. Other stops are still in the text and reached with Next. (src/data onMap; WalkMap, tracking, go screen, lens, explore; preview.)
- Brought in the map pages beyond each walk's first: Walk VIII page 2 (stops 15 to 32), Walk X pages 2 to 4 (stops 7 to 52), and Walk XI's map (stops 1 to 6). scripts/georef/extra_maps.py reads her printed numbers and street names straight from the PDF and fits each page to real streets from labeled street crossings (RMS 8 to 15 m). Pins sit exactly on her numbers.
- Walk X page 4 (upper Mānoa) is a sketch that would not line up with the streets, so stops 40 to 43 use the places themselves (Mānoa Valley District Park, Mānoa Chinese Cemetery, Mānoa Road at Pāwaina Street, Lyon Arboretum), recorded in pin_overrides.json.
- The book map view has "Map 1 / Map 2 ..." buttons on walks with several pages and opens on the page that prints the current stop.
- Fixed Walk XI stop 1: it is "McCully Street" (book p. 38). The parser had given number 1 to Walk XII's opening paragraph, which is back in Walk XII's introduction.
- Not on any of her maps: Walk XI stops 7 to 45 (campus) and Walk XII stops 15 to 28 (lower campus). These have no pins until she maps them.

## 2026-11-19 · Veneeta's Walk I notes, Next keeps the map on the stop
- Walk I pins 11, 16, 21 and 35 moved into line with their neighbors: 11 on Date Street between 10 and 12, and 16, 21 and 35 along the canal with the other street pins (scripts/georef/pin_overrides.json).
- The Kālia opening that had ended up at the bottom of Walk I stop 38 now opens Walk II, where the book prints it (page 40). Map labels after stop 38 removed.
- Next, Previous, or a tap on a pin now centers that stop on the street map and her book map, in the app and the preview. Following the walker resumes with the locate button.

## 2026-11-19 · Walk XII map page 2 from Veneeta's photo, Walk I route and stop 38
- Walk XII foldout page 2 (stops 16 to 28), which is missing from the PDF, now comes from Veneeta's photo: straightened (the map key fitted to a true rectangle and the page edge made vertical), lighting evened, colors matched to page 1, sharpened (scripts/georef/photo_clean.py). Georeferenced from three street crossings, 4.7 m RMS (scripts/georef/photo_maps.py). Stops 23 to 26 land within 6 to 19 m of where their buildings had been geocoded independently.
- Walk XII stop 15, printed just past the edge of the PDF page, placed from her photo of page 1 registered to the PDF page. All 28 Walk XII stops now have pins from her maps.
- Walk I stop 38 completed from her photo of book page 17, also missing from the PDF. Stop 36 "kahuna nui" corrected to "kuhina nui" from her hand correction (to confirm with her).
- The dashed route follows her traced red line between stops where we have it, instead of straight lines. Walk I 12 to 13 now goes along Date Street and down Kapahulu Avenue, around the golf course (her request).
- Book map page tabs moved out of the middle of the map, where they hid the current stop; the selected tab now shows.

## 2026-11-19 · Book photos without page text
- Pictures were cut from the page with the book's text, captions and page numbers printed over them (Nick: page 215 "cropped wrong"). All pictures re-rendered from the PDF with the page text removed (scripts/extract/rerender_images.py).
- Reviewed by eye: 146 boxes were not photos once the text was gone (map keys, page tints, slivers, blank page backgrounds) and are no longer shown; 55 trimmed to the photo inside. 190 stop photos remain; OCR finds no page text left in any of them (only real signs).
- Walk I stop 36: "kahuna nui" corrected to "kuhina nui" (Veneeta confirmed by email).

## 2026-11-19 · Walk XI map page 2 from Veneeta's photo
- Walk XI foldout page 2 (stops 7 to 45), missing from the PDF, from her photo IMG_4706: same cleanup as Walk XII page 2 (scripts/georef/photo_clean.py, now one config per page). Georeferenced from three route corners, 6.8 m RMS. Spot checks: Hamilton Library, Hawaiʻi Hall, Campus Center and Bachman Hall land on their buildings.
- Walk XI now has map pins for 44 of 45 stops; 43 (Sinclair) is not printed on her map, so it has none.
- Preview street tiles extended over upper campus at the closest zoom.
- Her photo of Walk XI page 1 (IMG_4705) has a short red handwritten note in the margin near stop 6; not legible in the photo, asked her.

## 2026-11-19 · Veneeta's Walk II notes, side trips, street routes, book updates list
- Walk II: pin 10 moved to where 11 was and 11 moved 40 percent of the way toward 12; pin 18 mirrored across Kālia Road; stop 13 is now a side trip (purple pin and dashed purple connector; the main line goes 12 to 14).
- Side-trip boxes: lettered sub-stops (13A to 13D, 21A, 25A, 36A, 36B) now belong to their side trip; Walk II 13 no longer boxes the main beach route.
- Map lines: legs with no traced red line now follow a walking route along the streets (142 legs, FOSSGIS OSRM foot router, cached in scripts/georef/street_legs.json), kept only when close to the straight line; 30 legs stay straight. Walk II 1 to 2 now runs along Ala Moana Boulevard.
- docs/BOOK_UPDATES.md: her changes to the printed text, and statements checked for being out of date.

## 2026-11-19 · Finishing a walk (Nick)
- Walked trail: the part of the route already walked shows as a solid green line over the dashed route, on every map, so the circuit fills in as you go; a finished walk shows all of it.
- Finish: on the last stop, Finish opens "Walk complete" with "See my route" (the whole walk on the map, fully lit) or "Back to all walks".
- Completed walks: the card says "Completed"; tapping it asks "Walk it again?" with "Start over" (from stop 1) or "Just look" (opens the walk's map, keeps the finished route). The walk page button reads "Walk it again".
