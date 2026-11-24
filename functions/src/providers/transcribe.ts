// Speech-to-text behind one small interface, so the service can be changed
// later without touching the rest of the pipeline:
//   transcribeAudio({ audio, mime, languages, prompt, keywords }) → result
// Providers never invent text: with no key, the result says so plainly.
import { isEmulator, type Config } from '../config.js';

export interface TranscribeInput {
  audio: Buffer;
  mime: string;
  filename: string;
  /** Language hints, e.g. ['en'] (ISO 639-1). */
  languages: string[];
  /** Short context: the question being answered. */
  prompt: string;
  /** Names, places and words to listen for (from the person's earlier stories). */
  keywords: string[];
}
export type TranscribeResult =
  | {
      ok: true;
      text: string;
      provider: string;
      model: string;
      /** Seconds the provider says it processed, when it reports that. */
      seconds: number | null;
      language: string | null;
      /** Provider-reported cost when available (none report money directly today). */
      costUsd: number | null;
      usageBasis: string;
    }
  | { ok: false; retryable: boolean; code: string; message: string; provider: string; model: string };

const fail = (provider: string, model: string, code: string, retryable: boolean, message = code): TranscribeResult => ({ ok: false, retryable, code, message, provider, model });

export function transcribeConfigured(cfg: Config): boolean {
  if (cfg.transcribeProvider === 'openai') return !!cfg.openaiKey;
  if (cfg.transcribeProvider === 'fake') return isEmulator();
  return false;
}

export async function transcribeAudio(input: TranscribeInput, cfg: Config): Promise<TranscribeResult> {
  const { transcribeProvider: provider, transcribeModel: model } = cfg;
  if (provider === 'fake') return fakeTranscribe(input, model);
  if (provider === 'openai') return openaiTranscribe(input, cfg);
  return fail(provider, model, 'unknown_provider', false, `No transcription provider called "${provider}"`);
}

async function openaiTranscribe(input: TranscribeInput, cfg: Config): Promise<TranscribeResult> {
  const provider = 'openai';
  const model = cfg.transcribeModel;
  if (!cfg.openaiKey) return fail(provider, model, 'not_configured', false);
  const form = new FormData();
  form.append('model', model);
  form.append('file', new Blob([new Uint8Array(input.audio)], { type: input.mime }), input.filename);
  form.append('response_format', 'json');
  if (input.prompt) form.append('prompt', input.prompt.slice(0, 800));
  // gpt-transcribe takes literal keywords (one per line) and several language hints.
  const words = input.keywords.map(k => k.replace(/[<>\n\r]/g, ' ').trim()).filter(Boolean).slice(0, 50);
  if (words.length && model === 'gpt-transcribe') form.append('keywords', words.join('\n'));
  if (model === 'gpt-transcribe') input.languages.forEach(l => form.append('languages[]', l));
  else if (input.languages[0]) form.append('language', input.languages[0]);

  let r: Response;
  try {
    r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${cfg.openaiKey}` },
      body: form,
      signal: AbortSignal.timeout(8 * 60_000),
    });
  } catch (e) {
    return fail(provider, model, 'network', true, (e as Error).name);
  }
  if (!r.ok) {
    const body = (await r.text().catch(() => '')).slice(0, 300);
    const retryable = r.status === 429 || r.status >= 500;
    return fail(provider, model, `http_${r.status}`, retryable, body.replace(/\s+/g, ' '));
  }
  const j = (await r.json()) as { text?: string; languages?: string[]; usage?: { type?: string; seconds?: number } };
  const text = (j.text ?? '').trim();
  const seconds = j.usage?.type === 'duration' && typeof j.usage.seconds === 'number' ? j.usage.seconds : null;
  return { ok: true, text, provider, model, seconds, language: j.languages?.[0] ?? input.languages[0] ?? null, costUsd: null, usageBasis: seconds !== null ? 'provider: seconds' : 'estimate: measured duration' };
}

/** Test-only provider: works only inside the Firebase emulator, and says what it is. */
function fakeTranscribe(input: TranscribeInput, model: string): TranscribeResult {
  if (!isEmulator()) return fail('fake', model, 'fake_outside_emulator', false);
  if (input.prompt.includes('[fail-transcribe]')) return fail('fake', model, 'http_503', true, 'simulated outage');
  return {
    ok: true,
    text: `[Test transcript from the emulator — not real speech] Well, I think it was 1974, maybe 1975, and my dad had this old blue Ford. (${input.audio.length} bytes of ${input.mime})`,
    provider: 'fake',
    model,
    seconds: null,
    language: input.languages[0] ?? 'en',
    costUsd: null,
    usageBasis: 'test',
  };
}
