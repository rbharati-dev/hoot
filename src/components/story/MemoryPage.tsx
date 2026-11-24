import { useState } from 'react';
import { Icon } from '../Icon';
import type { EditStyle, Memory, Revision } from '../../lib/story/types';
import type { StoryStrings } from '../../lib/story/strings-en';
import {
  addRevision,
  approve,
  currentRevision,
  deleteMemory,
  getStory,
  photosOf,
  removePhoto,
  updateMemory,
  updatePhoto,
  updateRecording,
  useStory,
  visibleChapters,
  storyText,
} from '../../lib/story/store';
import { fileGet } from '../../lib/story/idb';
import { extFor } from '../../lib/story/recorder';
import { addPhotoFile } from '../../lib/story/photos';
import { deleteServerCopies, regenerateStory, retryRecording, storyBackendOn } from '../../lib/story/cloud';
import { canProcess } from '../../lib/story/process';
import { clock } from '../../lib/story/stats';
import { count } from '../../lib/telemetry';
import { toast } from '../../lib/toast';
import AudioPlayer from './AudioPlayer';
import PhotoThumb from './PhotoThumb';
import { chapterTitle, memoryTitle, safeName, saveFile, shortDate } from './ui';

const STATUS_TEXT = (s: StoryStrings, st: string) =>
  ({
    local: s.stLocal,
    uploading: s.stUploading,
    uploaded: s.stProcessing,
    transcribing: s.stProcessing,
    transcribed: s.stStory,
    generating_story: s.stStory,
    ready: s.stReady,
    awaiting_setup: s.stAwaitingSetup,
    failed_retryable: s.stFailed,
    failed_permanent: s.stFailedFinal,
  })[st] ?? '';

export default function MemoryPage({
  s,
  lang,
  id,
  uid,
  onBack,
  onRecordMore,
  onAnswer,
}: {
  s: StoryStrings;
  lang: string;
  id: string;
  uid: string | null;
  onBack: () => void;
  onRecordMore: (memoryId: string) => void;
  onAnswer: (question: string) => void;
}) {
  const story = useStory();
  const m = story.memories.find(x => x.id === id && !x.deleted);
  const [editing, setEditing] = useState<null | 'story' | string>(null); // 'story' or a recording id
  const [draft, setDraft] = useState('');
  const [style, setStyle] = useState<EditStyle>(story.style);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!m) {
    return (
      <div className="story-page">
        <button className="btn quiet" onClick={onBack}>
          <Icon name="back" size={22} /> {s.backToStory}
        </button>
      </div>
    );
  }
  const cur = currentRevision(m);
  const recs = m.recordings.filter(r => r.status !== 'recording' && r.status !== 'deleted');
  const text = storyText(m);
  const chapters = visibleChapters(story);
  const set = (p: Partial<Memory>) => void updateMemory(m.id, p);
  const processing = canProcess(uid);
  const thisYear = new Date().getFullYear();

  const saveStoryEdit = () => {
    addRevision(m.id, { text: draft.trim(), style: cur?.style ?? 'written', source: 'user' });
    count('story.story_edited');
    setEditing(null);
  };
  const regenerate = async () => {
    const r = recs.find(x => x.transcript);
    if (!r) return;
    setBusy(true);
    try {
      await regenerateStory(r.id, style, r.correctedTranscript);
      toast(s.stStory, 'info');
    } catch {
      toast(s.stFailed, 'bad');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setConfirmDelete(false);
    if (uid && storyBackendOn() && recs.some(r => r.inCloud)) await deleteServerCopies(m.id).catch(() => undefined);
    await deleteMemory(m.id);
    count('story.memory_deleted');
    toast(s.deleted);
    onBack();
  };
  const downloadAudio = async () => {
    for (const [i, r] of recs.entries()) {
      const b = await fileGet(r.id);
      if (b) saveFile(b, `${safeName(memoryTitle(s, m))}${recs.length > 1 ? `-${i + 1}` : ''}.${extFor(r.mime)}`);
    }
  };
  const downloadText = () => {
    const parts = [memoryTitle(s, m), '', text, ''];
    recs.forEach((r, i) => r.transcript && parts.push(`— ${s.theTranscript}${recs.length > 1 ? ` (${i + 1})` : ''} —`, r.transcript, ''));
    saveFile(new Blob([parts.join('\n')], { type: 'text/plain;charset=utf-8' }), `${safeName(memoryTitle(s, m))}.txt`);
  };
  const sug = m.suggested;

  return (
    <article className="story-page memory-page" aria-labelledby="mp-title">
      <button className="btn quiet back-link" onClick={onBack}>
        <Icon name="back" size={22} /> {s.backToStory}
      </button>

      <header className="mp-head">
        <label className="field">
          <span>{s.titleLabel}</span>
          <input id="mp-title" className="text-input title-input" value={m.title} placeholder={m.question || s.untitled} onChange={e => set({ title: e.target.value.slice(0, 120) })} />
        </label>
        {!m.title && sug?.title && (
          <p className="suggest">
            <span className="muted">{s.aiSuggested}:</span> “{sug.title}”{' '}
            <button className="btn small-btn" onClick={() => set({ title: sug.title })}>
              {s.useSuggestion}
            </button>
          </p>
        )}
        {m.question && <p className="muted mp-question">{m.question}</p>}
        <p className="muted">{recs.length ? s.recordedOn.replace('{d}', shortDate(m.createdAt, lang)) : s.writtenOn.replace('{d}', shortDate(m.createdAt, lang))}</p>
      </header>

      <div className="mp-grid">
        <label className="field">
          <span>{s.chapterLabel}</span>
          <select value={m.chapterId ?? ''} onChange={e => set({ chapterId: e.target.value || null })}>
            <option value="">{s.noChapter}</option>
            {chapters.map(c => (
              <option key={c.id} value={c.id}>
                {chapterTitle(s, c)}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="field when">
          <legend>{s.whenLabel}</legend>
          <div className="when-row">
            <label>
              <span className="sr-only">{s.yearFrom}</span>
              <input
                className="text-input year"
                inputMode="numeric"
                placeholder={s.yearFrom}
                value={m.yearStart ?? ''}
                onChange={e => {
                  const y = Number(e.target.value.replace(/\D/g, '').slice(0, 4));
                  set({ yearStart: y >= 1850 && y <= thisYear ? y : null, datePrecision: y ? (m.datePrecision === 'unknown' ? 'approximate_year' : m.datePrecision) : 'unknown' });
                }}
              />
            </label>
            <span aria-hidden="true">–</span>
            <label>
              <span className="sr-only">{s.yearTo}</span>
              <input
                className="text-input year"
                inputMode="numeric"
                placeholder={s.yearTo}
                value={m.yearEnd ?? ''}
                onChange={e => {
                  const y = Number(e.target.value.replace(/\D/g, '').slice(0, 4));
                  set({ yearEnd: y >= (m.yearStart ?? 1850) && y <= thisYear ? y : null });
                }}
              />
            </label>
            <label className="check">
              <input type="checkbox" checked={m.datePrecision !== 'exact_year'} onChange={e => set({ datePrecision: e.target.checked ? 'approximate_year' : 'exact_year' })} disabled={!m.yearStart} />
              {s.approximate}
            </label>
          </div>
          {!m.yearStart && sug?.yearStart && (
            <p className="suggest">
              <span className="muted">{s.aiSuggested}:</span> {sug.yearStart}
              {sug.yearEnd && sug.yearEnd !== sug.yearStart ? `–${sug.yearEnd}` : ''}{' '}
              <button className="btn small-btn" onClick={() => set({ yearStart: sug.yearStart, yearEnd: sug.yearEnd, datePrecision: sug.datePrecision ?? 'approximate_year' })}>
                {s.useSuggestion}
              </button>
            </p>
          )}
        </fieldset>
      </div>

      {recs.length > 0 && (
        <section className="mp-section" aria-labelledby="mp-voice">
          <h2 id="mp-voice" className="with-icon">
            <Icon name="mic" size={24} /> {s.yourVoice}
          </h2>
          {recs.map((r, i) => (
            <div key={r.id} className="mp-rec">
              <p className="muted">
                {recs.length > 1 ? `${s.part.replace('{n}', String(i + 1))} · ` : ''}
                {clock(r.duration)}
              </p>
              <AudioPlayer s={s} rec={r} uid={uid} label={`${memoryTitle(s, m)} ${i + 1}`} />
              {r.status !== 'ready' && r.status !== 'transcribed' && STATUS_TEXT(s, r.status) && (
                <p className={`rec-state st-${r.status}`} role="status">
                  {STATUS_TEXT(s, r.status)}
                  {r.status === 'local' && !processing && <> {storyBackendOn() ? (uid ? '' : s.signInToKeep) : s.noTextYet}</>}
                </p>
              )}
              {(r.status === 'failed_retryable' || r.status === 'failed_permanent' || r.status === 'awaiting_setup' || (r.status === 'ready' && r.error)) && processing && (
                <button className="btn small-btn" onClick={() => void retryRecording(r.id).catch(() => toast(s.stFailed, 'bad'))}>
                  <Icon name="refresh" size={20} /> {s.tryAgain}
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="mp-section" aria-labelledby="mp-story">
        <h2 id="mp-story" className="with-icon">
          <Icon name="book" size={24} /> {s.theStory}
        </h2>
        {cur?.source === 'ai' && !m.approved && <p className="note-box">{s.reviewNote}</p>}
        {editing === 'story' ? (
          <div className="edit-box">
            <label className="sr-only" htmlFor="mp-story-edit">
              {s.storyTextLabel}
            </label>
            <textarea id="mp-story-edit" className="story-textarea" value={draft} onChange={e => setDraft(e.target.value)} rows={14} />
            <div className="row">
              <button className="btn primary" onClick={saveStoryEdit} disabled={!draft.trim()}>
                <Icon name="check" size={22} /> {s.saveEdits}
              </button>
              <button className="btn" onClick={() => setEditing(null)}>
                {s.cancelEdit}
              </button>
            </div>
          </div>
        ) : text ? (
          <div className="story-prose">
            {text.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <p className="muted">{s.writeHint}</p>
        )}
        {editing !== 'story' && (
          <div className="row">
            <button
              className="btn"
              onClick={() => {
                setDraft(text);
                setEditing('story');
              }}
            >
              <Icon name="pen" size={22} /> {text ? s.editStory : s.writeTitle}
            </button>
            {text && (
              <button className={m.approved ? 'btn' : 'btn primary'} onClick={() => void approve(m.id, !m.approved).then(() => !m.approved && count('story.story_approved'))} aria-pressed={m.approved}>
                <Icon name={m.approved ? 'check' : 'bookmark'} size={22} /> {m.approved ? `${s.approved} · ${s.unapprove}` : s.approve}
              </button>
            )}
          </div>
        )}

        {processing && recs.some(r => r.transcript) && (
          <fieldset className="style-pick">
            <legend>{s.styleLabel}</legend>
            {(
              [
                ['own_words', s.styleOwn, s.styleOwnHint],
                ['polished', s.stylePolished, s.stylePolishedHint],
                ['book', s.styleBook, s.styleBookHint],
              ] as const
            ).map(([v, label, hint]) => (
              <label key={v} className="radio">
                <input type="radio" name="style" checked={style === v} onChange={() => setStyle(v)} />
                <span>
                  <strong>{label}</strong> <span className="muted">{hint}</span>
                </span>
              </label>
            ))}
            <button className="btn" onClick={() => void regenerate()} disabled={busy} aria-busy={busy}>
              <Icon name="refresh" size={22} /> {s.regenerate}
            </button>
          </fieldset>
        )}

        {m.revisions.length > 1 && (
          <details className="versions">
            <summary>{s.versions}</summary>
            <ol>
              {[...m.revisions].reverse().map((r: Revision) => (
                <li key={r.id} className={r.id === cur?.id ? 'current' : ''}>
                  <p className="muted">{s.versionBy.replace('{who}', r.source === 'ai' ? s.byEditor : s.byYou).replace('{d}', shortDate(r.createdAt, lang))}</p>
                  <p className="version-text">{r.text.slice(0, 400)}{r.text.length > 400 ? '…' : ''}</p>
                  {r.id !== cur?.id && (
                    <button className="btn small-btn" onClick={() => void updateMemory(m.id, { currentRevisionId: r.id })}>
                      <Icon name="undo" size={20} /> {s.restore}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </details>
        )}
      </section>

      {recs.some(r => r.transcript) && (
        <section className="mp-section" aria-labelledby="mp-transcript">
          <h2 id="mp-transcript" className="with-icon">
            <Icon name="message" size={24} /> {s.theTranscript}
          </h2>
          <p className="muted">{s.transcriptNote}</p>
          {recs
            .filter(r => r.transcript)
            .map(r =>
              editing === r.id ? (
                <div key={r.id} className="edit-box">
                  <textarea className="story-textarea" value={draft} onChange={e => setDraft(e.target.value)} rows={10} aria-label={s.editTranscript} />
                  <div className="row">
                    <button
                      className="btn primary"
                      onClick={() => {
                        void updateRecording(m.id, r.id, { correctedTranscript: draft });
                        setEditing(null);
                      }}
                    >
                      {s.saveCorrections}
                    </button>
                    <button className="btn" onClick={() => setEditing(null)}>
                      {s.cancelEdit}
                    </button>
                  </div>
                </div>
              ) : (
                <div key={r.id} className="transcript">
                  <p>{r.correctedTranscript ?? r.transcript}</p>
                  <button
                    className="btn small-btn"
                    onClick={() => {
                      setDraft(r.correctedTranscript ?? r.transcript ?? '');
                      setEditing(r.id);
                    }}
                  >
                    <Icon name="pen" size={20} /> {s.editTranscript}
                  </button>
                </div>
              ),
            )}
        </section>
      )}

      {sug && (sug.uncertain?.length || sug.people?.length || sug.places?.length) ? (
        <section className="mp-section suggestions" aria-label={s.aiSuggested}>
          <p className="muted">{s.aiSuggested}</p>
          {!!sug.uncertain?.length && (
            <>
              <h3>{s.uncertainTitle}</h3>
              <ul>{sug.uncertain.map((u, i) => <li key={i}>{u}</li>)}</ul>
            </>
          )}
          {!!sug.people?.length && (
            <>
              <h3>{s.peopleTitle}</h3>
              <ul>{sug.people.map((p, i) => <li key={i}>{[p.name, p.relationship].filter(Boolean).join(' — ')}</li>)}</ul>
            </>
          )}
          {!!sug.places?.length && (
            <>
              <h3>{s.placesTitle}</h3>
              <ul>{sug.places.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </>
          )}
        </section>
      ) : null}

      {!!sug?.followUps?.length && (
        <section className="mp-section" aria-labelledby="mp-follow">
          <h2 id="mp-follow" className="with-icon">
            <Icon name="sparkle" size={24} /> {s.followUpsTitle}
          </h2>
          <ul className="follow-list">
            {sug.followUps.map((q, i) => (
              <li key={i}>
                <span>{q}</span>
                <button
                  className="btn small-btn"
                  onClick={() => {
                    count('story.follow_up_selected');
                    onAnswer(q);
                  }}
                >
                  <Icon name="mic" size={20} /> {s.answerThis}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mp-section" aria-labelledby="mp-photos">
        <h2 id="mp-photos" className="with-icon">
          <Icon name="photo" size={24} /> {s.photosTitle}
        </h2>
        <div className="photo-list">
          {photosOf(m).map(p => (
            <figure key={p.id} className="photo-item">
              <PhotoThumb id={p.id} alt={p.caption || p.who || ''} className="mp-photo" />
              <figcaption>
                {(
                  [
                    ['who', s.photoWho],
                    ['where', s.photoWhere],
                    ['when', s.photoWhen],
                    ['meaning', s.photoMeaning],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="field">
                    <span>{label}</span>
                    <input className="text-input" value={p[k] ?? ''} onChange={e => void updatePhoto(p.id, { [k]: e.target.value.slice(0, 300) })} />
                  </label>
                ))}
                <button className="btn small-btn danger-quiet" onClick={() => void removePhoto(m.id, p.id)}>
                  <Icon name="trash" size={20} /> {s.removePhoto}
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
        <label className="btn file-btn">
          <Icon name="photo" size={22} /> {s.addPhoto}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async e => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              const p = await addPhotoFile(m.id, f, m.photoIds.length);
              if (!p) toast(s.photoTooBig, 'bad');
            }}
          />
        </label>
      </section>

      <section className="mp-section mp-actions" aria-label={s.theStory}>
        <button className="btn" onClick={() => onRecordMore(m.id)}>
          <Icon name="mic" size={22} /> {s.addRecording}
        </button>
        {recs.length > 0 && (
          <button className="btn" onClick={() => void downloadAudio()}>
            <Icon name="download" size={22} /> {s.downloadAudio}
          </button>
        )}
        {text && (
          <button className="btn" onClick={downloadText}>
            <Icon name="download" size={22} /> {s.downloadText}
          </button>
        )}
        <label className="check">
          <input type="checkbox" checked={m.inBook} onChange={e => set({ inBook: e.target.checked })} /> {s.inBook}
        </label>
        <p className="muted">
          <Icon name="lock" size={18} /> {s.privateLabel}
        </p>
        <button className="btn danger-quiet" onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" size={22} /> {s.deleteMemory}
        </button>
      </section>

      {confirmDelete && (
        <div className="confirm-box" role="alertdialog" aria-labelledby="mp-del">
          <p id="mp-del">{s.deleteMemoryConfirm}</p>
          <div className="row">
            <button className="btn danger" onClick={() => void remove()}>
              {s.deleteYes}
            </button>
            <button className="btn" autoFocus onClick={() => setConfirmDelete(false)}>
              {s.cancel}
            </button>
          </div>
        </div>
      )}
      {getStory() && null}
    </article>
  );
}
