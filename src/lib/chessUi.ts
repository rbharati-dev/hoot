// Small, pure pieces of the chess screen's logic, kept here so they can be
// unit-tested without a browser.
import type { Chess } from 'chess.js';

export type ChessStatus = 'thinking' | 'yourMove' | 'inCheck' | 'youWin' | 'youLose' | 'draw';

/** What the status line should say. The person plays White. */
export function chessStatus(game: Chess, thinking: boolean): ChessStatus {
  if (game.isCheckmate()) return game.turn() === 'b' ? 'youWin' : 'youLose';
  if (game.isDraw() || game.isStalemate()) return 'draw';
  if (thinking) return 'thinking';
  if (game.inCheck() && game.turn() === 'w') return 'inCheck';
  return 'yourMove';
}

/**
 * How many positions "Take back" rewinds: your move and the computer's reply
 * (2) when it's your turn; just your move (1) when the computer has no reply
 * (you ended the game). 0 when there is nothing to take back, or while
 * the computer has yet to answer.
 */
export function takeBackSteps(turn: 'w' | 'b', historyLength: number, gameOver = false): 0 | 1 | 2 {
  // While the computer is still to reply, there is nothing to take back yet.
  if (turn === 'b' && !gameOver) return 0;
  const steps = turn === 'w' ? 2 : 1;
  return historyLength >= steps ? steps : 0;
}
