// Klondike solitaire, made for one-tap play: tap a card and it goes by itself
// to the best place it fits. Tap the deck for a new card. Undo any move.
import { useState } from 'react';
import { useGate } from './PlusProvider';
import { anyMove, applyMove, bestMove, deal, drawCard, won, isRed, SUITS, RANKS, type Card, type Game, type Source } from '../lib/solitaire';
import { ding, nope, win as winSound } from '../lib/sound';
import type { Strings } from '../lib/i18n';
import { Icon } from './Icon';

const SUIT_NAMES = (t: Strings) => [t.solClubs, t.solDiamonds, t.solHearts, t.solSpades];
const cardName = (t: Strings, c: Card) => `${t.solRankNames[c.rank - 1]} ${t.solOf} ${SUIT_NAMES(t)[c.suit]}`;

function CardFace({ c }: { c: Card }) {
  if (!c.up) return <span className="card-face back" aria-hidden="true" />;
  return (
    <span className={isRed(c) ? 'card-face red' : 'card-face black'} aria-hidden="true">
      <span className="cf-rank">{RANKS[c.rank]}</span>
      <span className="cf-suit">{SUITS[c.suit]}</span>
    </span>
  );
}

export default function Solitaire({ t, onSolved }: { t: Strings; onSolved: () => void }) {
  const gate = useGate();
  const [game, setGame] = useState<Game>(() => deal(Math.floor(Math.random() * 1e9)));
  const [history, setHistory] = useState<Game[]>([]);
  const [msg, setMsg] = useState<string>('');
  const [didWin, setDidWin] = useState(false);
  const [shake, setShake] = useState<number | null>(null);
  const [howOpen] = useState(() => {
    try {
      return localStorage.getItem('hoot.solHowClosed') !== '1';
    } catch {
      return true;
    }
  });
  const rememberHow = (open: boolean) => {
    try {
      localStorage.setItem('hoot.solHowClosed', open ? '0' : '1');
    } catch {
      /* private mode */
    }
  };

  const play = (g: Game) => {
    setHistory(h => [...h.slice(-199), game]);
    setGame(g);
    if (won(g) && !didWin) {
      setDidWin(true);
      setMsg('');
      winSound();
      onSolved();
    }
  };

  const newGame = () => {
    if (!gate()) return;
    setGame(deal(Math.floor(Math.random() * 1e9)));
    setHistory([]);
    setMsg('');
    setDidWin(false);
  };

  const undo = () => {
    if (!history.length) return;
    setGame(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    setMsg('');
  };

  const tapDeck = () => {
    if (!game.stock.length && !game.waste.length) return;
    const g = drawCard(game);
    play(g);
    setMsg(!g.stock.length && !g.waste.length ? '' : !game.stock.length ? t.solDeckRestarted : '');
  };

  const tapCard = (s: Source, c: Card) => {
    if (!c.up) {
      setMsg(t.solFaceDown);
      return;
    }
    const d = bestMove(game, s);
    if (!d) {
      nope();
      setShake(c.id);
      window.setTimeout(() => setShake(x => (x === c.id ? null : x)), 450);
      setMsg(anyMove(game) ? t.solCantMove : t.solTryDeck);
      return;
    }
    ding();
    setMsg('');
    play(applyMove(game, s, d));
  };

  const wasteTop = game.waste[game.waste.length - 1];
  const noMovesLeft = !didWin && !game.stock.length && !game.waste.length && !anyMove(game);

  return (
    <div className="minigame solitaire">
      <h1 className="with-icon">
        <Icon name="solitaire" size={32} />
        {t.solitaire}
      </h1>

      <details className="sol-how" open={howOpen} onToggle={e => rememberHow((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>{t.solHowTitle}</summary>
        <ol>
          {t.solSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </details>

      <div className="sol-top">
        <div className="sol-slot">
          <button className="sol-pile stock" onClick={tapDeck} aria-label={game.stock.length ? `${t.solDeck}: ${t.solCardsLeft(game.stock.length)}` : t.solRestartDeck}>
            {game.stock.length ? (
              <span className="card-face back" />
            ) : (
              <span className="card-face empty">
                <Icon name="refresh" size={28} />
              </span>
            )}
          </button>
          <span className="sol-label">{game.stock.length ? t.solCardsLeft(game.stock.length) : game.waste.length ? t.solRestartDeck : ''}</span>
        </div>
        <div className="sol-slot">
          <button className={'sol-pile waste' + (wasteTop && shake === wasteTop.id ? ' shake' : '')} onClick={() => wasteTop && tapCard({ kind: 'waste' }, wasteTop)} aria-label={wasteTop ? cardName(t, wasteTop) : t.solNoCard} disabled={!wasteTop}>
            {wasteTop ? <CardFace c={wasteTop} /> : <span className="card-face empty" />}
          </button>
          <span className="sol-label">{t.solTurned}</span>
        </div>
        <span className="sol-gap" />
        {game.foundations.map((f, fi) => (
          <div className="sol-slot" key={fi}>
            <div className="sol-pile foundation" role="img" aria-label={`${SUIT_NAMES(t)[fi]}: ${f.length ? cardName(t, f[f.length - 1]) : t.solEmpty}`}>
              {f.length ? <CardFace c={f[f.length - 1]} /> : <span className={'card-face empty' + (fi === 1 || fi === 2 ? ' red' : '')}>{SUITS[fi]}</span>}
            </div>
          </div>
        ))}
      </div>

      <p className="sol-found-label">{t.solFoundLabel}</p>

      <div className="sol-tableau">
        {game.tableau.map((pile, col) => (
          <div key={col} className="sol-col" style={{ minHeight: `${(Math.max(pile.length, 1) - 1) * 26 + 94}px` }}>
            {pile.length === 0 && <span className="card-face empty slot" aria-label={t.solEmptyCol}>K</span>}
            {pile.map((c, row) => (
              <button
                key={c.id}
                className={'sol-card' + (shake === c.id ? ' shake' : '') + (c.up ? '' : ' down')}
                style={{ top: `${row * 26}px` }}
                aria-label={c.up ? cardName(t, c) : t.solFaceDownCard}
                onClick={() => tapCard({ kind: 'tab', col, row }, c)}
              >
                <CardFace c={c} />
              </button>
            ))}
          </div>
        ))}
      </div>

      <p className="sol-msg" role="status" aria-live="polite">
        {didWin ? '' : noMovesLeft ? t.solStuck : msg}
      </p>
      {didWin && (
        <p className="notice good" role="status">
          {t.youWin}
        </p>
      )}
      <div className="row sol-actions">
        <button className="btn big" onClick={undo} disabled={!history.length}>
          <Icon name="back" size={24} />
          {t.solUndo}
        </button>
        <button className="btn primary big" onClick={newGame}>
          <Icon name="refresh" size={24} />
          {t.solNewGame}
        </button>
      </div>
    </div>
  );
}
