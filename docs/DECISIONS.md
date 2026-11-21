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
