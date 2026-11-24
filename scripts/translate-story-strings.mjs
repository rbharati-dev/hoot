// Translates the life-story pages' words (src/lib/story/strings-en.ts) into
// src/lib/story/strings-<lang>.json. Only missing or changed keys are done, so
// re-running is cheap. {placeholders} are protected during translation and a
// result that loses one is skipped (that key stays English until next time).
//   npx tsx scripts/translate-story-strings.mjs        (needs internet: CI)
import fs from 'node:fs';
import { en } from '../src/lib/story/strings-en.ts';

const LANGS = ['ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function google(text, to) {
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 HootBot' } });
  if (!r.ok) throw new Error('google ' + r.status);
  const j = await r.json();
  return (j[0] || []).map(s => s[0]).join('');
}
async function translate(text, to) {
  // Placeholders become numbered tokens the translator leaves alone.
  const names = [];
  const masked = text.replace(/\{(\w+)\}/g, (_, n) => {
    names.push(n);
    return `[${names.length - 1}]`;
  });
  for (let i = 0; i < 3; i++) {
    try {
      let out = await google(masked, to);
      out = out.replace(/\[\s*(\d+)\s*\]/g, (_, k) => `{${names[Number(k)]}}`);
      const want = (text.match(/\{\w+\}/g) ?? []).sort().join();
      const got = (out.match(/\{\w+\}/g) ?? []).sort().join();
      return want === got ? out : null;
    } catch {
      await sleep(1000 * (i + 1));
    }
  }
  return null;
}

// Remember which English text each translation came from, so changed English is redone.
const srcPath = 'src/lib/story/strings-source.json';
const source = fs.existsSync(srcPath) ? JSON.parse(fs.readFileSync(srcPath, 'utf8')) : {};
for (const lang of LANGS) {
  const p = `src/lib/story/strings-${lang}.json`;
  const out = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
  let n = 0;
  for (const [k, v] of Object.entries(en)) {
    const sig = JSON.stringify(v);
    if (out[k] !== undefined && source[k] === sig) continue;
    if (Array.isArray(v)) {
      const items = [];
      for (const item of v) items.push((await translate(item, lang)) ?? item);
      out[k] = items;
    } else if (typeof v === 'string') {
      const t = await translate(v, lang);
      if (!t) continue;
      out[k] = t;
    }
    n++;
    await sleep(80);
  }
  fs.writeFileSync(p, JSON.stringify(out, null, 1) + '\n');
  console.log(`${lang}: ${n} strings translated`);
}
fs.writeFileSync(srcPath, JSON.stringify(Object.fromEntries(Object.entries(en).map(([k, v]) => [k, JSON.stringify(v)])), null, 1) + '\n');
