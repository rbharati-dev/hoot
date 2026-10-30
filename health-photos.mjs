// Finds openly licensed photos for each health topic on Openverse, downloads
// and resizes them, and makes a contact sheet per topic for review.
// Only licences that allow commercial use and modification (CC0, PDM, BY, BY-SA).
import fs from 'node:fs';
import sharp from 'sharp';
const UA = { 'User-Agent': 'HootApp/1.0 (https://hoot.app; nostalgia app for seniors) photo-finder' };
const Q = {
  intimacy: ['elderly couple holding hands', 'senior couple smiling', 'older couple walking together', 'grandparents couple hug'],
  menopause: ['middle aged woman smiling outdoors', 'mature woman yoga', 'woman walking park autumn', 'senior woman portrait smiling'],
  men: ['senior man smiling portrait', 'older man fishing', 'elderly man walking', 'grandfather outdoors'],
  energy: ['senior morning walk sunrise', 'elderly woman cycling', 'older people hiking', 'senior stretching outdoors'],
  sleep: ['bedroom bed morning light', 'cozy bedroom pillows', 'sleeping cat bed', 'night lamp bedroom'],
  memory: ['senior playing chess', 'elderly reading book', 'older woman crossword', 'senior playing piano'],
  heart: ['senior couple walking park', 'elderly people walking', 'healthy vegetables olive oil', 'blood pressure monitor'],
  joints: ['senior doing yoga', 'elderly swimming pool', 'tai chi park', 'older woman stretching'],
  strength: ['senior exercise dumbbells', 'elderly fitness class', 'senior balance exercise', 'older adults gym'],
  weight: ['salad bowl healthy', 'fresh vegetables market', 'healthy plate food', 'walking shoes path'],
  eating: ['fresh fruit bowl', 'vegetables kitchen cooking', 'mediterranean food table', 'porridge berries breakfast'],
  digestion: ['yogurt berries', 'herbal tea cup', 'fiber oats bowl', 'ginger tea lemon'],
  bladder: ['glass of water', 'water jug glasses', 'cranberries', 'pelvic floor exercise mat'],
  senses: ['reading glasses book', 'eye glasses table', 'toothbrush toothpaste', 'senior listening music headphones'],
  skin: ['sunhat beach', 'hand cream hands', 'sunscreen', 'gardening gloves hands'],
  mood: ['friends laughing coffee', 'senior women laughing', 'garden flowers sunshine', 'dog walk park'],
  pain: ['warm bath relax', 'massage shoulders', 'hot water bottle', 'swimming pool lanes'],
  lungs: ['fresh air forest path', 'deep breath mountains', 'choir singing', 'open window curtains'],
  staywell: ['pharmacist pharmacy', 'doctor consultation', 'first aid kit', 'vaccination arm'],
  longevity: ['grandparents grandchildren', 'elderly friends park bench', 'senior gardening', 'older couple dancing'],
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync('out/img', { recursive: true });
fs.mkdirSync('out/sheets', { recursive: true });
const meta = {};
for (const [topic, queries] of Object.entries(Q)) {
  const picks = [];
  const seen = new Set();
  for (const q of queries) {
    const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=cc0,pdm,by,by-sa&aspect_ratio=wide&size=large&mature=false&page_size=12`;
    let j;
    try { const r = await fetch(u, { headers: UA }); j = await r.json(); } catch (e) { console.log('fail', q, e.message); continue; }
    for (const x of j.results ?? []) {
      if (picks.length >= 8 * queries.length) break;
      if (seen.has(x.id) || !x.url) continue;
      seen.add(x.id);
      picks.push({ q, ...x });
    }
    await sleep(1200);
  }
  const done = [];
  for (const x of picks) {
    if (done.length >= 14) break;
    try {
      const r = await fetch(x.url, { headers: UA });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const img = sharp(buf).rotate();
      const m = await img.metadata();
      if (!m.width || m.width < 900 || m.width < m.height) continue;
      const name = `${topic}-${done.length + 1}.jpg`;
      await img.resize({ width: 1000, height: 560, fit: 'cover', position: 'attention' }).jpeg({ quality: 74, mozjpeg: true }).toFile(`out/img/${name}`);
      done.push({ file: name, q: x.q, title: x.title, creator: x.creator, license: x.license, license_version: x.license_version, source: x.foreign_landing_url, provider: x.provider });
    } catch (e) { /* skip */ }
    await sleep(300);
  }
  meta[topic] = done;
  // contact sheet: 4 columns, numbered
  const tiles = await Promise.all(done.map(async (d, i) => ({
    input: await sharp(`out/img/${d.file}`).resize(300, 168).composite([{ input: Buffer.from(`<svg width="300" height="168"><rect width="44" height="34" fill="black"/><text x="8" y="25" font-size="24" fill="white" font-family="sans-serif">${i + 1}</text></svg>`), top: 0, left: 0 }]).toBuffer(),
    left: (i % 4) * 304, top: Math.floor(i / 4) * 172,
  })));
  const rows = Math.max(1, Math.ceil(done.length / 4));
  await sharp({ create: { width: 1216, height: rows * 172, channels: 3, background: '#ffffff' } }).composite(tiles).jpeg({ quality: 70 }).toFile(`out/sheets/${topic}.jpg`);
  console.log(topic, done.length);
}
fs.writeFileSync('out/meta.json', JSON.stringify(meta, null, 1));
