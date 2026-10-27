// Checkers (English draughts) rules and a simple computer opponent.
// Red (you) starts at the bottom and moves up; Black moves down.
// Jumps are compulsory, multi-jumps continue, and reaching the far row crowns.

export type Side = 'r' | 'b';
export interface Piece {
  s: Side;
  k: boolean;
}
export type Board = (Piece | null)[]; // 64 squares, index = row * 8 + col
export interface Move {
  path: number[]; // squares visited, first = start
  taken: number[]; // squares of captured pieces
}

export function startBoard(): Board {
  const b: Board = Array(64).fill(null);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 0) continue;
      if (r < 3) b[r * 8 + c] = { s: 'b', k: false };
      if (r > 4) b[r * 8 + c] = { s: 'r', k: false };
    }
  return b;
}

const dirs = (p: Piece) => (p.k ? [-1, 1] : p.s === 'r' ? [-1] : [1]);
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

function jumpsFrom(b: Board, from: number, p: Piece, taken: number[]): Move[] {
  const r = Math.floor(from / 8), c = from % 8;
  const out: Move[] = [];
  for (const dr of dirs(p))
    for (const dc of [-1, 1]) {
      const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
      if (!inside(lr, lc)) continue;
      const mid = mr * 8 + mc, land = lr * 8 + lc;
      const victim = b[mid];
      if (!victim || victim.s === p.s || taken.includes(mid) || b[land]) continue;
      const crowned = !p.k && ((p.s === 'r' && lr === 0) || (p.s === 'b' && lr === 7));
      const nextTaken = [...taken, mid];
      // Temporarily move so further jumps see the new position.
      const nb = b.slice();
      nb[from] = null;
      nb[land] = p;
      const more = crowned ? [] : jumpsFrom(nb, land, p, nextTaken);
      if (more.length) for (const m of more) out.push({ path: [from, ...m.path], taken: m.taken });
      else out.push({ path: [from, land], taken: nextTaken });
    }
  return out;
}

export function legalMoves(b: Board, side: Side): Move[] {
  const jumps: Move[] = [];
  const steps: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (!p || p.s !== side) continue;
    jumps.push(...jumpsFrom(b, i, p, []));
    const r = Math.floor(i / 8), c = i % 8;
    for (const dr of dirs(p))
      for (const dc of [-1, 1]) {
        const nr = r + dr, nc = c + dc;
        if (inside(nr, nc) && !b[nr * 8 + nc]) steps.push({ path: [i, nr * 8 + nc], taken: [] });
      }
  }
  return jumps.length ? jumps : steps;
}

export function apply(b: Board, m: Move): Board {
  const nb = b.slice();
  const p = nb[m.path[0]]!;
  nb[m.path[0]] = null;
  for (const t of m.taken) nb[t] = null;
  const end = m.path[m.path.length - 1];
  const row = Math.floor(end / 8);
  nb[end] = { s: p.s, k: p.k || (p.s === 'r' && row === 0) || (p.s === 'b' && row === 7) };
  return nb;
}

function evaluate(b: Board): number {
  // Positive = good for Black (the computer).
  let s = 0;
  b.forEach((p, i) => {
    if (!p) return;
    const row = Math.floor(i / 8);
    const v = p.k ? 170 : 100 + (p.s === 'b' ? row : 7 - row) * 4;
    s += p.s === 'b' ? v : -v;
  });
  return s;
}

function search(b: Board, depth: number, side: Side, alpha: number, beta: number): number {
  const moves = legalMoves(b, side);
  if (!moves.length) return side === 'b' ? -10000 - depth : 10000 + depth;
  if (depth === 0) return evaluate(b);
  if (side === 'b') {
    let best = -Infinity;
    for (const m of moves) {
      best = Math.max(best, search(apply(b, m), depth - 1, 'r', alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    best = Math.min(best, search(apply(b, m), depth - 1, 'b', alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

export function computerMove(b: Board, level: 1 | 2 | 3): Move | null {
  const moves = legalMoves(b, 'b');
  if (!moves.length) return null;
  if (level === 1 && Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)];
  const depth = level === 1 ? 2 : level === 2 ? 4 : 6;
  let best: Move[] = [];
  let bestScore = -Infinity;
  for (const m of moves) {
    const s = search(apply(b, m), depth - 1, 'r', -Infinity, Infinity);
    if (s > bestScore) {
      bestScore = s;
      best = [m];
    } else if (s === bestScore) best.push(m);
  }
  return best[Math.floor(Math.random() * best.length)];
}
