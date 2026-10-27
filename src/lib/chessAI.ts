// A gentle chess opponent: alpha-beta search over chess.js moves with simple
// piece-square tables. Depth 1–3 keeps it friendly and fast in the browser.
import { Chess, type Move } from 'chess.js';

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Bonus by square for White (a8 = index 0). Black uses the mirror.
const PST: Record<string, number[]> = {
  p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
};

function evaluate(game: Chess): number {
  // Positive = good for White.
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (!sq) continue;
      const idx = sq.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;
      const v = VALUE[sq.type] + PST[sq.type][idx];
      score += sq.color === 'w' ? v : -v;
    }
  }
  return score;
}

// Captures first, most valuable victim by least valuable attacker; then
// promotions and checks. Good ordering makes alpha-beta cut far more.
function order(moves: Move[]): Move[] {
  const score = (m: Move) =>
    (m.captured ? 10 * VALUE[m.captured] - VALUE[m.piece] + 1000 : 0) + (m.promotion ? 800 : 0) + (m.san.includes('+') ? 50 : 0);
  return moves.sort((a, b) => score(b) - score(a));
}

const MATE = 100000;

// Generates the moves once per position (game.isGameOver() would generate
// them again), and treats "no legal moves" as mate or stalemate.
function search(game: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0) return evaluate(game);
  const moves = game.moves({ verbose: true });
  if (!moves.length) return game.inCheck() ? (maximizing ? -MATE - depth : MATE + depth) : 0;
  if (game.isInsufficientMaterial()) return 0;
  order(moves);
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      game.move(m);
      best = Math.max(best, search(game, depth - 1, alpha, beta, false));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    game.move(m);
    best = Math.min(best, search(game, depth - 1, alpha, beta, true));
    game.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

// The computer plays Black. Level 1 also makes the odd casual move.
// Among equally good moves it picks one at random, so games vary.
export function computerMove(fen: string, level: 1 | 2 | 3): Move | null {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  if (level === 1 && Math.random() < 0.3) return moves[Math.floor(Math.random() * moves.length)];
  const depth = level === 1 ? 1 : level === 2 ? 2 : 3;
  let best: Move[] = [];
  let bestScore = Infinity;
  for (const m of order(moves)) {
    game.move(m);
    // Black minimises. A reply that can't beat bestScore needn't be scored
    // exactly: searching with beta = bestScore + 1 keeps exact scores for ties
    // (so the random choice among equals is unchanged) and cuts the rest.
    const s = search(game, depth - 1, -Infinity, bestScore + 1, true);
    game.undo();
    if (s < bestScore) {
      bestScore = s;
      best = [m];
    } else if (s === bestScore) best.push(m);
  }
  return best[Math.floor(Math.random() * best.length)];
}
