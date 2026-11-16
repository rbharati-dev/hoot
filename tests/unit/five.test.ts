import { describe, expect, it } from 'vitest';
import { mixFive, roundRobinByType, isSongCard } from '../../src/lib/daily';
import { arrange, type Card, type Profile } from '../../src/lib/data';

const card = (id: string, type: string, extra: Partial<Card> = {}): Card => ({ id, year: 1965, type, title: id, text: 'x', wiki: id, ...extra }) as Card;
const songs = Array.from({ length: 30 }, (_, i) => card('s' + i, 'music', { yt: 'v' + i }));
const others = [card('n1', 'news'), card('c1', 'culture'), card('n2', 'news'), card('sc1', 'science'), card('t1', 'tv'), card('n3', 'news')];

describe("today's five: a mix, never only songs", () => {
  it('takes one of each kind in turn, even from a list that is mostly songs', () => {
    const picked = roundRobinByType([...songs, ...others], 5);
    expect(picked.filter(isSongCard)).toHaveLength(1);
    expect(new Set(picked.map(c => c.type)).size).toBe(5);
  });
  it('allows at most one song when the set ends on the song game, two otherwise', () => {
    const list = [songs[0], songs[1], songs[2], ...others];
    expect(mixFive(list, 4, 1).filter(isSongCard)).toHaveLength(1);
    expect(mixFive(list, 5, 2).filter(isSongCard)).toHaveLength(2);
    expect(mixFive(list, 4, 1)).toHaveLength(4);
  });
  it('no kind takes more than two places', () => {
    const news = Array.from({ length: 6 }, (_, i) => card('n' + i, 'news'));
    const got = mixFive([...news, card('c', 'culture'), card('s', 'science'), card('t', 'tv')], 5, 1);
    expect(got.filter(c => c.type === 'news')).toHaveLength(2);
  });
  it('still fills the set in a thin year with nothing but songs', () => {
    expect(mixFive(songs, 4, 1)).toHaveLength(4);
  });
});

describe('the Memories feed spaces songs out', () => {
  it('has at most one song in any three cards while other cards remain', () => {
    const p = { born: 1950, country: 'ca', likes: ['music'], hideHeavy: false } as Profile;
    const many = [...songs, ...Array.from({ length: 80 }, (_, i) => card('o' + i, ['news', 'culture', 'science', 'tv'][i % 4]))];
    const feed = arrange(many, p);
    const head = feed.slice(0, 60);
    for (let i = 0; i + 3 <= head.length; i++) expect(head.slice(i, i + 3).filter(isSongCard).length, `cards ${i}–${i + 2}`).toBeLessThanOrEqual(1);
  });
});
