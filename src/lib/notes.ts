// "What do you remember?": the person's own words under a memory. Kept with a
// small copy of the memory (title, year, kind) so the memory book can show
// them even when that memory isn't loaded. Synced with the account (idList).
export interface Note {
  id: string; // the memory's id
  text: string;
  at: string; // ISO time last written
  title: string;
  year: number;
  type: string;
}
const KEY = 'hoot.notes';
const listeners = new Set<() => void>();

export function readNotes(): Note[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter(n => n && typeof n.id === 'string' && typeof n.text === 'string') : [];
  } catch {
    return [];
  }
}
function write(list: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or off */
  }
  listeners.forEach(f => f());
}
export const noteFor = (id: string) => readNotes().find(n => n.id === id) ?? null;

export function saveNote(card: { id: string; year: number; type: string }, title: string, text: string, now = new Date()) {
  const clean = text.trim().slice(0, 2000);
  const rest = readNotes().filter(n => n.id !== card.id);
  if (!clean) return write(rest);
  write([{ id: card.id, text: clean, at: now.toISOString(), title, year: card.year, type: card.type }, ...rest]);
}
export const removeNote = (id: string) => write(readNotes().filter(n => n.id !== id));
export function onNotesChange(f: () => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}

/** The memory book: oldest year first, then by title. */
export const bookOrder = (notes: Note[]) => notes.slice().sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
