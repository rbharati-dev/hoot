// Tiny wrapper over window.speechSynthesis for "Read to me".

const BCP: Record<string, string> = {
  en: 'en-US', ru: 'ru-RU', fr: 'fr-FR', de: 'de-DE', it: 'it-IT',
  pt: 'pt-BR', es: 'es-ES', hi: 'hi-IN', ne: 'ne-NP',
};

export const RATE = 0.92;

export function bcp47(lang: string): string {
  return BCP[lang] ?? lang;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

function voices(): SpeechSynthesisVoice[] {
  try {
    return window.speechSynthesis.getVoices() ?? [];
  } catch {
    return [];
  }
}

const code = (l: string) => l.toLowerCase().split(/[-_]/)[0];

export function pickVoice(lang: string, list: SpeechSynthesisVoice[] = voices()): SpeechSynthesisVoice | undefined {
  const want = bcp47(lang).toLowerCase().replace('_', '-');
  const matches = list.filter(v => code(v.lang) === code(lang));
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase().replace('_', '-') === want ? 4 : 0) + (v.localService ? 2 : 0) + (v.default ? 1 : 0);
  return matches.sort((a, b) => score(b) - score(a))[0];
}

export function hasVoiceFor(lang: string): boolean {
  return canSpeak() && !!pickVoice(lang);
}

// Voices can load asynchronously; calls back when the list changes. Returns an unsubscribe.
export function onVoicesChanged(cb: () => void): () => void {
  if (!canSpeak()) return () => {};
  const s = window.speechSynthesis;
  s.addEventListener?.('voiceschanged', cb);
  return () => s.removeEventListener?.('voiceschanged', cb);
}

export function speak(text: string, lang: string, onEnd?: () => void): void {
  if (!canSpeak()) {
    onEnd?.();
    return;
  }
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = bcp47(lang);
  u.rate = RATE;
  const v = pickVoice(lang);
  if (v) u.voice = v;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onEnd?.();
  };
  u.onend = finish;
  u.onerror = finish;
  s.speak(u);
}

export function stop(): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
}
