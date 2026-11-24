// The life-story data model. Everything is kept on the device first (in
// IndexedDB), and copied to the person's account when they are signed in.
// Field names match the server documents (functions/src/model.ts) so the two
// stay in step.

/** How sure we are of when something happened. Never invented. */
export type DatePrecision = 'exact_year' | 'approximate_year' | 'approximate_range' | 'decade' | 'unknown';

/** Where a memory is in its life. */
export type MemoryStatus =
  | 'draft' // started; nothing saved yet but the question
  | 'recorded' // has audio on this device, not yet turned into text
  | 'processing' // audio sent; text and story on their way
  | 'review' // a story is ready for the person to read and approve
  | 'approved'; // the person approved it; it goes in the book

/** Steps a recording goes through (adapted from the brief's pipeline). */
export type RecordingStatus =
  | 'recording' // still being recorded (chunks saved as we go)
  | 'local' // finished, kept on this device only
  | 'uploading'
  | 'uploaded' // in private storage; queued for transcription
  | 'transcribing'
  | 'transcribed'
  | 'generating_story'
  | 'ready' // transcript (and story, if editing worked) ready
  | 'awaiting_setup' // saved safely; text processing isn't switched on yet
  | 'failed_retryable'
  | 'failed_permanent'
  | 'deleted';

export type Visibility = 'private' | 'family';
export type EditStyle = 'own_words' | 'polished' | 'book';

export interface Recording {
  id: string;
  memoryId: string;
  mime: string;
  size: number;
  /** Seconds, measured on the device (the server measures again). */
  duration: number;
  createdAt: number;
  status: RecordingStatus;
  /** The closest written form of what was said. Never overwritten. */
  transcript?: string;
  /** The person's own corrections, kept separately from the original. */
  correctedTranscript?: string;
  language?: string;
  provider?: string;
  model?: string;
  error?: string;
  /** True once the audio is in the person's private cloud storage. */
  inCloud?: boolean;
}

export interface Revision {
  id: string;
  text: string;
  style: EditStyle | 'written';
  /** 'ai' = suggested by the story editor; 'user' = written or edited by the person. */
  source: 'ai' | 'user';
  model?: string;
  createdAt: number;
}

export interface Person {
  name: string | null;
  relationship: string | null;
}

/** What the story editor suggested; kept apart from what the person confirmed. */
export interface Suggested {
  title?: string;
  chapter?: string;
  yearStart?: number | null;
  yearEnd?: number | null;
  datePrecision?: DatePrecision;
  people?: Person[];
  places?: string[];
  themes?: string[];
  uncertain?: string[];
  followUps?: string[];
}

export interface Photo {
  id: string;
  memoryId: string;
  mime: string;
  width: number;
  height: number;
  caption?: string;
  who?: string;
  where?: string;
  when?: string;
  meaning?: string;
  order: number;
  createdAt: number;
  inCloud?: boolean;
}

export interface Memory {
  id: string;
  title: string;
  chapterId: string | null;
  /** The question it answers, if any (id in the library, and the words shown). */
  questionId?: string;
  question?: string;
  /** Confirmed by the person (not the AI). */
  yearStart?: number | null;
  yearEnd?: number | null;
  datePrecision: DatePrecision;
  status: MemoryStatus;
  visibility: Visibility;
  approved: boolean;
  /** Include in the book preview (approved stories are, unless switched off). */
  inBook: boolean;
  recordings: Recording[];
  revisions: Revision[];
  /** The revision shown as "the story". */
  currentRevisionId?: string;
  suggested?: Suggested;
  people?: Person[];
  places?: string[];
  photoIds: string[];
  /** Part of a guided interview session. */
  sessionId?: string;
  createdAt: number;
  updatedAt: number;
  /** Deleted memories are kept as a marker until the account copy is removed too. */
  deleted?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  hidden?: boolean;
  private?: boolean;
  /** One of the suggested chapters (its key), so it can be translated until renamed. */
  preset?: string;
  renamed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Book {
  title?: string;
  subtitle?: string;
  author?: string;
  dedication?: string;
  coverPhotoId?: string;
  updatedAt: number;
}

export interface QuestionEvent {
  questionId: string;
  viewedAt?: number;
  answeredAt?: number;
  skippedAt?: number;
  memoryId?: string;
}

/** Everything the story part of Hoot keeps (apart from audio and photo files). */
export interface StoryState {
  memories: Memory[];
  chapters: Chapter[];
  book: Book;
  photos: Record<string, Photo>;
  questions: Record<string, QuestionEvent>;
  /** Categories the person would rather not be asked about. */
  offLimits: string[];
  /** Consent to send audio/transcripts to the outside services (time given). */
  aiConsentAt?: number;
  /** Preferred editing style for new stories (the default is conservative). */
  style: EditStyle;
}
