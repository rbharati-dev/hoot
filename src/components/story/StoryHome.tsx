import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { store, type Card, type Lang, type Profile } from '../../lib/data';
import { onThisDay, todaysSet } from '../../lib/daily';
import type { StoryStrings } from '../../lib/story/strings-en';
import { fmt } from '../../lib/story/strings';
import { dailyQuestion, FIRST_QUESTION_ID, loadQuestions, qText, type Question } from '../../lib/story/questions';
import { questionEvent, useStory, useStoryLoaded } from '../../lib/story/store';
import { formatDuration, recent, storyStats, unfinished } from '../../lib/story/stats';
import { unfinishedRecordings, recoverRecording, discardPieces } from '../../lib/story/recorder';
import { adoptRecovered } from '../../lib/story/process';
import { storageProblem } from '../../lib/story/store';
import { count } from '../../lib/telemetry';
import MemoryCard from './MemoryCard';
import { promptOf, type TellIntent } from './TellStory';
import { memoryTitle } from './ui';
import Skeleton from '../Skeleton';

/**
 * The story home: a greeting, today's question with the microphone, what's
 * been told so far, what's unfinished, recent memories, a moment from the
 * person's lifetime, and then the daily discoveries (games, news, health).
 */
export default function StoryHome({
  s,
  lang,
  profile,
  uid,
  tell,
  openMemory,
  openStory,
  discovery,
}: {
  s: StoryStrings;
  lang: Lang;
  profile: Profile;
  uid: string | null;
  tell: (i: TellIntent) => void;
  openMemory: (id: string) => void;
  openStory: () => void;
  discovery: ReactNode;
}) {
  const story = useStory();
  const loaded = useStoryLoaded();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [offset, setOffset] = useState(0);
  const [lifetime, setLifetime] = useState<Card | null>(null);
  const [recovered, setRecovered] = useState<Awaited<ReturnType<typeof unfinishedRecordings>>>([]);
  useEffect(() => {
    void loadQuestions().then(setQuestions);
    void unfinishedRecordings().then(setRecovered);
  }, []);
  useEffect(() => {
    let live = true;
    // A real event from their own country on this date, or a memory from their younger years.
    void onThisDay(profile, new Date(), lang).then(async c => {
      if (c) return live && setLifetime(c);
      const set = await todaysSet(profile, store.hidden(), lang).catch(() => null);
      const pick = set?.memories.find(m => m.type !== 'music' && m.year >= profile.born && m.year <= profile.born + 40);
      if (live && pick) setLifetime(pick);
    });
    return () => {
      live = false;
    };
  }, [profile, lang]);

  const stats = storyStats(story);
  const isNew = stats.memories === 0;
  // A first-time storyteller starts with the simplest question.
  const q = useMemo(() => {
    const first = questions.find(x => x.id === FIRST_QUESTION_ID);
    if (isNew && offset === 0 && first && !story.questions[first.id]?.skippedAt) return first;
    return dailyQuestion(questions, story, offset);
  }, [questions, story, offset, isNew]);
  useEffect(() => {
    if (q) count('story.daily_question_viewed');
  }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hour = new Date().getHours();
  const name = profile.name?.trim() ?? '';
  const greet = hour < 12 ? (name ? s.morning : s.morningNoName) : hour < 18 ? (name ? s.afternoon : s.afternoonNoName) : name ? s.evening : s.eveningNoName;
  const date = new Date().toLocaleDateString(lang === 'en' ? undefined : lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const cont = unfinished(story).slice(0, 3);
  const latest = recent(story, 4);
  const units = { h: s.h, min: s.min, sec: s.sec };
  const age = lifetime ? lifetime.year - profile.born : 0;

  return (
    <div className="story-home">
      <header className="sh-greet">
        <p className="muted sh-date">{date}</p>
        <h1>{greet.replace('{n}', name)}</h1>
        <p className="sh-waiting">{s.waiting}</p>
      </header>

      {storageProblem() ? <p className="note-box warn" role="alert">{s.storageWarn}</p> : null}

      {recovered.map(r => (
        <div key={r.rec} className="note-box" role="alert">
          <p>{s.recovered}</p>
          <div className="row">
            <button
              className="btn primary"
              onClick={async () => {
                const f = await recoverRecording(r.rec);
                if (f) {
                  await adoptRecovered(r.memoryId, r.rec, f, s.untitled);
                  openMemory(r.memoryId);
                }
                setRecovered(x => x.filter(y => y.rec !== r.rec));
              }}
            >
              {s.keepIt}
            </button>
            <button
              className="btn"
              onClick={async () => {
                await discardPieces(r.rec);
                setRecovered(x => x.filter(y => y.rec !== r.rec));
              }}
            >
              {s.discard}
            </button>
          </div>
        </div>
      ))}

      <section className="daily-q" aria-labelledby="dq-title">
        <p className="rec-kicker">{isNew ? s.firstStoryTitle : s.todaysQuestion}</p>
        {!questions.length ? (
          <Skeleton kind="lines" label={s.todaysQuestion} />
        ) : q ? (
          <>
            <h2 id="dq-title" className="dq-question">
              {qText(q, lang).title}
            </h2>
            {qText(q, lang).text && <p className="dq-hint">{qText(q, lang).text}</p>}
            <button
              className="mic-button"
              onClick={() => {
                void questionEvent(q.id, { viewedAt: Date.now() });
                tell({ mode: 'record', prompt: promptOf(q, lang), autoStart: true });
              }}
            >
              <Icon name="mic" size={52} />
              <span>{s.tellMyStory}</span>
            </button>
            <div className="dq-alt">
              <button className="btn" onClick={() => tell({ mode: 'write', prompt: promptOf(q, lang) })}>
                <Icon name="pen" size={22} /> {s.ratherWrite}
              </button>
              <button className="btn quiet" onClick={() => setOffset(o => o + 1)}>
                <Icon name="refresh" size={22} /> {s.anotherQuestion}
              </button>
              <button
                className="btn quiet"
                onClick={() => {
                  void questionEvent(q.id, { skippedAt: Date.now() });
                  count('story.daily_question_skipped');
                }}
              >
                {s.skipQuestion}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="dq-title" className="dq-question">
              {s.noQuestions}
            </h2>
            <button className="mic-button" onClick={() => tell({ mode: 'record', prompt: { title: s.freeQuestion, kicker: s.wayFree }, autoStart: true })}>
              <Icon name="mic" size={52} />
              <span>{s.tellMyStory}</span>
            </button>
          </>
        )}
      </section>

      {loaded && (
        <section className="sh-progress" aria-labelledby="sh-prog-t">
          <h2 id="sh-prog-t" className="with-icon">
            <Icon name="book" size={24} /> {s.yourStorySoFar}
          </h2>
          {isNew ? (
            <p className="muted">{s.firstStoryNudge}</p>
          ) : (
            <ul className="progress-facts">
              <li>{fmt(s, 'memoriesKept', { n: stats.memories })}</li>
              {stats.seconds > 0 && <li>{s.recorded.replace('{d}', formatDuration(stats.seconds, units))}</li>}
              {stats.chaptersStarted > 0 && <li>{fmt(s, 'chaptersStarted', { n: stats.chaptersStarted })}</li>}
              {stats.latest && <li>{s.latestMemory.replace('{t}', memoryTitle(s, stats.latest))}</li>}
            </ul>
          )}
          {!isNew && (
            <button className="btn quiet" onClick={openStory}>
              {s.navStoryLong} <Icon name="forward" size={20} />
            </button>
          )}
        </section>
      )}

      {cont.length > 0 && (
        <section className="sh-continue" aria-labelledby="sh-cont-t">
          <h2 id="sh-cont-t">{s.continueTitle}</h2>
          <ul className="q-list">
            {cont.map(m => (
              <li key={m.id}>
                <button className="q-row" onClick={() => openMemory(m.id)}>
                  <span>{s.continueStory.replace('{t}', memoryTitle(s, m))}</span>
                  <Icon name="forward" size={22} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latest.length > 0 && (
        <section className="sh-recent" aria-labelledby="sh-recent-t">
          <h2 id="sh-recent-t">{s.recentTitle}</h2>
          <div className="memory-grid">
            {latest.map(m => (
              <MemoryCard key={m.id} s={s} m={m} uid={uid} onOpen={openMemory} />
            ))}
          </div>
        </section>
      )}

      {lifetime && (
        <section className="sh-lifetime" aria-labelledby="sh-life-t">
          <h2 id="sh-life-t" className="with-icon">
            <Icon name="calendar" size={24} /> {s.lifetimeTitle}
          </h2>
          <p className="sh-life-year">{age > 0 ? s.youWereAbout.replace('{y}', String(lifetime.year)).replace('{age}', String(age)) : s.happenedIn.replace('{y}', String(lifetime.year))}</p>
          <h3 className="sh-life-title">{lifetime.title}</h3>
          <p className="sh-life-q">{s.rememberThen}</p>
          <button
            className="btn primary"
            onClick={() => tell({ mode: 'record', prompt: { title: s.rememberThen, text: `${lifetime.year} — ${lifetime.title}`, kicker: s.lifetimeTitle }, autoStart: false })}
          >
            <Icon name="mic" size={22} /> {s.recordAboutThis}
          </button>
        </section>
      )}

      <section className="sh-discovery" aria-labelledby="sh-disc-t">
        <h2 id="sh-disc-t" className="with-icon">
          <Icon name="compass" size={24} /> {s.discoveryTitle}
        </h2>
        {discovery}
      </section>
    </div>
  );
}
