// Hoot Plus in the UI: one provider at the top of the app that knows whether
// the person has Plus, counts game rounds against the free daily allowance,
// and shows the Upgrade sheet when something locked is tapped.
//
// Games call `useGate()`'s function before starting ANOTHER round inside the
// game ("New puzzle", "Play again"); it returns false (and the Games page shows
// the "come back tomorrow" screen) when the free round for today is used up.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readActivity, recordStart, recordSolve, type GameId } from '../lib/activity';
import { canStartRound, canStartTrial, isPlus, readPlus, trialDaysLeft, withTrial, writePlus, type PlusState } from '../lib/plus';
import { recordSignal } from '../lib/prefs';

interface PlusApi {
  plus: boolean;
  state: PlusState;
  trialDaysLeft: number;
  /** Show the Upgrade sheet (why: what was tapped, for the heading). */
  openUpgrade: () => void;
  startTrial: () => void;
  /** Free allowance check for opening/starting a round; does not record. */
  canPlay: (game: GameId) => boolean;
  /** Record a started round (call once a round actually starts). */
  started: (game: GameId) => void;
  solved: (game: GameId) => void;
}

const noop = () => {};
const PlusCtx = createContext<PlusApi>({
  plus: true, // outside a provider (unit/component tests): nothing is locked
  state: {},
  trialDaysLeft: 0,
  openUpgrade: noop,
  startTrial: noop,
  canPlay: () => true,
  started: noop,
  solved: noop,
});

export const usePlus = () => useContext(PlusCtx);

// The game currently on screen, and what to do when its free round is used up.
interface GateApi {
  game: GameId | null;
  onBlocked: () => void;
}
export const GateCtx = createContext<GateApi>({ game: null, onBlocked: noop });

/**
 * For a game component: returns `next()` → true if another round may start
 * now (and records it), false if today's free round is used (and switches the
 * page to the "come back tomorrow" screen). Outside the Games page it always
 * allows.
 */
export function useGate(): () => boolean {
  const { canPlay, started } = usePlus();
  const { game, onBlocked } = useContext(GateCtx);
  return useCallback(() => {
    if (!game) return true;
    if (!canPlay(game)) {
      onBlocked();
      return false;
    }
    started(game);
    return true;
  }, [game, canPlay, started, onBlocked]);
}

export default function PlusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlusState>(() => readPlus());
  const [tick, setTick] = useState(0); // re-render after activity changes
  const plus = isPlus();

  // A trial can end while the app is open overnight: re-check hourly.
  useEffect(() => {
    const id = window.setInterval(() => setTick(x => x + 1), 3600_000);
    return () => window.clearInterval(id);
  }, []);

  const api = useMemo<PlusApi>(
    () => ({
      plus,
      state,
      trialDaysLeft: trialDaysLeft(state, new Date()),
      openUpgrade: () => {},
      startTrial: () => {
        if (!canStartTrial(state)) return;
        const next = withTrial(state, new Date());
        writePlus(next);
        setState(next);
      },
      canPlay: game => canStartRound(readActivity(), game, new Date()),
      started: game => {
        recordStart(game);
        recordSignal({ kind: 'gameStart', game });
        setTick(x => x + 1);
      },
      solved: game => {
        recordSolve(game);
        recordSignal({ kind: 'gameSolve', game });
        setTick(x => x + 1);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plus, state, tick],
  );

  return (
    <PlusCtx.Provider value={api}>
      {children}
    </PlusCtx.Provider>
  );
}
