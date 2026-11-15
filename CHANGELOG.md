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
