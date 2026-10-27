import { describe, expect, it } from 'vitest';
import { arrange, withoutDuplicates, type Card, type Profile } from '../../src/lib/data';

const card = (over: Partial<Card>): Card => ({ id: Math.random().toString(36), year: 1967, type: 'news', title: 'x', text: 'y', wiki: 'Z', ...over });
const profile: Profile = { born: 1952, country: 'ca', likes: ['hockey'], hideHeavy: true };

describe('feed helpers', () => {
  it('drops live cards that repeat a hand-written one', () => {
    const curated = [card({ title: 'The Leafs win the Stanley Cup', wiki: '1967 Stanley Cup Final' }), card({ title: 'Expo 67 in Montreal', wiki: 'Expo 67' })];
    const live = [
      card({ live: true, wiki: 'Expo 67', title: 'Expo 67 opens' }),
      card({ live: true, wiki: '1967 Stanley Cup Final', title: 'The Toronto Maple Leafs win the Stanley Cup' }),
      card({ live: true, wiki: 'Order of Canada', title: 'The Order of Canada is created' }),
    ];
    expect(withoutDuplicates(curated, live).map(c => c.wiki)).toEqual(['Order of Canada']);
  });

  it('hides hard history on request, puts interests first, and avoids two of a kind in a row', () => {
    const cards = [
      card({ type: 'news', heavy: true }),
      card({ type: 'news' }),
      card({ type: 'news' }),
      card({ type: 'sport', tags: ['hockey'] }),
      card({ type: 'tv' }),
    ];
    const out = arrange(cards, profile);
    expect(out.length).toBe(4);
    expect(out.some(c => c.heavy)).toBe(false);
    expect(out[0].tags).toEqual(['hockey']);
    expect(out[1].type).not.toBe(out[2].type);
  });
});
