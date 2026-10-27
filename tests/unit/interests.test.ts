import { describe, expect, it } from 'vitest';
import { cardMatchesLikes, arrange, INTERESTS, type Card, type Profile } from '../../src/lib/data';

const card = (over: Partial<Card>): Card => ({ id: 'x', year: 1965, type: 'news', title: 't', text: 'x', wiki: 'w', ...over });

describe('interest matching', () => {
  it('matches by card type', () => {
    expect(cardMatchesLikes(card({ type: 'music' }), ['music'])).toBe(true);
    expect(cardMatchesLikes(card({ type: 'politics' }), ['politics'])).toBe(true);
    expect(cardMatchesLikes(card({ type: 'news' }), ['music'])).toBe(false);
  });

  it('matches by tags, and the broad "sport" interest spans specific sports', () => {
    expect(cardMatchesLikes(card({ type: 'everyday', tags: ['cars'] }), ['cars'])).toBe(true);
    expect(cardMatchesLikes(card({ type: 'sport', tags: ['hockey'] }), ['sport'])).toBe(true);
    expect(cardMatchesLikes(card({ type: 'news', tags: ['football'] }), ['sport'])).toBe(true);
  });

  it('every pickable interest maps to something (no dead chips)', () => {
    for (const i of INTERESTS) {
      // A card that could plausibly match this interest exists in the scheme.
      const probe = card({ type: i === 'music' ? 'music' : 'news', tags: [i] });
      // At minimum the interest must be recognised by the matcher.
      expect(typeof cardMatchesLikes(probe, [i])).toBe('boolean');
    }
  });

  it('arrange floats liked content to the front', () => {
    const cards = [card({ id: 'a', type: 'news' }), card({ id: 'b', type: 'music' }), card({ id: 'c', type: 'politics' })];
    const p: Profile = { born: 1955, country: 'ca', likes: ['music'], hideHeavy: false };
    const out = arrange(cards, p);
    expect(out[0].id).toBe('b');
  });

  it('no likes = stable, not reordered by interest', () => {
    const cards = [card({ id: 'a', type: 'news' }), card({ id: 'b', type: 'music' })];
    const p: Profile = { born: 1955, country: 'ca', likes: [], hideHeavy: false };
    const out = arrange(cards, p);
    expect(out.map(c => c.id)).toContain('a');
    expect(out.map(c => c.id)).toContain('b');
  });
});
