import fs from 'node:fs';
const cards = JSON.parse(fs.readFileSync('added.json', 'utf8'));
const H = { 'User-Agent': 'HootApp/1.0 (https://hootdaily.com) content-check' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const c of cards) {
  let r;
  for (let i = 0; i < 4; i++) {
    r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(c.wiki.replace(/ /g, '_'))}`, { headers: H });
    if (r.status !== 429) break;
    await sleep(3000 * (i + 1));
  }
  let line = `${r.status}\t${c.id}\t${c.wiki}`;
  if (r.ok) {
    const j = await r.json();
    const src = j.originalimage?.source ?? j.thumbnail?.source ?? '';
    line += `\t${j.type}\t${src.includes('/wikipedia/commons/') ? 'photo' : src ? 'nonfree' : 'nophoto'}\t${j.title}\t${(j.description || '').slice(0, 60)}`;
  }
  console.log(line);
  await sleep(200);
}
