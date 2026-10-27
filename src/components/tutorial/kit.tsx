import type { CSSProperties, ReactNode } from 'react';
import type { Strings } from '../../lib/i18n';

// Shared pieces for the tutorial demos. A demo is a small fake board inside a
// `.td` stage. Everything is positioned in percentages of the board (`.tb`), and
// the finger dot (`Pointer`) visits up to five targets, tapping at 20/35/50/65/80
// percent of the loop. Classes such as s1 (appears after tap 1) or l2 (lights
// up after tap 2) are driven by keyframes in styles/tutorial.css. The base
// styles are the FINAL state, so with reduced motion the demo is a still frame.

export type Pt = [number, number];
export interface DemoProps {
  t: Strings;
  phone: boolean;
}

/** Centre of a grid cell as a percentage of a box (x0/w and y0/h offset it). */
export const cellPt = (r: number, c: number, rows: number, cols: number, x0 = 0, w = 100, y0 = 0, h = 100): Pt => [
  x0 + ((c + 0.5) / cols) * w,
  y0 + ((r + 0.5) / rows) * h,
];

export function Pointer({ pts, drag }: { pts: Pt[]; drag?: boolean }) {
  const style: Record<string, string> = {};
  for (let i = 0; i < 6; i++) {
    const p = pts[Math.min(i, pts.length - 1)];
    style[`--x${i}`] = `${p[0]}%`;
    style[`--y${i}`] = `${p[1]}%`;
    // A ripple only where the finger arrives somewhere new (tap i of 1..5).
    if (i >= 1) {
      const prev = pts[Math.min(i - 1, pts.length - 1)];
      style[`--r${i}`] = i < pts.length && (p[0] !== prev[0] || p[1] !== prev[1]) ? '1' : '0';
    }
  }
  return <span className={drag ? 'fp drag' : 'fp'} style={style as CSSProperties} aria-hidden="true" />;
}

/** The stage + board. `ratio` is the board's width/height. */
export function Stage({ ratio = 1.9, children }: { ratio?: number; children: ReactNode }) {
  return (
    <div className="td" aria-hidden="true">
      <div className="tb" style={{ aspectRatio: String(ratio) }}>
        {children}
      </div>
    </div>
  );
}

export const at = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  left: `${x}%`,
  top: `${y}%`,
  ...(w !== undefined ? { width: `${w}%` } : {}),
  ...(h !== undefined ? { height: `${h}%` } : {}),
});
