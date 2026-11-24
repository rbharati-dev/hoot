import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { StoryRecorder, micProblem, discardPieces, canRecord, type Finished, type MicProblem } from '../../lib/story/recorder';
import { createMemory, deleteMemory, memoryById, newId, getStory } from '../../lib/story/store';
import { keepRecording, canProcess } from '../../lib/story/process';
import { clock } from '../../lib/story/stats';
import { storyBackendOn } from '../../lib/story/cloud';
import type { StoryStrings } from '../../lib/story/strings-en';
import { count } from '../../lib/telemetry';
import { toast } from '../../lib/toast';
import Waveform from './Waveform';
import ConsentDialog from './ConsentDialog';

/** Long stories are saved in parts of this length (each part stays small enough to process). */
const PART_SECONDS = 25 * 60;

export interface Prompt {
  id?: string;
  title: string;
  text?: string;
  /** The chapter a new memory starts in (the person can move it). */
  chapterId?: string | null;
  kicker?: string;
  sessionId?: string;
}
type Phase = 'intro' | 'starting' | 'recording' | 'paused' | 'review' | 'saving' | 'error';
interface Part {
  recId: string;
  f: Finished;
  url: string;
}

/**
 * The recording screen. Asks for the microphone only when the person presses
 * the button; shows real microphone activity; pauses and resumes; never stops
 * on silence; saves every second to the device; and lets them listen back,
 * add more, record again or throw it away before saving.
 */
export default function Recorder({
  s,
  prompt,
  memoryId: existing,
  uid,
  autoStart,
  onSaved,
  onWrite,
  onClose,
}: {
  s: StoryStrings;
  prompt: Prompt;
  /** Add to an existing memory instead of starting a new one. */
  memoryId?: string;
  uid: string | null;
  autoStart?: boolean;
  onSaved: (memoryId: string) => void;
  onWrite: () => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [problem, setProblem] = useState<MicProblem | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [parts, setParts] = useState<Part[]>([]);
  const [confirm, setConfirm] = useState<null | 'cancel' | 'again'>(null);
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState('');
  const rec = useRef<StoryRecorder | null>(null);
  const memId = useRef<string | null>(existing ?? null);
  const before = useRef(0); // seconds in parts already finished
  const wake = useRef<{ release(): Promise<void> } | null>(null);
  const live = phase === 'recording' || phase === 'paused';
  const unsaved = live || phase === 'review';

  // Ask before leaving with a recording that isn't saved.
  useEffect(() => {
    if (!unsaved) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = s.leaveWarning;
      return s.leaveWarning;
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [unsaved, s.leaveWarning]);

  // Always turn the microphone off when this screen closes.
  useEffect(
    () => () => {
      rec.current?.release();
      void wake.current?.release().catch(() => undefined);
    },
    [],
  );

  // The clock, and starting a new part when a very long story reaches the part length.
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      const r = rec.current;
      if (!r) return;
      setElapsed(before.current + r.elapsed());
      if (r.state === 'recording' && r.elapsed() >= PART_SECONDS) void rotate();
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const keepAwake = async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } };
      wake.current = (await nav.wakeLock?.request('screen')) ?? null;
    } catch {
      /* not available: fine */
    }
  };

  const begin = useCallback(async () => {
    setProblem(null);
    setPhase('starting');
    if (!memId.current) {
      memId.current = createMemory({ questionId: prompt.id, question: prompt.title, chapterId: prompt.chapterId ?? null, sessionId: prompt.sessionId }).id;
    }
    const r = new StoryRecorder(newId('rec'), memId.current);
    r.onInterrupted = () => {
      setNote(s.interrupted);
      void finish();
    };
    try {
      await r.start();
      rec.current = r;
      setPhase('recording');
      count('story.recording_started');
      void keepAwake();
    } catch (e) {
      r.release();
      setProblem(micProblem(e));
      setPhase('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.id, prompt.title, prompt.chapterId, prompt.sessionId]);

  useEffect(() => {
    if (autoStart && canRecord()) void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Finishes the current part and starts the next without a pause (very long stories). */
  const rotate = async () => {
    const r = rec.current;
    if (!r || !memId.current) return;
    const f = await r.stop();
    before.current += f.duration;
    if (f.blob.size) {
      await keepRecording(memId.current, r.recId, f);
      setNote(s.partSaved);
    }
    const next = new StoryRecorder(newId('rec'), memId.current);
    next.onInterrupted = r.onInterrupted;
    try {
      await next.start();
      rec.current = next;
    } catch (e) {
      setProblem(micProblem(e));
      setPhase('review');
    }
  };

  const finish = async () => {
    const r = rec.current;
    if (!r) return;
    rec.current = null;
    const f = await r.stop();
    void wake.current?.release().catch(() => undefined);
    before.current += f.duration;
    if (f.blob.size) setParts(p => [...p, { recId: r.recId, f, url: URL.createObjectURL(f.blob) }]);
    setPhase('review');
  };

  const pause = () => {
    rec.current?.pause();
    setPhase('paused');
    count('story.recording_paused');
  };
  const resume = () => {
    rec.current?.resume();
    setPhase('recording');
  };

  const throwAway = async () => {
    await rec.current?.cancel();
    rec.current = null;
    for (const p of parts) {
      URL.revokeObjectURL(p.url);
      await discardPieces(p.recId).catch(() => undefined);
    }
    setParts([]);
    before.current = 0;
    setElapsed(0);
  };

  /** Deletes the memory too, if this recording was all it held. */
  const dropEmptyMemory = async () => {
    const m = memoryById(memId.current);
    if (!existing && m && !m.recordings.length && !m.revisions.length) await deleteMemory(m.id);
    memId.current = existing ?? null;
  };

  const save = async (process: boolean) => {
    if (!memId.current) return;
    setPhase('saving');
    try {
      for (const p of parts) await keepRecording(memId.current, p.recId, p.f);
      parts.forEach(p => URL.revokeObjectURL(p.url));
      setParts([]);
      count('story.memory_saved');
      toast(process && canProcess(uid) ? s.savedCloud : s.savedLocal);
      onSaved(memId.current);
    } catch {
      // Not stored: say so, keep everything on screen, let them try again.
      toast(s.stFailed, 'bad');
      setPhase('review');
    }
  };

  const onSaveClick = () => {
    // Ask once, before anything is sent to an outside service.
    if (uid && storyBackendOn() && !getStory().aiConsentAt) setConsent(true);
    else void save(true);
  };

  const problemText: Record<MicProblem, string> = {
    denied: s.micDenied,
    'no-mic': s.micNone,
    busy: s.micBusy,
    insecure: s.micInsecure,
    unsupported: s.micUnsupported,
    unknown: s.micUnknown,
  };

  return (
    <section className={`recorder phase-${phase}`} aria-labelledby="rec-q">
      <p className="rec-kicker">{prompt.kicker ?? s.todaysQuestion}</p>
      <h1 id="rec-q" className="rec-question">
        {prompt.title}
      </h1>
      {prompt.text && phase !== 'recording' && <p className="rec-hint">{prompt.text}</p>}

      {(phase === 'intro' || phase === 'starting') && (
        <div className="rec-stage">
          <p className="rec-lead">{s.beforeTitle}</p>
          <button className="mic-button" onClick={() => void begin()} disabled={phase === 'starting'} aria-describedby="rec-mic-explain">
            <Icon name="mic" size={56} />
            <span>{s.startRecording}</span>
          </button>
          <p id="rec-mic-explain" className="rec-small">
            {s.micExplain}
          </p>
          <p className="rec-small rec-privacy">
            <Icon name="lock" size={20} /> {uid && storyBackendOn() ? s.privacyCloud : s.privacyLocal}
          </p>
          <div className="rec-alt">
            <button className="btn quiet" onClick={onWrite}>
              <Icon name="pen" size={22} />
              {s.ratherWrite}
            </button>
            <button className="btn quiet" onClick={onClose}>
              {s.cancel}
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && problem && (
        <div className="rec-stage" role="alert">
          <p className="rec-problem">
            <Icon name="warning" size={26} /> {problemText[problem]}
          </p>
          <div className="rec-alt">
            {problem !== 'unsupported' && problem !== 'insecure' && (
              <button className="btn primary" onClick={() => void begin()}>
                <Icon name="refresh" size={22} />
                {s.tryAgain}
              </button>
            )}
            <button className="btn" onClick={onWrite}>
              <Icon name="pen" size={22} />
              {s.writeInstead}
            </button>
            <button className="btn quiet" onClick={onClose}>
              {s.cancel}
            </button>
          </div>
        </div>
      )}

      {live && (
        <div className="rec-stage">
          <p className={`rec-status ${phase}`} aria-live="polite">
            <span className="rec-dot" aria-hidden="true" />
            {phase === 'recording' ? s.recording : s.paused}
            <span className="rec-time" aria-label={clock(elapsed)}>
              {clock(elapsed)}
            </span>
          </p>
          <Waveform level={() => rec.current?.level() ?? 0} active={phase === 'recording'} />
          <p className="rec-lead">{phase === 'recording' ? s.listening : s.pausedNote}</p>
          {note && <p className="rec-small" role="status">{note}</p>}
          <div className="rec-controls">
            {phase === 'recording' ? (
              <button className="btn big" onClick={pause}>
                <Icon name="pause" size={26} />
                {s.pause}
              </button>
            ) : (
              <button className="btn big" onClick={resume}>
                <Icon name="mic" size={26} />
                {s.resume}
              </button>
            )}
            <button className="btn primary big" onClick={() => void finish()}>
              <Icon name="stop" size={26} />
              {s.finish}
            </button>
          </div>
          <button className="btn quiet rec-cancel" onClick={() => setConfirm('cancel')}>
            {s.cancel}
          </button>
        </div>
      )}

      {(phase === 'review' || phase === 'saving') && (
        <div className="rec-stage">
          {note && <p className="rec-small" role="status">{note}</p>}
          <h2 className="rec-sub">{s.listenBack}</h2>
          {parts.map((p, i) => (
            <div key={p.recId} className="rec-part">
              {parts.length > 1 && <span className="muted">{s.part.replace('{n}', String(i + 1))}</span>}
              <audio controls src={p.url} preload="metadata" />
              <span className="muted">{clock(p.f.duration)}</span>
            </div>
          ))}
          <div className="rec-controls">
            <button className="btn primary big" onClick={onSaveClick} disabled={phase === 'saving' || !parts.length} aria-busy={phase === 'saving'}>
              <Icon name="check" size={26} />
              {phase === 'saving' ? s.saving : uid && storyBackendOn() ? s.saveAndTranscribe : s.saveStory}
            </button>
          </div>
          <div className="rec-alt">
            <button className="btn" onClick={() => void begin()} disabled={phase === 'saving'}>
              <Icon name="mic" size={22} />
              {s.addMore}
            </button>
            <button className="btn" onClick={() => setConfirm('again')} disabled={phase === 'saving'}>
              <Icon name="refresh" size={22} />
              {s.recordAgain}
            </button>
            <button
              className="btn danger-quiet"
              disabled={phase === 'saving'}
              onClick={async () => {
                await throwAway();
                await dropEmptyMemory();
                count('story.recording_cancelled');
                onClose();
              }}
            >
              <Icon name="trash" size={22} />
              {s.deleteRecording}
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <div className="confirm-box" role="alertdialog" aria-labelledby="rec-confirm-t" aria-modal="false">
          <p id="rec-confirm-t">{confirm === 'cancel' ? s.cancelConfirm : s.recordAgainConfirm}</p>
          <div className="row">
            <button
              className="btn danger"
              onClick={async () => {
                const which = confirm;
                setConfirm(null);
                await throwAway();
                count('story.recording_cancelled');
                if (which === 'cancel') {
                  await dropEmptyMemory();
                  onClose();
                } else setPhase('intro');
              }}
            >
              {s.discard}
            </button>
            <button className="btn" autoFocus onClick={() => setConfirm(null)}>
              {s.keepRecording}
            </button>
          </div>
        </div>
      )}

      {consent && (
        <ConsentDialog
          s={s}
          onAnswer={yes => {
            setConsent(false);
            void save(yes);
          }}
        />
      )}
    </section>
  );
}
