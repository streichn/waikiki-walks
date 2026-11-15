# Waikīkī Walks

iPhone and Android app for *Waikīkī: Twelve Walks Through Time* by Veneeta Acson, Ph.D.
Built with Expo (React Native), so one codebase ships to both stores.

## What is in here

| Path | What it is |
| --- | --- |
| `src/app/` | Screens (Expo Router): home, map, saved, profile, walk overview, active walk, paywall, sign-in, settings, camera "What am I looking at?", welcome, about |
| `src/lib/tracking.ts` | GPS arrival detection: foreground watch, background geofences, arrival notifications |
| `src/lib/liveActivity.ts` | Lock Screen / Dynamic Island "walk in progress" on iPhone |
| `src/lib/narration.ts` | Read-aloud with the phone's voices; highlight follows the paragraph being read |
| `src/lib/purchases.ts` | Subscriptions through Apple and Google, via RevenueCat |
| `src/lib/auth.ts` | Accounts: Sign in with Apple, Google, email code, or guest (Supabase) |
| `src/lib/lens.ts`, `server/lens.ts` | Camera identification: GPS + compass shortlist, optional photo check |
| `src/config.ts` | Free trial rule (Walk IV, stops 1 to 5), keys |
| `src/data/` | Generated from the book: 12 walks, 308 stops, photos, fun facts, glossary |
| `scripts/build_data.py` | Rebuilds `src/data` from the extracted book |
| `review/stops_review.csv` | Every pin with a map link and confidence, for checking on the ground |

## Run it on a phone

1. `npm install`
2. Copy `.env.example` to `.env` (the app runs without keys; purchases and sign-in stay inactive).
3. Build a development app once: `npx eas-cli@latest build --profile development --platform ios`
   (Expo Go cannot run it because of the native location, purchase, and Live Activity modules.)
4. `npx expo start` and open the development app.

## Accounts to create before launch

- Apple Developer Program (App Store, TestFlight, in-app purchases)
- Google Play Console
- RevenueCat (free tier): products `ww_monthly`, `ww_annual`, `ww_lifetime` → entitlement `all_walks`
- Supabase (free tier): enable Apple, Google, and email providers; deploy `server/delete-account.ts`
- Google Cloud OAuth client IDs (iOS and web) for Google sign-in

## Ship

- TestFlight: `npx eas-cli@latest build --profile production --platform ios` then `npx eas-cli@latest submit -p ios`
- Play internal testing: same with `-p android`

## Known gaps

- Pins: 169 matched to named places or street corners, 41 to a street only, 98 estimated between neighbours. Walk each route once or have the author check `review/stops_review.csv`.
- Text was extracted automatically from the PDFs; captions and a few headings need a proofread.
- Routes between stops are straight lines; real walking paths can come from a directions API later.
- `expo-live-activity` is flagged as unmaintained by expo-doctor; it is isolated in one file.
