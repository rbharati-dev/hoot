# Hoot – Build Instructions

Oct 14, 2026 · @Jason Latri

## Overview & goals

Hoot is a simple web app where an older adult enters their birth year and birth country and gets a personal feed of the songs, news, photos, shows and everyday things from their childhood and youth, plus a tab of brain games.

**Goals for version 1**

- Someone aged 60+ can go from landing page to their first memory in under 30 seconds, with only two questions.
- Every memory card is grounded in a real, credited source (Wikipedia, Wikimedia Commons, public archives, YouTube) rather than invented.
- Feed covers the years they were roughly 5 to 25, for their country and, optionally, their city or region.
- A separate Games tab offers crossword, sudoku, chess, era trivia and word games.
- Free for everyone, no account needed; everything personal is saved on their device.
- No live AI: all content is generated once, ahead of time, and shipped as a content database, so running costs stay near zero.

**Example:** born 1962 in the USSR → feed spans about 1967 to 1987: Brezhnev, Gagarin's legacy and the space race, the 1980 Moscow Olympics, Vysotsky and Pugacheva songs, "Nu, pogodi!" cartoons, bread queues and Zhiguli cars.

## Users & design principles

The primary user is an older adult (60+) using the app on their own, mostly on a desktop computer, in English or in the language of their birth country.

1. **Two questions, then value.** Ask only birth year and country up front; everything else is optional and offered later.
2. **One thing on screen at a time.** One memory card, one big Next button. No infinite scroll, no pop-ups, no ads.
3. **Big and forgiving.** Minimum 20px body text, buttons at least 56px tall, generous spacing, no hover-only actions, every action undoable.
4. **Plain words.** "Next memory", not icons alone. Every icon has a text label.
5. **True and credited.** Each card shows where its photo and facts came from. If the app isn't sure, it says less rather than guessing.
6. **Gentle tone.** Warm and respectful. Hard history (war, famine, repression) appears factually, never as entertainment, and users can turn off heavy topics.

## Onboarding flow

Onboarding is two required questions on one screen, then straight into the feed; optional details come later as a gentle "Tell us more" prompt.

1. **Welcome screen:** one sentence ("See the world you grew up in") and a Start button.
2. **Required:** birth year (large number picker or typed field) and birth country (searchable list).
   - Historical countries are first-class options: USSR, Yugoslavia, Czechoslovakia, East Germany, etc., with a note that the user can pick the country as it was then.
   - The interface language defaults to English, with a one-tap switch to the language of their birth country (e.g. Русский).
3. **Feed opens** on their first memory card.
4. **"Tell us more" (optional, any time):** simple pickers, no typing needed:
   - City or region (a list for their country)
   - Places they moved to later, with the year (country + year pickers)
   - Interests (checkboxes: hockey, music, films, cars, cooking, space, fashion)
   - Topics to avoid (war, politics, hardship)
5. The feed reshuffles instantly using tags already on each pre-built card. A plain confirmation line shows what was picked ("Leningrad, then Canada from 1991. Hockey, music.") and can be edited.

All profile data is stored in the browser only.

### Sharing a feed (profile in the link)

A family member can set up someone's feed and send it as a link, with no accounts: the profile travels inside the link itself.

1. On any device, open **Settings → Share this feed**. Hoot builds a link from the current profile, e.g. `hoot.app/?born=1948&country=ussr&city=kyiv&moved=ca-1975&likes=music,hockey&lang=ru`.
2. Copy it, or send it by email or text with one tap.
3. Whoever opens the link lands straight in that feed, with no questions asked, and the profile is saved on their device.
4. Each memory card also has a **Share this memory** button that links to that one card (e.g. `hoot.app/m/ca-1967-expo67`).

Notes: saved cards do not travel with the link; a link anyone has will show the same feed, which is fine since it holds only a birth year, places and interests (no names). Keep links short by using short codes for countries and interests.

## Memory feed

The feed shows one card at a time from the years the user was about 5 to 25, mixing every content type, drawn from a pre-built database of sourced facts, photos and music.

### Content types

| Type | Example card (Canada, born 1952) | Source |
| --- | --- | --- |
| Music | A top song of 1964, with play button | YouTube embed; Wikipedia for song facts |
| News & world events | Expo 67 opens in Montreal | Wikipedia "year in Canada" pages |
| Leaders & politics | Lester Pearson, the new maple leaf flag (1965) | Wikipedia |
| Daily life photos | A Main Street, a 1950s kitchen, cars of the era | Wikimedia Commons, national archives (open licence) |
| TV, film & radio | Hockey Night in Canada, popular shows | Wikipedia, YouTube clips |
| Everyday things | Price of bread, milk delivery, school routines | Wikipedia, statistics pages; marked "approximate" |
| Sports | Stanley Cup winners, Olympic moments | Wikipedia |
| Toys, brands & ads | Popular toys, candy, household brands | Wikipedia, Commons |
| Fashion & slang | What people wore, popular sayings | Wikipedia |
| "On this day" | What happened on today's date when they were 12 | Wikipedia date pages |

### Each card shows

- The year and their age then ("1967 · you were 15")
- A photo (when a properly licensed one exists)
- A title and 2–4 short sentences, written warmly
- A play button for songs and clips
- A small "Source" link and photo credit
- Three buttons: **Next**, **♥ Save**, **Not for me** (hides similar cards)

### How the content is built (once, offline)

1. **Plan:** Claude drafts a topic list for each country and year, 1940–1990 (e.g. "1967 Canada: Expo 67, Centennial, Leafs win the Cup").
2. **Fetch:** a build script pulls each topic's Wikipedia text, a Wikimedia Commons photo with its licence and credit, and a YouTube video ID for songs.
3. **Write:** Claude writes each card only from the fetched text, in each interface language, and tags it (type, year, region, interests, heavy topic yes/no).
4. **Check:** cards with no source, no licence or a fact that doesn't match are dropped; a person spot-checks a sample per country.
5. **Ship:** cards are saved as JSON files, one per country and year (e.g. `ca/1967.json`), and served with the website. The app makes no AI calls while people use it.

Rough size: 10 countries × 50 years × about 30 cards ≈ 15,000 cards, a few MB of text. Photos load from Wikimedia rather than being stored. Adding a country later means rerunning the build for it.

### Ordering

Mix types so no two neighbouring cards are the same kind; move gently forward through the years, with a "Jump to a year" button for users who want to choose. Saved cards live in a **My Memories** list.

## Brain games tab

Games live in their own tab, each opening full-screen with big pieces, an easy default level, unlimited time, and hints and undo always available.

| Game | V1 behaviour | Build notes |
| --- | --- | --- |
| Crossword | One daily puzzle, 9×9 or 11×11; option for era-themed clues from their decade | Generate from a word list; era clues pre-written from the content database |
| Sudoku | Easy / Medium / Hard, pencil marks, mistake highlighting (can be turned off) | Open-source generator; puzzles must have one solution |
| Chess | Play the computer at 5 gentle levels; show legal moves; take back | chess.js for rules + Stockfish (WebAssembly) at low strength |
| Era trivia | 10 multiple-choice questions from their own feed ("Who won the Cup in 1967?") | Built from cached memory cards, so answers are sourced |
| Word search | Themed grids (1960s songs, Soviet cartoons) | Simple generator |
| Memory match | Flip cards to match pairs of era photos | Uses cached licensed images |
| Solitaire | Classic Klondike | Common open-source logic |
| Word scramble / daily word | Unscramble or guess a 5-letter word | Simple word lists per language |

All games track a gentle daily streak and personal bests, stored on the device. No timers counting down, no leaderboards in V1.

## Visual design spec

The look is clean and modern: white space, large high-contrast type and a single accent colour, designed for a desktop screen first.

| Element | Spec |
| --- | --- |
| Layout | One centred column, max 760px wide; two tabs at top: **Memories** and **Games**; a small Settings link |
| Body text | 20–22px, line height 1.6; headings 32–40px |
| Typeface | One readable sans-serif with full Cyrillic support (e.g. Inter or Atkinson Hyperlegible) |
| Colour | Off-white background, near-black text (contrast ≥ 7:1), one warm accent for buttons |
| Buttons | At least 56px tall, text labels, wide click areas; Next is the largest thing on the card |
| Memory card | Photo on top (up to 60% of card), year + age, title, short text, source line, buttons |
| Motion | Minimal: a soft fade between cards, nothing that moves on its own |
| Settings | Text size (3 steps), dark mode, language, "hide heavy topics", reset my data |
| Accessibility | Full keyboard support (arrow keys for Next / Back), screen-reader labels, WCAG 2.2 AA |

## Tech stack & architecture

Hoot is a static website plus a folder of pre-built JSON content: no app server, no database and no live AI, all on Google Firebase's free plan.

Architecture: Claude + Wikipedia/Commons/YouTube -> build script -> JSON content files (one per country+year) -> Firebase Hosting -> person's browser (profile and saved cards in localStorage). No AI calls at runtime.

Content is built once, offline, then shipped with the site. Photos load from Wikimedia and songs play through the official YouTube embed. Anyone curious could find the JSON files, which is fine: the content is public-domain facts with credits.

| Part | Suggested choice | Why |
| --- | --- | --- |
| Front end | React + Vite + TypeScript, Tailwind CSS | Simple, fast, easy to keep minimal |
| Translations | i18next | English + birth-country language switching |
| Content | JSON files on Firebase Hosting, one per country + year | Cheaper than Firestore for read-only content; move to Firestore only if cards need live editing |
| Content build | A script run with Claude, using Wikipedia, Wikimedia Commons and YouTube Data APIs | Run once; rerun to add countries or fix cards |
| Hosting | Firebase Hosting (free Spark plan) | Static files on Google's CDN; deploy with one command (firebase deploy) |
| Games | chess.js + Stockfish WASM; open-source sudoku and crossword generators | Run in the browser, no server cost |
| Local data | localStorage / IndexedDB | Profile and saved cards stay on the device |
| Accounts | None in V1 | Later via Firebase Authentication + Firestore, e.g. for sharing with family; Google Analytics for Firebase for anonymous usage stats |

## Build phases & open questions

Build in three phases, launching with ten major countries across North America, Europe and South America, then widening the list.

1. **Phase 1 – Core feed (USSR, Canada, USA, UK, France, Germany (East and West), Italy, Brazil, Argentina, Colombia, 1940–1990).** Onboarding, pre-built content for all ten countries, Next / Save / Not for me, interface in English, Russian, French, German, Italian, Spanish and Portuguese, sudoku and crossword.
2. **Phase 2 – Personalisation & games.** "Tell us more" pickers, city/region and later moves, interests, era trivia, chess, word search, memory match, solitaire.
3. **Phase 3 – More countries & polish.** Add countries in batches (e.g. Spain, Poland, Mexico, Chile, Japan, Yugoslavia), more languages, "On this day", text-size and dark mode refinements.

### Open questions

- [x] App name: Hoot (decided).
- [ ] Family sharing: decided, use profile-in-the-link (see Onboarding). No accounts needed.
- [ ] Is a phone/tablet version needed after V1, or desktop only? NO. not right now.
- [ ] Should the app read cards aloud (text-to-speech) for users with low vision? NO not now.
- [ ] Business model: free for everyone at launch, no accounts. Donations and a paid tier may come later; still to decide what would ever be paid.
