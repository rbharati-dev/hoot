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
