import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Checks every hand-written memory file before it ships.
const dir = 'scripts/seed';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const load = (f: string) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Record<string, unknown>[];

const KNOWN_TYPES = new Set(['music', 'song', 'news', 'politics', 'space', 'sport', 'tv', 'film', 'everyday', 'culture', 'wisdom', 'science', 'cricket']);
const KNOWN_LANGS = new Set(['en', 'ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne']);

describe('hand-written memories', () => {
  it('has content for at least 12 countries', () => expect(files.length).toBeGreaterThanOrEqual(12));

  for (const f of files) {
    it(`${f} is complete and well-formed`, () => {
      const cards = load(f);
      const ids = new Set<string>();
      const shared = f.startsWith('_'); // Reflections deck: not tied to a year
      // Country files prefix ids with their code (ca-…); shared decks use wis-.
      const expectPrefix = shared ? 'wis' : path.basename(f, '.json');
      for (const c of cards) {
        expect(c.id, f).toBeTruthy();
        expect(ids.has(c.id as string), `duplicate id ${c.id}`).toBe(false);
        ids.add(c.id as string);
        expect(String(c.id).split('-')[0], `${c.id} should start with "${expectPrefix}-"`).toBe(expectPrefix);
        if (shared) {
          expect(c.era, `${c.id} needs an era`).toBeTruthy();
        } else {
          expect(c.year as number).toBeGreaterThanOrEqual(1940);
          expect(c.year as number).toBeLessThanOrEqual(2000);
        }
        for (const k of ['type', 'title', 'text', 'wiki']) expect(c[k], `${c.id} ${k}`).toBeTruthy();
        expect(KNOWN_TYPES.has(c.type as string), `${c.id} unknown type "${c.type}"`).toBe(true);
        if (c.yt) expect(c.yt as string, c.id as string).toMatch(/^[\w-]{11}$/);
        if (c.pl) expect(c.pl as string, c.id as string).toMatch(/^(PL|OLAK)[\w-]{10,}$/);
        if (c.photo) expect(typeof c.photo, `${c.id} photo`).toBe('string');
        for (const [lang, tr] of Object.entries<{ title: string; text: string }>((c.t as never) ?? {})) {
          expect(KNOWN_LANGS.has(lang), `${c.id} unknown lang "${lang}"`).toBe(true);
          expect(tr.title, `${c.id} ${lang} title`).toBeTruthy();
          expect(tr.text, `${c.id} ${lang} text`).toBeTruthy();
        }
      }
    });
  }

  it('has no duplicate ids across all files', () => {
    const seen = new Map<string, string>();
    for (const f of files) {
      for (const c of load(f)) {
        const id = c.id as string;
        expect(seen.has(id), `id ${id} in both ${seen.get(id)} and ${f}`).toBe(false);
        seen.set(id, f);
      }
    }
  });

  it('shared Reflections deck holds only wisdom cards', () => {
    for (const c of load('_wisdom.json')) expect(c.type, c.id as string).toBe('wisdom');
  });
});
