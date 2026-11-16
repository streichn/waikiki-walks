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

## Author corrections to pins (16 Nov 2026)
- **Common practice:** tour publishers place each trigger point on the walking route, positioned to suit the point of interest rather than on top of it. VoiceMap's publisher guide: "Make sure that you place it on the line" and "You don't need listeners to be on top of a location" (a distant mountain is their example).
- **Our choice:**
  - Pins still come from where Veneeta's map prints each number.
  - When she corrects a pin, the correction goes in scripts/georef/author_fixes.json with her words, and build.py applies it. Nothing is hand-edited in src/data.
  - "on: canal" moves the pin to the bank walkway, 10 m from the Ala Wai's edge (water from the bundled OpenStreetMap tiles, streams under about 20 m wide ignored).
  - "on: route" is for stops whose numbers she prints as labels away from the path (a school's grounds, the mountains, the golf course). The pin goes on her red route halfway between the stops before and after. These pins are marked "estimated" with a 50 m arrival circle until checked on the ground.
- **Why:** a pin off the route never triggers, so the walker misses the stop. Her email confirms the stops are read from the canal path and on the way to Date Street.
- Sources: docs.voicemap.me/tour-publishers/choosing-locations/ (markers on the route line; listeners need not stand on the location).

## Walks that run onto a second map page (16 Nov 2026)
- **How it is normally done:** a scanned map is tied to real coordinates with ground control points, and the fit is checked by its residual error. QGIS asks for at least four points and says more is better; it recommends thin plate spline only for poor originals, because it bends the map locally. Tour publishers then put each trigger on the walking line (VoiceMap's publisher guide).
- **What we chose:**
  - Each extra map page is listed in scripts/georef/pages.json and fitted exactly like the first map: labeled street crossings in controls.json, refined against named streets in roads.py, numbers in map_stops.json. A stop already placed from the first map keeps that pin.
  - Walk X's continuation map (book page 155) is used: 9 crossings, 9 m RMS, 89 percent of road points on her streets. Two crossings on Lowrey Avenue fixed a skew that three central crossings alone left in place (RMS dropped from 19 m to 9 m).
  - Walk X's upper-valley page is not used. Its three usable crossings imply scales that disagree by almost two to one, so street-level positions from it would be wrong. Stops 41 and 43 use their named places from OpenStreetMap instead; 40 and 42 stay "estimated" between them.
  - Pins read off her maps are exempt from the "more than 1800 m from the walk's centre" check, which was meant for stray place-name matches. Named places the book really sends the walk to are listed, with the book's words, in scripts/extract/far_stops.json.
  - Stops the book numbers without a bold heading (Walk X 28 and 30) are restored with the book's own opening words as the title, rather than a title we write.
- **Why:** Walk X is the longest walk (52 stops, McCully Street to Lyon Arboretum). Before this, 22 of its stops were straight-line guesses, so arrival alerts could not fire there.
- **Still open:** Walk X stops 7 to 29 are not on any map (Punahou and College Hills); they remain estimates between known pins. The book's Walk XI map (part 3, page 37) exists and covers stops 1 to 6, but is not yet fitted.
- Sources: docs.qgis.org/3.4/en/docs/user_manual/working_with_raster/georeferencer.html (GCP count, transformation choice, residuals); docs.voicemap.me/tour-publishers/choosing-locations/ (triggers on the route line).

## Waterways layer on the street map (16 Nov 2026)
- **Asked for by:** Veneeta, 16 Nov: "The maps needs the water ways overlays." Walk I is about the three streams that once crossed Waikīkī, but the phone's street map shows only the Ala Wai Canal and none of the streams.
- **How it is normally done:** apps add their own data to a system map as overlays. Apple's guidelines say to "use overlays to define map areas with a specific relationship to your content", placed above roads by default so people still see what is underneath. Tour apps keep the map simple and let people switch views (VoiceMap's offline maps show the route and pins only). react-native-maps provides an `Overlay` component that lays a bundled image over given corners, on both Apple and Google maps.
- **What we chose:**
  - The waterways come from her own maps, not from OpenStreetMap. Her maps show the streams the book talks about, including pale ones that no longer run on the surface; OpenStreetMap has only part of them, and the book is the source of truth.
  - scripts/georef/waterways.py matches each pixel of her map to her palette, keeps the waterway ink (full strength) and the pale stream tint (printed at about 40 percent), drops text, roads, grass and the route, and warps the result onto real coordinates with the same fit used for her pins. Output: one transparent PNG per walk (6 to 104 KB, about 430 KB in all) in assets/waterways/, bundled in the app so it works offline.
  - Drawn under the route and pins, never fully opaque, in one teal that reads on street, satellite, light and dark maps.
  - On by default, with a "Waterways from the book" switch in the map style menu. The choice is saved with the other settings and syncs for signed-in walkers.
  - The same layer is in the web preview.
- **Why:** it answers her request with her own drawing, keeps the street map usable, and costs nothing at run time.
- **Limits:** the canal is drawn a little wider than it really is, because her map exaggerates it; the overlay follows the map fit (9 to 30 m typical error). Labels printed inside the canal ("Ala Wai Canal") show as small gaps.
- Sources: developer.apple.com/design/human-interface-guidelines/maps (overlays, above-roads level); react-native-maps 1.29 Overlay type definitions in node_modules/react-native-maps/dist/src/MapOverlay.d.ts (image and corner bounds; opacity works only with Google Maps on iOS, so transparency is baked into the PNG); blog.voicemap.me/?p=1629 (VoiceMap maps: route line and pins, offline).
