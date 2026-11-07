// "What do you remember?" under a memory: write a line or two; it is kept in
// the person's memory book (see lib/notes).
import { useEffect, useId, useState } from 'react';
import type { Strings } from '../lib/i18n';
import { noteFor, onNotesChange, removeNote, saveNote } from '../lib/notes';
import { Icon } from './Icon';

export default function NoteBox({ t, card, title }: { t: Strings; card: { id: string; year: number; type: string }; title: string }) {
  const [note, setNote] = useState(() => noteFor(card.id));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [flash, setFlash] = useState(false);
  const id = useId();
  useEffect(() => {
    setNote(noteFor(card.id));
    setEditing(false);
    return onNotesChange(() => setNote(noteFor(card.id)));
  }, [card.id]);

  if (editing)
    return (
      <form
        className="note-box editing"
        onSubmit={e => {
          e.preventDefault();
          saveNote(card, title, draft);
          setEditing(false);
          setFlash(!!draft.trim());
        }}
      >
        <label htmlFor={id} className="note-label">
          {t.noteAsk}
        </label>
        <textarea id={id} rows={3} value={draft} placeholder={t.notePlaceholder} onChange={e => setDraft(e.target.value)} autoFocus maxLength={2000} />
        <div className="note-actions">
          <button className="btn primary" type="submit">
            <Icon name="check" size={20} />
            {t.noteSave}
          </button>
          <button className="btn quiet" type="button" onClick={() => setEditing(false)}>
            {t.noteCancel}
          </button>
        </div>
      </form>
    );

  if (note)
    return (
      <figure className="note-box saved">
        <figcaption className="note-label">
          <Icon name="pen" size={18} />
          {t.noteYours}
        </figcaption>
        <blockquote>{note.text}</blockquote>
        {flash && (
          <p className="muted small" role="status">
            {t.noteSaved}
          </p>
        )}
        <div className="note-actions">
          <button
            className="btn quiet"
            onClick={() => {
              setDraft(note.text);
              setEditing(true);
              setFlash(false);
            }}
          >
            {t.noteEdit}
          </button>
          <button className="btn quiet" onClick={() => removeNote(card.id)}>
            {t.noteRemove}
          </button>
        </div>
      </figure>
    );

  return (
    <button
      className="btn note-ask"
      onClick={() => {
        setDraft('');
        setEditing(true);
      }}
    >
      <Icon name="pen" size={22} />
      {t.noteAsk}
    </button>
  );
}
