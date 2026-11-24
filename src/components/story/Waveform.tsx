import { useEffect, useRef } from 'react';

/**
 * A row of bars that follows the real microphone level (from the recorder),
 * scrolling gently. Nothing moves when the microphone is quiet or paused.
 */
export default function Waveform({ level, active }: { level: () => number; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const bars = useRef<number[]>([]);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let last = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 80) return; // ~12 updates a second: calm, not jittery
      last = t;
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== w * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      const n = Math.max(12, Math.floor(w / 9));
      bars.current.push(active ? level() : 0);
      while (bars.current.length > n) bars.current.shift();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getComputedStyle(c).color;
      bars.current.forEach((v, i) => {
        const bh = Math.max(3, v * h);
        const x = w - (bars.current.length - i) * 9;
        ctx.globalAlpha = 0.35 + 0.65 * (i / bars.current.length);
        ctx.beginPath();
        ctx.roundRect?.(x, (h - bh) / 2, 5, bh, 2.5) ?? ctx.rect(x, (h - bh) / 2, 5, bh);
        ctx.fill();
      });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [level, active]);
  return <canvas ref={ref} className="waveform" aria-hidden="true" />;
}
