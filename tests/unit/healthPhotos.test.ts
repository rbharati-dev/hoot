import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { photoFor } from '../../src/lib/healthPhotos';

const lib = JSON.parse(fs.readFileSync('public/photos/health/photos.json', 'utf8'));
const TOPICS = ['intimacy', 'menopause', 'men', 'energy', 'sleep', 'memory', 'heart', 'joints', 'strength', 'weight', 'eating', 'digestion', 'bladder', 'senses', 'skin', 'mood', 'pain', 'lungs', 'staywell', 'longevity'];

describe('health photos', () => {
  it('every topic has photos to choose from, and each tip always gets the same one', () => {
    for (const t of TOPICS) {
      const a = photoFor(lib, t, 'h-x-1');
      expect(a, t).not.toBeNull();
      expect(photoFor(lib, t, 'h-x-1')).toEqual(a);
    }
  });
  it('every photo exists in both sizes and is openly licensed with a credit', () => {
    for (const list of Object.values(lib.photos) as { f: string; by: string; license: string; source: string }[][])
      for (const p of list) {
        expect(fs.existsSync(`public/photos/health/${p.f}.jpg`), p.f).toBe(true);
        expect(fs.existsSync(`public/photos/health/${p.f}-900.jpg`), p.f).toBe(true);
        expect(p.license).toMatch(/^(CC0|CC BY(-SA)? [0-9.]+|Public domain)$/);
        expect(p.source).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      }
  });
});
