// Finds a playable YouTube video for every song that doesn't have one, so songs
// play inside the app instead of sending people to YouTube.
//
// For each song lacking a video (hand-written decks AND the overnight chart
// feeds) it searches YouTube for "<song> <artist>", then accepts a result only
// if YouTube's oEmbed endpoint confirms the video is public and embeddable
// AND its title contains the song's name. Results (including "nothing found")
// are kept in scripts/yt-cache.json, so each song is searched once and the
// nightly overnight feeds — rebuilt from scratch each night — get their ids
// back instantly.
//
// Runs where there's internet (CI, after the overnight build):
//   node scripts/find-videos.mjs           (default: up to 400 new searches)
//   VIDEO_MAX=50 node scripts/find-videos.mjs
//
// Videos blocked only in some countries can't be detected from here; the app
// detects those in the viewer's browser and skips them.
import fs from 'node:fs';
import path from 'node:path';

const SEED = 'scripts/seed';
const LIVE = 'public/content/live';
const CACHE = 'scripts/yt-cache.json';
const MAX = Number(process.env.VIDEO_MAX ?? 400);
const RETRY_DAYS = 30; // re-try a "nothing found" after this long
const sleep = ms => new Promise(r => setTimeout(r, ms));

const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
// Videos found broken by check-videos.mjs (removed, private, not embeddable).
const BAD = new Set(fs.existsSync('scripts/yt-bad.json') ? JSON.parse(fs.readFileSync('scripts/yt-bad.json', 'utf8')) : []);
const isMusic = c => c.type === 'music' || c.type === 'song';

// Strip accents/punctuation so "Poupée de cire" matches "POUPEE DE CIRE".
const fold = s =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

// The song's own name: from “Song” in a chart title, else the search phrase.
function songName(c) {
  const m = /“([^”]+)”/.exec(c.title) ?? /"([^"]+)"/.exec(c.title) ?? /«\s*([^»]+?)\s*»/.exec(c.title);
  return m ? m[1] : null;
}
const queryFor = c => (c.listen ?? c.title.replace(/[“”"]/g, '').replace(/ by /, ' ')).trim();

async function search(q) {
  const r = await fetch(`https://www.youtube.com/results?hl=en&search_query=${encodeURIComponent(q)}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'en' },
  });
  if (!r.ok) throw new Error(`search ${r.status}`);
  const html = await r.text();
  const ids = [...html.matchAll(/"videoRenderer":\{"videoId":"([\w-]{11})"/g)].map(m => m[1]);
  return [...new Set(ids)].slice(0, 4);
}

// 200 = public and embeddable; 401/403/404 = not embeddable, private or gone.
async function oembed(id) {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
  return r.ok ? r.json() : null;
}

async function find(c) {
  const q = queryFor(c);
  const name = fold(songName(c) ?? '');
  // Words that must appear in the video title: the song name's longer words.
  const need = name.split(' ').filter(w => w.length >= 3).slice(0, 3);
  for (const id of await search(q)) {
    if (BAD.has(id)) continue;
    const info = await oembed(id);
    await sleep(120);
    if (!info) continue;
    const title = fold(`${info.title} ${info.author_name}`);
    if (need.length && !need.every(w => title.includes(w))) continue;
    if (!need.length && !fold(q).split(' ').filter(w => w.length >= 4).slice(0, 2).every(w => title.includes(w))) continue;
    return id;
  }
  return null;
}

// Every song card lacking a video, with where to write the result back.
function* songs() {
  for (const f of fs.readdirSync(SEED).filter(f => f.endsWith('.json') && !f.startsWith('_'))) {
    const file = path.join(SEED, f);
    const cards = JSON.parse(fs.readFileSync(file, 'utf8'));
    yield { file, cards, pretty: true };
  }
  if (fs.existsSync(LIVE)) {
    for (const country of fs.readdirSync(LIVE)) {
      const dir = path.join(LIVE, country);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
        const file = path.join(dir, f);
        yield { file, cards: JSON.parse(fs.readFileSync(file, 'utf8')), pretty: false };
      }
    }
  }
}

let searched = 0, found = 0, reused = 0, failures = 0, streak = 0;
const PAUSE = Number(process.env.VIDEO_PAUSE_MS ?? 2500);
const now = Date.now();
for (const { file, cards, pretty } of songs()) {
  let changed = false;
  for (const c of cards) {
    if (!isMusic(c) || c.yt || c.pl) continue;
    const key = fold(queryFor(c));
    const hit = cache[key];
    if (hit?.id && !BAD.has(hit.id)) {
      c.yt = hit.id;
      changed = true;
      reused++;
      continue;
    }
    if (hit && now - hit.at < RETRY_DAYS * 864e5) continue; // recently found nothing
    if (searched >= MAX || streak >= 4) continue;
    searched++;
    try {
      const id = await find(c);
      cache[key] = { id, at: now };
      streak = 0;
      if (id) {
        c.yt = id;
        changed = true;
        found++;
        console.log(`  ${c.id}: ${queryFor(c)} -> ${id}`);
      }
    } catch (e) {
      failures++;
      streak++;
      console.warn(`  search failed (${e.message}) for ${queryFor(c)}; backing off`);
      await sleep(30000 * streak); // YouTube is throttling: wait longer each time
    }
    await sleep(PAUSE); // be gentle with YouTube
  }
  if (changed) fs.writeFileSync(file, pretty ? JSON.stringify(cards, null, 1) + '\n' : JSON.stringify(cards));
}
fs.writeFileSync(CACHE, JSON.stringify(cache, null, 0) + '\n');
console.log(`\nVideos: ${found} found by search, ${reused} from cache, ${searched} searched this run.`);
if (streak >= 4) console.log(`Stopped early after ${failures} refusals from YouTube. The rest continue next run.`);
