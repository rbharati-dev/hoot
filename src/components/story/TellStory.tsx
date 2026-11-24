import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../Icon';
import type { Lang } from '../../lib/data';
import type { StoryStrings } from '../../lib/story/strings-en';
import { fmt } from '../../lib/story/strings';
import { CATEGORIES, dailyQuestion, loadQuestions, nextInCategory, qText, rankQuestions, type Question } from '../../lib/story/questions';
import { chapterById, memoryById, questionEvent, useStory, visibleChapters } from '../../lib/story/store';
import { unfinished } from '../../lib/story/stats';
import { newId } from '../../lib/story/store';
import { count } from '../../lib/telemetry';
import Recorder, { type Prompt } from './Recorder';
import WriteStory from './WriteStory';
import { chapterTitle, memoryTitle } from './ui';

/** What Tell a Story should open with (from the home page, a chapter, a follow-up…). */
export interface TellIntent {
  mode: 'menu' | 'record' | 'write' | 'interview';
  prompt?: Prompt;
  /** Add a recording to this memory. */
  memoryId?: string;
  chapterId?: string;
  autoStart?: boolean;
}

/** The chapter a question's memory starts in, if that chapter still exists. */
export const chapterFor = (q: Question) => (chapterById(`ch_${q.chapter}`) ? `ch_${q.chapter}` : null);
export const promptOf = (q: Question, lang: Lang, kicker?: string): Prompt => ({ id: q.id, ...qText(q, lang), chapterId: chapterFor(q), kicker });

export default function TellStory({
  s,
  lang,
  uid,
  intent,
  openMemory,
}: {
  s: StoryStrings;
  lang: Lang;
  uid: string | null;
  intent: TellIntent;
  openMemory: (id: string) => void;
}) {
  const story = useStory();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [state, setState] = useState<TellIntent>(intent);
  const [cat, setCat] = useState<string | null>(null);
  // Guided interview: one session id; count of stories told; the question asked last.
  const [session, setSession] = useState<{ id: string; told: number; lastCat?: string; lastMemory?: string } | null>(intent.mode === 'interview' ? { id: newId('ses'), told: 0 } : null);
  useEffect(() => {
    void loadQuestions().then(setQuestions);
  }, []);
  useEffect(() => setState(intent), [intent]);

  const ranked = useMemo(() => rankQuestions(questions, story), [questions, story]);
  const today = dailyQuestion(questions, story);
  const back = () => setState({ mode: 'menu' });

  const ask = (q: Question, mode: 'record' | 'write' = 'record') => {
    void questionEvent(q.id, { viewedAt: Date.now() });
    setState({ mode, prompt: { ...promptOf(q, lang), sessionId: session?.id } });
  };

  // ---- guided interview ----
  const nextInterviewQuestion = (): Prompt | null => {
    // A follow-up from the last story if the editor suggested one, else the next question in the same part of life.
    const last = memoryById(session?.lastMemory);
    const follow = last?.suggested?.followUps?.[0];
    if (follow) return { title: follow, chapterId: last?.chapterId, sessionId: session?.id, kicker: s.wayInterview };
    const q = (session?.lastCat && nextInCategory(questions, story, session.lastCat, 1)[0]) || ranked[0];
    return q ? { ...promptOf(q, lang, s.wayInterview), sessionId: session?.id } : null;
  };

  if (state.mode === 'interview' && session) {
    const p = nextInterviewQuestion();
    return (
      <div className="story-page tell">
        {session.told > 0 && <p className="note-box" role="status">{fmt(s, 'interviewDone', { n: session.told })}</p>}
        {p ? (
          <Recorder
            key={`${session.id}-${session.told}`}
            s={s}
            prompt={p}
            uid={uid}
            onSaved={id => {
              const q = questions.find(x => x.id === p.id);
              setSession({ ...session, told: session.told + 1, lastMemory: id, lastCat: q?.cat ?? session.lastCat });
            }}
            onWrite={() => setState({ mode: 'write', prompt: p })}
            onClose={() => setState({ mode: 'menu' })}
          />
        ) : (
          <p>{s.noQuestions}</p>
        )}
        <div className="row interview-end">
          <button className="btn" onClick={() => (session.lastMemory ? openMemory(session.lastMemory) : setState({ mode: 'menu' }))}>
            <Icon name="check" size={22} /> {s.interviewFinish}
          </button>
        </div>
      </div>
    );
  }

  if (state.mode === 'record' && (state.prompt || state.memoryId)) {
    const m = memoryById(state.memoryId);
    const prompt = state.prompt ?? { title: m ? memoryTitle(s, m) : s.freeQuestion, kicker: s.addRecording };
    return (
      <div className="story-page tell">
        <Recorder
          s={s}
          prompt={prompt}
          memoryId={state.memoryId}
          uid={uid}
          autoStart={state.autoStart}
          onSaved={openMemory}
          onWrite={() => setState({ mode: 'write', prompt })}
          onClose={() => (state.memoryId ? openMemory(state.memoryId) : back())}
        />
      </div>
    );
  }
  if (state.mode === 'write' && state.prompt) {
    return (
      <div className="story-page tell">
        <WriteStory s={s} prompt={state.prompt} onSaved={openMemory} onClose={back} />
      </div>
    );
  }

  // ---- the menu: ways to begin ----
  const chapter = state.chapterId ? chapterById(state.chapterId) : undefined;
  const inChapter = chapter?.preset ? ranked.filter(q => q.chapter === chapter.preset) : [];
  const continuing = unfinished(story).slice(0, 4);
  const shown = (cat ? ranked.filter(q => q.cat === cat) : ranked).slice(0, 6);

  return (
    <div className="story-page tell">
      <header>
        <h1 className="with-icon">
          <Icon name="mic" size={30} /> {s.tellTitle}
        </h1>
        <p className="lead">{s.tellIntro}</p>
      </header>

      {chapter && (
        <section className="tell-block" aria-labelledby="tb-ch">
          <h2 id="tb-ch">{chapterTitle(s, chapter)}</h2>
          <ul className="q-list">
            {(inChapter.length ? inChapter : ranked).slice(0, 5).map(q => (
              <li key={q.id}>
                <button className="q-row" onClick={() => setState({ mode: 'record', prompt: { ...promptOf(q, lang), chapterId: chapter.id } })}>
                  <span>{qText(q, lang).title}</span>
                  <Icon name="mic" size={24} />
                </button>
              </li>
            ))}
            <li>
              <button className="q-row" onClick={() => setState({ mode: 'record', prompt: { title: s.freeQuestion, chapterId: chapter.id, kicker: chapterTitle(s, chapter) } })}>
                <span>{s.wayFree}</span>
                <Icon name="mic" size={24} />
              </button>
            </li>
          </ul>
        </section>
      )}

      {today && !chapter && (
        <section className="tell-block daily-q small" aria-labelledby="tb-today">
          <p className="rec-kicker" id="tb-today">
            {s.todaysQuestion}
          </p>
          <h2 className="dq-question">{qText(today, lang).title}</h2>
          <div className="row">
            <button className="btn primary big" onClick={() => ask(today)}>
              <Icon name="mic" size={26} /> {s.tellMyStory}
            </button>
            <button className="btn" onClick={() => ask(today, 'write')}>
              <Icon name="pen" size={22} /> {s.ratherWrite}
            </button>
          </div>
        </section>
      )}

      <section className="tell-block" aria-labelledby="tb-ways">
        <h2 id="tb-ways" className="sr-only">
          {s.tellTitle}
        </h2>
        <div className="way-grid">
          <button
            className="way"
            onClick={() => {
              setSession({ id: newId('ses'), told: 0 });
              setState({ mode: 'interview' });
              count('story.interview_started');
            }}
          >
            <Icon name="chat" size={30} />
            <strong>{s.wayInterview}</strong>
            <span className="muted">{s.wayInterviewHint}</span>
          </button>
          <button className="way" onClick={() => setState({ mode: 'record', prompt: { title: s.freeQuestion, kicker: s.wayFree } })}>
            <Icon name="sparkle" size={30} />
            <strong>{s.wayFree}</strong>
          </button>
        </div>
      </section>

      <section className="tell-block" aria-labelledby="tb-q">
        <h2 id="tb-q">{s.wayQuestion}</h2>
        <div className="chip-row" role="group" aria-label={s.pickCategory}>
          <button className={cat ? 'chip' : 'chip active'} aria-pressed={!cat} onClick={() => setCat(null)}>
            {s.all}
          </button>
          {CATEGORIES.filter(c => !story.offLimits.includes(c)).map(c => (
            <button key={c} className={cat === c ? 'chip active' : 'chip'} aria-pressed={cat === c} onClick={() => setCat(c)}>
              {(s as unknown as Record<string, string>)[`cat_${c}`]}
            </button>
          ))}
        </div>
        <ul className="q-list">
          {shown.map(q => (
            <li key={q.id} className="q-item">
              <button className="q-row" onClick={() => ask(q)}>
                <span>{qText(q, lang).title}</span>
                <Icon name="mic" size={24} />
              </button>
              <button
                className="btn small-btn quiet"
                onClick={() => {
                  void questionEvent(q.id, { skippedAt: Date.now() });
                  count('story.daily_question_skipped');
                }}
              >
                {s.skipQuestion}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="tell-block" aria-labelledby="tb-chapters">
        <h2 id="tb-chapters">{s.wayChapter}</h2>
        <div className="chip-row">
          {visibleChapters(story)
            .filter(c => !c.hidden)
            .map(c => (
              <button key={c.id} className="chip" onClick={() => setState({ mode: 'menu', chapterId: c.id })}>
                {chapterTitle(s, c)}
              </button>
            ))}
        </div>
      </section>

      {continuing.length > 0 && (
        <section className="tell-block" aria-labelledby="tb-cont">
          <h2 id="tb-cont">{s.wayContinue}</h2>
          <ul className="q-list">
            {continuing.map(m => (
              <li key={m.id}>
                <button className="q-row" onClick={() => setState({ mode: 'record', memoryId: m.id })}>
                  <span>{memoryTitle(s, m)}</span>
                  <Icon name="mic" size={24} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
