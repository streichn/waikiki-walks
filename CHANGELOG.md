# Changelog

## 2026-11-21 · The book's front matter in About
- About the book now has the rest of the book's opening pages, word for word: Introduction, Hawaiian Language and Guide to Pronunciation (with the ʻŌlelo Hawaiʻi Pīʻāpā alphabet), Hawaiian Monarchy and Some Historic Dates (the royalty table and the dates), and Wahi Pana (sacred places, walk by walk). Before, only Dedications and Foreword were there.
- A short "In this section" list at the top of About jumps to each part.
- The Hawaiian word card on a stop has a "How to say Hawaiian words" link that opens the pronunciation guide.
- Built by scripts/build_data.py from the book's front matter; paragraphs that a photo split across pages are rejoined, and photo captions are left out because the photos are not shown there. The Monarchy table is transcribed from page xvi.
- Web preview updated the same way.

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

## 2026-11-19 · Cartographer's maps for Walks X, XI and XII
- Jason Nakano's original vector maps (Drive folder Veneeta forwarded, saved in book/cartographer/) replace the book page renders and Veneeta's phone photos for Walks X (two maps), XI and XII. Every stop number is printed, including Walk XI stop 43.
- New scripts/georef/carto_maps.py renders them, fits each to OpenStreetMap streets from its own street labels (5 to 7 m RMS, about twice as accurate as the old Walk XII fit) and traces the dotted walk path between stops.
- Pins now sit where these maps print the numbers. Overrides dropped for Walk X 40 and 41 and Walk XII 15; kept for X 42 and 43, which the map squeezes at its top edge.
- build.py, routes.py, warp.py and build_data.py use the new maps for these walks; the folder also holds maps for Walks I to IX and a master map, not yet used.

## 2026-11-19 · Cartographer's maps for every walk; map controls rearranged
- Walks I to IX now use Jason Nakano's vector maps too, fitted the same way (4 to 8 m RMS). Walk VIII's two book pages become one map. Small maps render at least 1300 px wide.
- Pins checked against landmarks moved closer: Diamond Head Lighthouse (VII 17) now within about 20 m (was 235 m), Honolulu Zoo (VI 14) about 70 m (was 280 m).
- Walk I 7 to 9 overrides converted from book-map pixels to lat/lng; Walk IV 19 and 20, which the new map does not print, keep their book-map spots.
- Map controls (Nick): Street map / Book map switch at the bottom left with Demo walk above it, + and - at the bottom right on both maps, the top left clear for the arrival banner. The layers button is gone (redundant with the switch; no satellite view).
- App book map keeps each map's own shape and opens wide maps zoomed to fill the space; + and - zoom around the middle of the view.
- Nominatim lookups back off and retry when rate limited.

## 2026-11-19 · Audio mode; pinch zoom everywhere
- The speaker button left the map. Next to the headphones (read this stop) there is now an "Audio mode" switch: when on, each stop is read aloud on arrival, so the phone can stay in a pocket.
- Preview: two-finger pinch zooms the book map around the fingers; street maps zoom out one level further.
- App: street maps already pinch natively; the book map pinches on iPhone.

## 2026-11-19 · Real GPS in the preview; walked trail on the book map
- Preview: a walk now starts in real mode. The phone's location moves the dot, triggers arrivals (same radius rule as the app) and updates the distance line. The demo walk only runs when tapped, or by itself when the browser has no location.
- Book map (preview and app): the walked part of the route fills in over her dotted line, in the same green as the street map's trail (one shared TRAIL color).

## 2026-11-19 · Book map trail follows her dotted line; map opens filling the screen
- The walked part on the book map is now her own dotted line, leg by leg, filled in see-through blue once each stop is reached. It is never the walker's GPS track. carto_maps.py saves each traced leg in map pixels (routes_carto_px.json, carried into bookmaps.json as "legs").
- Path tracing now bridges the small gaps where dashes meet at corners and picks up maps drawn with solid path strokes, so many more legs trace (Walk V 6 to 16, Walk VI 4 to 9, Walk XI 23 to 41).
- The book map opens zoomed so her map fills the full height under the header, in the preview and the app, until the walker zooms.

## 2026-11-19 · Blue line fills along her route as you walk
- Book map (preview and app): while heading to a stop, her dotted line from the previous stop fills in blue as far as the walker has come along it. The position is projected onto her line, counts only near it, and never shrinks on doubling back. The whole leg fills on arrival.
- Preview book map measures the real pane to fill its full height, on any screen size and after resizes, until the walker zooms; a new walk resets the zoom.
- Preview: Demo walk now starts at stop 1 and walks the whole route, with the street map and the book map following the dot. Pausing and tapping again carries on from where it paused.

## 2026-11-19 · Blue lines on both maps; book trail sits straight on her line
- Street map: the walked trail is see-through blue and the leg ahead is dashed blue (was green and red).
- Book map: each traced leg is pulled back onto her drawn line and straightened, so the blue sits exactly on her dots with no wobble. The current leg fills smoothly to the walker's point along her line.
- Preview: the "location is off" notice no longer shows during the demo walk, and shows once at most.

## 2026-11-19 · Direction controls on the book map
- Preview: the follow-me button and the whole-walk button now work on the book map (follow scrolls with the dot; whole shows the full page). No made-up position when location isn't known yet.
- Preview: the directions button opens walking directions to the next stop in Apple Maps on iPhone, Google Maps elsewhere.
- Preview: the phone's compass sets the heading when standing still (iPhone asks once, on Start).
- Book map (preview and app): the walker's dot has a heading wedge like the street map, turned for each map's own orientation (her maps are mauka-up, not north-up).
- App: the street-only buttons hide on the book map, which keeps its own follow-me button beside + and -.

## 2026-11-21 · Veneeta's Walk II notes
- Pins 15 and 16 sit on her dotted line (no loop), and the line from 16 to 17 follows her route along the side of the park. carto_maps.py starts and ends legs at author-placed pixel pins.
- Walk II stop 16 ends with her new sentence about Bob Magoon and Chun Afong.
- Walk II stop 4: "Sandalwood" (the book's line-break hyphen had left "Sandalewood").
- docs/BOOK_UPDATES.md lists twelve possible typos in the printed book, sent to her to confirm.

## 2026-11-21 · Street map matches the book map; Read and Pause by the text
- Street map (preview and app): her route is a dotted yellow line like her map, and the walked part fills in solid see-through blue over it, live along the leg being walked (never the walker's own track). The dashed leg-ahead line is gone.
- Reading: a Read / Pause / Resume button sits just above the stop text; the headphones button left the bottom bar. Audio mode stays beside Next stop.
- Shared polyline helpers in src/lib/polyline.ts.
- Street map pins: one color (blue) for every stop, red for the stop you're heading to or at, purple for her side trips; the current pin is no longer enlarged. Visited stops show through the blue trail instead of a green pin.

## 2026-11-21 · Maps before unlocking
- Her book maps (and the book overlay on the street map) appear only once the walks are unlocked.
- Before unlocking, the street map shows only the stops you can open: Walk IV's free stops 1 to 5 with the route between them, and a locked walk's first stop. The rest of the walk stays hidden until unlocked.
## 2026-11-18 · "What am I looking at?" done right
- Asks for the camera and location only when the walker opens the feature. If the camera is refused, it still works from location and compass; if location is refused, it says what is missing and how to turn it on, instead of "Finding your location..." forever.
- Steadier answers: compass readings are smoothed, and a figure 8 tip appears when the compass is unsure.
- Honest labels: "You are looking at" only after a photo match; otherwise "Probably in view". The shutter appears only when the photo service is set up.
- Smaller, private photos: about a tenth of the size, upright, no location tags, deleted after the check. Server caps photo size and only answers with the book's stops.
- No microphone permission and no barcode scanner in the app any more.
- Spoken labels and announcements for screen reader users.

## 2026-11-21 · Database and photo-check safety
- The photo check in "What am I looking at?" now has a daily limit per walker (60 photos for a signed-in walker, 40 per guest network, 1,500 in total), so nobody can run up the paid vision service through the public address. Past the limit, the app says photo checks are resting for today and still answers from location and compass.
- Signed-in walkers send their own sign-in token with a photo check, so their limit is theirs alone. Guest network addresses are hashed with a secret and the date; nothing about the photo, the place or the address is stored, only a count per day, kept for a week.
- The server refuses anything that is not a JPEG before it reaches the vision service.
- New migration `server/003_security_and_limits.sql`: policies are for signed-in walkers only ("to authenticated"), guests get no table access, the sign-up function can't be called through the API and has a fixed search path, and size checks stop oversized rows (names, settings, walk numbers, stop ids).
## 2026-11-21 · Pin audit against Veneeta's maps
- New `scripts/georef/audit_pins.py` (read-only) checks every pin against the numbers printed on her maps and writes `docs/PIN_AUDIT.md`. `--strict` exits with an error if a pin has no printed number or has drifted off it.
- First run: 344 pins, 0 rule breaks, 0 pins off her number. 12 pins moved at her request are listed with her reason. Walk IV stops 19 and 20 are printed on the book's own map page but not on the cartographer's map, and share one pin spot.
## 2026-11-15 · Account deletion done right
- Deleting an account that used Sign in with Apple now revokes the app's Apple access, as Apple requires (TN3194). Apple asks the walker to confirm once; nothing is stored.
- Google accounts: the app's Google access is revoked on the phone.
- Fixed the server function, which tried to delete from a table that does not exist; the database now removes everything through cascades.
- Clear messages: what gets deleted, that purchases stay with Apple or Google, an error if deletion fails, and manual Apple steps if revocation fails.
- The app signs out if the walker stops using Sign in with Apple from iPhone Settings.
- Draft Google Play account deletion page (legal/DELETE-ACCOUNT.md); privacy policy and checklist updated.
## 2026-11-15 · Works without signal
- Walk screen shows a calm "No internet. Your walk still works." notice when the phone loses signal, saying what still works (text, photos, pins, GPS, arrival alerts, the book's map). Screen readers hear it once.
- Cloud sync now retries when the connection comes back. After an offline start it pulls from the cloud before pushing, so it can't overwrite progress saved on another phone.
- "What am I looking at?" skips the photo upload with no signal and matches by location and direction instead.
- New "Without signal" section in Settings, including the tip to turn off mobile data rather than use Airplane mode.
- Fixed the "offline maps" claim on the profile screen; added a "Works without signal" line to the paywall.
- Accessibility: Settings switches, rows, and voice choices now have screen reader labels, roles, and states; rows are at least 44 points tall.
## 2026-11-18 · Clearer paywall: what is free, what you get, when a pass ends
- Paywall says what stays free (Walk IV stops 1 to 5, plus every walk's overview, map and first stop), worded from src/config.ts.
- Plan notes say how long each lasts: "for 7 days from purchase" and "on this trip and every visit after".
- Fine print under the button changes with the plan: one charge, the exact date and time a pass would end, and that it never renews.
- "BEST VALUE" badge replaced with "NEVER EXPIRES", which is literally true.
- Week passes stack: a pass bought while one is active adds 7 days instead of restarting the clock. A pass holder sees "Add 7 days" and when the pass runs.
- A forever owner who opens the paywall is told everything is already theirs.
- Plans read as a radio group with checked state for VoiceOver and TalkBack.
- Profile: removed the "Manage subscription" button (nothing renews, so there was nothing to manage); pass holders get "Add days or keep forever".
- Web preview paywall and profile card match.
## 2026-11-18 · Arrival alerts and the Lock Screen walk, done the standard way
- One Live Activity per walk. Leaving and reopening the walk screen used to start a second one; now it updates the one already showing.
- The Live Activity says "You are at: ..." once you reach a stop, and "Next: ..." before. It changes only when something changes, as Apple asks.
- Background arrival alerts (phone in pocket) now follow the same rules as the walk screen: no alert for a locked stop, a stop already reached, a stop behind you, a walk that has ended, or when Arrival alerts is off in Settings.
- When the phone wakes the app in the background, it first reads back the saved walk, settings and purchase. Before, it could decide with empty defaults.
- After an arrival in the background, the alerts move on to the stops ahead.
- Each new arrival alert replaces the last one, and alerts from one walk group together. Ending a walk clears the last alert.
- Android: arrival alerts have their own "Arrival alerts" channel (high importance, shows on the Lock Screen), created before the Android 13 permission prompt.
- Tapping an arrival alert opens that stop even when the tap is what launched the app from closed.
- Settings: if notifications or background location are off, a short note under Arrival alerts says what that means, with an "Open phone Settings" link.
## 2026-11-18 · Readable in light and dark mode
- Unlock buttons, the "Keep reading with Veneeta" banner, the read-aloud button and the "Continue" home card now use dark text on pink in dark mode. White on that pink measured 2.4:1; it is now 7.5:1.
- Home card text and icon follow the card's color (pink, green or teal) in both modes, instead of white and gold everywhere.
- Light mode pink deepened slightly (#D6336C to #C2255C) so white text on it and pink icons pass 4.5:1. The hibiscus drawings keep the original color.
- Gold info, bus, gift and ribbon icons use a darker gold on light backgrounds (was 2:1, now 4.6:1 or better). Gold badges keep their color.
- Stop number badges and map pins pick white or dark numbers by contrast with the walk's color; locked stops use a darker grey.
- "Delete account" uses a theme red that passes in both modes.
- Dark mode: the book map viewer sits on the dark background instead of a bright cream page edge.
- Photos and book maps are left alone by Smart Invert, so they never show as negatives.
- New scripts/check_contrast.py checks every theme color pair against WCAG in both modes.
## 2026-11-19 · Stop pages work with VoiceOver, TalkBack and larger text
- Each stop page now has a heading that VoiceOver and TalkBack read as one item: "Stop 7, 'Iolani School". Taglines, book sub-headings and the Side trip box are headings too, so screen reader users can jump between them.
- Walking directions are read as "Walking direction. ..." so they stand apart from the history.
- New "Hawaiian words on this stop" row under the text. Each word from the book's glossary is a button that opens its meaning. Words inside a paragraph are hard to reach with a screen reader, and the row also helps anyone who wants a quick list.
- Listen, On map and Save are labeled buttons at least 44 pt tall (48 dp touch area on Android). The directions button grew from 40 to 44 pt and the Previous and Next buttons to 44 pt.
- Captions, info notes and taglines now follow the Text size slider, like the rest of the stop text.
- The paragraph being read aloud has a gold bar on its left, so it does not rely on color alone.
- The stop panel handle works with VoiceOver: swipe up or down to switch between Map, Map and text, and Text.
- Arrival is spoken by the screen reader ("You've arrived at stop 12: ..."), since the banner fades after a few seconds.
- The glossary card and the photo viewer keep screen reader focus inside until closed; photo buttons say "Photo 2 of 3" and the caption.
- Preview: the same "Hawaiian words on this stop" row, headings and reading bar.

## 2026-11-19 · Asking for location the standard way
- The first time a walk starts, a short screen explains what location is for (where you are, distance to the next stop, alerts even when the app is closed or not in use) and that it stays on the phone, then one "Continue" button opens the phone's own prompt. Before, three system prompts (location, notifications, background location) appeared at once with no explanation. (src/components/LocationPrimer.tsx)
- On Android the screen says to choose "Allow all the time" for alerts with the app closed, as Android 11 and later only offers that option on a settings page.
- If location is off, "turn on location" on the walk screen asks again, or opens the app's Settings page if the phone will not ask again.
- Coming back from Settings with location now allowed starts following the walk right away, without leaving and reopening the walk.
