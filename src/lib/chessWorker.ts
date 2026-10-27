// Runs the chess computer off the main thread, so the screen never freezes
// while it thinks (the Hard level can take a second or more).
import { computerMove } from './chessAI';

self.onmessage = (e: MessageEvent<{ id: number; fen: string; level: 1 | 2 | 3 }>) => {
  const { id, fen, level } = e.data;
  const m = computerMove(fen, level);
  (self as unknown as Worker).postMessage({ id, move: m ? { from: m.from, to: m.to, promotion: m.promotion } : null });
};
