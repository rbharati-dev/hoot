// Content health check (needs network — run with: npm run check:content).
// For every hand-written card it asks Wikipedia two things:
//   1. Does the `wiki` article exist? A 404 means a broken "Source" link.
//   2. Does it (or the card's `photo` fallback) have a free Commons photo?
// It prints a per-country photo-coverage report and the list of cards that
// will show no picture, so gaps are visible rather than silent.
import fs from 'node:fs';
import path from 'node:path';

const dir = 'scripts/seed';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Wikimedia asks bots to say who they are and to slow down when told (429).
const HEADERS = { 'User-Agent': 'HootApp/1.0 (https://hoot.app; nostalgia app for seniors) content-check' };
async function summary(title) {
  try {
    let r;
    for (let attempt = 0; attempt < 4; attempt++) {
      r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, { headers: HEADERS });
      if (r.status !== 429) break;
      await sleep(2000 * (attempt + 1));
    }
    if (!r.ok) return { ok: false, status: r.status };
    const j = await r.json();
    const src = j.originalimage?.source ?? j.thumbnail?.source;
    const freePhoto = !!src && src.includes('/wikipedia/commons/') && !src.endsWith('.svg');
    return { ok: true, freePhoto };
  } catch {
    return { ok: false, status: 'err' };
  }
}

const broken = [];
const noPhoto = [];
let totalCards = 0,
  withPhoto = 0;

for (const f of files) {
  const cards = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  let cWith = 0;
  for (const c of cards) {
    totalCards++;
    const main = await summary(c.wiki);
    if (!main.ok) broken.push(`${c.id}: "${c.wiki}" [${main.status}]`);
    let hasPhoto = main.freePhoto;
    if (!hasPhoto && c.photo) hasPhoto = (await summary(c.photo)).freePhoto;
    // Music cards play a video, so they don't need a photo.
    const needsPhoto = !(c.yt || c.pl);
    if (hasPhoto) {
      withPhoto++;
      cWith++;
    } else if (needsPhoto) {
      noPhoto.push(`${c.id} (${c.type}): ${c.title}`);
    }
    await sleep(250);
  }
  console.log(`${f}: ${cWith}/${cards.length} cards have a free photo`);
}

console.log(`\nTotal: ${withPhoto}/${totalCards} cards have a free photo.`);
if (broken.length) {
  console.log(`\n${broken.length} BROKEN article links (fix these — the Source link 404s):`);
  for (const b of broken) console.log('  ' + b);
}
if (noPhoto.length) {
  console.log(`\n${noPhoto.length} cards that will show no picture (add a "photo" fallback article):`);
  for (const n of noPhoto.slice(0, 60)) console.log('  ' + n);
  if (noPhoto.length > 60) console.log(`  …and ${noPhoto.length - 60} more`);
}
// Only a broken link is a hard failure; thin photo coverage is a warning.
process.exit(broken.length ? 1 : 0);
