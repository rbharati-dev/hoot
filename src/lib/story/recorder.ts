// The recording engine: the browser's own MediaRecorder (no library), with
// - the audio format chosen from what this browser can actually record
//   (Safari records MP4/AAC, Chrome and Firefox WebM/Opus),
// - every second of audio saved to the device as it is recorded, so a closed
//   tab, a sleeping phone or a crash loses at most a second,
// - a live level from the real microphone (for the waveform),
// - pause and resume, and no automatic stop when the speaker goes quiet.
import { chunkAdd, chunksDelete, chunksFor, chunkRecs, type Chunk } from './idb';

export type MicProblem = 'denied' | 'no-mic' | 'busy' | 'insecure' | 'unsupported' | 'unknown';

const CANDIDATES = ['audio/webm;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/aac'];

/** The best format this browser can record, or '' to let it choose. */
export function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* ignore */
    }
  }
  return '';
}
export const canRecord = () =>
  typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export function micProblem(e: unknown): MicProblem {
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'insecure';
  const name = (e as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'no-mic';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
  if (name === 'SecurityError') return 'insecure';
  if (name === 'NotSupportedError') return 'unsupported';
  return 'unknown';
}

/** A file extension for a recorded type (for downloads and storage names). */
export function extFor(mime: string): string {
  if (mime.includes('mp4') || mime.includes('aac') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg')) return 'mp3';
  return 'webm';
}

export interface Finished {
  blob: Blob;
  mime: string;
  duration: number;
}
type State = 'idle' | 'recording' | 'paused' | 'stopped';

export class StoryRecorder {
  state: State = 'idle';
  private rec: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private buf: Uint8Array<ArrayBuffer> | null = null;
  private seq = 0;
  private activeMs = 0;
  private since = 0;
  private pending: Promise<unknown> = Promise.resolve();
  private stopped: ((f: Finished) => void) | null = null;
  mime = '';
  private cancelled = false;
  /** Called if the microphone goes away mid-recording (unplugged, taken by a call). */
  onInterrupted?: () => void;

  readonly recId: string;
  readonly memoryId: string;
  constructor(recId: string, memoryId: string) {
    this.recId = recId;
    this.memoryId = memoryId;
  }

  /** Asks for the microphone (only now, after the person pressed the button) and starts. */
  async start(): Promise<void> {
    if (!canRecord()) throw Object.assign(new Error('unsupported'), { name: 'NotSupportedError' });
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const mime = pickMime();
    this.rec = mime ? new MediaRecorder(this.stream, { mimeType: mime, audioBitsPerSecond: 64_000 }) : new MediaRecorder(this.stream);
    this.mime = (this.rec.mimeType || mime || 'audio/webm').split(';')[0];
    this.rec.ondataavailable = e => {
      if (!e.data || !e.data.size || this.cancelled) return;
      const c: Chunk = { rec: this.recId, memoryId: this.memoryId, mime: this.mime, seq: this.seq++, at: Date.now(), blob: e.data, elapsed: this.elapsed() };
      this.pending = this.pending.then(() => chunkAdd(c)).catch(() => undefined);
    };
    this.rec.onstop = () => {
      void this.pending.then(async () => {
        const chunks = await chunksFor(this.recId).catch(() => [] as Chunk[]);
        const blob = new Blob(chunks.map(c => c.blob), { type: this.mime });
        this.stopped?.({ blob, mime: this.mime, duration: this.elapsed() });
      });
    };
    for (const tr of this.stream.getAudioTracks()) {
      tr.onended = () => {
        if (this.state === 'recording' || this.state === 'paused') this.onInterrupted?.();
      };
    }
    this.meter();
    this.rec.start(1000); // a piece every second, saved straight away
    this.since = performance.now();
    this.state = 'recording';
  }

  private meter() {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      const src = this.ctx.createMediaStreamSource(this.stream!);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      src.connect(this.analyser);
      this.buf = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
      void this.ctx.resume?.();
    } catch {
      this.analyser = null; // the recording still works; only the waveform is missing
    }
  }

  /** How loud the microphone is right now, 0–1 (real input, not an animation). */
  level(): number {
    if (!this.analyser || !this.buf || this.state !== 'recording') return 0;
    this.analyser.getByteTimeDomainData(this.buf);
    let sum = 0;
    for (const v of this.buf) {
      const x = (v - 128) / 128;
      sum += x * x;
    }
    return Math.min(1, Math.sqrt(sum / this.buf.length) * 4);
  }

  elapsed(): number {
    return (this.activeMs + (this.state === 'recording' ? performance.now() - this.since : 0)) / 1000;
  }

  pause() {
    if (this.state !== 'recording' || !this.rec) return;
    this.rec.pause();
    this.activeMs += performance.now() - this.since;
    this.state = 'paused';
  }
  resume() {
    if (this.state !== 'paused' || !this.rec) return;
    this.rec.resume();
    this.since = performance.now();
    this.state = 'recording';
  }

  /** Stops and returns the whole recording (pieces stay on the device until saved). */
  stop(): Promise<Finished> {
    return new Promise(resolve => {
      if (!this.rec || this.state === 'stopped' || this.state === 'idle') {
        resolve({ blob: new Blob([], { type: this.mime }), mime: this.mime, duration: 0 });
        return;
      }
      if (this.state === 'recording') this.activeMs += performance.now() - this.since;
      this.state = 'stopped';
      this.stopped = f => {
        this.release();
        resolve(f);
      };
      try {
        this.rec.stop();
      } catch {
        this.release();
        void chunksFor(this.recId).then(cs => resolve({ blob: new Blob(cs.map(c => c.blob), { type: this.mime }), mime: this.mime, duration: this.elapsed() }));
      }
    });
  }

  /** Throws the recording away (pieces too). */
  async cancel() {
    this.cancelled = true; // ignore the last piece the browser sends after stopping
    const r = this.rec;
    if (r && r.state !== 'inactive') {
      await new Promise<void>(resolve => {
        const t = window.setTimeout(resolve, 2000);
        r.onstop = () => {
          window.clearTimeout(t);
          resolve();
        };
        try {
          r.stop();
        } catch {
          resolve();
        }
      });
    }
    this.state = 'stopped';
    this.release();
    await this.pending;
    await chunksDelete(this.recId).catch(() => undefined);
  }

  /** Always turn the microphone off (the browser's red dot goes away). */
  release() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.analyser = null;
  }
}

/** Recordings that were interrupted before they were finished (tab closed, crash). */
export async function unfinishedRecordings(): Promise<{ rec: string; memoryId: string; mime: string; duration: number; at: number }[]> {
  const recs = await chunkRecs().catch(() => [] as string[]);
  const out = [];
  for (const rec of recs) {
    const cs = await chunksFor(rec);
    if (!cs.length) continue;
    const last = cs[cs.length - 1];
    out.push({ rec, memoryId: last.memoryId, mime: last.mime, duration: last.elapsed, at: last.at });
  }
  return out;
}
export async function recoverRecording(rec: string): Promise<Finished | null> {
  const cs = await chunksFor(rec);
  if (!cs.length) return null;
  const mime = cs[0].mime;
  return { blob: new Blob(cs.map(c => c.blob), { type: mime }), mime, duration: cs[cs.length - 1].elapsed };
}
export const discardPieces = (rec: string) => chunksDelete(rec);
