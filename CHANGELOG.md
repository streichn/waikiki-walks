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
