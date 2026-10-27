import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RATE, bcp47, canSpeak, hasVoiceFor, pickVoice, speak, stop } from '../../src/lib/speech';

const v = (lang: string, extra: Partial<SpeechSynthesisVoice> = {}) =>
  ({ lang, name: `${lang}-${extra.localService ? 'local' : 'net'}`, localService: false, default: false, voiceURI: lang, ...extra }) as SpeechSynthesisVoice;

class Utt {
  lang = ''; rate = 1; voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null; onerror: (() => void) | null = null;
  constructor(public text: string) {}
}
let voices: SpeechSynthesisVoice[];
let order: string[];
let spoken: Utt[];
let synth: { speak: (u: Utt) => void; cancel: () => void; getVoices: () => SpeechSynthesisVoice[] };

const ALL: Record<string, string> = { en: 'en-US', ru: 'ru-RU', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR', es: 'es-ES', hi: 'hi-IN', ne: 'ne-NP' };
const realistic = () => [
  v('en-US', { default: true, localService: true }), v('en-GB'), v('ru-RU', { localService: true }), v('fr-CA'), v('fr-FR', { localService: true }), v('fr-FR'),
  v('de-DE'), v('it-IT', { localService: true }), v('pt-PT'), v('pt-BR', { localService: true }), v('es-MX'), v('es-ES', { localService: true }), v('hi-IN'), v('ja-JP'),
];

beforeEach(() => {
  voices = realistic();
  order = [];
  spoken = [];
  synth = { speak: u => { order.push('speak'); spoken.push(u); }, cancel: () => void order.push('cancel'), getVoices: () => voices };
  vi.stubGlobal('window', { speechSynthesis: synth });
  vi.stubGlobal('SpeechSynthesisUtterance', Utt);
});
afterEach(() => vi.unstubAllGlobals());

describe('voice choice', () => {
  it.each(Object.keys(ALL))('%s: a voice whose language matches is picked', lang => {
    const picked = pickVoice(lang);
    if (lang === 'ne') expect(picked).toBeUndefined();
    else expect(picked!.lang.split('-')[0]).toBe(lang);
  });
  it.each(Object.entries(ALL))('%s maps to %s', (l, tag) => expect(bcp47(l)).toBe(tag));
  it('unknown language tag passes through', () => expect(bcp47('ja')).toBe('ja'));
  it('prefers the exact regional voice, then local, then default', () => {
    expect(pickVoice('pt')!.lang).toBe('pt-BR');
    expect(pickVoice('es')!.lang).toBe('es-ES');
    expect(pickVoice('fr')!.lang).toBe('fr-FR');
    expect(pickVoice('fr')!.localService).toBe(true);
    expect(pickVoice('en')!.lang).toBe('en-US');
  });
  it('falls back to another region when the exact one is missing', () => {
    expect(pickVoice('pt', [v('pt-PT')])!.lang).toBe('pt-PT');
    expect(pickVoice('es', [v('es-MX'), v('es-AR')])!.lang).toBe('es-MX');
  });
  it('prefers a local service among equals; default breaks ties', () => {
    expect(pickVoice('de', [v('de-DE'), v('de-DE', { localService: true })])!.localService).toBe(true);
    const d = v('en-GB', { default: true });
    expect(pickVoice('en', [v('en-AU'), d])).toBe(d);
  });
  it('underscore language tags are understood', () => {
    expect(pickVoice('fr', [v('fr_FR')])!.lang).toBe('fr_FR');
  });
  it('empty voice list gives undefined', () => expect(pickVoice('en', [])).toBeUndefined());
  it('does not confuse prefixes (e.g. "hi" vs "he")', () => expect(pickVoice('hi', [v('he-IL'), v('hr-HR')])).toBeUndefined());
});

describe('hasVoiceFor', () => {
  it.each(Object.keys(ALL))('%s with the realistic list', lang => expect(hasVoiceFor(lang)).toBe(lang !== 'ne'));
  it.each(Object.keys(ALL))('%s is false when its voice is missing', lang => {
    voices = voices.filter(x => x.lang.split('-')[0] !== lang);
    expect(hasVoiceFor(lang)).toBe(false);
    for (const other of Object.keys(ALL)) if (other !== lang && other !== 'ne') expect(hasVoiceFor(other), other).toBe(true);
  });
  it('false with no voices at all', () => {
    voices = [];
    for (const l of Object.keys(ALL)) expect(hasVoiceFor(l)).toBe(false);
  });
  it('false when getVoices throws', () => {
    synth.getVoices = () => { throw new Error('no'); };
    expect(hasVoiceFor('en')).toBe(false);
  });
  it('false when speech is unsupported', () => {
    vi.stubGlobal('window', {});
    expect(canSpeak()).toBe(false);
    expect(hasVoiceFor('en')).toBe(false);
  });
  it('canSpeak requires an utterance constructor', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', undefined);
    expect(canSpeak()).toBe(false);
  });
});

describe('speak', () => {
  it.each(Object.keys(ALL))('%s: utterance gets language, rate, and the chosen voice', lang => {
    speak('hello', lang);
    const u = spoken[0];
    expect(u.text).toBe('hello');
    expect(u.lang).toBe(ALL[lang]);
    expect(u.rate).toBe(RATE);
    expect(u.voice).toBe(pickVoice(lang) ?? null);
  });
  it('cancels the previous speech before starting a new one', () => {
    speak('one', 'en');
    speak('two', 'fr');
    expect(order).toEqual(['cancel', 'speak', 'cancel', 'speak']);
  });
  it('onEnd fires once for end then error, in either order', () => {
    const a = vi.fn();
    speak('x', 'en', a);
    spoken[0].onend!();
    spoken[0].onend!();
    spoken[0].onerror!();
    expect(a).toHaveBeenCalledTimes(1);
    const b = vi.fn();
    speak('y', 'en', b);
    spoken[1].onerror!();
    spoken[1].onend!();
    expect(b).toHaveBeenCalledTimes(1);
  });
  it('onEnd does not fire before the speech ends', () => {
    const a = vi.fn();
    speak('x', 'en', a);
    expect(a).not.toHaveBeenCalled();
  });
  it('works without an onEnd callback', () => {
    speak('x', 'en');
    expect(() => spoken[0].onend!()).not.toThrow();
  });
  it('unsupported: calls onEnd immediately, speaks nothing', () => {
    vi.stubGlobal('window', {});
    const a = vi.fn();
    speak('x', 'en', a);
    expect(a).toHaveBeenCalledTimes(1);
    expect(spoken.length).toBe(0);
  });
  it('no voice available still speaks with the language tag', () => {
    voices = [];
    speak('namaste', 'ne');
    expect(spoken[0].lang).toBe('ne-NP');
    expect(spoken[0].voice).toBeNull();
  });
  it('stop cancels, and is safe when unsupported', () => {
    stop();
    expect(order).toEqual(['cancel']);
    vi.stubGlobal('window', {});
    expect(() => stop()).not.toThrow();
  });
});
