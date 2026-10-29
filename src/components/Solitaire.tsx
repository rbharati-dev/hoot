// Klondike solitaire, made for one-tap play: tap a card and it goes by itself
// to the best place it fits. Tap the deck for a new card. Undo any move.
//
// The first time someone opens it, a short walkthrough plays on the real
// cards: a finger points at a card to tap, then at the deck, then at the suit
// piles. It moves on as they actually do each thing, and can be skipped.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGate } from './PlusProvider';
import { anyMove, applyMove, bestMove, deal, drawCard, won, isRed, SUITS, RANKS, type Card, type Game, type Source } from '../lib/solitaire';
import { markCoached, needsCoach } from '../lib/coach';
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

/** The first card that one tap would move (the turned card first). */
function movableCard(g: Game): Card | null {
  const top = g.waste[g.waste.length - 1];
  if (top && bestMove(g, { kind: 'waste' })) return top;
  for (let col = 0; col < 7; col++)
    for (let row = 0; row < g.tableau[col].length; row++) {
      const c = g.tableau[col][row];
      if (c.up && bestMove(g, { kind: 'tab', col, row })) return c;
    }
  return null;
}

type Step = 'card' | 'deck' | 'piles';
interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
  room: number; // space below the target, inside the game
}

function Finger() {
  return (
    <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
      <path
        d="M9 11V5.5a1.5 1.5 0 013 0V10m0-1.5a1.5 1.5 0 013 0V11m0-1a1.5 1.5 0 013 0v4.5c0 3.6-2.4 6.5-6 6.5h-.6c-2 0-3.4-.8-4.6-2.4L4.2 14a1.5 1.5 0 012.4-1.8L9 15"
        fill="#fff"
        stroke="#1c1b1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Solitaire({ t, onSolved }: { t: Strings; onSolved: () => void }) {
  const gate = useGate();
  const [game, setGame] = useState<Game>(() => deal(Math.floor(Math.random() * 1e9)));
  const [history, setHistory] = useState<Game[]>([]);
  const [msg, setMsg] = useState<string>('');
  const [didWin, setDidWin] = useState(false);
  const [shake, setShake] = useState<number | null>(null);

  // ---- first-time walkthrough ----
  const [coaching, setCoaching] = useState(() => needsCoach('solitaire'));
  const [doneSteps, setDoneSteps] = useState<Step[]>([]);
  const [box, setBox] = useState<Box | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const movable = movableCard(game);
  const step: Step | null = !coaching
    ? null
    : !doneSteps.includes('card') && movable
      ? 'card'
      : !doneSteps.includes('deck') && (game.stock.length || game.waste.length)
        ? 'deck'
        : 'piles';

  const finishCoach = useCallback(() => {
    markCoached('solitaire');
    setCoaching(false);
    setBox(null);
  }, []);
  const stepDone = (s: Step) => coaching && setDoneSteps(d => (d.includes(s) ? d : [...d, s]));

  // Find where the thing to tap is on screen, relative to the game.
  const measure = useCallback(() => {
    const root = wrap.current;
    if (!root || !step) return setBox(null);
    const sel = step === 'card' ? `[data-card="${movable?.id}"]` : step === 'deck' ? '.sol-pile.stock' : '.sol-founds';
    const el = root.querySelector<HTMLElement>(sel);
    if (!el) return setBox(null);
    const base = root.getBoundingClientRect();
    let r = el.getBoundingClientRect();
    // A card in the middle of a column moves with the cards on it: ring them all.
    let bottom = r.bottom;
    for (let n = el.nextElementSibling; step === 'card' && n; n = n.nextElementSibling) bottom = Math.max(bottom, n.getBoundingClientRect().bottom);
    r = new DOMRect(r.left, r.top, r.width, bottom - r.top);
    setBox({ left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height, room: base.bottom - r.bottom });
  }, [step, movable?.id]);

  // Bring each new step into view (on a phone the deck can be off-screen).
  const lastStep = useRef<Step | null>(null);
  useEffect(() => {
    if (!step || step === lastStep.current) return;
    const first = lastStep.current === null;
    lastStep.current = step;
    const root = wrap.current;
    const el = root?.querySelector<HTMLElement>(step === 'card' ? `[data-card="${movable?.id}"]` : step === 'deck' ? '.sol-pile.stock' : '.sol-founds');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (el && !first) el.scrollIntoView?.({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    // The first step: make sure the cards (not just the title) are on screen.
    else if (el && el.getBoundingClientRect().bottom + 180 > window.innerHeight) root?.querySelector('.sol-top')?.scrollIntoView?.({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [step, movable?.id]);

  useLayoutEffect(measure, [measure, game]);
  useEffect(() => {
    if (!coaching) return;
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [coaching, measure]);
  useEffect(() => {
    if (!coaching) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finishCoach();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [coaching, finishCoach]);

  // ---- the game ----
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
    play(drawCard(game));
    setMsg(!game.stock.length ? t.solDeckRestarted : '');
    stepDone('deck');
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
    stepDone('card');
  };

  const wasteTop = game.waste[game.waste.length - 1];
  const noMovesLeft = !didWin && !game.stock.length && !game.waste.length && !anyMove(game);
  const tip = step === 'card' ? t.solCoachCard : step === 'deck' ? t.solCoachDeck : t.solCoachPiles;
  // Put the bubble under the target, or above it when there is no room below.
  const below = box ? box.room > 190 || box.top < 190 : true;

  return (
    <div className="minigame solitaire" ref={wrap}>
      <h1 className="with-icon">
        <Icon name="solitaire" size={32} />
        {t.solitaire}
      </h1>
      <p className="muted">{t.solitaireHelp}</p>

      <div className="sol-top">
        <button className="sol-pile stock" onClick={tapDeck} aria-label={game.stock.length ? `${t.solDeck}: ${t.solCardsLeft(game.stock.length)}` : t.solRestartDeck}>
          {game.stock.length ? (
            <span className="card-face back" />
          ) : (
            <span className="card-face empty">
              <Icon name="refresh" size={28} />
            </span>
          )}
        </button>
        <button
          className={'sol-pile waste' + (wasteTop && shake === wasteTop.id ? ' shake' : '')}
          onClick={() => wasteTop && tapCard({ kind: 'waste' }, wasteTop)}
          aria-label={wasteTop ? cardName(t, wasteTop) : t.solNoCard}
          disabled={!wasteTop}
          data-card={wasteTop?.id}
        >
          {wasteTop ? <CardFace c={wasteTop} /> : <span className="card-face empty" />}
        </button>
        <span className="sol-gap" />
        <div className="sol-founds">
          {game.foundations.map((f, fi) => (
            <div key={fi} className="sol-pile foundation" role="img" aria-label={`${SUIT_NAMES(t)[fi]}: ${f.length ? cardName(t, f[f.length - 1]) : t.solEmpty}`}>
              {f.length ? <CardFace c={f[f.length - 1]} /> : <span className={'card-face empty' + (fi === 1 || fi === 2 ? ' red' : '')}>{SUITS[fi]}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="sol-tableau">
        {game.tableau.map((pile, col) => (
          <div key={col} className="sol-col" style={{ minHeight: `${(Math.max(pile.length, 1) - 1) * 26 + 94}px` }}>
            {pile.length === 0 && <span className="card-face empty slot" aria-label={t.solEmptyCol}>K</span>}
            {pile.map((c, row) => (
              <button
                key={c.id}
                data-card={c.id}
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

      {step && box && (
        <div className="coach" aria-live="polite">
          <span className="coach-ring" key={`r-${step}`} style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12 }} aria-hidden="true" />
          {step !== 'piles' && (
            <span className="coach-finger" key={`f-${step}-${movable?.id}`} style={{ left: box.left + box.width / 2 - 8, top: box.top + Math.min(box.height, 70) / 2 }} aria-hidden="true">
              <Finger />
            </span>
          )}
          <div
            className={'coach-bubble ' + (below ? 'below' : 'above')}
            role="dialog"
            aria-label={t.solitaire}
            style={below ? { top: box.top + box.height + 18 } : { top: box.top - 18 }}
          >
            <p>{tip}</p>
            <div className="coach-actions">
              {step === 'piles' ? (
                <button className="btn primary" onClick={finishCoach} autoFocus>
                  {t.solCoachGotIt}
                </button>
              ) : null}
              <button className="btn quiet" onClick={finishCoach}>
                {t.solCoachSkip}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
