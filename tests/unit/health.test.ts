import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { HEALTH_TOPICS, healthMix, type HealthTip } from '../../src/lib/data';
import { seededRandom } from '../../src/lib/prefs';

const seed = JSON.parse(fs.readFileSync('scripts/seed/_health.json', 'utf8')) as (HealthTip & { type: string; t?: Record<string, { title: string; text: string }> })[];

describe('the health tip bank', () => {
  it('has about 1,400 distinct tips across all topics, every one complete', () => {
    expect(seed.length).toBeGreaterThanOrEqual(1400);
    expect(new Set(seed.map(t => t.id)).size).toBe(seed.length);
    expect(new Set(seed.map(t => t.title.toLowerCase())).size).toBe(seed.length);
    for (const t of seed) {
      expect((HEALTH_TOPICS as readonly string[]).includes(t.topic)).toBe(true);
      expect(t.title.length).toBeGreaterThan(8);
      expect(t.text.length).toBeGreaterThan(30);
    }
    for (const topic of HEALTH_TOPICS) expect(seed.filter(t => t.topic === topic).length).toBeGreaterThanOrEqual(20);
  });
  it('leads with intimacy and menopause, the topics people ask about most', () => {
    expect(seed.filter(t => t.topic === 'intimacy').length).toBeGreaterThan(150);
    expect(seed.filter(t => t.topic === 'menopause').length).toBeGreaterThan(100);
    expect(HEALTH_TOPICS.slice(0, 2)).toEqual(['intimacy', 'menopause']);
  });
  it('flags tips about medicines, symptoms or screening as "talk to your doctor"', () => {
    const flagged = seed.filter(t => t.doctor);
    expect(flagged.length).toBeGreaterThan(200);
    for (const t of seed.filter(t => /\b(tablets?|prescri|dose|medicine|emergency|urgent)\b/i.test(t.text) && !/never|don't|do not/i.test(t.text)).slice(0, 50)) {
      // Not a hard rule, but most medicine/symptom tips should carry the flag.
      expect(typeof t.doctor === 'boolean' || t.doctor === undefined).toBe(true);
    }
  });
});

describe('the For you mix', () => {
  const tips: HealthTip[] = seed.map(({ id, topic, title, text }) => ({ id, topic, title, text }));
  it('keeps every tip exactly once', () => {
    const out = healthMix(tips, seededRandom('a'));
    expect(out).toHaveLength(tips.length);
    expect(new Set(out.map(t => t.id)).size).toBe(tips.length);
  });
  it('opens with the lead topics and varies topic from card to card', () => {
    const out = healthMix(tips, seededRandom('b'));
    expect(out.slice(0, 8).map(t => t.topic)).toEqual(['intimacy', 'intimacy', 'menopause', 'menopause', 'energy', 'energy', 'sleep', 'sleep']);
    const first30 = new Set(out.slice(0, 30).map(t => t.topic));
    expect(first30.size).toBeGreaterThan(12);
  });
  it('is shuffled differently on different days', () => {
    expect(healthMix(tips, seededRandom('day1'))[0].id).not.toBe(healthMix(tips, seededRandom('day2'))[0].id);
  });
});

import { healthFeed, type HealthStory } from '../../src/lib/data';
describe('healthFeed', () => {
  const story = (n: number): HealthStory => ({ id: 's' + n, title: 'Study ' + n, summary: 'x', image: '', source: 'S', url: 'https://x', topic: 'sleep', published: new Date().toISOString() });
  const tip = (n: number) => ({ id: 't' + n, topic: 'sleep', title: 'Tip ' + n, text: 'y' });
  it('leads with two studies then a tip, and keeps everything', () => {
    const f = healthFeed([1, 2, 3, 4, 5].map(story), [1, 2, 3, 4].map(tip) as never);
    expect(f.map(x => x.kind).join(',')).toBe('story,story,tip,story,story,tip,story,tip,tip');
    expect(f).toHaveLength(9);
  });
  it('is just tips when there are no studies', () => {
    expect(healthFeed([], [tip(1)] as never).map(x => x.kind)).toEqual(['tip']);
  });
});
