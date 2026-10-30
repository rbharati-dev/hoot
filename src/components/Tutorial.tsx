import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { Lang } from '../lib/data';
import { Icon } from './Icon';
import { STRINGS } from '../lib/i18n';
import { TUTORIAL_TEXT, type TutorialStepId } from '../lib/tutorialText';
import type { GameId } from '../lib/activity';
import type { DemoProps } from './tutorial/kit';
import {
  CheckersDemo, ChessDemo, CrosswordDemo, ExtrasDemo, FinishDemo, HangmanDemo, MathDemo, MemoriesDemo, MenuDemo,
  PatternDemo, QuizDemo, ScrambleDemo, SettingsDemo, SolitaireDemo, SudokuDemo, TodayDemo, TuneDemo, WelcomeDemo,
  WordSearchDemo,
} from './tutorial/demos';

// A step-by-step animated tour. The first visit and the Help page show the
// tour of the app (TOUR_STEPS: getting around, not how to play). Each game's
// own lesson opens on its own from "How to play" in that game (gameSteps()).

const DEMOS: Record<TutorialStepId, (p: DemoProps) => ReactNode> = {
  welcome: () => <WelcomeDemo />,
  menu: p => <MenuDemo {...p} />,
  today: p => <TodayDemo {...p} />,
  memories: p => <MemoriesDemo {...p} />,
  extras: p => <ExtrasDemo {...p} />,
  settings: p => <SettingsDemo {...p} />,
  quiz: () => <QuizDemo />,
  tune: () => <TuneDemo />,
  crossword: p => <CrosswordDemo {...p} />,
  wordsearch: () => <WordSearchDemo />,
  scramble: () => <ScrambleDemo />,
  hangman: () => <HangmanDemo />,
  solitaire: () => <SolitaireDemo />,
  sudoku: () => <SudokuDemo />,
  pattern: () => <PatternDemo />,
  math: () => <MathDemo />,
  chess: p => <ChessDemo {...p} />,
  checkers: () => <CheckersDemo />,
  finish: () => <FinishDemo />,
};

const GAME_STEP: Record<GameId, TutorialStepId> = {
  trivia: 'quiz', tune: 'tune', crossword: 'crossword', wordsearch: 'wordsearch', scramble: 'scramble', hangman: 'hangman',
  solitaire: 'solitaire', sudoku: 'sudoku', pattern: 'pattern', quickmath: 'math', chess: 'chess', checkers: 'checkers',
};

export const TUTORIAL_STEP_COUNT = 7; // the tour (TOUR_STEPS)

/** The one-step lesson for a game, for its "How to play" button. */
export function gameSteps(game: GameId): readonly TutorialStepId[] {
  return [GAME_STEP[game]];
}

const KEY = 'hoot.seenTutorial';

/** True once the tutorial was shown. Anyone who already skipped the old intro counts as having seen it. */
export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true' || localStorage.getItem('hoot.seenIntro') === 'true';
  } catch {
    return false;
  }
}
export function markTutorialSeen(): void {
  try {
    localStorage.setItem(KEY, 'true');
  } catch {
    /* storage unavailable */
  }
}

const PHONE = '(max-width: 759.98px)';
function usePhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia?.(PHONE).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(PHONE);
    if (!mq) return;
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
}

/** The tour shown on the first visit and from Help: how to get around. */
export const TOUR_STEPS: readonly TutorialStepId[] = ['welcome', 'menu', 'today', 'memories', 'extras', 'settings', 'finish'];

export default function Tutorial({ lang, steps = TOUR_STEPS, startAt = 0, onClose }: { lang: Lang; steps?: readonly TutorialStepId[]; startAt?: number; onClose: () => void }) {
  const text = TUTORIAL_TEXT[lang] ?? TUTORIAL_TEXT.en;
  const t = STRINGS[lang];
  const total = steps.length;
  const [step, setStep] = useState(() => Math.min(Math.max(0, startAt), total - 1));
  const phone = usePhone();
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const headId = useId();
  const id = steps[step];
  const last = step === total - 1;

  const close = () => {
    if (steps === TOUR_STEPS) markTutorialSeen();
    onClose();
  };
  // Latest handlers for the key listener without re-subscribing every step.
  const act = useRef({ next: () => {}, back: () => {}, close });
  act.current = {
    next: () => (last ? close() : setStep(s => s + 1)),
    back: () => setStep(s => Math.max(0, s - 1)),
    close,
  };

  // Remember where focus was, and give it back on close.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => before?.focus?.();
  }, []);

  // Focus the heading on every step.
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        act.current.close();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        act.current.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        act.current.back();
      } else if (e.key === 'Tab' && root.current) {
        // keep focus inside the dialog
        const items = [...root.current.querySelectorAll<HTMLElement>('button:not([disabled])')];
        if (!items.length) return;
        const first = items[0];
        const lastEl = items[items.length - 1];
        const a = document.activeElement;
        if (e.shiftKey && (a === first || !root.current.contains(a) || a === heading.current)) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && (a === lastEl || !root.current.contains(a))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const s = text.steps[id];
  const label = text.ui.stepOf.replace('{n}', String(step + 1)).replace('{total}', String(total));

  return (
    <div className="tut" ref={root} role="dialog" aria-modal="true" aria-labelledby={headId} data-testid="tutorial">
      <div className="tut-top">
        <p className="tut-step" data-testid="tutorial-step">{total > 1 ? label : ''}</p>
        <button className="tut-skip" onClick={close}>
          <Icon name="close" size={22} />
          {text.ui.skip}
        </button>
      </div>
      <div className="tut-main">
        <div className="tut-card" key={id} aria-live="polite">
          {DEMOS[id]({ t, phone })}
          <h2 id={headId} ref={heading} tabIndex={-1}>
            {s.title}
          </h2>
          <p>{s.body}</p>
        </div>
      </div>
      <div className="tut-dots" aria-hidden="true" hidden={total < 2}>
        {steps.map((x, k) => (
          <span key={x} className={k === step ? 'dot on' : k < step ? 'dot done' : 'dot'} />
        ))}
      </div>
      <div className="tut-nav">
        <button className="btn back" onClick={() => act.current.back()} disabled={step === 0} hidden={total < 2}>
          <Icon name="back" size={24} />
          {text.ui.back}
        </button>
        <button className="btn primary next" onClick={() => act.current.next()}>
          <Icon name={last ? 'check' : 'next'} size={24} />
          {total < 2 ? t.solCoachGotIt : last ? text.ui.start : text.ui.next}
        </button>
      </div>
    </div>
  );
}
