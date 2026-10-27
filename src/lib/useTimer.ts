import { useEffect, useRef, useState } from 'react';

// mm:ss formatter for a count of seconds.
export const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.abs(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// A simple stopwatch: starts when `running` turns true, freezes when it turns
// false. Returns elapsed whole seconds. Reset by toggling `running` off→on.
export function useStopwatch(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed * 1000;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return { elapsed, reset: () => setElapsed(0) };
}

// A countdown from `seconds`. Starts when `active` is true; calls onEnd once at
// zero. Returns the whole seconds remaining.
export function useCountdown(seconds: number, active: boolean, onEnd: () => void, paused = false) {
  const [left, setLeft] = useState(seconds);
  const leftRef = useRef(seconds);
  leftRef.current = left;
  const endRef = useRef<() => void>(onEnd);
  endRef.current = onEnd;
  useEffect(() => {
    if (!active) {
      setLeft(seconds);
      return;
    }
    // Paused (e.g. reading an explanation): hold the time where it is.
    if (paused) return;
    const target = Date.now() + leftRef.current * 1000;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setLeft(rem);
      if (rem <= 0) {
        clearInterval(id);
        endRef.current();
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, seconds, paused]);
  return left;
}
