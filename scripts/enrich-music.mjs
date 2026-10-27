// Fills real YouTube video ids into music cards that don't have one, so every
// song can embed and play. It resolves each card's Wikipedia article to its
// Wikidata item and reads the "YouTube video ID" property (P1651). Runs where
// there's internet (your machine or CI): npm run enrich:music
//
// It only ADDS a `yt` to cards that lack one — it never overwrites a curated id
// — and writes the updated seed files back in place. Review the git diff after.
import fs from 'node:fs';
import path from 'node:path';

const dir = 'scripts/seed';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function qidFor(title) {
  const u = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(title)}`;
  try {
    const j = await (await fetch(u)).json();
    return j?.query?.pages?.[0]?.pageprops?.wikibase_item ?? null;
  } catch {
    return null;
  }
}

async function ytFor(qid) {
  const u = `https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&ids=${qid}&format=json`;
  try {
    const j = await (await fetch(u)).json();
    const v = j?.entities?.[qid]?.claims?.P1651?.[0]?.mainsnak?.datavalue?.value;
    return typeof v === 'string' && /^[\w-]{11}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

let filled = 0,
  missed = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const file = path.join(dir, f);
  const cards = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;
  for (const c of cards) {
    if (!(c.type === 'music' || c.type === 'song') || c.yt || c.pl) continue;
    // Prefer the song's own article; fall back to the artist (c.photo) if set.
    let yt = null;
    for (const title of [c.wiki, c.photo].filter(Boolean)) {
      const qid = await qidFor(title);
      if (qid) yt = await ytFor(qid);
      await sleep(80);
      if (yt) break;
    }
    if (yt) {
      c.yt = yt;
      filled++;
      changed = true;
      console.log(`  ${c.id}: ${c.wiki} -> ${yt}`);
    } else {
      missed++;
      console.log(`  (none) ${c.id}: ${c.wiki}`);
    }
  }
  if (changed) fs.writeFileSync(file, JSON.stringify(cards, null, 1) + '\n');
}
console.log(`\nFilled ${filled} songs; ${missed} had no YouTube id on Wikidata.`);
