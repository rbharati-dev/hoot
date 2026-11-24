// Checks an uploaded recording on the server: is it really audio, how big is
// it, and how long is it. The app's own numbers are never trusted for usage.
import { parseBuffer } from 'music-metadata';

export type Sniffed = 'webm' | 'mp4' | 'ogg' | 'wav' | 'mp3' | 'flac' | null;

/** Looks at the first bytes of the file, not at the name or the claimed type. */
export function sniff(b: Buffer): Sniffed {
  if (b.length < 12) return null;
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
  if (b.toString('latin1', 4, 8) === 'ftyp') return 'mp4';
  if (b.toString('latin1', 0, 4) === 'OggS') return 'ogg';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WAVE') return 'wav';
  if (b.toString('latin1', 0, 4) === 'fLaC') return 'flac';
  if (b.toString('latin1', 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'mp3';
  return null;
}
export const MIME_OF: Record<Exclude<Sniffed, null>, string> = { webm: 'audio/webm', mp4: 'audio/mp4', ogg: 'audio/ogg', wav: 'audio/wav', mp3: 'audio/mpeg', flac: 'audio/flac' };
export const EXT_OF: Record<Exclude<Sniffed, null>, string> = { webm: 'webm', mp4: 'm4a', ogg: 'ogg', wav: 'wav', mp3: 'mp3', flac: 'flac' };

/**
 * Duration in seconds read from the file. Browser WebM recordings often have
 * no duration in their header; then this returns null and the pipeline uses
 * the provider's figure or, failing that, the app's figure capped by size.
 */
export async function measureSeconds(b: Buffer, mime: string): Promise<number | null> {
  try {
    const meta = await parseBuffer(new Uint8Array(b), { mimeType: mime }, { duration: true, skipCovers: true });
    const d = meta.format.duration;
    return typeof d === 'number' && Number.isFinite(d) && d > 0 ? d : null;
  } catch {
    return null;
  }
}

/**
 * The most seconds a file of this size could plausibly hold (at a very low
 * 8 kbit/s), used to cap a duration the server could not measure itself.
 */
export const maxPlausibleSeconds = (bytes: number) => (bytes * 8) / 8000;
