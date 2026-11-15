# Rights and legal checklist (draft, not legal advice)

Have a lawyer review before launch. Status: [ ] open, [x] done.

## Rights to the content
- [ ] **Written permission from Island Heritage.** The book's copyright page reads "©2023 Island Heritage. All rights reserved. No portion of this book may be reproduced ... without prior written permission from Island Heritage." Veneeta's publishing contract decides who holds digital and app rights; read it first, then request a license (draft: permission-request-island-heritage.md).
- [ ] **Photographs.** Contributing photographers Merina Vo and Joel Bradshaw and cover artist Cameron Brooks may hold their own copyrights. Get written permission for app use, or replace those images.
- [ ] **Historic photographs.** Several captions credit the Hawaiʻi State Archives. Confirm each image's terms of use and keep the credit in the caption.
- [ ] **App copyright line.** Shown as "© 2026 Veneeta Acson" for the app itself; book text and photographs keep the Island Heritage notice.
- [ ] Decide who owns the app and sells it: Veneeta personally, an LLC, or Streicher Neurology LLC. The App Store "seller" name comes from the developer account.

## Attributions already shown in the app (Credits screen)
- [x] Author: Veneeta Acson, Ph.D.; dedication: For Alice and Ezra
- [x] Book: © 2023 Island Heritage
- [x] Photo credits and Hawaiʻi State Archives
- [x] Map data © OpenStreetMap contributors (ODbL)
- [x] Fonts: Libre Caslon Text and Nunito (SIL Open Font License)

## App Store and Google Play
- [ ] Privacy policy at a public URL, linked in App Store Connect and inside the app (draft: PRIVACY.md). Replace the placeholder links in src/legal.ts.
- [ ] Terms of use (draft: TERMS.md), or rely on Apple's standard EULA.
- [x] In-app account deletion (Settings > Delete my account). Deploy server/delete-account.ts. For Sign in with Apple, the deletion should also revoke the Apple token.
- [ ] Google Play also expects a web page where people can request account deletion.
- [x] Sign in with Apple offered alongside Google sign-in (Guideline 4.8).
- [x] Guest access, so registration isn't forced (Guideline 5.1.1).
- [x] Restore Purchases button and auto-renewal wording on the paywall.
- [ ] App Privacy "nutrition label" answers in App Store Connect: email and name (account), purchase history (RevenueCat), coarse diagnostics. Location stays on the device.
- [ ] Location permission wording reviewed (in app.json).

## Name and brand
- [ ] Quick trademark search for the app name before printing anything.
