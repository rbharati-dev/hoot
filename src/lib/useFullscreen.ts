import { useCallback, useEffect, useRef, useState } from 'react';

// Wraps the Fullscreen API with a graceful fallback: where the browser blocks
// real fullscreen (some iPads, embedded views), we still expand the element to
// fill the window via a CSS class. Either way the caller gets one flag + toggle.
export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Keep the CSS fallback in sync and allow Esc to exit it.
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full]);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen?.();
      setFull(false);
    } else if (el.requestFullscreen) {
      el.requestFullscreen().then(() => setFull(true)).catch(() => setFull(true));
    } else {
      setFull(true); // CSS fallback
    }
  }, []);

  return { ref, full, toggle };
}
