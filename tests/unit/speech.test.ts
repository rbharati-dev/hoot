import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { speak, stop, pickVoice, hasVoiceFor, canSpeak } from '../../src/lib/speech';

const v = (lang: string, extra: Partial<SpeechSynthesisVoice> = {}) =>
  ({ lang, name: lang, localService: false, default: false, voiceURI: lang, ...extra }) as SpeechSynthesisVoice;

let voices: SpeechSynthesisVoice[];
let synth: { speak: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn>; getVoices: () => SpeechSynthesisVoice[] };

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

beforeEach(() => {
  voices = [v('en-US', { default: true }), v('hi-IN', { localService: true }), v('fr-CA'), v('fr-FR', { localService: true })];
  synth = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => voices };
  vi.stubGlobal('window', { speechSynthesis: synth });
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
});
afterEach(() => vi.unstubAllGlobals());

describe('speech', () => {
  it('detects support', () => {
    expect(canSpeak()).toBe(true);
    expect(hasVoiceFor('hi')).toBe(true);
    expect(hasVoiceFor('ne')).toBe(false);
  });
  it('picks hi and fr voices', () => {
    expect(pickVoice('hi')?.lang).toBe('hi-IN');
    expect(pickVoice('fr')?.lang).toBe('fr-FR');
  });
  it('speaks with lang, slow rate, and calls onEnd once', () => {
    const end = vi.fn();
    speak('Bonjour', 'fr', end);
    const u = synth.speak.mock.calls[0][0] as FakeUtterance;
    expect(u.lang).toBe('fr-FR');
    expect(u.rate).toBeLessThan(1);
    expect(u.voice?.lang).toBe('fr-FR');
    u.onend?.();
    u.onerror?.();
    expect(end).toHaveBeenCalledTimes(1);
  });
  it('cancels previous speech before speaking', () => {
    speak('a', 'en');
    speak('b', 'en');
    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(synth.cancel.mock.invocationCallOrder[1]).toBeLessThan(synth.speak.mock.invocationCallOrder[1]);
  });
  it('stop cancels', () => {
    stop();
    expect(synth.cancel).toHaveBeenCalled();
  });
});
