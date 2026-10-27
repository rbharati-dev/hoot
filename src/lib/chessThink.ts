// Ask the chess computer for a move without blocking the page: in a Web Worker
// when the browser has them, otherwise on the main thread (tests, old browsers).
import { computerMove } from './chessAI';

export interface PlainMove {
  from: string;
  to: string;
  promotion?: string;
}

let worker: Worker | null | undefined;
let nextId = 1;
const waiting = new Map<number, (m: PlainMove | null) => void>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = typeof Worker === 'undefined' ? null : new Worker(new URL('./chessWorker.ts', import.meta.url), { type: 'module' });
    worker?.addEventListener('message', (e: MessageEvent<{ id: number; move: PlainMove | null }>) => {
      waiting.get(e.data.id)?.(e.data.move);
      waiting.delete(e.data.id);
    });
    worker?.addEventListener('error', () => {
      // A worker that fails to start: answer everything still waiting on the main thread.
      worker = null;
    });
  } catch {
    worker = null;
  }
  return worker;
}

const local = (fen: string, level: 1 | 2 | 3): PlainMove | null => {
  const m = computerMove(fen, level);
  return m ? { from: m.from, to: m.to, promotion: m.promotion } : null;
};

export function think(fen: string, level: 1 | 2 | 3): Promise<PlainMove | null> {
  const w = getWorker();
  if (!w) return Promise.resolve(local(fen, level));
  const id = nextId++;
  return new Promise(resolve => {
    waiting.set(id, resolve);
    // Safety net: if the worker never answers, think here instead.
    setTimeout(() => {
      if (waiting.has(id)) {
        waiting.delete(id);
        resolve(local(fen, level));
      }
    }, 15000);
    w.postMessage({ id, fen, level });
  });
}
