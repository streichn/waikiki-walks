# Store privacy answers (draft for Nick)

Copy these answers into App Store Connect (App Privacy) and the Google Play Console (Data safety) when the app is first submitted. They describe what the code does today. If a feature changes what leaves the phone, update this file, `expo.ios.privacyManifests` in app.json, and legal/PRIVACY.md together.

## What leaves the phone today

| Data | Leaves the phone? | Where it goes | Why |
| --- | --- | --- | --- |
| Location | No | Stays on the phone | Map dot, distance, arrival alerts all run on the device |
| Email address | Only if the walker signs in | Supabase | Account and sync |
| Name | Only if the walker signs in or types a display name | Supabase | Shown on the profile |
| User ID | Only if the walker signs in | Supabase, RevenueCat | Links progress and purchases to the account |
| Purchase history | Yes, when buying or restoring | Apple or Google, then RevenueCat | Unlocks the walks; RevenueCat also uses it for its dashboard |
| Walk progress, saved stops, settings | Only if the walker signs in | Supabase | Follow the walker to a new phone |
| Camera photo | No, today. Only if `EXPO_PUBLIC_LENS_ENDPOINT` is set | Our identification server | "What am I looking at?" |

Guests (no sign-in) send only purchase data, and RevenueCat then sees an anonymous ID.

## App Store Connect: App Privacy

Apple: "'Collect' refers to transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time." Data processed only on the device is not collected.

- Do you or your third-party partners collect data from this app? **Yes**
- Tracking: **No** for every type. We have no ads, no advertising ID, no data brokers.

| Apple category | Data type | Linked to the user | Used for tracking | Purposes |
| --- | --- | --- | --- | --- |
| Contact Info | Email Address | Yes | No | App Functionality |
| Contact Info | Name | Yes | No | App Functionality |
| Identifiers | User ID | Yes | No | App Functionality |
| Purchases | Purchase History | Yes | No | App Functionality, Analytics (RevenueCat says to tick both) |
| Usage Data | Product Interaction (walk progress, saved stops) | Yes | No | App Functionality |

Not collected: Location, Photos or Videos (while the lens server is off), Health, Financial Info beyond purchases, Contacts, Browsing or Search History, Diagnostics, Device ID, Sensitive Info.

Expected result on the listing: "Data Linked to You: Contact Info, Identifiers, Purchases, Usage Data." No "Data Used to Track You."

For comparison, VoiceMap's listing shows Precise Location and Product Interaction linked to the user, and Identifiers used to track. Ours is smaller because location never leaves the phone and there is no advertising.

## Google Play Console: Data safety

Google: "'Collect' means transmitting data from your app off a user's device." Data "only processed locally on the user's device and not sent off device does not need to be disclosed." Supabase and RevenueCat process data on our behalf, so they are service providers, and that is not "sharing".

- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes** (Supabase, RevenueCat and Google Play all use HTTPS)
- Do you provide a way for users to request that their data is deleted? **Yes**: Settings > Delete my account, plus the contact email in the privacy policy

| Play category | Data type | Collected | Shared | Ephemeral | Required or optional | Purposes |
| --- | --- | --- | --- | --- | --- | --- |
| Personal info | Email address | Yes | No | No | Optional (guests skip sign-in) | App functionality, Account management |
| Personal info | Name | Yes | No | No | Optional | App functionality, Account management |
| Personal info | User IDs | Yes | No | No | Optional | App functionality, Account management |
| Financial info | Purchase history | Yes | No | No | Required | App functionality, Analytics |
| App activity | Other user-generated content or App interactions (walk progress, saved stops) | Yes | No | No | Optional | App functionality |

Location: **not collected** (on-device only). Google Play still asks a separate declaration for `ACCESS_BACKGROUND_LOCATION` under the Permissions policy; that is a different form from Data safety, with a short video of the arrival alert in use.

## If the camera identification server is turned on

The photo and a list of nearby stop names go to our server and to an AI provider for one request, and are not stored. Under both stores' rules that is processing for a real-time request:

- Apple: not "collected" if neither we nor the provider keep it beyond the request. Confirm the provider's retention terms before saying No.
- Google: declare Photos as collected, mark it "processed ephemerally", optional, App functionality.

If either side keeps photos, declare Photos as collected on both stores and add it to `NSPrivacyCollectedDataTypes` in app.json.

## Sources
- Apple, App privacy details: https://developer.apple.com/support/app-privacy-on-the-app-store
- Apple, Privacy manifest files: https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
- Expo, Privacy manifests: https://docs.expo.dev/guides/apple-privacy/
- RevenueCat, Apple App Privacy: https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy
- RevenueCat, Google Play Data safety: https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety
- Google Play, Data safety section: https://support.google.com/googleplay/android-developer/answer/10787469
- VoiceMap App Store listing (App Privacy): https://apps.apple.com/us/app/voicemap-audio-tours-guides/id852027939
