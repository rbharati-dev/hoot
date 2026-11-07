// "My memory book": every note the person wrote under a memory, year by
// year, with a Print button that prints just the book.
import { useEffect, useState } from 'react';
import type { Strings } from '../lib/i18n';
import { bookOrder, onNotesChange, readNotes } from '../lib/notes';
import { Icon } from './Icon';

export default function MemoryBook({ t, born }: { t: Strings; born: number }) {
  const [notes, setNotes] = useState(() => bookOrder(readNotes()));
  useEffect(() => onNotesChange(() => setNotes(bookOrder(readNotes()))), []);
  const print = () => {
    document.body.classList.add('printing-book');
    const done = () => {
      document.body.classList.remove('printing-book');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
  };
  return (
    <section className="memory-book" aria-labelledby="book-title">
      <div className="book-head">
        <h2 id="book-title" className="with-icon">
          <Icon name="book" size={28} />
          {t.bookTitle}
        </h2>
        {notes.length > 0 && (
          <button className="btn" onClick={print}>
            <Icon name="print" size={22} />
            {t.bookPrint}
          </button>
        )}
      </div>
      <p className="muted">{notes.length ? `${t.bookIntro} · ${t.bookCount(notes.length)}` : t.bookEmpty}</p>
      {notes.length > 0 && (
        <ol className="book-entries">
          {notes.map(n => (
            <li key={n.id}>
              <p className="book-year">
                {n.year}
                {n.year >= born && ` · ${t.youWere(n.year - born)}`}
              </p>
              <h3>{n.title}</h3>
              <blockquote>{n.text}</blockquote>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
