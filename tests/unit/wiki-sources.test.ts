import { describe, expect, it } from 'vitest';
import { parseHTML } from 'linkedom';
import { GDR, SOURCES, SOVIET, readList, titleFromUrl, wikidataQuery, workTitle } from '../../src/lib/wiki-core';

const doc = (html: string) => parseHTML(`<html><body>${html}</body></html>`).document as unknown as Document;
const a = (t: string) => `<a rel="mw:WikiLink" href="./${encodeURIComponent(t.replace(/ /g, '_'))}">${t}</a>`;

describe('new country sources', () => {
  it('every thin country now has native-language or Wikidata sources', () => {
    const hosts = (c: string) => new Set(SOURCES[c].map(s => s.host));
    expect(hosts('su').has('ru.wikipedia.org')).toBe(true);
    expect(hosts('dd').has('de.wikipedia.org')).toBe(true);
    expect(hosts('co').has('es.wikipedia.org')).toBe(true);
    expect(SOURCES.np.some(s => s.kind === 'wikidata')).toBe(true);
    for (const c of ['su', 'dd', 'co', 'np']) expect(SOURCES[c].some(s => s.kind === 'wikidata')).toBe(true);
  });

  it('a German world year page keeps only the East German items', () => {
    const d = doc(`<section><h3>Politik und Weltgeschehen</h3><ul>
      <li>13. August: Die ${a('DDR')} beginnt mit dem Bau der ${a('Berliner Mauer')} quer durch Berlin.</li>
      <li>20. Januar: ${a('John F. Kennedy')} wird als Präsident der Vereinigten Staaten vereidigt.</li>
      <li>12. April: ${a('Juri Gagarin')} umkreist als erster Mensch die Erde, bejubelt in Ost-Berlin.</li>
    </ul></section>`);
    const out = readList(d.querySelector('section')!, GDR);
    expect(out.map(r => r.links[0])).toEqual(['DDR', 'Juri Gagarin']);
    expect(out[0].date).toBe('13. August');
    expect(out[0].title).toMatch(/^Die DDR beginnt/);
  });

  it('a Russian year page keeps the Soviet items, and skips date links', () => {
    const d = doc(`<section><h2>События</h2><ul>
      <li>${a('3 февраля')} — советская станция ${a('Луна-9')} совершила мягкую посадку на Луну.</li>
      <li>${a('30 июля')} — сборная Англии выиграла ${a('Чемпионат мира по футболу 1966')}.</li>
    </ul></section>`);
    const out = readList(d.querySelector('section')!, SOVIET);
    expect(out).toHaveLength(1);
    expect(out[0].links).toEqual(['Луна-9']);
    expect(out[0].date).toBe('3 февраля');
  });

  it('film titles from Wikidata lose their "(film)" note in every language', () => {
    expect(workTitle('Die Legende von Paul und Paula (Film)')).toBe('Die Legende von Paul und Paula');
    expect(workTitle('Бриллиантовая рука (фильм)')).toBe('Бриллиантовая рука');
    expect(workTitle('Solaris (película de 1972)')).toBe('Solaris');
    expect(workTitle('Kusume Rumal (1985)')).toBe('Kusume Rumal');
    expect(workTitle('Ironiya Sudby')).toBe('Ironiya Sudby');
    expect(titleFromUrl('https://ru.wikipedia.org/wiki/%D0%9B%D1%83%D0%BD%D0%B0-9')).toBe('Луна-9');
  });

  it('the Wikidata query asks for that country, year and Wikipedia', () => {
    const q = wikidataQuery('Q16957', 'Q11424', 1973, 'de.wikipedia.org', 40);
    expect(q).toContain('wdt:P495 wd:Q16957');
    expect(q).toContain('YEAR(?date) = 1973');
    expect(q).toContain('<https://de.wikipedia.org/>');
    expect(q).toContain('LIMIT 40');
  });
});

describe('cleaner Colombian events', () => {
  it('skips birthday lines but keeps real events', () => {
    const d = doc(`<section><h2>Acontecimientos</h2><ul>
      <li>18 de enero: ${a('Xiomara Xibillé')}, Medellín, actriz, cantante y presentadora.</li>
      <li>13 de marzo: se efectúan las primeras ${a('Elecciones regionales de Colombia de 1988')} para alcalde.</li>
    </ul></section>`);
    expect(readList(d.querySelector('section')!).map(r => r.links[0])).toEqual(['Elecciones regionales de Colombia de 1988']);
  });
  it('every country also gets world news, science and books', () => {
    for (const c of Object.keys(SOURCES)) {
      expect(SOURCES[c].some(s => s.page(1966) === '1966' && s.host === 'en.wikipedia.org')).toBe(true);
      expect(SOURCES[c].some(s => s.page(1966) === '1966 in science')).toBe(true);
    }
  });
});
