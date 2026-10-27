import { describe, expect, it } from 'vitest';
import { localized, type Card } from '../../src/lib/data';

const base: Card = {
  id: 'x-1960-a',
  year: 1960,
  type: 'news',
  title: 'English title',
  text: 'English text.',
  wiki: 'Something',
  t: { ru: { title: 'Русский заголовок', text: 'Русский текст.' }, hi: { title: 'हिन्दी', text: 'हिन्दी पाठ।' } },
};

describe('localized()', () => {
  it('returns the translation when one exists for the language', () => {
    expect(localized(base, 'ru')).toEqual({ title: 'Русский заголовок', text: 'Русский текст.' });
    expect(localized(base, 'hi')).toEqual({ title: 'हिन्दी', text: 'हिन्दी पाठ।' });
  });

  it('falls back to English base when the language is missing', () => {
    // This is the Canada-in-Russian case: UI may be Russian, but an untranslated
    // card shows its English base rather than another language's text.
    expect(localized(base, 'fr')).toEqual({ title: 'English title', text: 'English text.' });
    expect(localized(base, 'ne')).toEqual({ title: 'English title', text: 'English text.' });
  });

  it('never returns a different language than the one requested or English', () => {
    // A French request must never surface the Russian translation.
    const fr = localized(base, 'fr');
    expect(fr.title).not.toContain('Русский');
    expect(fr.text).not.toContain('Русский');
  });

  it('uses the base text for English even when no en translation object exists', () => {
    expect(localized(base, 'en')).toEqual({ title: 'English title', text: 'English text.' });
  });
});
