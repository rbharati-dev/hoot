// All settings in one place. Plain settings come from functions/.env; the two
// API keys are secrets (Secret Manager in production, .secret.local in the
// emulator). A key set to "none" or left empty means "not set up yet".
import { defineSecret } from 'firebase-functions/params';

export const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
export const SECRETS = [OPENAI_API_KEY, ANTHROPIC_API_KEY];

const num = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};
const str = (name: string, fallback: string) => (process.env[name] ?? '').trim() || fallback;
const key = (s: { value(): string }) => {
  try {
    const v = s.value().trim();
    return v && v.toLowerCase() !== 'none' ? v : '';
  } catch {
    return '';
  }
};
export const isEmulator = () => process.env.FUNCTIONS_EMULATOR === 'true';

export function config() {
  return {
    transcribeProvider: str('TRANSCRIBE_PROVIDER', 'openai'),
    transcribeModel: str('TRANSCRIBE_MODEL', 'gpt-transcribe'),
    editProvider: str('EDIT_PROVIDER', 'anthropic'),
    editModel: str('EDIT_MODEL', 'claude-sonnet-5-5'),
    anthropicVersion: str('ANTHROPIC_VERSION', '2023-06-01'),
    maxUploadBytes: num('MAX_UPLOAD_MB', 24) * 1024 * 1024,
    maxRecordingSeconds: num('MAX_RECORDING_SECONDS', 3600),
    maxRetries: num('MAX_RETRIES', 4),
    dailySecondsLimit: num('DAILY_SECONDS_LIMIT', 4 * 3600),
    dailyRecordingsLimit: num('DAILY_RECORDINGS_LIMIT', 60),
    transcribeUsdPerMin: num('TRANSCRIBE_USD_PER_MIN', 0.0045),
    editUsdPerMTokIn: num('EDIT_USD_PER_MTOK_IN', 3),
    editUsdPerMTokOut: num('EDIT_USD_PER_MTOK_OUT', 15),
    storageUsdPerGbMonth: num('STORAGE_USD_PER_GB_MONTH', 0.026),
    adminUids: str('ADMIN_UIDS', '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    openaiKey: key(OPENAI_API_KEY),
    anthropicKey: key(ANTHROPIC_API_KEY),
  };
}
export type Config = ReturnType<typeof config>;
