import { useState } from 'react';
import { useGate } from './PlusProvider';
import { deal, canToFoundation, canToTableau, won, isRed, SUITS, RANKS, type Card, type Game } from '../lib/solitaire';
import { ding, nope, win as winSound } from '../lib/sound';
import type { Strings } from '../lib/i18n';
import { Icon, IconButton } from './Icon';

type Sel = { kind: 'waste' } | { kind: 'tab'; col: number; row: number } | null;

const clone = (g: Game): Game => ({
  stock: g.stock.map(c => ({ ...c })),
  waste: g.waste.map(c => ({ ...c })),
  foundations: g.foundations.map(f => f.map(c => ({ ...c }))),
  tableau: g.tableau.map(t => t.map(c => ({ ...c }))),
});

function CardFace({ c }: { c: Card }) {
  if (!c.up) return <span className="card-face back" aria-hidden="true" />;
  return (
    <span className={isRed(c) ? 'card-face red' : 'card-face black'}>
      <span className="cf-rank">{RANKS[c.rank]}</span>
      <span className="cf-suit">{SUITS[c.suit]}</span>
    </span>
  );
}

export default function Solitaire({ t, onSolved }: { t: Strings; onSolved: () => void }) {
  const gate = useGate();
  const [game, setGame] = useState<Game>(() => deal(Math.floor(Math.random() * 1e9)));
  const [sel, setSel] = useState<Sel>(null);
  const [didWin, setDidWin] = useState(false);

  const commit = (g: Game) => {
    setGame(g);
    setSel(null);
    if (won(g) && !didWin) {
      setDidWin(true);
      winSound();
      onSolved();
    }
  };

  const newGame = () => {
    if (!gate()) return;
    setGame(deal(Math.floor(Math.random() * 1e9)));
    setSel(null);
    setDidWin(false);
  };

  // Click the stock: draw one to the waste, or recycle the waste when empty.
  const clickStock = () => {
    const g = clone(game);
    if (g.stock.length) {
      const c = g.stock.pop()!;
      c.up = true;
      g.waste.push(c);
    } else {
      g.stock = g.waste.reverse().map(c => ({ ...c, up: false }));
      g.waste = [];
    }
    setGame(g);
    setSel(null);
  };

  // The selected card(s): a single waste card, or a face-up tableau substack.
  const selected = (): Card[] => {
    if (!sel) return [];
    if (sel.kind === 'waste') return game.waste.slice(-1);
    return game.tableau[sel.col].slice(sel.row);
  };

  const removeSelected = (g: Game) => {
    if (sel!.kind === 'waste') g.waste.pop();
    else g.tableau[sel!.col].splice(sel!.row);
    // Flip the newly exposed tableau card face-up.
    if (sel!.kind === 'tab') {
      const pile = g.tableau[sel!.col];
      if (pile.length && !pile[pile.length - 1].up) pile[pile.length - 1].up = true;
    }
  };

  const toFoundation = (fi: number) => {
    const stack = selected();
    if (stack.length !== 1) return nope();
    if (!canToFoundation(stack[0], game.foundations[fi])) return nope();
    const g = clone(game);
    removeSelected(g);
    g.foundations[fi].push({ ...stack[0] });
    ding();
    commit(g);
  };

  const toTableau = (col: number) => {
    const stack = selected();
    if (!stack.length) return;
    if (!canToTableau(stack[0], game.tableau[col])) return nope();
    const g = clone(game);
    removeSelected(g);
    g.tableau[col].push(...stack.map(c => ({ ...c })));
    ding();
    commit(g);
  };

  // Double-click a card to send it straight to a foundation if it fits.
  const autoFoundation = (card: Card) => {
    for (let fi = 0; fi < 4; fi++) {
      if (canToFoundation(card, game.foundations[fi])) {
        const g = clone(game);
        // remove card from waste or its tableau top
        if (game.waste.length && game.waste[game.waste.length - 1].id === card.id) g.waste.pop();
        else {
          for (const pile of g.tableau) {
            if (pile.length && pile[pile.length - 1].id === card.id) {
              pile.pop();
              if (pile.length && !pile[pile.length - 1].up) pile[pile.length - 1].up = true;
              break;
            }
          }
        }
        g.foundations[fi].push({ ...card, up: true });
        ding();
        return commit(g);
      }
    }
  };

  const selMatch = (kind: 'waste' | 'tab', col = 0, row = 0) =>
    sel && sel.kind === kind && (kind === 'waste' || (sel.kind === 'tab' && sel.col === col && sel.row === row));

  const wasteTop = game.waste[game.waste.length - 1];

  return (
    <div className="minigame solitaire">
      <h1 className="with-icon">
        <Icon name="solitaire" size={32} />
        {t.solitaire}
      </h1>
      <p className="muted">{t.solitaireHelp}</p>

      <div className="sol-top">
        <button className="sol-pile stock" onClick={clickStock} aria-label="stock">
          {game.stock.length ? <span className="card-face back" /> : <span className="card-face empty">
              <Icon name="refresh" size={28} />
            </span>}
        </button>
        <button
          className={'sol-pile waste' + (selMatch('waste') ? ' sel' : '')}
          onClick={() => (sel ? setSel(null) : wasteTop && setSel({ kind: 'waste' }))}
          onDoubleClick={() => wasteTop && autoFoundation(wasteTop)}
          aria-label="waste"
        >
          {wasteTop ? <CardFace c={wasteTop} /> : <span className="card-face empty" />}
        </button>
        <span className="sol-gap" />
        {game.foundations.map((f, fi) => (
          <button key={fi} className="sol-pile foundation" onClick={() => sel && toFoundation(fi)} aria-label={`foundation ${fi + 1}`}>
            {f.length ? <CardFace c={f[f.length - 1]} /> : <span className="card-face empty">{SUITS[fi]}</span>}
          </button>
        ))}
      </div>

      <div className="sol-tableau">
        {game.tableau.map((pile, col) => (
          <div
            key={col}
            className="sol-col"
            style={{ minHeight: `${(Math.max(pile.length, 1) - 1) * 26 + 94}px` }}
            onClick={() => sel && !pile.length && toTableau(col)}
          >
            {pile.length === 0 && <span className="card-face empty slot" />}
            {pile.map((c, row) => {
              const isSel = sel?.kind === 'tab' && sel.col === col && row >= sel.row;
              const onClick = () => {
                if (!c.up) return;
                if (sel) {
                  // if clicking within current selection's own pile top area, treat as destination
                  if (row === pile.length - 1) toTableau(col);
                  else if (sel.kind === 'tab' && sel.col === col && sel.row === row) setSel(null);
                  else toTableau(col);
                } else {
                  setSel({ kind: 'tab', col, row });
                }
              };
              return (
                <button
                  key={c.id}
                  className={'sol-card' + (isSel ? ' sel' : '')}
                  style={{ top: `${row * 26}px` }}
                  onClick={e => {
                    e.stopPropagation();
                    onClick();
                  }}
                  onDoubleClick={e => {
                    e.stopPropagation();
                    if (c.up && row === pile.length - 1) autoFoundation(c);
                  }}
                >
                  <CardFace c={c} />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {didWin && <p className="notice good" role="status">{t.youWin}</p>}
      <IconButton className="primary" icon="refresh" label={t.newPuzzle} onClick={newGame} />
    </div>
  );
}
