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

## 2026-11-18 · Camera: "What am I looking at?"
- **How it is normally done:**
  - Apple: "Request permission only when your app clearly needs access", "ideally, wait to request permission until people actually use an app feature that requires access", and "Request access only to data that you actually need." A custom screen before the system alert may have only one button, titled like "Continue", never "Allow", and no way to leave without seeing the alert.
  - Android: "Ask for a permission in context." If someone says no, "Minimize functionality loss", "Be specific. Don't display a generic message", "Don't block the user interface", and accept their choice without pressure. After a second "Deny" the system stops showing the prompt.
  - Phone compasses report their own calibration. Expo's `watchHeadingAsync` gives 0 to 3 (on iOS 1 means up to 50 degrees of uncertainty). Google Maps shows a wider beam when the compass is off and tells people to move the phone in a figure 8. Phone compasses wobble by several degrees and get worse near strong magnetic fields (PeakVisor).
  - Expo Camera: `skipProcessing: true` skips the whole pipeline, so `quality` is ignored and the photo can arrive sideways. The camera config plugin adds the microphone permission unless told not to.
- **What we chose:**
  - Ask for the camera, then location, right after the walker taps "What am I looking at?". No pre-alert screen: the tap is the context, and the purpose strings say why. The old "Allow camera / Not now" screen used the word Apple says to avoid.
  - Camera refused: the screen still works from location and compass, says so in one line, and offers a quiet link to turn the camera on (Settings once the system stops asking).
  - Location refused: say exactly what does not work and offer "Try again" or "Open Settings". Before, the screen said "Finding your location..." forever.
  - Smooth the compass on the circle and re-rank only after a 3 degree change, so the answer holds still. When the compass reports low calibration, show the figure 8 tip.
  - Be honest about matches. Without the photo service, or when the photo check fails or is unsure, the card says "Probably in view", never "You are looking at". The server and the app both accept only a stop id from the candidates sent.
  - Photo minimization: one small upright JPEG (quality 0.4, no EXIF, so no GPS tags), deleted from the phone right after the check, 12 second timeout. The server refuses anything over about 1.5 MB or more than 5 candidates before calling the paid vision API.
  - Removed the microphone permission (iOS and Android) and the unused barcode scanner from the camera plugin, since we never record video or scan codes.
  - Screen reader: the result card, read-aloud button, and photo button have spoken labels, and changes to the best guess are announced.
- **Still open:** the lens Edge Function is deployed with `--no-verify-jwt`, so anyone with the URL can call it. Supabase's default is `verify_jwt = true`; with the new publishable keys the function should check the caller itself (`withSupabase({ auth: 'publishable' })`). Do this before the photo service is switched on.
- Sources: developer.apple.com/design/human-interface-guidelines/privacy; developer.android.com/training/permissions/requesting; expo-location 58 types (LocationHeadingObject.accuracy); expo-camera 58 types (CameraPictureOptions.skipProcessing); notebookcheck.net/Google-Maps-will-show-if-your-compass-is-uncalibrated-on-Android.177474.0.html; peakvisor.com/en/news/most-precise-compass.html; supabase.com/docs/guides/functions/auth

## 2026-11-21 · Security: database rules and limits on paid services
- **How it is normally done:**
  - Supabase: "Always add 'authenticated' to the approved roles instead of nothing or public" in each policy, and never rely on `auth.uid()` alone to keep the anon role out (RLS Performance and Best Practices).
  - Supabase: "RLS doesn't apply to functions, so grant `execute` only to the roles that need to call them. Review every `security definer` function carefully" (Securing your API). The advisors flag a mutable search path (lint 0011) and security definer functions callable by anon or authenticated (lints 0028, 0029). Fix: `set search_path = ''`, schema-qualified names, revoke execute.
  - Supabase's rate-limiting guide limits Edge Functions per user ID from Supabase Auth (its example uses Upstash Redis). Its API guide rate-limits per IP from `x-forwarded-for`, with counts in a private table.
  - OWASP API Security Top 10 (API4:2023, Unrestricted Resource Consumption): set spending limits and rate limits on any endpoint that calls a paid third-party service.
- **What we chose:**
  - All three policies name `to authenticated`; anon has no table grants.
  - `handle_new_user` uses `search_path = ''`, trims the name to 80 characters, and can't be called through the API.
  - CHECK constraints on every column the phone writes (added NOT VALID so they never block on old rows).
  - The lens function counts each photo check in `private.lens_usage` through `public.lens_take`, which only the service-role key inside the function can call. Caps per day (Hawaii time): 60 per signed-in walker, 40 per guest network, 1,500 overall, all adjustable with function secrets without a new app release.
  - Postgres instead of Upstash: no new vendor or account, and one count per photo is light work.
  - Guests are not forced to sign in (Apple: don't require an account for features that don't need one). Their network address is hashed with a secret and the date, so the stored key can't be traced back and changes daily.
  - When the counter can't be reached, the function refuses instead of spending, and the app falls back to location and compass.
- **For Nick, in dashboards (not code):** set a monthly spend limit for the Anthropic API key in the Anthropic Console, and in Supabase Auth turn on leaked password protection and CAPTCHA if email sign-up is used.
- Sources: supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv; supabase.com/docs/guides/api/securing-your-api; supabase.com/docs/guides/observability/advisors; supabase.com/docs/guides/functions/examples/rate-limiting; owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
## Checking pins against the author's maps (2026-11-21)
- **How it is normally done:** VoiceMap asks publishers to place each location "on the line" of the route, then test on the ground in at least two rounds, reporting each trigger that fires early or late ("moved ten metres forward"). Its smallest trigger radius is 21 m because of GPS bounce, and it warns that a stop can fail to play when the previous one runs into it.
- **What we chose:** an automatic check before anyone walks. `scripts/georef/audit_pins.py` draws every app pin back onto Veneeta's map with the app's own transform and compares it with the number she printed. It also checks the rule in reverse (every printed number has a stop), lists pins she asked to move with her reason, flags pins that share one spot, and lists long jumps between consecutive pins. It writes `docs/PIN_AUDIT.md`. Ground testing still follows for the stops it lists.
- **Why:** Nick's rule (17 Nov 2026) says a pin exists only where her map prints the number. Many hands touch the pipeline (map fits, overrides, cartographer's maps), so a repeatable check catches drift cheaply and gives Nick a short list to verify instead of 344 pins.
- Sources: https://docs.voicemap.me/tour-publishers/choosing-locations/ , https://docs.voicemap.me/tour-publishers/testing/ , https://docs.voicemap.me/tour-publishers/plotting-a-route/
## Background reading and Hawaiian pronunciation (21 Nov 2026)
- **Common practice:** tour apps keep orientation and background content out of the way of the tour itself, in a place people can open any time, rather than in a long first-run flow. Apple's onboarding guidance says to let people start quickly and find extra information later; Nielsen Norman Group says the same for mobile onboarding. Hawaiʻi visitor guides (for example the Hawaiʻi Tourism Authority's language page) give a short pronunciation guide covering vowels, the ʻokina and the kahakō, since visitors meet many place names.
- **Our choice:** the book's own front matter (Introduction, the pronunciation guide, the Monarchy table and dates, Wahi Pana) lives on the About screen, with a short contents list at the top that jumps to each part. The Hawaiian word card on each stop links to the pronunciation guide, so help is one tap away at the moment a walker meets a new word. Nothing is added that is not in the book.
- **Why:** the walks refer often to the monarchs, the ʻili and the streams the Introduction explains, and walkers see Hawaiian words on every stop. The book puts this material before Walk I for that reason.
- **Not done:** we did not change how read-aloud says Hawaiian words. Phone voices are English voices, and respelling words for them could not be checked by ear in this run.
- Sources: https://developer.apple.com/design/human-interface-guidelines/onboarding ; https://www.nngroup.com/articles/mobile-app-onboarding/ ; https://www.gohawaii.com/hawaiian-culture/hawaiian-language-guide

## Account deletion (added 2026-11-15)
- **Common practice:**
  - Apple: apps that create accounts must let people start deletion inside the app (Guideline 5.1.1(v)). Apps with Sign in with Apple must also revoke the walker's Apple tokens through the REST API (`/auth/token`, then `/auth/revoke`). If the tokens can't be revoked, the account must still be deleted, and the walker is told how to stop using Sign in with Apple by hand (TN3194).
  - Google Play: an easy-to-find in-app path, plus a public web page where people can ask for deletion without reinstalling. Associated data must be deleted, not just hidden, including data held by service providers.
  - RevenueCat: deleting the customer never cancels or refunds store purchases; log the SDK out so it does not recreate the customer.
- **Our choice:**
  - Settings > Delete my account. For Apple accounts the app asks the walker to confirm with Apple once more. That gives a fresh, single-use authorization code. The `delete-account` Edge Function exchanges it and revokes it, then deletes the user. We never store Apple tokens.
  - Google accounts: `GoogleSignin.revokeAccess()` on the device.
  - Profiles, progress, saved stops and settings are removed by `on delete cascade`. The old function deleted from a `progress` table that does not exist; that line is gone.
  - On-device progress is cleared and the walker is signed out. If Apple revocation failed, the app shows the manual steps from Apple's support page.
  - The app listens for Apple's "credential revoked" event and signs out, as TN3194 asks.
  - The dialog now says purchases stay with the Apple ID or Google account and come back with Restore purchases. The old text mentioned cancelling subscriptions, but the app sells none that renew.
  - Draft web deletion page in `legal/DELETE-ACCOUNT.md` for Google Play.
- **Why a fresh Apple code at deletion instead of storing refresh tokens at sign-in:** Supabase's native Apple sign-in (`signInWithIdToken`) does not keep Apple refresh tokens. Storing them ourselves would mean holding a long-lived credential for every walker just in case they delete. Asking once at deletion keeps nothing on our side and doubles as a check that the account owner is the one deleting.
- **Not done (open):** deleting the RevenueCat customer. It holds only the anonymous account ID and store receipts, and the 7-day pass expiry is computed from those receipts, so deleting it could cut short a pass someone already paid for. Revisit if a privacy review asks for it (needs a RevenueCat secret key on the server).
- Sources: developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple; developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens; support.apple.com/102571 (manual steps); support.google.com/googleplay/android-developer/answer/13327111; revenuecat.com/blog/engineering/app-store-account-deletion
## Offline behavior (added 2026-11-15)
- **Common practice:**
  - VoiceMap and Shaka Guide download the whole tour (text, audio, images, map, geodata) so it works "100% offline". Both tell walkers to download on hotel Wi-Fi and not to use Airplane mode, since on some phones it turns off GPS.
  - Google's offline design guidance: say clearly what works offline, keep content on the device, queue changes, and tell people when they are back online.
- **What was already true here:** all book text, photos, book maps, pins, and walk data are bundled inside the app. GPS and arrival geofences need no data. Only three things need the internet: street and satellite map tiles (Apple Maps or Google Maps), cloud sync, and the photo step of "What am I looking at?".
- **Our choice:**
  - Detect connectivity with `expo-network` (`useNetworkState`); unknown counts as online so we never warn by mistake.
  - On the walk screen, show a small notice that leads with what still works, not an error. It is announced once to screen readers.
  - Sync: Supabase returns failures as `{ error }` instead of throwing, so we now check them. A failed push is retried when the network comes back. If the first pull after sign-in fails, we don't push until a pull succeeds, so an offline start can't overwrite another phone's progress.
  - The camera feature sends no photo when offline and falls back to GPS and compass.
  - We dropped the "offline maps" promise. Apple MapKit and Google Maps SDK have no offline download API for apps. Using OpenStreetMap's tile server for offline is not allowed either: its policy forbids "download for offline" features and prefetching. True offline street maps would need a provider that allows it (for example self-hosted or paid vector tiles). That is a cost decision for later.
- **Not done:** an offline street map (see above), and a check that read-aloud voices are on the device on Android.
- Sources: support.voicemap.me/can-i-use-my-tour-offline; shakaguide.com/frequently-asked-questions; design.google/library/offline-design; docs.expo.dev/versions/v58.0.0/sdk/network; operations.osmfoundation.org/policies/tiles

## Accessibility basics (added 2026-11-15)
- **Common practice:** every control a screen reader can reach has a label, a role (button, switch, radio), and its state (on, off, selected). Touch targets are at least 44 by 44 points (Apple).
- **Our choice:** Settings switches carry their label and hint, rows are buttons at least 44 points tall, and voice choices are radios with a checked state. Changes in connection are announced with `AccessibilityInfo.announceForAccessibility`.
- **Still to audit:** the rest of the screens, Dynamic Type (the app has its own text-size setting but doesn't follow the system size yet), and Reduce Motion for the arrival banner and sheet.
- Sources: reactnative.dev/docs/accessibility; reactnative.dev/docs/accessibilityinfo
## Paywall clarity (2026-11-18)
- **Common practice:**
  - Apple: "Before asking a customer to subscribe, you should clearly describe what the user will get for the price" (guideline 3.1.2).
  - RevenueCat: show live store prices, state how long access lasts next to each price, describe concrete outcomes, keep a visible Restore button and in-app Terms and Privacy links, and make any "best value" claim accurate.
  - Tour apps answer "how long do I keep it?" up front. Shaka Guide: "a one-time purchase and not a subscription service", "it never expires". VoiceMap: "VoiceMap is not a subscription service."
  - Reviewer complaints in this category are about not knowing what you get ("leaves you wondering what exactly you're getting for $18", GPSmyCity) and purchases not being recognized.
- **What we chose:**
  - Say what is free before asking for money, generated from the product rules in config.ts so it cannot drift.
  - Each plan states its duration in the note; the fine print under the button names the one charge, the exact pass end, and "never renews".
  - Badge "NEVER EXPIRES" instead of "BEST VALUE", because it is a fact, not a judgment.
  - Week passes stack (a new one starts when the current one ends), so buying early never costs a walker days. The pass end is computed in the app because Apple sends no expiry for non-renewing purchases.
  - No "Manage subscription" button, since neither product renews. Pass holders are offered more days or the forever unlock.
  - Plans are a radio group for screen readers, with the badge hidden from them (the label already says it).
- **Why:** visitors decide in seconds on a sidewalk. Clear duration and "never renews" remove the main worry people have about tour apps, and it is what App Review checks.
- Sources: conductatlas.com/platform/apple/apple-app-store-review-guidelines/provision/CA-P-018923 (guideline 3.1.2 text); revenuecat.com/guides/revenuecat-replit/your-paywall-show-users-what-they-re-buying; shakaguide.com/article/app-faqs; support.voicemap.me/what-am-i-paying-for; appshunter.io/ios/app/417207307/reviews/7 (GPSmyCity reviews).
## Arrival alerts and the Live Activity (2026-11-18)
- **How it is normally done:**
  - Apple: a Live Activity is for a task with a clear start and end (under eight hours), shows only what people need at a glance, is updated only when content changes, and ends as soon as the task ends. "Don't use push notifications alongside Live Activities for the same updates" applies to remote pushes; tour apps still post a local alert on arrival because the phone is in a pocket.
  - Apple: avoid several notifications for the same thing; they fill Notification Center and people turn off all of an app's notifications. Keep content short and don't tell people what to do inside the app.
  - Android: since Android 8 every notification belongs to a channel the user can tune, and on Android 13+ the notification permission prompt appears only after the app creates a channel. Expo's guide creates the channel first, then asks.
  - Expo Router guide: handle a notification tap both with the listener and with `getLastNotificationResponse()`, so a tap that launches the app from closed still opens the right screen, then clear it.
  - GPS tour apps (VoiceMap, Action Tour Guide, Shaka Guide) trigger audio or an alert as you approach each stop, in order, with the phone in a pocket.
- **What we chose:**
  - One Live Activity per walk (no duplicates when the walk screen reopens), "You are at" vs "Next" wording, and updates only when the text changes.
  - The background geofence task now checks the same things as the walk screen: the walk is active, the stop is ahead and not yet reached, the stop is unlocked, and alerts are on. It waits for saved data to load first, since the OS can wake the app with nothing loaded.
  - A single notification identifier, so each arrival replaces the last; a per-walk thread identifier groups them; ending a walk clears it.
  - An Android "Arrival alerts" channel at high importance, created at startup and again just before asking permission.
  - A Settings note when notifications or background location are blocked, with a link to the phone's Settings, instead of failing silently.
- **Not done, and why:**
  - Time-sensitive notifications (break through Focus) need an Apple entitlement and a strong case; a walking tour does not need to break through Focus.
  - expo-live-activity 0.4.2 ends the activity with immediate dismissal and no stale date. Apple suggests a short custom dismissal (15 to 30 minutes) with a summary. That needs a library update or a config plugin; left for later.
- Sources: developer.apple.com/design/human-interface-guidelines/live-activities; developer.apple.com/design/human-interface-guidelines/notifications; docs.expo.dev/versions/latest/sdk/notifications (channels before the Android 13 prompt, getLastNotificationResponse with Expo Router); developer.android.com/about/versions/13/changes/notification-permission; apps.apple.com/us/app/id852027939 (VoiceMap: GPS-triggered audio with the phone in a pocket).
## Visual design: color contrast in light and dark mode (2026-11-18)
How it is normally done: Apple asks for about 4.5:1 contrast for text and 3:1 for icons and controls, checked in both light and dark mode, and for a dark interface to stay dark with no bright flashes. Material Design pairs every fill color with an "on" color (onPrimary, onSecondary) so text on a colored button is chosen per theme, usually dark text on the lighter fills used in dark mode. WCAG 1.4.3 (text, 4.5:1) and 1.4.11 (non-text, 3:1) are the shared yardstick.
What we chose: the theme now has "on" colors (accentText, accentTextMuted, leafText) and a goldInk for icons, plus danger and lockedFill. Dark mode uses dark text on pink and green, as it already did on teal. Light mode pink is a little deeper (#C2255C). Badges on walk colors pick white or ink with readableOn(). Photos and book maps set accessibilityIgnoresInvertColors so Smart Invert does not turn them into negatives. scripts/check_contrast.py reads src/theme.ts and fails if a pair drops below the minimum.
Why: in dark mode the most important buttons (unlock, keep reading, read aloud, continue walk) had white on light pink at 2.4:1, and gold icons in light mode were 2:1. Walkers read these outdoors in bright sun, where contrast matters most.
Left for Nick: walk colors IX, X and XI give 4.1 to 4.4:1 with their bold numbers. That passes for bold badges but not the 4.5:1 aim; changing a walk's color is a design choice.
Sources:
- Apple, Sufficient Contrast evaluation criteria: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/sufficient-contrast-evaluation-criteria
- Apple, Dark Interface evaluation criteria: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/dark-interface-evaluation-criteria
- W3C, Understanding SC 1.4.11 Non-text Contrast: https://w3c.github.io/wcag21/understanding/non-text-contrast
- Android Developers, Material 3 theming in Compose (color roles): https://developer.android.com/codelabs/jetpack-compose-theming
- React Native accessibilityIgnoresInvertColors (View accessibility props), checked in node_modules/react-native ViewAccessibility.d.ts
## Accessibility of the stop pages (2026-11-19)
- **How it is normally done:**
  - Apple asks for controls of at least 44 x 44 pt (28 pt minimum), about 12 pt of space around buttons, support for larger text (ideally up to 200 percent), a 17 pt default body size, information that does not rely on color alone, and VoiceOver labels for every control. Views that dismiss themselves on a timer are discouraged.
  - Google asks for touch targets of at least 48 x 48 dp, 8 dp apart.
  - React Native: mark section titles with the header role so screen readers can jump between them, label every pressable, use `accessibilityViewIsModal` so VoiceOver stays inside a popup, and give an "adjustable" control increment and decrement actions. Tappable words nested inside a paragraph are not reliably reachable with VoiceOver, so the usual fix is to also offer them as separate buttons.
- **What we chose:**
  - One heading per stop ("Stop 7, 'Iolani School"), header roles on taglines, book sub-headings and the Side trip box.
  - Walking directions read with a "Walking direction" prefix.
  - A visible "Hawaiian words on this stop" row of glossary buttons, in addition to the underlined words in the text. Words and meanings come only from the book's glossary.
  - Stop action buttons at least 44 pt with a small vertical hitSlop for 48 dp on Android; directions and pager buttons raised to 44 pt.
  - All stop text, including captions and info notes, follows the in-app Text size slider; the system text size also applies on top.
  - The read-aloud highlight adds a gold left bar so it is not color alone.
  - The stop panel handle answers VoiceOver swipe up and down; arrivals are announced with `AccessibilityInfo.announceForAccessibility`.
- **Why:** walkers read in bright sun, often with one hand, and some use larger text or a screen reader. These are the platform defaults, they cost no new data or permissions, and they help everyone, not only screen reader users.
- **Still to do:** test on a real iPhone with VoiceOver and Accessibility Inspector, and on Android with TalkBack and Accessibility Scanner; then fill in Apple's Accessibility Nutrition Labels in App Store Connect. Check Reduce Motion for the stop panel spring and the arrival banner.
- Sources: developer.apple.com/design/human-interface-guidelines/accessibility (control size, spacing, text size, color, timers, Accessibility Nutrition Labels); support.google.com/accessibility/android/answer/7101858 (48 dp targets, 8 dp apart); reactnative.dev/docs/accessibility (header role, labels, accessibilityViewIsModal, accessibility actions); codegenes.net/blog/how-can-i-make-a-link-in-a-nested-text-element-accessible-in-react-native (nested Text links and screen readers).

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
## 2026-11-19 · Privacy manifest and store privacy labels
- **How it is normally done:** since 1 May 2024 Apple refuses uploads whose privacy manifest (PrivacyInfo.xcprivacy) does not give a reason for each "required reason" API the app or its libraries call. The manifest also lists the data types the app collects and says whether it tracks. In Expo apps it is set in app.json under `expo.ios.privacyManifests`. Expo warns that CocoaPods does not always merge the libraries' own manifests, so the usual practice is to copy their reasons into app.json. Both stores also ask the developer to fill in a privacy form (App Store "App Privacy", Google Play "Data safety"). Both define "collect" as sending data off the phone; data used only on the phone does not count.
- **What we chose:**
  - app.json now declares `NSPrivacyTracking: false`, the required-reason APIs our libraries use (UserDefaults, file timestamps, system boot time, disk space, with the exact reason codes from their own manifests), and five collected data types: email, name, user ID, purchase history, and product interaction (walk progress and saved stops). All are linked to the account, none used for tracking.
  - Location is not declared as collected, because the arrival logic and map run on the phone and our code never sends a position to a server.
  - `scripts/privacy/check_manifest.py` compares app.json with every library manifest in node_modules and fails if a reason is missing. Run it after any library upgrade.
  - `docs/STORE_PRIVACY.md` holds ready answers for App Store Connect and the Play Console, with the reasoning for each line.
- **Why:** an incomplete manifest blocks the first upload, and the privacy label is the first thing many travelers see. Tour apps such as VoiceMap list precise location and an advertising identifier on their label; ours can honestly show less, which is a selling point for a book-based guide.
- **Open:** if the camera identification server is turned on, or a crash reporter or analytics tool is added, both the manifest and the store answers must change.
- Sources: developer.apple.com/support/app-privacy-on-the-app-store; developer.apple.com/documentation/bundleresources/privacy-manifest-files; developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api; docs.expo.dev/guides/apple-privacy; revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy; revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety; support.google.com/googleplay/android-developer/answer/10787469; apps.apple.com/us/app/voicemap-audio-tours-guides/id852027939
## Where walks start and end (text cleanup, 20 Nov 2026)
- **Common practice:** tour apps present each stop as a self-contained page: its name, its own text and its own photos, and nothing from the next tour. Apple's writing guidance asks for text that is clear and consistent across the app. Reviewers of large tour catalogues complain when a stop has no real information or the map doesn't match the text.
- **What we found:** the book PDF reads each walk's map page and title page before its title, so six walks ended with the next walk's opening text, four more with map labels, and Walk XII ended with the book's back matter.
- **Our choice:** fix it in the build, not by hand: scripts/extract/walk_ends.json records, for each walk, the first text that is not part of it and where the next walk's opening begins, checked against the book pages. Opening text moves to the next walk's introduction; title-page photos go to that walk's stop 1 with their captions. This carries over the approach of the unmerged branch improve/2026-11-17-0651 (PR #9), rebuilt on today's main.
- **Not done:** the book's own Hawaiian Glossary and Further Readings (back matter) are no longer in Walk XII. They could become an in-app glossary and reading list later, from the book.
- Sources: Apple Human Interface Guidelines, Writing (developer.apple.com/design/human-interface-guidelines/writing); GPSmyCity reviews (justuseapp.com/en/app/417207307/gpsmycity-walks-in-1k-cities/reviews); VoiceMap reviews (trustpilot.com/review/voicemap.me).


## Boxed plaques and quotations (text cleanup, 20 Nov 2026)
- **Common practice:** digital books treat a sidebar as secondary content placed between paragraphs, never inside one, and mark it so readers can follow the main text past it. The EPUB accessibility guidelines say readers should be able to follow "a logical path that excludes the secondary material and orders the primary", and that a sidebar "may be placed between two paragraphs". DAISY recommends marking each one as an aside with its own heading. React Native exposes headings to VoiceOver and TalkBack with accessibilityRole "header".
- **What we found:** the PDF gives each shaded box's text in the reading flow wherever its column breaks, after a hidden pin symbol and the background map label "‘Ena Rd.". Ten boxes landed inside other text, nine of them mid-sentence, six in the wrong stop.
- **Our choice:** a reviewed list (scripts/extract/box_fixes.json) rather than a guess: each entry names the box's last words, the page, and the paragraph it follows in the book. build_data.py rejoins the cut sentence and marks the box blocks box: true. The app and preview draw them in a framed card; a short first line ending in a colon is the card's heading. Narration still reads the box where it sits. A missing anchor or end text stops the build, so a later PDF change cannot silently misplace a box.
- **Not done:** other extraction slips found while auditing, for the next text pass: inline stop headings that lost their first words (Walk VIII stops 6, 7, 10, 21; Walk XII stops 5, 10), Walk XI stop 6's first sentence split in two, "Hawai‘ithe reason" in Walk IV stop 1, Walk IV stop 1's info box carrying map labels ("Parking Parking lot"), and doubled words ("of of", "the the").
- Sources: W3C/IDPF EPUB Accessibility Guidelines, Logical Reading Order (idpf.github.io/a11y-guidelines/content/semantics/order.html); DAISY Knowledge Base, Asides (kb.daisy.org/publishing/docs/html/asides.html); React Native Accessibility (reactnative.dev/docs/accessibility).


## Stop names, line-end hyphens and typos (text cleanup, 20 Nov 2026)
- **Common practice:** tour apps give every stop a short name that stands on its own in lists, maps and the Lock Screen, with the text below it. Apple's writing guidance asks for text that is clear and consistent. For PDF text, the standard step is "dehyphenation": rejoin a word split at a line end, but keep the hyphen when it belongs to the word. Research tools decide this by checking whether the hyphenated form is used elsewhere in a body of text; plain extractors (pypdf, Poppler) leave it to post-processing, which is how our "(18901968)" and "wellknown" got through.
- **What we found:** twelve stops whose name the book prints in bold at the start of the first sentence ("6 Da ‘Ono Hawaiian food on the ‘Ewa side of Kapahulu ...") had the whole first line as their name and text starting mid-sentence. 38 hyphens were lost at line ends, including 13 life dates. Four doubled words or periods are in the printed book itself.
- **Our choice:** use the book as its own dictionary. scripts/extract/line_hyphens.py keeps a line-end hyphen when both sides are digits, when a capital follows it, or when the book prints the same hyphenated word mid-line elsewhere; a short reviewed list adds or skips the rest (for example "nearby" stays one word). Run-in names go in heading_fixes.json as title plus first_prefix, so the name is the bold words and the sentence keeps them. Typos and slips go in a new text_fixes.json with the page; a fix that no longer matches stops the build. The four book typos are also listed in docs/BOOK_UPDATES.md for the next printing.
- **Not done:** Walk IV stop 1's info box and the walk info boxes still read as one run-on line (labels like "Parking:" are not set apart). That is a layout change for a later pass.
- Sources: Apple Human Interface Guidelines, Writing (developer.apple.com/design/human-interface-guidelines/writing); pypdf, Post-Processing in Text Extraction (pypdf.readthedocs.io/en/4.0.1/user/post-processing-in-text-extraction.html); M. Hernaes, Improved Dehyphenation of Line Breaks for PDF Text Extraction, University of Freiburg, 2019 (ad-publications.informatik.uni-freiburg.de/theses/Bachelor_Mari_Hernaes_2019.pdf); GPSmyCity reviews (justuseapp.com/en/app/417207307/gpsmycity-walks-in-1k-cities/reviews).


## Walk information boxes (text cleanup and layout, 21 Nov 2026)
- **Common practice:** practical details (how long, how to get there, where to park, opening hours) are shown as short, separate, labeled items, each with an icon, so a walker can scan them; Nielsen Norman Group's reading studies found that people scan rather than read, and that lists and highlighted keywords make text far easier to use. Phone numbers and web addresses are links: Apple's phone links use the tel: scheme, and React Native's Linking opens both. WCAG 2.2 exempts links inside a sentence from the 24 px target size rule, so inline links are acceptable.
- **What we found:** the parser joined each box into one line ("... steps Parking: Parking lot ... Bus routes and times ..."), and for Walks I and IV filed the box inside stop 1, so their walk pages had no box. Walk III's time chip had been typed as "1.5 to 2 hr"; the book prints 0.5.
- **Our choice:** read the boxes straight from the PDF with their paragraph breaks (scripts/extract/info_boxes.py), keep every word as printed, and only split off labels the book prints on their own line or before a colon. Each row gets a kind (time, route, bus, parking, web, contact) used only to pick its icon. Links are found in the text by pattern, so nothing is added that the book does not print.
- **Not done:** Walk X's box repeats Walk I's word for word, and Walk III's says "Lewers Street & Road"; both are questions for Veneeta (docs/BOOK_UPDATES.md). Bus, phone and parking details may have changed since printing; the TheBus number was checked 19 Nov 2026, the others were not.
- Sources: Nielsen Norman Group, How Users Read on the Web (nngroup.com/articles/how-users-read-on-the-web, alertbox 9710a) and Concise, Scannable, and Objective (nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web); Apple, Phone Links (developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/PhoneLinks/PhoneLinks.html); React Native, Linking (reactnative.dev/docs/linking); W3C, Understanding SC 2.5.8 Target Size (Minimum) (w3.org/WAI/WCAG22/Understanding/target-size-minimum); Apple Human Interface Guidelines, Writing (developer.apple.com/design/human-interface-guidelines/writing).

## Welcome screens (onboarding, 22 Nov 2026)
- **Common practice:** Apple's HIG says people "want to start using your app or game immediately", asks for "a brief, enjoyable experience", and says to make onboarding optional and ask for private data "when people first access the specific function". Nielsen Norman Group recommends against deck-of-cards onboarding; if used, "ensure there's a highly visible Skip option, minimize the number of cards". Its tutorial study (70 users) found tutorials did not make people faster or more successful. Tour apps such as Shaka Guide go straight to browsing tours, with no tour shown before buying beyond the listing.
- **What we chose:** keep the three short cards (they carry the author's name and dedication) but add a Skip button, state the free part (Walk IV stops 1 to 5, read from src/config.ts so it cannot drift from the paywall), and stop promising arrival detection without saying it needs location, which is asked at walk start (see "Asking for location permission"). The page indicator is one spoken element ("Page 1 of 3"), and Reduce Motion pages without sliding.
- **Why:** walkers often open the app standing at the start of a walk; Skip gets them there. Saying what is free up front answers the first question people ask of a paid app and matches the paywall. No new data is collected.
- Sources: https://developer.apple.com/design/human-interface-guidelines/onboarding ; https://www.nngroup.com/articles/mobile-app-onboarding/ ; https://www.nngroup.com/articles/mobile-tutorials/ ; https://shakaguide.freshdesk.com/support/solutions/articles/151000217331-shaka-guide-first-time-user-walkthrough

## Read-aloud voices without signal (24 Nov 2026)
- **How it is normally done:** VoiceMap and Shaka Guide ship recorded audio inside the downloaded tour, so narration never needs signal. Apps that use the phone's own voice depend on which voices are installed. On Android, the Google engine offers both installed voices and network voices; Android's Voice class has isNetworkConnectionRequired() for this, and Google's help page tells people to add voices under Settings › Accessibility › Text-to-speech output and Install voice data.
- **What we chose:** expo-speech passes only the voice name, quality and language, not isNetworkConnectionRequired(), so we read the name: Google's voice names end in "-local" or "-network". Network voices are listed after installed ones, marked "Needs internet", and when one is chosen and the phone is offline, the walk reads with the phone default instead. Raw Android names become "US English, voice IOL". iPhone voices are always on the device, so nothing changes there.
- **Why:** walkers lose signal on beaches and in valleys (Walk X), and a voice that silently stops reads as a broken app. This closes the "not done" note under Offline behavior (15 Nov).
- **Limits:** the name rule fits Google's engine; other engines (Samsung's, for example) may not use it, and then nothing is marked. A native check would need a small config plugin or a change to expo-speech.
- Sources: https://developer.android.com/reference/android/speech/tts/Voice (isNetworkConnectionRequired, getName); https://support.google.com/accessibility/android/answer/6006983 (Text-to-speech output, Install voice data); https://docs.expo.dev/versions/v58.0.0/sdk/speech/ (Voice fields); node_modules/expo-speech/android SpeechModule.kt (identifier = Voice.getName()); https://support.voicemap.me/can-i-use-my-tour-offline

