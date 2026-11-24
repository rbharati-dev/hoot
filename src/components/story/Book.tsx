import { useState } from 'react';
import { Icon } from '../Icon';
import type { StoryStrings } from '../../lib/story/strings-en';
import { liveMemories, photosOf, storyText, useStory, visibleChapters } from '../../lib/story/store';
import { fileGet, fileKeys } from '../../lib/story/idb';
import { extFor } from '../../lib/story/recorder';
import { count } from '../../lib/telemetry';
import PhotoThumb from './PhotoThumb';
import { chapterTitle, dateLabel, memoryTitle, safeName, saveFile } from './ui';

/**
 * The autobiography as a book: cover, dedication, contents, chapters and
 * stories with their photographs. "Save as PDF or print" uses the browser's
 * print dialog with book-like print styles (page numbers in the footer).
 */
export default function Book({ s, lang, name }: { s: StoryStrings; lang: string; name: string }) {
  const story = useStory();
  const [all, setAll] = useState(false);
  const title = story.book.title || (name ? s.lifeOf.replace('{n}', name) : s.bookTitleDefault);
  const author = story.book.author ?? name;
  const chapters = visibleChapters(story)
    .filter(c => !c.hidden)
    .map(c => ({
      c,
      ms: liveMemories(story)
        .filter(m => m.chapterId === c.id && m.inBook && (all || m.approved) && storyText(m).trim())
        .sort((a, b) => (a.yearStart ?? 9999) - (b.yearStart ?? 9999) || a.createdAt - b.createdAt),
    }))
    .filter(x => x.ms.length);
  const loose = liveMemories(story).filter(m => !m.chapterId && m.inBook && (all || m.approved) && storyText(m).trim());

  const exportText = () => {
    const out = [title, author ? s.bookBy.replace('{n}', author) : '', '', story.book.dedication ?? '', ''];
    for (const { c, ms } of chapters) {
      out.push('', chapterTitle(s, c).toUpperCase(), '');
      for (const m of ms) out.push(memoryTitle(s, m), dateLabel(s, m), '', storyText(m), '');
    }
    saveFile(new Blob([out.join('\n')], { type: 'text/plain;charset=utf-8' }), `${safeName(title)}.txt`);
    count('story.book_exported');
  };
  const exportEverything = async () => {
    // Everything Hoot keeps about your stories, as data, plus each recording and photograph.
    saveFile(new Blob([JSON.stringify(story, null, 2)], { type: 'application/json' }), `${safeName(title)}-data.json`);
    const keys = (await fileKeys()) as string[];
    for (const m of liveMemories(story)) {
      for (const [i, r] of m.recordings.entries()) {
        if (!keys.includes(r.id)) continue;
        const b = await fileGet(r.id);
        if (b) saveFile(b, `${safeName(memoryTitle(s, m))}-${i + 1}.${extFor(r.mime)}`);
      }
      for (const [i, p] of photosOf(m).entries()) {
        const b = await fileGet(p.id);
        if (b) saveFile(b, `${safeName(memoryTitle(s, m))}-photo-${i + 1}.jpg`);
      }
    }
    count('story.book_exported');
  };

  const empty = !chapters.length && !loose.length;
  return (
    <section className="book-wrap" aria-label={s.tabBook}>
      <div className="row book-tools no-print">
        <label className="check">
          <input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} /> {s.includeAll}
        </label>
        <button
          className="btn"
          onClick={() => {
            count('story.book_exported');
            // Print only the book (the rest of the page is hidden by the print styles).
            document.body.classList.add('printing-story');
            const done = () => {
              document.body.classList.remove('printing-story');
              window.removeEventListener('afterprint', done);
            };
            window.addEventListener('afterprint', done);
            window.print();
          }}
          disabled={empty}
        >
          <Icon name="print" size={22} /> {s.printBook}
        </button>
        <button className="btn" onClick={exportText} disabled={empty}>
          <Icon name="download" size={22} /> {s.exportText}
        </button>
        <button className="btn" onClick={() => void exportEverything()}>
          <Icon name="download" size={22} /> {s.exportAll}
        </button>
      </div>
      {empty ? (
        <p className="muted">{s.bookEmpty}</p>
      ) : (
        <div className="book" lang={lang}>
          <div className="book-page cover">
            <h1 className="book-title">{title}</h1>
            {author && <p className="book-author">{s.bookBy.replace('{n}', author)}</p>}
          </div>
          {story.book.dedication && (
            <div className="book-page dedication-page">
              <p className="book-dedication">{story.book.dedication}</p>
            </div>
          )}
          <div className="book-page toc">
            <h2>{s.contents}</h2>
            <ol>
              {chapters.map(({ c }) => (
                <li key={c.id}>{chapterTitle(s, c)}</li>
              ))}
            </ol>
          </div>
          {chapters.map(({ c, ms }, ci) => (
            <div key={c.id} className="book-chapter">
              <h2 className="book-chapter-title">
                <span className="book-chapter-num">{ci + 1}</span>
                {chapterTitle(s, c)}
              </h2>
              {ms.map(m => (
                <article key={m.id} className="book-story">
                  <h3>{memoryTitle(s, m)}</h3>
                  {dateLabel(s, m) && <p className="book-date">{dateLabel(s, m)}</p>}
                  {photosOf(m).map(p => (
                    <figure key={p.id} className="book-photo">
                      <PhotoThumb id={p.id} alt={p.who ?? ''} className="book-img" />
                      {(p.who || p.where || p.when) && <figcaption>{[p.who, p.where, p.when].filter(Boolean).join(' · ')}</figcaption>}
                    </figure>
                  ))}
                  {storyText(m)
                    .split(/\n{2,}/)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </article>
              ))}
            </div>
          ))}
          {loose.length > 0 && (
            <div className="book-chapter">
              {loose.map(m => (
                <article key={m.id} className="book-story">
                  <h3>{memoryTitle(s, m)}</h3>
                  {storyText(m)
                    .split(/\n{2,}/)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
