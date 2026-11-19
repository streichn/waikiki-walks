# How it's built and why

A running record of how each part of a tour app is normally built, what we chose, and why.
Each entry lists its sources. Add a new dated entry when a decision changes; don't rewrite history.

---

## Platform: Expo (React Native)
- **Common practice:** one cross-platform codebase (React Native or Flutter) for small teams; native Swift and Kotlin for large ones.
- **Our choice:** Expo SDK 58 with Expo Router. One codebase for iPhone and Android, cloud builds with EAS, no Mac needed.
- **Why:** smallest team, fastest path to both stores, and native modules where needed (location, purchases, Live Activities).
- Sources: docs.expo.dev/llms.txt; docs.expo.dev/router/advanced/tabs

## Accounts: Supabase Auth
- **Common practice:** a managed auth service (Supabase, Firebase, Auth0) rather than storing passwords yourself.
- **Our choice:** Supabase Auth with Sign in with Apple, Google, a one-time email code, and guest mode.
- **Rules we follow:**
  - Offer a privacy-focused login (Sign in with Apple) whenever Google sign-in is offered (App Store Guideline 4.8).
  - Don't force registration for features that don't need an account; guests can browse and take the free walk (Guideline 5.1.1).
  - Offer account deletion inside the app (Guideline 5.1.1(v)). Google Play also wants a web page for deletion requests.
- Sources: developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion; ptkd.com/app-store/guidelines/5-1-1; newly.app/how-to/account-deletion-requirement

## Database and security: Postgres with Row Level Security
- **Common practice:** the mobile app talks to the database directly through an auto-generated API, protected by Row Level Security (RLS), with no custom server in between.
- **Our choice:** tables `profiles` (including `settings`), `walk_progress`, and `favorites`, each with RLS so a person reaches only their own rows. Policies use `(select auth.uid())` so it is evaluated once per query.
- **Keys:** the publishable key ships in the app and is safe only because RLS is on. The secret (service-role) key bypasses RLS and lives only on the server (Edge Functions), never in the app.
- **Migrations:** numbered SQL files in `server/` (`schema.sql`, `002_...sql`), run in order in the Supabase SQL Editor.
- Sources: docs.expo.dev/guides/using-supabase; flaviocopes.com/courses/supabase/separate-public-and-secret-keys; instamobile.io/blog/supabase-react-native

## Login session storage
- **Common practice:** persist the session on the device and refresh tokens only while the app is in the foreground.
- **Our choice:** AsyncStorage, the store used in Supabase's Expo guide, with `startAutoRefresh` and `stopAutoRefresh` tied to the app's foreground state.
- **Why not SecureStore:** it caps each value at 2 KB, and Supabase sessions with refresh tokens often exceed that.
- Sources: rapidnative.com/blogs/how-rapidnative-handles-authentication-in-ai-generated-react-native-apps; supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth

## What syncs to the cloud, and what doesn't
| Data | Where | Why |
| --- | --- | --- |
| Account (email, sign-in method) | Supabase Auth | Managed and secure |
| Progress, saved stops, settings | Supabase tables | Follow the walker to a new phone |
| Voice choice | Phone only | Voices differ between devices |
| Location | Phone only | Privacy; the arrival logic runs on the device |
| Purchases | Apple and Google, checked through RevenueCat | The stores own payments; we never touch card data |

## What Apple and Google hold, and what we hold
| Held by Apple or Google | Held by us (Supabase) |
| --- | --- |
| Apple ID or Google account, payment card, billing address | Account: name (optional), email (or Apple's private relay address if the walker hides it) |
| Purchase receipts, subscription status, renewals, refunds | Walk progress, saved stops, app settings |
| "Restore purchases" (we ask the store; RevenueCat confirms) | Nothing about payments except the RevenueCat entitlement check |
| Phone backup of on-device data | |

We store no addresses, phone numbers, birthdates, or payment details.

## Data minimization: what we ask for
- **Rule:** Apple: "Apps should only request access to data relevant to the core functionality of the app and should only collect and use data that is required to accomplish the relevant task." Reviewers reject sign-up forms that require fields such as city, state, or birthdate when the app doesn't need them.
- **Our choice:**
  - Sign-in collects only what Apple or Google provides: a name and email, and the walker can hide their email with Apple.
  - The profile has one optional field, the display name.
  - There are no address or demographic fields. If a later feature truly needs more, such as a mailing address for a printed book order, ask for it at that moment, for that purpose only.
- **Permissions in context:**
  - Location is requested when the walker starts a walk, not at launch.
  - The camera is requested when they open "What am I looking at?".
- **Saying "stored securely":** accurate here. Supabase states all customer data is encrypted at rest with AES-256 and in transit with TLS. Row Level Security limits each person to their own rows.
- Sources: conductatlas.com (Apple guideline excerpt, data minimization); ptkd.com/journal/guideline-5-1-1-data-collection-and-storage-fix; supabase.com/security; developer.apple.com/videos/play/tech-talks/110352

## Payments: in-app purchase through RevenueCat
- **Common practice:** digital content must use Apple In-App Purchase and Google Play Billing. Many tour apps preview a few stops free and charge for the rest, sold per tour, as a bundle, or by subscription.
- **Our choice (updated 2026-11-15):** no free trial. The free part of Walk IV (stops 1 to 5) is the trial, because a vacation-length trial would let most visitors finish without paying.
  - Two purchases:
    - **7-day pass, $9.99:** a non-renewing subscription that never charges again.
    - **Yours forever, $34.99:** a non-consumable.
  - Locked stops show their first photo and opening lines, with one-tap unlock.
- **Market check, Nov 2026:**
  - Single Waikīkī walking tours sell for $4.99 to $9.99 (VoiceMap, Shaka Guide).
  - VoiceMap city passes: 3 tours for 14 days at $24.99, 5 tours for 30 days at $34.99.
  - Shaka Guide's Oahu bundle is $29.99, and its Hawaiʻi collection $79.99.
  - Monthly and yearly subscriptions fit locals more than visitors; they can be added later.
- **How it works technically:**
  - Apple sends no expiry date for non-renewing purchases, so the app computes the pass end from the purchase date.
  - The forever unlock grants the `all_walks` entitlement in RevenueCat.
  - Holiday specials use App Store price schedules or offer codes, with no app update needed.
- Sources: voicemap.me/tour/honolulu-hawaii (tour prices); voicemap.me/passes; shakaguide.com (tour and bundle prices); community.revenuecat.com (non-renewing subscriptions need client-side expiry).
- Sources: smartguide.app/museums (first stops free, rest paid); apps.apple.com/app/id1457662600 (WalknTours annual subscription); support.voicemap.me/what-am-i-paying-for

## Arrival detection
- **Common practice:** GPS-triggered narration as the walker approaches each stop, maps that work offline, and directions to the starting point.
- **Our choice:** three layers.
  - A foreground GPS watch at the walker's chosen radius.
  - Background geofences of at least 100 m around the next 18 stops (iOS allows 20 monitored regions).
  - An "I'm here" button.
- Sources: actiontourguide.com comparison; shakaguide.com/how-it-works; voicemap.me/walking-tour-app

## Narration
- **Common practice:** professional recorded audio. Reviewers complain about robotic voices in apps that use text-to-speech.
- **Our choice for now:** the phone's own voices (Siri on iPhone, Google on Android), with a voice picker and a tip on downloading Enhanced voices. Recorded audio can replace it per stop later.
- Source: appshunter.io/ios/topics/walking-tour (complaints about robotic audio)

## Resuming walks
- **Common practice and complaint:** reviewers of top apps report difficulty resuming tours after pausing, and confusing navigation.
- **Our choice:** progress saves automatically; a persistent "walk in progress" bar appears on every screen, with a Lock Screen Live Activity on iPhone.
- Source: appshunter.io/ios/topics/nyc-walking-tour-app

## Content pipeline
- The book is the source of truth. Text and photos are extracted from the PDFs by `scripts/extract/`, then turned into app data by `scripts/build_data.py`. Pins come from OpenStreetMap, each with a confidence level. Uncertain pins are marked "estimated" and listed in `review/stops_review.csv` for checking on the ground.

## Rights and legal
- See `legal/CHECKLIST.md`. Publisher permission from Island Heritage is required before launch.

## Asking for location permission (2026-11-19)
- **How it is normally done:**
  - Apple (HIG, Privacy): ask only when a feature needs it, and if more explanation is needed, show one custom screen before the system alert with a single button titled "Continue" or "Next". No Cancel or Close: "don't provide a way for people to leave the screen or window without viewing the system alert." An app was rejected under guideline 5.1.1(iv) for a "Not Now" button on such a screen.
  - Google Play (User Data policy): an app using background location must show a prominent in-app disclosure before the runtime prompt that says location is used "even when the app is closed or not in use", lists the features, and says how the data is used. The walker may dismiss it; the system prompt is the consent.
  - Android developers: request background location separately, after foreground location. On Android 11 and later there is no "Allow all the time" button in the dialog; the walker must pick it on a settings page, so explain the option label first.
  - Tour apps: Shaka Guide's top support article is "app is stuck at Allow Location Services"; it asks walkers to set "Always" or "All the time" in Settings. VoiceMap tells walkers location "isn't stored or shared" and stays on the device.
- **What we chose:**
  - A one-time LocationPrimer screen on the first walk start (only when the phone has never been asked), with one Continue button, the Google disclosure wording, the features (map position, distance, arrival alerts), and our data practice (used on the phone, not stored or shared). On Android it names "Allow all the time".
  - Our walk never gets stuck: if location is refused, the walker uses Next. The walk screen offers "turn on location", which asks again or opens Settings, and tracking starts by itself when they return from Settings.
  - Location is still requested at walk start, not at launch or during onboarding.
- **Why:** three unexplained prompts in a row at walk start invite "Don't Allow", and background location without the disclosure is a common Google Play rejection.
- **Still open:** background location and notifications are still asked right after foreground location in one sequence (src/lib/tracking.ts requestPermissions, also changed by PR #14). A later step could ask for them only when the walker has arrival alerts on.
- Sources: developer.apple.com/design/human-interface-guidelines/privacy; developer.apple.com/forums/thread/817672; support.google.com/googleplay/android-developer/answer/9799150; developer.android.com/develop/sensors-and-location/location/permissions/background; shakaguide.com/article/planyourtrip/enable-location-services-shaka-guide-tour; support.voicemap.me/how-does-voicemap-use-my-location
