# Handoff: live sessions and improvement runs

Shared notes between Nick's live Claude sessions and the scheduled improvement runs. Read this first, every run. Newest first. Keep entries short.

## Rules for improvement runs
- Build on the latest main. Live sessions commit straight to main, often several times a day: read `git log -20 main` and CHANGELOG.md before choosing work, and never redo something already on main.
- If one of your earlier pull requests is now replaced by work on main, close it with a one-line note saying what replaced it. Keep at most three of your own pull requests open; if more are open, tidy them (rebase, merge-ready, or close) instead of starting new work.
- Veneeta's email is handled by the live session when Nick is around. Before fixing one of her comments, check docs/FEEDBACK.md and main: if it is already marked fixed, skip it.
- Questions for Nick go in "Questions for Nick" below and in the push notification, first sentence.
- Never run SQL against the live database or deploy functions; list what Nick must run in the pull request.

## Current state (21 Nov 2026, live session)
- Maps: every walk uses the cartographer's vector maps (book/cartographer/, scripts/georef/carto_maps.py). Pins sit on his printed numbers, with author moves in pin_overrides.json. The route is her dotted line (yellow dots on both maps); the walked part fills in see-through blue, live along the current leg. Stop pins on the street map: blue, red for the current stop, purple for side trips.
- Before unlocking: no book maps; the street map shows only the stops you can open (Walk IV stops 1 to 5, or a locked walk's first stop).
- Reading: Read / Pause / Resume button above the stop text; Audio mode (read on arrival) beside Next stop.
- All open pull requests up to #28 were merged or closed on 21 Nov 2026.
- Waiting on Nick: run server/003_security_and_limits.sql, redeploy the lens and delete-account functions, set an Anthropic Console spend limit.
- Waiting on Veneeta: twelve possible book typos (docs/BOOK_UPDATES.md), five possibly dated places, permission to use Jason Nakano's map files, the red note near Walk XI stop 6.

## Decisions from Nick (22 Nov 2026)

- Reduce Motion (PR #29): leave it out for now. Only the "Did you know?" card change went in. Don't re-propose the map, sheet or banner motion changes unless Nick asks.
- Welcome screens (PR #30): merged.
- Camera "What am I looking at?": shows Coming soon until the lens endpoint is deployed (LENS_LIVE in src/config.ts).

## Map lines and look-at stops (Nick and Veneeta by phone, 22 Nov 2026)

- The route is her dotted line, exactly. Never draw or route a path of our own, and never jog the line out to a pin.
- Some numbers sit off her line (Walk III: 2, 5, 6, 8, from Veneeta). The walker looks at them from the line; there is no arrival alert, and the walker taps Next. At Nick's request, Claude applied the same rule to every walk (75 stops in scripts/georef/look_stops.json, each with its reason); they are going to Veneeta to confirm. Change that list only with Nick's or Veneeta's word.
- The book text's bold "Walk ..." directions say where to go; when the line and the text disagree, ask Veneeta.

## 2026-11-26 · Scheduled run
- Her 25 Nov 21:23Z reply did answer the look-at list (the live session read it as blank): Walk I has only stop 9; the other walks she will review herself. Walk I is applied in PR improve/2026-11-26-1430. Re-check: Walk III, new III-d and III-e.

## 2026-11-25 · Live session (evening)
- Veneeta answered part of the go / no-go list by email (reply in "Delete this in Walk III", 21:23Z and 22:16Z). Her written answers are applied in TEXT_FIXES (scripts/build_data.py); IDs and wording in docs/BOOK_UPDATES.md and docs/MOM_REVIEW.md. A fix may now empty a paragraph or start a new one with a blank line.
- Left blank by her, so still waiting: I-12, I-27, I-28, I-5, IV-a (Ho‘okela, IV-23 and V-19), IV-b, IV-c, VII-a, VII-b, VII-d, VII-f, VII-g, VIII-a, IX-a, X-a to X-f, XII-a, and the look-at stops on other walks (she marked none; not treated as agreement).
- Reading layout (margins, line spacing, smaller text) is in PR #34.

## Questions for Nick
- Look-at stops on Walks II and IV to XII: Veneeta wrote on 25 Nov that most of Claude's picks are different from Walk III and she will review each walk herself. Keep them as they are until she does, or turn them back into normal arrival stops now? (asked 26 Nov)

## 2026-11-22 · Scheduled run, 13:00Z
- No new app comments from Veneeta. PR #29 (Reduce Motion) is open; this run worked on the welcome screens instead (Skip, what is free, honest arrival copy). It uses Reanimated's useReducedMotion, so it does not depend on #29.
