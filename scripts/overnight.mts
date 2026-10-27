// The overnight build. Once a night (GitHub Actions) this walks every country
// that has a live Wikipedia source and every year in range, runs the SAME
// engine the browser uses (src/lib/wiki-core.ts) to turn year pages into ranked,
// sourced memory cards, and writes them to public/content/live/<country>/<year>.json
// with an index.json. The deployed app then opens these feeds instantly instead
// of hitting Wikipedia live on first view.
//
// Run: npm run overnight   (node via tsx, so it can import the TypeScript core)

import fs from 'node:fs';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { SOURCES, buildYear } from '../src/lib/wiki-core.ts';

const FROM = 1940;
const TO = new Date().getFullYear();
const OUT = 'public/content/live';

// linkedom gives us a DOM; wrap it to match the (html) => Document contract.
const parse = (html: string) => parseHTML(html).document as unknown as Document;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  fs.rmSync(OUT, { recursive: true, force: true });
  const index: Record<string, number[]> = {};
  const countries = Object.keys(SOURCES);
  console.log(`Overnight build: ${countries.join(', ')} — ${FROM}..${TO}`);

  for (const country of countries) {
    fs.mkdirSync(path.join(OUT, country), { recursive: true });
    const years: number[] = [];
    for (let year = FROM; year <= TO; year++) {
      let cards: Awaited<ReturnType<typeof buildYear>> = [];
      try {
        cards = await buildYear(country, year, parse);
      } catch (e) {
        console.warn(`  ${country} ${year}: ${(e as Error).message}`);
      }
      if (cards.length) {
        fs.writeFileSync(path.join(OUT, country, `${year}.json`), JSON.stringify(cards));
        years.push(year);
        console.log(`  ${country} ${year}: ${cards.length} cards`);
      }
      await sleep(250); // be gentle with Wikipedia
    }
    if (years.length) index[country] = years;
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
  const total = Object.values(index).reduce((n, y) => n + y.length, 0);
  console.log(`Done: ${total} year-files across ${Object.keys(index).length} countries.`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
