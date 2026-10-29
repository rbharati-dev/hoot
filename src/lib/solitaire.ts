// A compact Klondike (draw-one) engine. Pure data + rule helpers; the React
// component drives it with taps.

export interface Card {
  id: number;
  suit: 0 | 1 | 2 | 3; // 0 ♣ black, 1 ♦ red, 2 ♥ red, 3 ♠ black
  rank: number; // 1 (Ace) .. 13 (King)
  up: boolean;
}

export interface Game {
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // 4 piles, by suit order as filled
  tableau: Card[][]; // 7 piles
}

export const SUITS = ['♣', '♦', '♥', '♠'];
export const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const isRed = (c: Card) => c.suit === 1 || c.suit === 2;

export function deal(seed: number): Game {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
  const deck: Card[] = [];
  let id = 0;
  for (let suit = 0; suit < 4; suit++) for (let rank = 1; rank <= 13; rank++) deck.push({ id: id++, suit: suit as Card['suit'], rank, up: false });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck.pop()!;
      card.up = row === col;
      tableau[col].push(card);
    }
  }
  return { stock: deck, waste: [], foundations: [[], [], [], []], tableau };
}

export const canToFoundation = (card: Card, pile: Card[]) =>
  pile.length === 0 ? card.rank === 1 : pile[pile.length - 1].suit === card.suit && card.rank === pile[pile.length - 1].rank + 1;

export const canToTableau = (card: Card, pile: Card[]) =>
  pile.length === 0 ? card.rank === 13 : pile[pile.length - 1].up && isRed(pile[pile.length - 1]) !== isRed(card) && pile[pile.length - 1].rank === card.rank + 1;

export const won = (g: Game) => g.foundations.every(f => f.length === 13);

/** Where a tapped card comes from: the turned-over card, or a column (with every card below it). */
export type Source = { kind: 'waste' } | { kind: 'tab'; col: number; row: number };
export type Dest = { kind: 'found'; pile: number } | { kind: 'tab'; col: number };

const cardsOf = (g: Game, s: Source): Card[] => (s.kind === 'waste' ? g.waste.slice(-1) : g.tableau[s.col].slice(s.row));

/** Can these cards go to that place? */
export function canMove(g: Game, s: Source, d: Dest): boolean {
  const cards = cardsOf(g, s);
  if (!cards.length || !cards[0].up) return false;
  if (d.kind === 'found') return cards.length === 1 && cards[0].suit === d.pile && canToFoundation(cards[0], g.foundations[d.pile]);
  if (s.kind === 'tab' && s.col === d.col) return false;
  return canToTableau(cards[0], g.tableau[d.col]);
}

/**
 * The best place for a tapped card, so one tap is enough: its suit's pile at
 * the top first, then a column with cards, then an empty column (only Kings,
 * and never a King that is already alone at the top of its column).
 */
export function bestMove(g: Game, s: Source): Dest | null {
  const cards = cardsOf(g, s);
  if (!cards.length || !cards[0].up) return null;
  const f: Dest = { kind: 'found', pile: cards[0].suit };
  if (canMove(g, s, f)) return f;
  for (let col = 0; col < 7; col++) if (g.tableau[col].length && canMove(g, s, { kind: 'tab', col })) return { kind: 'tab', col };
  const pointless = s.kind === 'tab' && s.row === 0;
  if (!pointless) for (let col = 0; col < 7; col++) if (!g.tableau[col].length && canMove(g, s, { kind: 'tab', col })) return { kind: 'tab', col };
  return null;
}

/** Make the move (returns a new game; the old one is untouched, so Undo is easy). */
export function applyMove(g: Game, s: Source, d: Dest): Game {
  const n: Game = {
    stock: g.stock.map(c => ({ ...c })),
    waste: g.waste.map(c => ({ ...c })),
    foundations: g.foundations.map(f => f.map(c => ({ ...c }))),
    tableau: g.tableau.map(t => t.map(c => ({ ...c }))),
  };
  const moving = s.kind === 'waste' ? n.waste.splice(-1) : n.tableau[s.col].splice(s.row);
  if (s.kind === 'tab') {
    const pile = n.tableau[s.col];
    if (pile.length) pile[pile.length - 1].up = true; // turn over the card underneath
  }
  if (d.kind === 'found') n.foundations[d.pile].push(...moving);
  else n.tableau[d.col].push(...moving);
  return n;
}

/** Turn over the next deck card, or start the deck again when it is empty. */
export function drawCard(g: Game): Game {
  const n: Game = { ...g, stock: g.stock.map(c => ({ ...c })), waste: g.waste.map(c => ({ ...c })) };
  if (n.stock.length) {
    const c = n.stock.pop()!;
    c.up = true;
    n.waste.push(c);
  } else {
    n.stock = n.waste.reverse().map(c => ({ ...c, up: false }));
    n.waste = [];
  }
  return n;
}

/** Is there any card that can move right now (not counting the deck)? */
export function anyMove(g: Game): boolean {
  if (g.waste.length && bestMove(g, { kind: 'waste' })) return true;
  return g.tableau.some((pile, col) => pile.some((c, row) => c.up && bestMove(g, { kind: 'tab', col, row }) !== null));
}
