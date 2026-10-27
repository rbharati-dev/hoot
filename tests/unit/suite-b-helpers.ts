// Shared helpers for suite B. No tests in here.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as object)) deepFreeze(v);
  }
  return o;
}
export const pad = (n: number) => String(n).padStart(2, '0');
/** Independent YYYY-MM-DD for y/m(1-12)/d using UTC arithmetic (handles overflow). */
export function ymd(y: number, m: number, d: number): string {
  const t = new Date(Date.UTC(y, m - 1, d));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
export function parseKey(k: string): [number, number, number] {
  const [y, m, d] = k.split('-').map(Number);
  return [y, m, d];
}
export function addKey(k: string, n: number): string {
  const [y, m, d] = parseKey(k);
  return ymd(y, m, d + n);
}
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export function memStorage(opts: { throws?: boolean } = {}) {
  const mem = new Map<string, string>();
  const s = {
    mem,
    getItem: (k: string) => {
      if (opts.throws) throw new Error('blocked');
      return mem.has(k) ? mem.get(k)! : null;
    },
    setItem: (k: string, v: string) => {
      if (opts.throws) throw new Error('quota');
      mem.set(k, String(v));
    },
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  };
  return s;
}
