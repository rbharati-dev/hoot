# Hoot

**Live app: https://project-b9f72b7f-699d-46ed-aec.web.app**

See the world you grew up in. A calm, large-text web app for older adults: enter a birth year and country, get one memory at a time from ages 5–25, plus daily puzzles.

Full product plan: [PLAN.md](PLAN.md).

## What's in Phase 1 so far

- Onboarding: birth year + country (two questions), in English, Русский, Français, Deutsch, Italiano, Português or Español
- Memory feed: one card at a time, Next / Back / Save / Share / Not for me, jump to a year, arrow keys
- Real sources: every card links to Wikipedia; photos load live from Wikimedia Commons (free licences only)
- Saved memories, settings (text size, dark mode, language, interests, hide hard history)
- Profile-in-the-link sharing for family (`/?born=1962&c=su&lang=ru`) and single-memory links
- Games: memory quiz built from the person's own feed, daily crossword with era clues, word search, sudoku (easy / medium / hard)
- No accounts, no server, no live AI. Everything personal stays in the browser.

Content: hand-written memories for 12 countries, plus, for Canada, the USA and Mexico, a live stream of hundreds of memories per year read straight from Wikipedia in the visitor's browser (that year's events and sport, the Billboard and Canadian #1 charts, TV debuts and top films). Songs with a known video play inside the card.

Hand-written content so far: 334 memories across 12 countries (Canada, USA, Mexico, UK, USSR, France, West Germany, East Germany, Italy, Brazil, Argentina, Colombia), 1944–1989. Each country's memories are also written in its own language (USSR in Russian, Brazil in Portuguese, and so on); the reader sees their chosen language when available, otherwise English.

## Deploying

Every push to `main` is tested first (29 unit tests plus browser tests that click through sign-up, the feed, every game, settings and the crash screen). Only if all tests pass is it built and published to Firebase Hosting automatically by GitHub Actions (`.github/workflows/firebase-hosting-merge.yml`). It uses the `FIREBASE_TOKEN` repository secret, created once with `firebase login:ci` and pasted into GitHub → Settings → Secrets and variables → Actions.

## Run it locally

```
npm install
npm run dev        # local preview at http://localhost:5173
npm run build      # builds content + app into dist/
npm test           # unit tests (games, feed helpers, every memory file)
npm run test:e2e   # browser tests against the built site (run `npx playwright install chromium` once first)
```

## Adding memories

1. Edit or add `scripts/seed/<country-code>.json` (fields: id, year, type, title, text, wiki, optional listen, heavy, tags, and `t` for translations: `{"ru": {"title": "...", "text": "..."}}`).
2. Run `npm run content`. It validates the cards and writes `public/content/<country>/<year>.json`.
3. Countries appear as available automatically once they have content.

Card text should be written only from the linked Wikipedia article. `wiki` is the exact English Wikipedia page title.

Next step from the plan: a build script that has Claude draft topics per country and year, fetches the Wikipedia text and Commons photo, writes cards in each language, and drops anything without a source.
