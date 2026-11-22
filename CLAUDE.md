# Waikīkī Walks: working notes for Claude

Follow AGENTS.md for Expo rules. Read docs/HANDOFF.md first: it is the shared notes between live sessions and the scheduled improvement runs. Project-specific rules:

- Source of truth for content is the book (book/*.pdf) by Veneeta Acson, Ph.D. Never invent historical facts, dates, or translations; app text must come from the book.
- Data pipeline: scripts/extract/* (PDF → geo.json) then `python3 -I scripts/build_data.py` → src/data/*. Never hand-edit src/data/images.ts.
- Every walk uses the cartographer's maps (book/cartographer/): run `python3 -I scripts/georef/carto_maps.py` before build.py.
- Map lines: her dotted line only, traced whole by carto_maps.py and cut into legs where each stop falls on it; never a route of our own (Nick and Veneeta, 22 Nov 2026). street_legs.py skips every walk on the cartographer's maps. Look-at stops (number printed off her line: no arrival alert, the walker taps Next) are listed in scripts/georef/look_stops.json, from Veneeta only. Book text changes and possibly dated statements are tracked in docs/BOOK_UPDATES.md.
- Product rules live in src/config.ts (free trial = Walk IV, stops 1 to 5).
- Web preview: edit preview/app.js and preview/template.html, build with `python3 -I preview/build_preview.py`, publish preview/site/ (all files) to artifact slug b70f1702-10ef-4fc9-8920-ef8e0c561f66 with mode "patch".
- Before any commit: `npx tsc --noEmit` must pass, and `npx expo export --platform ios --output-dir /tmp/x` must bundle.
- Writing style for summaries and UI copy: plain, concise, no em dashes.
- Improvement runs: never push to main. Work on a branch `improve/YYYY-MM-DD-HHMM`, open a pull request, record the change in CHANGELOG.md, and list research sources in the PR body.
