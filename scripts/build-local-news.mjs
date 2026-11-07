// Local news: the latest stories from each region's public news feed
// (CBC regions in Canada, BBC regions in the UK), headline + short summary +
// link only, like the main news. Writes public/content/news/local/<id>.json.
// Runs where there's internet (CI): npm run build:local-news
import fs from 'node:fs';
import path from 'node:path';
import { parseItems } from './build-news.mjs';

// The region list lives in the app's TypeScript; read the feed URLs from it.
const src = fs.readFileSync('src/lib/regions.ts', 'utf8');
const regions = [...src.matchAll(/(cbc|bbc)\('([^']+)', '([^']+)', '([^']+)'\)/g)].map(([, kind, id, name, slug]) => ({
  id,
  name,
  feeds: [kind === 'cbc' ? { url: `https://www.cbc.ca/webfeed/rss/rss-canada-${slug}`, source: 'CBC News' } : { url: `https://feeds.bbci.co.uk/news/${slug}/rss.xml`, source: 'BBC News' }],
}));

const dir = 'public/content/news/local';
fs.mkdirSync(dir, { recursive: true });
let ok = 0;
for (const r of regions) {
  const stories = [];
  for (const f of r.feeds) {
    try {
      const res = await fetch(f.url, { headers: { 'user-agent': 'HootNewsBot/1.0 (+https://hootdaily.com)' } });
      if (!res.ok) throw new Error(String(res.status));
      for (const it of parseItems(await res.text()).slice(0, 15)) {
        if (!it.title || !it.link) continue;
        stories.push({ id: Buffer.from(it.link).toString('base64url').slice(-16), title: it.title.trim(), summary: (it.summary || '').slice(0, 280), image: it.image || '', source: f.source, url: it.link, published: it.date && !isNaN(Date.parse(it.date)) ? new Date(it.date).toISOString() : new Date().toISOString() });
      }
    } catch (e) {
      console.warn(`skip ${r.id} ${f.url}: ${e.message}`);
    }
  }
  if (stories.length < 3) continue; // keep yesterday's file rather than an empty one
  stories.sort((a, b) => b.published.localeCompare(a.published));
  fs.writeFileSync(path.join(dir, `${r.id}.json`), JSON.stringify({ built: new Date().toISOString(), region: r.name, stories: stories.slice(0, 12) }));
  ok++;
}
console.log(`local news: ${ok}/${regions.length} regions`);
