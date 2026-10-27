import { describe, expect, it } from 'vitest';
import { rankNews, newsMatchesLikes, type NewsStory } from '../../src/lib/data';

const story = (o: Partial<NewsStory>): NewsStory => ({
  id: o.id ?? 'x',
  title: o.title ?? 't',
  summary: o.summary ?? '',
  source: o.source ?? 'BBC News',
  url: o.url ?? 'https://example.com',
  topic: o.topic ?? 'world',
  published: o.published ?? new Date().toISOString(),
  importance: o.importance ?? 1,
});

describe('news ranking', () => {
  it('maps topics to interests', () => {
    expect(newsMatchesLikes(story({ topic: 'music' }), ['music'])).toBe(true);
    expect(newsMatchesLikes(story({ topic: 'science' }), ['space'])).toBe(true);
    expect(newsMatchesLikes(story({ topic: 'sport' }), ['football'])).toBe(true);
    expect(newsMatchesLikes(story({ topic: 'world' }), ['news'])).toBe(true);
    expect(newsMatchesLikes(story({ topic: 'music' }), ['sport'])).toBe(false);
  });

  it('floats interest-matching stories above others', () => {
    const feed = [
      story({ id: 'a', topic: 'sport', importance: 9 }),
      story({ id: 'b', topic: 'music', importance: 2 }),
      story({ id: 'c', topic: 'world', importance: 5 }),
    ];
    const ranked = rankNews(feed, ['music'], 12);
    expect(ranked[0].id).toBe('b'); // music first despite lower importance
  });

  it('falls back to pure importance when nothing matches, and caps the count', () => {
    const feed = Array.from({ length: 30 }, (_, i) => story({ id: String(i), importance: i }));
    const ranked = rankNews(feed, [], 12);
    expect(ranked.length).toBe(12);
    expect(ranked[0].importance).toBe(29); // biggest first
  });

  it('with no likes keeps the biggest stories', () => {
    const feed = [story({ id: 'a', importance: 1 }), story({ id: 'b', importance: 10 })];
    expect(rankNews(feed, [], 12)[0].id).toBe('b');
  });
});
