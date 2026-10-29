import { describe, expect, it } from 'vitest';
import { balance } from '../../src/lib/data';
import type { Card } from '../../src/lib/data';

let n = 0;
const card = (type: string, live = true): Card => ({ id: `c${n++}`, year: 1966, type, title: `t${n}`, text: 'x', wiki: `w${n}`, live });

describe('a varied year', () => {
  it('songs are at most a third of the year when there are plenty of other memories', () => {
    const cards = [...Array.from({ length: 54 }, () => card('music')), ...Array.from({ length: 30 }, () => card('news'))];
    const out = balance(cards);
    const songs = out.filter(c => c.type === 'music').length;
    expect(songs).toBe(15);
    expect(out.filter(c => c.type === 'news')).toHaveLength(30);
    expect(songs / out.length).toBeLessThanOrEqual(1 / 3 + 0.01);
  });
  it('keeps the biggest hits (the first ones) and every hand-written card', () => {
    const hand = [card('music', false), card('music', false)];
    const charts = Array.from({ length: 40 }, () => card('music'));
    const out = balance([...charts, ...hand, ...Array.from({ length: 4 }, () => card('news'))]);
    expect(out).toEqual(expect.arrayContaining(hand));
    expect(out.filter(c => c.live && c.type === 'music').map(c => c.id)).toEqual(charts.slice(0, 4).map(c => c.id));
  });
  it('a quiet year still gets a handful of songs, and no other kind takes over', () => {
    expect(balance([...Array.from({ length: 10 }, () => card('music')), card('news')]).filter(c => c.type === 'music')).toHaveLength(6);
    const out = balance([...Array.from({ length: 60 }, () => card('film')), ...Array.from({ length: 20 }, () => card('news'))]);
    expect(out.filter(c => c.type === 'film').length).toBeLessThanOrEqual(40);
  });
});
