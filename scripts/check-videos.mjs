// Nightly health check of every song video, so people never press Play on a
// video that can't play. For each YouTube id in the hand-written decks and the
// overnight feeds it asks YouTube's oEmbed endpoint, which answers 200 only for
// videos that are public AND allowed to play inside other sites. A video that
// has been removed, made private, or had embedding switched off is:
//   - removed from its card (so the card hides or shows "can't play"),
//   - added to scripts/yt-bad.json, so find-videos.mjs never picks it again
//     and searches for a replacement the same night.
// Results are cached per id for CHECK_DAYS so each run stays short.
//
// Not caught here: videos blocked only in some countries. The app detects
// those in the viewer's browser and skips them. Catching them ahead of time
// needs a YouTube Data API key (YT_API_KEY): when set, ids are also checked
// for regionRestriction against REGIONS.
//
//   node scripts/check-videos.mjs
import fs from 'node:fs';
import path from 'node:path';

const SEED = 'scripts/seed';
const LIVE = 'public/content/live';
const SEEN = 'scripts/yt-checked.json';
const BADF = 'scripts/yt-bad.json';
const CHECK_DAYS = Number(process.env.CHECK_DAYS ?? 7);
const MAX = Number(process.env.CHECK_MAX ?? 1500);
const KEY = process.env.YT_API_KEY;
// Where Hoot's readers live: a video blocked in any of these is treated as bad.
const REGIONS = (process.env.YT_REGIONS ?? 'CA,US,GB,FR,DE,IT,BR,AR,CO,MX,IN,NP,RU,ES,PT').split(',');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const seen = fs.existsSync(SEEN) ? JSON.parse(fs.readFileSync(SEEN, 'utf8')) : {};
const bad = new Set(fs.existsSync(BADF) ? JSON.parse(fs.readFileSync(BADF, 'utf8')) : []);
const now = Date.now();

async function embeddable(id) {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
  if (r.status === 429 || r.status >= 500) throw new Error(`oembed ${r.status}`);
  return r.ok;
}

// With an API key: status + region restrictions for up to 50 ids per call.
async function apiCheck(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const u = `https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${batch.join(',')}&key=${KEY}`;
    const j = await (await fetch(u)).json();
    const found = new Map((j.items ?? []).map(v => [v.id, v]));
    for (const id of batch) {
      const v = found.get(id);
      if (!v) { out.set(id, false); continue; }
      const rr = v.contentDetails?.regionRestriction;
      const blocked = rr ? REGIONS.some(c => (rr.blocked ?? []).includes(c) || (rr.allowed && !rr.allowed.includes(c))) : false;
      const ok = v.status?.embeddable !== false && v.status?.privacyStatus === 'public' && !blocked && !v.contentDetails?.contentRating?.ytRating;
      out.set(id, ok);
    }
  }
  return out;
}

function* files() {
  for (const f of fs.readdirSync(SEED).filter(f => f.endsWith('.json') && !f.startsWith('_'))) yield { file: path.join(SEED, f), pretty: true };
  if (!fs.existsSync(LIVE)) return;
  for (const c of fs.readdirSync(LIVE)) {
    const dir = path.join(LIVE, c);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) yield { file: path.join(dir, f), pretty: false };
  }
}

// 1. Which ids need checking?
const all = new Set();
for (const { file } of files()) for (const c of JSON.parse(fs.readFileSync(file, 'utf8'))) if (c.yt) all.add(c.yt);
const due = [...all].filter(id => !bad.has(id) && !(seen[id] && now - seen[id] < CHECK_DAYS * 864e5)).slice(0, MAX);
console.log(`Videos: ${all.size} in use, ${due.length} due for a check${KEY ? ' (with region check)' : ''}.`);

// 2. Check them.
let failures = 0, newlyBad = 0;
const api = KEY ? await apiCheck(due).catch(e => (console.warn('API check failed:', e.message), null)) : null;
for (const id of due) {
  let ok;
  try {
    ok = api?.has(id) ? api.get(id) : await embeddable(id);
  } catch (e) {
    if (++failures > 10) { console.warn('YouTube is refusing checks; stopping early.'); break; }
    await sleep(5000);
    continue;
  }
  if (ok) seen[id] = now;
  else { bad.add(id); delete seen[id]; newlyBad++; console.log(`  can't play: ${id}`); }
  if (!api) await sleep(150);
}

// 3. Take broken videos off their cards.
let cleared = 0;
for (const { file, pretty } of files()) {
  const cards = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;
  for (const c of cards) if (c.yt && bad.has(c.yt)) { delete c.yt; changed = true; cleared++; }
  if (changed) fs.writeFileSync(file, pretty ? JSON.stringify(cards, null, 1) + '\n' : JSON.stringify(cards));
}
fs.writeFileSync(SEEN, JSON.stringify(seen) + '\n');
fs.writeFileSync(BADF, JSON.stringify([...bad].sort(), null, 0) + '\n');
console.log(`Done: ${newlyBad} newly unplayable, ${cleared} cards cleared (find-videos will look for replacements).`);
