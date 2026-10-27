// Shared behaviour for modal sheets: Escape closes, Tab stays inside, focus
// starts in the sheet and returns to where it was when the sheet closes.
import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function useDialog(ref: RefObject<HTMLElement | null>, onClose: () => void, opts: { locked?: boolean } = {}) {
  const closeRef = useRef(onClose);
  const lockedRef = useRef(!!opts.locked);
  useEffect(() => {
    closeRef.current = onClose;
    lockedRef.current = !!opts.locked;
  });

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      const box = ref.current;
      if (!box) return;
      if (e.key === 'Escape') {
        if (!lockedRef.current) {
          e.preventDefault();
          closeRef.current();
        }
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!box.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      before?.focus?.();
    };
  }, [ref]);
}
