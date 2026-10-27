// Fills in the `t` (translations) on seed cards so every reader sees content in
// their own language — the Reflections/spirituality deck first, then the
// curated memories. Machine translation (Google's free endpoint, MyMemory as a
// fallback) is used; it isn't perfect for poetry, but it means a Hindi or
// Spanish reader gets Hindi or Spanish rather than English. Already-translated
// cards are skipped, so it is cheap to re-run and fills in over time.
//
// Runs where there's internet (CI): npm run translate:content
import fs from 'node:fs';
import path from 'node:path';

const LANGS = ['ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne'];
const dir = 'scripts/seed';
// Reflections (spirituality) first — the user asked for that specifically — then
// the country decks, largest last.
const order = ['_wisdom.json', ...fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== '_wisdom.json')];

const MAX_CARDS = Number(process.env.TRANSLATE_MAX ?? 250); // cards per run (bounds runtime)
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function google(text, to) {
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 HootBot' } });
  if (!r.ok) throw new Error('google ' + r.status);
  const j = await r.json();
  return (j[0] || []).map(s => s[0]).join('');
}
async function mymemory(text, to) {
  const email = process.env.HOOT_MT_EMAIL ? `&de=${encodeURIComponent(process.env.HOOT_MT_EMAIL)}` : '';
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${to}${email}`);
  const j = await r.json();
  const out = j?.responseData?.translatedText;
  if (!out || /MYMEMORY WARNING|QUOTA/i.test(out)) throw new Error('mymemory quota');
  return out;
}
async function translate(text, to) {
  // MyMemory is a proper free translation API (reliable from CI IPs); Google's
  // endpoint is the fallback.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await mymemory(text, to);
    } catch {
      /* try fallback / retry */
    }
    try {
      return await google(text, to);
    } catch {
      await sleep(800);
    }
  }
  return null;
}

let done = 0;
for (const file of order) {
  if (done >= MAX_CARDS) break;
  const p = path.join(dir, file);
  const cards = JSON.parse(fs.readFileSync(p, 'utf8'));
  let changed = false;
  for (const c of cards) {
    if (done >= MAX_CARDS) break;
    c.t ??= {};
    const missing = LANGS.filter(l => !c.t[l]?.title || !c.t[l]?.text);
    if (!missing.length) continue;
    for (const lang of missing) {
      const title = await translate(c.title, lang);
      await sleep(120);
      const text = await translate(c.text, lang);
      await sleep(120);
      if (title && text) c.t[lang] = { title, text };
    }
    changed = true;
    done++;
    if (done % 10 === 0) console.log(`  ${done} cards translated…`);
  }
  if (changed) fs.writeFileSync(p, JSON.stringify(cards, null, 1) + '\n');
}
console.log(`Translated ${done} cards into ${LANGS.length} languages this run.`);
