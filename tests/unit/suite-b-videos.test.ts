import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isBadVideo, markBadVideo } from '../../src/lib/videos';
import { memStorage } from './suite-b-helpers';

let s: ReturnType<typeof memStorage>;
beforeEach(() => { s = memStorage(); vi.stubGlobal('localStorage', s); });
afterEach(() => vi.unstubAllGlobals());
const list = () => JSON.parse(s.mem.get('hoot.badVideos') ?? '[]') as string[];

describe('bad videos', () => {
  it('nothing is bad at first', () => expect(isBadVideo('abc')).toBe(false));
  it.each([undefined, ''])('%j is never bad', id => {
    markBadVideo('abc');
    expect(isBadVideo(id)).toBe(false);
  });
  it('mark then check', () => {
    markBadVideo('abc');
    expect(isBadVideo('abc')).toBe(true);
    expect(isBadVideo('abd')).toBe(false);
  });
  it('newest first, no duplicates (re-marking moves it to the front)', () => {
    markBadVideo('a'); markBadVideo('b'); markBadVideo('c');
    expect(list()).toEqual(['c', 'b', 'a']);
    markBadVideo('a');
    expect(list()).toEqual(['a', 'c', 'b']);
    markBadVideo('a');
    expect(list()).toEqual(['a', 'c', 'b']);
  });
  it.each([499, 500, 501, 700])('after %i distinct ids the list is capped at 500, newest kept', n => {
    for (let i = 0; i < n; i++) markBadVideo(`v${i}`);
    const l = list();
    expect(l.length).toBe(Math.min(n, 500));
    expect(l[0]).toBe(`v${n - 1}`);
    expect(isBadVideo(`v${n - 1}`)).toBe(true);
    if (n > 500) {
      expect(isBadVideo('v0')).toBe(false);
      expect(isBadVideo(`v${n - 500}`)).toBe(true);
      expect(isBadVideo(`v${n - 501}`)).toBe(false);
    } else expect(isBadVideo('v0')).toBe(true);
  });
  it.each(['{broken', 'nul', '"str"x'])('corrupt storage %j is tolerated', raw => {
    s.mem.set('hoot.badVideos', raw);
    expect(isBadVideo('abc')).toBe(false);
    expect(() => markBadVideo('abc')).not.toThrow();
    expect(isBadVideo('abc')).toBe(true);
  });
  it('storage that throws is tolerated', () => {
    vi.stubGlobal('localStorage', memStorage({ throws: true }));
    expect(isBadVideo('abc')).toBe(false);
    expect(() => markBadVideo('abc')).not.toThrow();
  });
  it('ids are matched exactly', () => {
    markBadVideo('AbCdEfGhIjK');
    expect(isBadVideo('abcdefghijk')).toBe(false);
    expect(isBadVideo('AbCdEfGhIj')).toBe(false);
  });
});
