// Splits scripts/seed/<country>.json into public/content/<country>/<year>.json
// plus public/content/index.json listing which years each country has.
// Run: npm run content
import fs from 'node:fs';
import path from 'node:path';

const seedDir = 'scripts/seed';
const outDir = 'public/content';
// Clear what this script manages, but keep the overnight build's output
// (public/content/live) which is generated separately and committed.
if (fs.existsSync(outDir)) {
  for (const entry of fs.readdirSync(outDir)) {
    if (entry === 'live' || entry === 'news' || entry === 'research') continue; // generated separately
    fs.rmSync(path.join(outDir, entry), { recursive: true, force: true });
  }
}
fs.mkdirSync(outDir, { recursive: true });
const index = {};
for (const file of fs.readdirSync(seedDir).filter(f => f.endsWith('.json'))) {
  const country = path.basename(file, '.json');
  const cards = JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf8'));
  const ids = new Set();
  const byYear = {};
  const shared = country.startsWith('_'); // e.g. _wisdom.json — a shared deck
  // Required keys. Shared decks (Reflections) are not tied to a reader's year,
  // so they don't need `year`; everything else does.
  const health = country === '_health'; // health tips: no Wikipedia article, one file per language
  const required = health ? ['id', 'type', 'topic', 'title', 'text'] : shared ? ['id', 'type', 'title', 'text', 'wiki'] : ['id', 'year', 'type', 'title', 'text', 'wiki'];
  for (const c of cards) {
    for (const k of required) {
      if (!c[k]) throw new Error(`${file}: card ${c.id ?? '?'} is missing "${k}"`);
    }
    for (const [l, tr] of Object.entries(c.t ?? {})) {
      if (!tr.title || !tr.text) throw new Error(`${file}: card ${c.id} has an incomplete "${l}" translation`);
    }
    if (ids.has(c.id)) throw new Error(`${file}: duplicate id ${c.id}`);
    ids.add(c.id);
    (byYear[c.year ?? 0] ??= []).push(c);
  }
  // Files starting with "_" (e.g. _wisdom.json) are shared decks, not
  // countries: they go to /content/<name>/ and never appear in the picker.
  const folder = shared ? country.slice(1) : country;
  fs.mkdirSync(path.join(outDir, folder), { recursive: true });
  if (health) {
    // One small file per language (each reader downloads only theirs). A tip
    // not yet translated falls back to English rather than disappearing.
    for (const lang of ['en', 'ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne']) {
      const list = cards.map(c => {
        const tr = lang === 'en' ? c : (c.t?.[lang] ?? c);
        const out = { id: c.id, topic: c.topic, title: tr.title, text: tr.text };
        if (c.doctor) out.doctor = true;
        if (lang !== 'en' && !c.t?.[lang]) out.en = true; // shown in English for now
        return out;
      });
      fs.writeFileSync(path.join(outDir, folder, `${lang}.json`), JSON.stringify(list));
    }
    index[folder] = cards.length;
  } else if (shared) {
    // Shared decks ship as one file; order is each card's own.
    fs.writeFileSync(path.join(outDir, folder, 'all.json'), JSON.stringify(cards));
    index[folder] = cards.length;
  } else {
    for (const [year, list] of Object.entries(byYear)) {
      fs.writeFileSync(path.join(outDir, folder, `${year}.json`), JSON.stringify(list));
    }
    index[country] = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b);
  }
  console.log(`${folder}: ${cards.length} cards`);
}
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
