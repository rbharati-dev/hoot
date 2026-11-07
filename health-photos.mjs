// Finds openly licensed, very high-resolution photos for each health topic on
// Wikimedia Commons (no key needed), downloads and resizes them, and makes a
// numbered contact sheet per topic for review. Only licences that allow
// commercial use and changes: CC0, public domain, CC BY, CC BY-SA.
import fs from 'node:fs';
import sharp from 'sharp';
const UA = { 'User-Agent': 'HootDaily/1.0 (https://hootdaily.com; photo finder for a free app for older adults)' };
const Q = {
  menopause: ['woman smiling outdoors portrait autumn', 'mature woman walking park', 'woman yoga outdoors', 'woman hiking mountains'],
  men: ['elderly man smiling portrait', 'senior man fishing lake', 'grandfather walking', 'old man cycling'],
  energy: ['sunrise walk countryside', 'elderly cyclists', 'senior hikers mountain', 'people walking morning beach'],
  sleep: ['bedroom bed pillows morning light', 'cozy bedroom', 'sleeping cat', 'bed linen white'],
  memory: ['elderly man playing chess', 'old woman reading book', 'senior playing piano', 'crossword puzzle newspaper'],
  heart: ['elderly couple walking park', 'olive oil vegetables', 'senior walking autumn leaves', 'nordic walking'],
  joints: ['tai chi park', 'elderly swimming pool', 'aqua aerobics', 'senior yoga class'],
  strength: ['senior exercise class gym', 'elderly woman dumbbells', 'older adults fitness', 'resistance band exercise'],
  weight: ['salad bowl', 'farmers market vegetables', 'healthy meal plate', 'walking shoes trail'],
  eating: ['fresh fruit bowl', 'vegetables cutting board kitchen', 'mediterranean food', 'porridge berries'],
  digestion: ['yogurt berries bowl', 'herbal tea cup', 'oats bowl', 'ginger lemon tea'],
  bladder: ['glass of water', 'water jug glasses table', 'cranberries', 'drinking water'],
  senses: ['reading glasses book', 'eyeglasses table', 'listening to music headphones elderly', 'toothbrush'],
  skin: ['sun hat beach', 'hands cream', 'gardening gloves', 'shade tree summer'],
  mood: ['friends laughing cafe', 'elderly women laughing', 'garden flowers sunshine', 'dog walk park'],
  pain: ['warm bath', 'massage shoulders', 'hot water bottle', 'swimming pool lanes'],
  lungs: ['forest path', 'mountain view fresh air', 'choir singing', 'open window curtains'],
  staywell: ['pharmacy', 'doctor patient consultation', 'first aid kit', 'stethoscope'],
  longevity: ['grandparents grandchildren', 'elderly friends bench park', 'senior gardening', 'elderly couple dancing'],
  intimacy: ['elderly couple holding hands', 'senior couple smiling', 'old couple walking beach', 'couple hug sunset'],
};
const OK = /^(cc0|cc[- ]?by(-sa)?[- ]?[0-9.]*|public domain|pd|cc-pd.*)$/i;
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(params) {
  const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params });
  for (let a = 0; a < 3; a++) {
    const r = await fetch(u, { headers: UA });
    if (r.ok) return r.json();
    await sleep(2000 * (a + 1));
  }
  throw new Error('commons ' + u);
}
fs.mkdirSync('out/img', { recursive: true });
fs.mkdirSync('out/sheets', { recursive: true });
const meta = {};
for (const [topic, queries] of Object.entries(Q)) {
  const cands = [];
  const seen = new Set();
  for (const q of queries) {
    try {
      const j = await api({
        action: 'query', generator: 'search', gsrnamespace: '6', gsrlimit: '20',
        gsrsearch: `${q} filetype:bitmap filew:>2000 fileh:>1200`,
        prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '2000',
      });
      for (const p of j.query?.pages ?? []) {
        const ii = p.imageinfo?.[0];
        if (!ii || seen.has(p.title)) continue;
        seen.add(p.title);
        const m = ii.extmetadata ?? {};
        const lic = strip(m.LicenseShortName?.value);
        if (!OK.test(lic) || !/jpeg/.test(ii.mime)) continue;
        if (ii.width < 2000 || ii.height < 1125 || ii.width < ii.height * 1.2) continue;
        if (/restrict|nudity|nsfw/i.test(strip(m.Restrictions?.value) + p.title)) continue;
        cands.push({ q, title: p.title, url: ii.thumburl || ii.url, w: ii.width, h: ii.height, license: lic, creator: strip(m.Artist?.value).slice(0, 120), source: ii.descriptionurl });
      }
    } catch (e) {
      console.log('fail', q, e.message);
    }
    await sleep(500);
  }
  const done = [];
  for (const c of cands) {
    if (done.length >= 16) break;
    try {
      const r = await fetch(c.url, { headers: UA });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const name = `${topic}-${done.length + 1}.jpg`;
      await sharp(buf).rotate().resize({ width: 1800, height: 1012, fit: 'cover', position: 'attention', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(`out/img/${name}`);
      const m = await sharp(`out/img/${name}`).metadata();
      if (m.width < 1800) { fs.rmSync(`out/img/${name}`); continue; }
      done.push({ file: name, ...c });
    } catch { /* skip */ }
    await sleep(200);
  }
  meta[topic] = done;
  const tiles = await Promise.all(done.map(async (d, i) => ({
    input: await sharp(`out/img/${d.file}`).resize(300, 168).composite([{ input: Buffer.from(`<svg width="300" height="168"><rect width="44" height="34" fill="black"/><text x="6" y="25" font-size="22" fill="white" font-family="sans-serif">${i + 1}</text></svg>`), top: 0, left: 0 }]).toBuffer(),
    left: (i % 4) * 304, top: Math.floor(i / 4) * 172,
  })));
  await sharp({ create: { width: 1216, height: Math.max(1, Math.ceil(done.length / 4)) * 172, channels: 3, background: '#ffffff' } }).composite(tiles).jpeg({ quality: 70 }).toFile(`out/sheets/${topic}.jpg`);
  console.log(topic, cands.length, 'candidates,', done.length, 'kept');
}
fs.writeFileSync('out/meta.json', JSON.stringify(meta, null, 1));
