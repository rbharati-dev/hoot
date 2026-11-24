import { beforeEach, describe, expect, it } from 'vitest';
import {
  addChapter,
  addRecording,
  addRevision,
  approve,
  createMemory,
  currentRevision,
  deleteChapter,
  getStory,
  mergeChapters,
  moveChapter,
  questionEvent,
  resetStoryForTests,
  setOffLimits,
  storyText,
  updateMemory,
  updateRecording,
  visibleChapters,
} from '../../src/lib/story/store';
import { formatDuration, storyStats, unfinished, clock } from '../../src/lib/story/stats';
import { dailyQuestion, rankQuestions, nextInCategory, qText, type Question } from '../../src/lib/story/questions';
import { fmt, storyStrings } from '../../src/lib/story/strings';
import { en } from '../../src/lib/story/strings-en';
import { extFor, micProblem } from '../../src/lib/story/recorder';
import questionsJson from '../../scripts/stories/questions.json';

const Q = questionsJson as Question[];
const rec = (id: string, memoryId: string, duration: number) => ({ id, memoryId, mime: 'audio/webm', size: 1000, duration, createdAt: 1, status: 'local' as const });

describe('story store', () => {
  beforeEach(() => resetStoryForTests());

  it('starts with the twelve suggested chapters, in order', () => {
    const cs = visibleChapters(getStory());
    expect(cs.map(c => c.preset)).toEqual(['beginnings', 'childhood', 'school', 'findingWay', 'work', 'love', 'travels', 'traditions', 'turningPoints', 'lessons', 'today', 'legacy']);
  });

  it('keeps every version of a story and never overwrites the transcript', async () => {
    const m = createMemory({ question: 'First car?' });
    await addRecording(m.id, rec('r1', m.id, 30));
    await updateRecording(m.id, 'r1', { transcript: 'um my first car was a blue Ford' });
    await updateRecording(m.id, 'r1', { correctedTranscript: 'My first car was a blue Ford.' });
    const first = addRevision(m.id, { text: 'My first car was a blue Ford.', style: 'own_words', source: 'ai' });
    addRevision(m.id, { text: 'My first car was a blue Ford, bought in 1971.', style: 'own_words', source: 'user' });
    const now = getStory().memories[0];
    expect(now.recordings[0].transcript).toBe('um my first car was a blue Ford');
    expect(now.revisions).toHaveLength(2);
    expect(storyText(now)).toContain('1971');
    await updateMemory(m.id, { currentRevisionId: first.id });
    expect(currentRevision(getStory().memories[0])?.id).toBe(first.id);
  });

  it('works out status from what a memory holds', async () => {
    const m = createMemory();
    expect(getStory().memories[0].status).toBe('draft');
    await addRecording(m.id, rec('r1', m.id, 10));
    expect(getStory().memories[0].status).toBe('recorded');
    addRevision(m.id, { text: 'Hello', style: 'written', source: 'user' });
    expect(getStory().memories[0].status).toBe('review');
    await approve(m.id);
    expect(getStory().memories[0].status).toBe('approved');
  });

  it('only deletes empty chapters, and merging moves the memories', async () => {
    const c = addChapter('The farm');
    const m = createMemory({ chapterId: c.id });
    expect(deleteChapter(c.id)).toBe(false);
    await mergeChapters(c.id, 'ch_childhood');
    expect(getStory().memories[0].chapterId).toBe('ch_childhood');
    expect(getStory().chapters.some(x => x.id === c.id)).toBe(false);
    expect(m.id).toBeTruthy();
  });

  it('reorders chapters', async () => {
    await moveChapter('ch_childhood', -1);
    expect(visibleChapters(getStory())[0].id).toBe('ch_childhood');
  });

  it('counts memories, seconds (exactly) and chapters started — no percentages', async () => {
    const a = createMemory({ chapterId: 'ch_work' });
    await addRecording(a.id, rec('r1', a.id, 61.4));
    const b = createMemory({ chapterId: 'ch_work' });
    addRevision(b.id, { text: 'Written', style: 'written', source: 'user' });
    createMemory(); // empty draft: not counted
    const st = storyStats(getStory());
    expect(st.memories).toBe(2);
    expect(st.seconds).toBeCloseTo(61.4);
    expect(st.chaptersStarted).toBe(1);
    expect(formatDuration(8040, { h: 'h', min: 'min', sec: 'sec' })).toBe('2 h 14 min');
    expect(clock(61.4)).toBe('1:01');
    expect(unfinished(getStory()).length).toBe(2);
  });
});

describe('questions', () => {
  beforeEach(() => resetStoryForTests());

  it('has a curated library across all ten parts of life, with unique ids', () => {
    expect(Q.length).toBeGreaterThanOrEqual(80);
    expect(new Set(Q.map(q => q.id)).size).toBe(Q.length);
    expect(new Set(Q.map(q => q.cat)).size).toBe(10);
    // No question assumes marriage, children or university.
    for (const q of Q) expect(q.title).not.toMatch(/\b(your (wife|husband|children|kids|grandchildren)|wedding day|university)\b/i);
  });

  it('never asks an answered or off-limits question, and rests a skipped one for a week', async () => {
    const d = new Date(2026, 10, 23);
    const first = dailyQuestion(Q, getStory(), 0, d)!;
    await questionEvent(first.id, { answeredAt: Date.now() });
    expect(rankQuestions(Q, getStory()).some(q => q.id === first.id)).toBe(false);
    await setOffLimits(['relationships']);
    expect(rankQuestions(Q, getStory()).some(q => q.cat === 'relationships')).toBe(false);
    const next = rankQuestions(Q, getStory())[0];
    await questionEvent(next.id, { skippedAt: Date.now() });
    expect(rankQuestions(Q, getStory()).some(q => q.id === next.id)).toBe(false);
  });

  it('is the same all day and changes the next day', () => {
    const a = dailyQuestion(Q, getStory(), 0, new Date(2026, 10, 23, 8));
    const b = dailyQuestion(Q, getStory(), 0, new Date(2026, 10, 23, 21));
    const c = dailyQuestion(Q, getStory(), 0, new Date(2026, 10, 24, 8));
    expect(a!.id).toBe(b!.id);
    expect(c!.id).not.toBe(a!.id);
  });

  it('leans towards parts of life with fewer stories', () => {
    const child = Q.filter(q => q.cat === 'childhood').slice(0, 3);
    child.forEach(q => createMemory({ questionId: q.id }));
    const top = rankQuestions(Q, getStory()).slice(0, 9);
    expect(top.every(q => q.cat !== 'childhood')).toBe(true);
    expect(nextInCategory(Q, getStory(), 'career', 2).every(q => q.cat === 'career')).toBe(true);
  });

  it('falls back to English for a question not yet translated', () => {
    expect(qText({ title: 'Hi', text: 'There' }, 'hi')).toEqual({ title: 'Hi', text: 'There' });
  });
});

describe('story words', () => {
  it('fills placeholders and uses the singular form for one', () => {
    const s = storyStrings('en');
    expect(fmt(s, 'memoriesKept', { n: 1 })).toBe('1 memory preserved');
    expect(fmt(s, 'memoriesKept', { n: 18 })).toBe('18 memories preserved');
    expect(fmt(s, 'summary', { m: 32, d: '4 h 0 min' })).toBe('32 memories, 4 h 0 min of stories, a lifetime of experiences.');
  });
  it('every language has every key (English fills any gap)', () => {
    for (const l of ['en', 'ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne'] as const) expect(Object.keys(storyStrings(l)).sort()).toEqual(Object.keys(en).sort());
  });
  it('never uses fear or pressure', () => {
    const all = JSON.stringify(en).toLowerCase();
    for (const w of ['running out of time', 'before it is too late', 'before it\'s too late', 'dementia', 'forget', 'streak']) expect(all).not.toContain(w);
  });
});

describe('recorder helpers', () => {
  it('names files by their real format', () => {
    expect(extFor('audio/mp4')).toBe('m4a');
    expect(extFor('audio/webm;codecs=opus')).toBe('webm');
    expect(extFor('audio/ogg')).toBe('ogg');
  });
  it('explains microphone problems by type', () => {
    expect(micProblem({ name: 'NotAllowedError' })).toBe('denied');
    expect(micProblem({ name: 'NotFoundError' })).toBe('no-mic');
    expect(micProblem({ name: 'NotReadableError' })).toBe('busy');
  });
});
