# Feedback from Veneeta

Every comment from Veneeta Acson (acson99@gmail.com) about the app, so no comment is handled twice.
Status is one of: fixed (with PR), needs Nick's decision, needs checking on the ground, no action needed.

| Date | Her words (short quote) | Where | Status |
|---|---|---|---|
| 2026-11-15 | "thanks for all this work. It's wonderful!" (reply in "I can help with your computer later") | General | No action needed. Praise only; the rest of the message is about using the Walu Way computer, not the app. |
| 2026-11-16 | "Stop 1 is on the canal - there the walk starts." (email "corrections") | Walk I, stop 1 | No change needed. The pin already sits on the canal bank at the McCully Street bridge, where her map prints "Begin Walk I". |
| 2026-11-16 | "Stop 3 through 5 are on the canal" (email "corrections") | Walk I, stops 3, 4, 5 | Fixed in this PR. The pins sat inside Ala Wai Community Park, away from the water; they now sit on the canal-side walkway, 10 m from the water (scripts/georef/author_fixes.json). |
| 2026-11-16 | "Stops 7 to 11 leave the canal and go toward Date street" (email "corrections") | Walk I, stops 7 to 11 | Fixed in this PR for stops 7, 9 and 11, whose numbers her map prints away from the path (the school grounds, the far mountains, the middle of the golf course). Those pins now sit on her route between the stops before and after, marked "estimated". Stops 8, 10 and 12 were already on the route and are unchanged. Exact spots for 7, 9 and 11 need checking on the ground. |
| 2026-11-16 | "The maps needs the water ways overlays." (email "corrections") | All maps (raised on Walk I) | Fixed in the 2026-11-16 19:04 UTC PR (branch improve/2026-11-16-1904), pending Nick's approval. The street and satellite maps now show the waterways exactly as her book maps draw them: the canal and current streams in full color, and the pale streams and ponds as she prints them, pale. Lifted from her maps and laid on real streets (scripts/georef/waterways.py); on by default, with a "Waterways from the book" switch in the map style menu. 10 of the 11 maps have waterways; the Walk X map has none. Nick to confirm this is what she meant. |

Note on the 16 Nov "corrections" email: it was sent at 22:18 Hawaiʻi time on 15 Nov, one minute after the first pins from her own maps were committed, so she was almost certainly looking at the older place-name pins. In that version, stop 1 sat about 1 km mauka of the canal, stops 3 and 4 were on the Waikīkī side of the canal, and stops 7 to 12 were a straight-line guess. All three of her pin comments describe problems the book-map pins already fixed.

2026-11-17 run: no new mail from Veneeta since the 16 Nov runs. Her two threads ("corrections" and "I can help with your computer later") hold no new messages from her; every comment in them is logged above.
