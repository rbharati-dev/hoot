// Server-side documents. The person's own words and choices live in
// users/{uid}/stories/{memoryId} (written by the app); everything the server
// produces lives in users/{uid}/recordings/{recId}, which only the server can
// change. Usage and processing jobs are server-only collections.

export type RecStatus =
  | 'uploaded'
  | 'transcribing'
  | 'transcribed'
  | 'generating_story'
  | 'ready'
  | 'awaiting_setup'
  | 'failed_retryable'
  | 'failed_permanent'
  | 'deleted';

export type EditStyle = 'own_words' | 'polished' | 'book';

/** Set by the app when it creates the recording (validated by the rules). */
export interface RecordingRequest {
  memoryId: string;
  storagePath: string;
  mime: string;
  size: number;
  clientDuration: number;
  language: string;
  style: EditStyle;
  /** Short hints: names, places and topics already in the person's stories. */
  hints: string[];
  /** The question being answered, to give the editor context. */
  question: string;
  createdAt: unknown;
  status: 'uploaded';
}

export interface StoryResult {
  title: string | null;
  story: string;
  chapter: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  datePrecision: 'exact_year' | 'approximate_year' | 'approximate_range' | 'decade' | 'unknown';
  people: { name: string | null; relationship: string | null }[];
  places: string[];
  themes: string[];
  uncertain: string[];
  followUps: string[];
}

/** One entry in the usage ledger. The document id is the idempotency key. */
export interface UsageEvent {
  uid: string;
  recordingId: string;
  jobId: string;
  type: 'transcription' | 'ai_edit' | 'storage' | 'adjustment' | 'allowance';
  /** Seconds of audio the event covers (exact, never rounded up). */
  seconds: number;
  /** Seconds that would count toward a future allowance (0 for cost-only events). */
  billableSeconds: number;
  bytes: number;
  provider: string;
  model: string;
  /** What it cost us, estimated from settings. */
  estimatedCostUsd: number;
  /** What the provider reported, when it does. */
  actualCostUsd: number | null;
  currency: 'USD';
  idempotencyKey: string;
  createdAt: unknown;
  /** Notes like "estimate: tokens" so reports can show how sure a number is. */
  basis: string;
}
