import { useMemo, useState } from 'react';
import { Icon } from '../Icon';
import type { StoryStrings } from '../../lib/story/strings-en';
import { fmt } from '../../lib/story/strings';
import {
  addChapter,
  deleteChapter,
  liveMemories,
  memoriesIn,
  mergeChapters,
  moveChapter,
  renameChapter,
  storyText,
  updateBook,
  updateChapter,
  useStory,
  visibleChapters,
} from '../../lib/story/store';
import { formatDuration, hasContent, storyStats } from '../../lib/story/stats';
import { count } from '../../lib/telemetry';
import { toast } from '../../lib/toast';
import MemoryCard from './MemoryCard';
import Book from './Book';
import { chapterTitle, dateLabel, memoryTitle } from './ui';

export type LifeView = 'chapters' | 'all' | 'timeline' | 'book';

export default function LifeStory({
  s,
  lang,
  uid,
  name,
  born,
  view,
  setView,
  openMemory,
  tell,
}: {
  s: StoryStrings;
  lang: string;
  uid: string | null;
  name: string;
  born?: number;
  view: LifeView;
  setView: (v: LifeView) => void;
  openMemory: (id: string) => void;
  tell: (chapterId?: string) => void;
}) {
  const story = useStory();
  const stats = storyStats(story);
  const units = { h: s.h, min: s.min, sec: s.sec };
  const [editingTitle, setEditingTitle] = useState(false);
  const title = story.book.title || (name ? s.lifeOf.replace('{n}', name) : s.bookTitleDefault);

  return (
    <div className="story-page life-story">
      <header className="ls-head">
        {editingTitle ? (
          <form
            className="ls-title-form"
            onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void updateBook({ title: String(f.get('title') ?? '').slice(0, 120), author: String(f.get('author') ?? '').slice(0, 80), dedication: String(f.get('dedication') ?? '').slice(0, 600) });
              setEditingTitle(false);
            }}
          >
            <label className="field">
              <span>{s.bookTitleLabel}</span>
              <input name="title" className="text-input" defaultValue={story.book.title ?? title} />
            </label>
            <label className="field">
              <span>{s.authorLabel}</span>
              <input name="author" className="text-input" defaultValue={story.book.author ?? name} />
            </label>
            <label className="field">
              <span>{s.dedicationLabel}</span>
              <textarea name="dedication" className="text-input" rows={3} defaultValue={story.book.dedication ?? ''} />
            </label>
            <div className="row">
              <button className="btn primary" type="submit">
                {s.save}
              </button>
              <button className="btn" type="button" onClick={() => setEditingTitle(false)}>
                {s.cancel}
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="ls-title">{title}</h1>
            <p className="ls-summary">{stats.memories ? fmt(s, 'summary', { m: stats.memories, d: formatDuration(stats.seconds, units) }) : s.summaryEmpty}</p>
            <button className="btn quiet" onClick={() => setEditingTitle(true)}>
              <Icon name="pen" size={20} /> {s.editBookTitle}
            </button>
          </>
        )}
      </header>

      <div className="ls-tabs" role="tablist" aria-label={s.navStoryLong}>
        {(
          [
            ['chapters', s.tabChapters, 'book'],
            ['all', s.tabAll, 'grid'],
            ['timeline', s.tabTimeline, 'timeline'],
            ['book', s.tabBook, 'bookmark'],
          ] as const
        ).map(([v, label, icon]) => (
          <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'ls-tab active' : 'ls-tab'} onClick={() => {
            if (v === 'book') count('story.book_preview_opened');
            setView(v);
          }}>
            <Icon name={icon} size={22} />
            {label}
          </button>
        ))}
      </div>

      {view === 'chapters' && <Chapters s={s} uid={uid} openMemory={openMemory} tell={tell} />}
      {view === 'all' && <Library s={s} uid={uid} openMemory={openMemory} />}
      {view === 'timeline' && <Timeline s={s} born={born} openMemory={openMemory} />}
      {view === 'book' && <Book s={s} lang={lang} name={name} />}
      {!liveMemories(story).some(hasContent) && view !== 'book' && (
        <div className="empty-story">
          <p>{s.noMemoriesYet}</p>
          <button className="btn primary big" onClick={() => tell()}>
            <Icon name="mic" size={26} /> {s.tellMyStory}
          </button>
        </div>
      )}
    </div>
  );
}

function Chapters({ s, uid, openMemory, tell }: { s: StoryStrings; uid: string | null; openMemory: (id: string) => void; tell: (chapterId?: string) => void }) {
  const story = useStory();
  const [arranging, setArranging] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const chapters = visibleChapters(story);
  const loose = memoriesIn(story, null).filter(hasContent);

  return (
    <section aria-label={s.tabChapters}>
      <div className="row ls-tools">
        <button className="btn" onClick={() => setArranging(a => !a)} aria-pressed={arranging}>
          <Icon name={arranging ? 'check' : 'settings'} size={22} /> {arranging ? s.doneArranging : s.manageChapters}
        </button>
        {arranging && (
          <button
            className="btn"
            onClick={() => {
              const name = window.prompt(s.newChapterName)?.trim();
              if (name) {
                addChapter(name);
                count('story.chapter_created');
              }
            }}
          >
            <Icon name="sparkle" size={22} /> {s.newChapter}
          </button>
        )}
      </div>
      <ol className="chapter-list">
        {chapters
          .filter(c => arranging || !c.hidden)
          .map((c, i, list) => {
            const ms = memoriesIn(story, c.id).filter(hasContent);
            const latest = [...ms].sort((a, b) => b.updatedAt - a.updatedAt)[0];
            const isOpen = open === c.id;
            return (
              <li key={c.id} className={`chapter-card${c.hidden ? ' is-hidden' : ''}`}>
                <div className="cc-head">
                  <span className="cc-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="cc-text">
                    {renaming === c.id ? (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          const v = String(new FormData(e.currentTarget).get('t') ?? '').trim();
                          if (v) void renameChapter(c.id, v);
                          setRenaming(null);
                        }}
                      >
                        <input name="t" className="text-input" autoFocus defaultValue={chapterTitle(s, c)} aria-label={s.rename} />
                        <button className="btn small-btn" type="submit">
                          {s.save}
                        </button>
                      </form>
                    ) : (
                      <h2 className="cc-title">{chapterTitle(s, c)}</h2>
                    )}
                    <p className="muted">
                      {ms.length ? fmt(s, 'chapterCount', { n: ms.length }) : s.emptyChapter}
                      {c.hidden && <span className="badge">{s.hiddenBadge}</span>}
                      {c.private && <span className="badge">{s.privateBadge}</span>}
                    </p>
                    {latest && !arranging && <p className="cc-latest">{memoryTitle(s, latest)}</p>}
                  </div>
                </div>
                {arranging ? (
                  <div className="cc-tools">
                    <button className="btn small-btn" onClick={() => setRenaming(c.id)}>
                      <Icon name="pen" size={18} /> {s.rename}
                    </button>
                    <button className="btn small-btn" onClick={() => void moveChapter(c.id, -1)} disabled={i === 0}>
                      ↑ {s.moveUp}
                    </button>
                    <button className="btn small-btn" onClick={() => void moveChapter(c.id, 1)} disabled={i === list.length - 1}>
                      ↓ {s.moveDown}
                    </button>
                    <button className="btn small-btn" onClick={() => void updateChapter(c.id, { hidden: !c.hidden })}>
                      <Icon name={c.hidden ? 'eye' : 'eyeOff'} size={18} /> {c.hidden ? s.show : s.hide}
                    </button>
                    <button className="btn small-btn" onClick={() => void updateChapter(c.id, { private: !c.private })}>
                      <Icon name="lock" size={18} /> {c.private ? s.makeShared : s.makePrivate}
                    </button>
                    {ms.length > 0 && (
                      <label className="merge">
                        <span>{s.mergeInto}</span>
                        <select
                          value=""
                          onChange={e => {
                            if (e.target.value) void mergeChapters(c.id, e.target.value);
                          }}
                        >
                          <option value="">—</option>
                          {chapters
                            .filter(x => x.id !== c.id)
                            .map(x => (
                              <option key={x.id} value={x.id}>
                                {chapterTitle(s, x)}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                    <button className="btn small-btn danger-quiet" onClick={() => !deleteChapter(c.id) && toast(s.cantDeleteChapter, 'bad')}>
                      <Icon name="trash" size={18} /> {s.deleteChapter}
                    </button>
                  </div>
                ) : (
                  <div className="cc-actions">
                    {ms.length > 0 && (
                      <button className="btn small-btn" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen}>
                        <Icon name={isOpen ? 'shrink' : 'expand'} size={18} /> {fmt(s, 'chapterCount', { n: ms.length })}
                      </button>
                    )}
                    <button className="btn small-btn" onClick={() => tell(c.id)}>
                      <Icon name="mic" size={18} /> {s.addToChapter}
                    </button>
                  </div>
                )}
                {isOpen && !arranging && (
                  <div className="cc-memories">
                    {ms.map(m => (
                      <MemoryCard key={m.id} s={s} m={m} uid={uid} onOpen={openMemory} />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
      </ol>
      {loose.length > 0 && (
        <section className="loose">
          <h2>{s.noChapter}</h2>
          {loose.map(m => (
            <MemoryCard key={m.id} s={s} m={m} uid={uid} onOpen={openMemory} />
          ))}
        </section>
      )}
    </section>
  );
}

function Library({ s, uid, openMemory }: { s: StoryStrings; uid: string | null; openMemory: (id: string) => void }) {
  const story = useStory();
  const [q, setQ] = useState('');
  const [chapter, setChapter] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'life' | 'recorded'>('recorded');
  const list = useMemo(() => {
    // Forgiving search: every word typed must appear somewhere (title, story, people, places), any order, any case.
    const words = q
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .split(/\s+/)
      .filter(Boolean);
    const norm = (x: string) => x.toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    return liveMemories(story)
      .filter(hasContent)
      .filter(m => !chapter || (m.chapterId ?? '') === (chapter === '-' ? '' : chapter))
      .filter(m => !status || (status === 'approved' ? m.approved : status === 'review' ? !m.approved && m.revisions.length > 0 : !m.approved && !m.revisions.length))
      .filter(m => {
        if (!words.length) return true;
        const hay = norm(
          [memoryTitle(s, m), storyText(m), m.question ?? '', ...(m.people ?? m.suggested?.people ?? []).map(p => `${p.name ?? ''} ${p.relationship ?? ''}`), ...(m.places ?? m.suggested?.places ?? []), ...(m.suggested?.themes ?? []), String(m.yearStart ?? '')].join(' '),
        );
        return words.every(w => hay.includes(w));
      })
      .sort((a, b) => (sort === 'life' ? (a.yearStart ?? 9999) - (b.yearStart ?? 9999) || a.createdAt - b.createdAt : b.createdAt - a.createdAt));
  }, [story, q, chapter, status, sort, s]);
  return (
    <section aria-label={s.tabAll}>
      <div className="lib-filters">
        <label className="field grow">
          <span>{s.search}</span>
          <input type="search" className="text-input" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <label className="field">
          <span>{s.filterChapter}</span>
          <select value={chapter} onChange={e => setChapter(e.target.value)}>
            <option value="">{s.all}</option>
            {visibleChapters(story).map(c => (
              <option key={c.id} value={c.id}>
                {chapterTitle(s, c)}
              </option>
            ))}
            <option value="-">{s.noChapter}</option>
          </select>
        </label>
        <label className="field">
          <span>{s.filterStatus}</span>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">{s.all}</option>
            <option value="draft">{s.statusDraft}</option>
            <option value="review">{s.statusReview}</option>
            <option value="approved">{s.statusApproved}</option>
          </select>
        </label>
        <label className="field">
          <span>{s.sortBy}</span>
          <select value={sort} onChange={e => setSort(e.target.value as 'life' | 'recorded')}>
            <option value="recorded">{s.sortRecorded}</option>
            <option value="life">{s.sortLife}</option>
          </select>
        </label>
      </div>
      <p className="sr-only" role="status">
        {list.length}
      </p>
      {list.length ? (
        <div className="memory-grid">
          {list.map(m => (
            <MemoryCard key={m.id} s={s} m={m} uid={uid} onOpen={openMemory} />
          ))}
        </div>
      ) : (
        liveMemories(story).some(hasContent) && <p className="muted">{s.noMatches}</p>
      )}
    </section>
  );
}

function Timeline({ s, born, openMemory }: { s: StoryStrings; born?: number; openMemory: (id: string) => void }) {
  const story = useStory();
  const ms = liveMemories(story).filter(hasContent);
  const dated = ms.filter(m => m.yearStart).sort((a, b) => a.yearStart! - b.yearStart! || (a.yearEnd ?? a.yearStart!) - (b.yearEnd ?? b.yearStart!));
  const undated = ms.filter(m => !m.yearStart);
  return (
    <section aria-label={s.tabTimeline}>
      <p className="muted">{s.timelineNote}</p>
      <ol className="timeline">
        {born && (
          <li className="tl-item tl-born">
            <span className="tl-year">{born}</span>
            <span className="tl-title">{s.born.replace('{y}', String(born))}</span>
          </li>
        )}
        {dated.map(m => (
          <li key={m.id} className={`tl-item${m.datePrecision !== 'exact_year' ? ' approx' : ''}`}>
            <span className="tl-year">{dateLabel(s, m)}</span>
            <button className="tl-title linkish" onClick={() => openMemory(m.id)}>
              {memoryTitle(s, m)}
            </button>
          </li>
        ))}
      </ol>
      {undated.length > 0 && (
        <>
          <h2>{s.undated}</h2>
          <ul className="tl-undated">
            {undated.map(m => (
              <li key={m.id}>
                <button className="linkish" onClick={() => openMemory(m.id)}>
                  {memoryTitle(s, m)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
