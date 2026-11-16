// Toasts: a short message that confirms an action worked (or says plainly that
// it didn't), then goes away by itself. Any code can call toast(); the
// <Toaster/> in App shows them. Kept tiny: no library, no state manager.
export type ToastKind = 'good' | 'bad' | 'info';
export interface ToastItem {
  id: number;
  text: string;
  kind: ToastKind;
}
type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l(items));

/** How long a toast stays: long enough to read slowly; errors stay longer. */
export const toastMs = (text: string, kind: ToastKind) => Math.min(9000, (kind === 'bad' ? 5000 : 3200) + text.length * 45);

export function dismissToast(id: number) {
  items = items.filter(x => x.id !== id);
  emit();
}
export function toast(text: string, kind: ToastKind = 'good') {
  // The same message twice in a row replaces itself instead of stacking.
  items = items.filter(x => x.text !== text);
  const item = { id: nextId++, text, kind };
  items = [...items, item].slice(-3);
  emit();
  setTimeout(() => dismissToast(item.id), toastMs(text, kind));
  return item.id;
}
export function onToasts(l: Listener) {
  listeners.add(l);
  l(items);
  return () => {
    listeners.delete(l);
  };
}
/** For tests. */
export function clearToasts() {
  items = [];
  emit();
}
