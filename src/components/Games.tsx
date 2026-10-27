import Loading from './Loading';
import { useEffect, useState } from 'react';
import { orderGamesForVisit, readPrefs, roundsPlayed } from '../lib/prefs';
import { store, type Lang, type Profile } from '../lib/data';
import { tuneRound, type Tune } from '../lib/daily';
import { win } from '../lib/sound';
import { gameName, type Strings } from '../lib/i18n';
import { Icon, gameIcon } from './Icon';
import { GateCtx, useGate, usePlus } from './PlusProvider';
import { GAMES, type GameId } from '../lib/activity';
import Sudoku from './Sudoku';
import Crossword from './Crossword';
import Trivia from './Trivia';
import WordSearch from './WordSearch';
import ChessGame from './ChessGame';
import CheckersGame from './CheckersGame';
import PatternGame from './PatternGame';
import QuickMath from './QuickMath';
import WordScramble from './WordScramble';
import Hangman from './Hangman';
import Solitaire from './Solitaire';
import NameThatTune from './NameThatTune';

type Game = GameId;

function TuneGame({ t, lang, profile, onSolved }: { t: Strings; lang: Lang; profile: Profile; onSolved: () => void }) {
  const [tune, setTune] = useState<Tune | null | undefined>(undefined);
  const [round, setRound] = useState(0);
  const [swapped, setSwapped] = useState(false); // came from a "can't play" swap → start playing
  const gate = useGate();
  useEffect(() => {
    let live = true;
    setTune(undefined);
    tuneRound(profile, lang).then(x => live && setTune(x));
    return () => {
      live = false;
    };
  }, [profile, lang, round]);
  if (tune === undefined) return <Loading label={t.loading} />;
  if (tune === null) return <p className="muted">{t.noContent}</p>;
  return (
    <NameThatTune
      t={t}
      lang={lang}
      tune={tune}
      doneLabel={t.newPuzzle}
      autoPlay={swapped}
      onUnavailable={() => {
        setSwapped(true);
        setRound(r => r + 1);
      }}
      onDone={() => {
        onSolved();
        setSwapped(false);
        // Another song is another round (a swap for an unplayable song is not).
        if (gate()) setRound(r => r + 1);
      }}
    />
  );
}

// Shown instead of a game when today's free round of it is used up.
function DailyDone({ t, game, back }: { t: Strings; game: Game; back: () => void }) {
  const { openUpgrade } = usePlus();
  return (
    <div className="daily-done" role="status">
      <p className="daily-done-icon" aria-hidden="true">
        <Icon name="clock" size={56} />
      </p>
      <h1>{t.dailyDone(gameName(t, game))}</h1>
      <p>{t.dailyDoneBody}</p>
      <div className="row">
        <button className="btn primary big" onClick={openUpgrade}>
          <Icon name="star" size={26} />
          {t.seePlus}
        </button>
        <button className="btn big" onClick={back}>
          <Icon name="grid" size={26} />
          {t.otherGames}
        </button>
      </div>
    </div>
  );
}

export default function Games({ t, lang, profile, openProgress, howToPlay }: { t: Strings; lang: Lang; profile: Profile; openProgress?: () => void; howToPlay?: (g: Game) => void }) {
  const [game, setGame] = useState<Game | null>(null);
  const [blocked, setBlocked] = useState(false); // today's free round of `game` is used up
  const [stats, setStats] = useState(() => store.games());
  const plusApi = usePlus();
  // Favourites float up once the person has played a few rounds. Worked out
  // once per visit so tiles never shuffle under their finger.
  const [order] = useState<string[]>(() => orderGamesForVisit([...GAMES], readPrefs(), roundsPlayed(readPrefs(), store.games())));

  const onSolved = (g: Game) => {
    win();
    const s = { ...store.games(), [g]: (store.games()[g] ?? 0) + 1 };
    store.setGames(s);
    setStats(s);
    plusApi.solved(g);
  };

  // Opening a game is its first round of the day.
  const open = (g: Game) => {
    if (plusApi.canPlay(g)) {
      plusApi.started(g);
      setBlocked(false);
    } else setBlocked(true);
    setGame(g);
  };

  if (game && blocked) {
    return (
      <div className="game-page">
        <button className="btn" onClick={() => setGame(null)}>
          <Icon name="back" size={24} />
          {t.allGames}
        </button>
        <DailyDone t={t} game={game} back={() => setGame(null)} />
      </div>
    );
  }

  if (game) {
    return (
      <GateCtx.Provider value={{ game, onBlocked: () => setBlocked(true) }}>
      <div className="game-page">
        <div className="game-top">
          <button className="btn" onClick={() => setGame(null)}>
            <Icon name="back" size={24} />
          {t.allGames}
          </button>
          {howToPlay && (
            <button className="btn how-to" onClick={() => howToPlay(game)}>
              <Icon name="help" size={24} />
              {t.howToPlay}
            </button>
          )}
        </div>
        {game === 'sudoku' && <Sudoku t={t} onSolved={() => onSolved('sudoku')} />}
        {game === 'crossword' && <Crossword t={t} lang={lang} profile={profile} onSolved={() => onSolved('crossword')} />}
        {game === 'trivia' && <Trivia t={t} lang={lang} profile={profile} onSolved={() => onSolved('trivia')} />}
        {game === 'tune' && <TuneGame t={t} lang={lang} profile={profile} onSolved={() => onSolved('tune')} />}
        {game === 'wordsearch' && <WordSearch t={t} lang={lang} profile={profile} onSolved={() => onSolved('wordsearch')} />}
        {game === 'scramble' && <WordScramble t={t} lang={lang} profile={profile} onSolved={() => onSolved('scramble')} />}
        {game === 'hangman' && <Hangman t={t} lang={lang} profile={profile} onSolved={() => onSolved('hangman')} />}
        {game === 'solitaire' && <Solitaire t={t} onSolved={() => onSolved('solitaire')} />}
        {game === 'pattern' && <PatternGame t={t} onSolved={() => onSolved('pattern')} />}
        {game === 'quickmath' && <QuickMath t={t} onSolved={() => onSolved('quickmath')} />}
        {game === 'chess' && <ChessGame t={t} onSolved={() => onSolved('chess')} />}
        {game === 'checkers' && <CheckersGame t={t} onSolved={() => onSolved('checkers')} />}
      </div>
      </GateCtx.Provider>
    );
  }

  const unordered: [Game, string, string][] = [
    ['trivia', t.trivia, t.triviaBody],
    ['tune', t.nameTune, t.nameTuneBody],
    ['crossword', t.crossword, t.crosswordBody],
    ['wordsearch', t.wordsearch, t.wordsearchBody],
    ['scramble', t.wordscramble, t.wordscrambleBody],
    ['hangman', t.hangman, t.hangmanBody],
    ['solitaire', t.solitaire, t.solitaireBody],
    ['sudoku', t.sudoku, t.sudokuBody],
    ['pattern', t.pattern, t.patternBody],
    ['quickmath', t.quickmath, t.quickmathBody],
    ['chess', t.chess, t.chessBody],
    ['checkers', t.checkers, t.checkersBody],
  ];
  const list = unordered.slice().sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));

  return (
    <div className="games">
      <div className="games-head">
        <div>
          <h1 className="with-icon">
            <Icon name="games" size={32} />
            {t.games}
          </h1>
          <p className="muted">{t.gamesIntro}</p>
        </div>
        <div className="games-head-actions">
          {openProgress && (
            <button className="btn" onClick={openProgress}>
              <Icon name="progress" size={24} />
              {t.progress}
            </button>
          )}
          <button className={plusApi.plus ? 'btn plus-chip on' : 'btn plus-chip'} onClick={plusApi.openUpgrade}>
            <Icon name="star" size={24} />
            {plusApi.plus && plusApi.trialDaysLeft > 0 ? t.plusTrialActive(plusApi.trialDaysLeft) : t.plusName}
          </button>
        </div>
      </div>
      <div className="game-list">
        {list.map(([id, name, body]) => (
          <button key={id} className={plusApi.canPlay(id) ? 'game-tile' : 'game-tile played'} onClick={() => open(id)}>
            <span className="game-icon" aria-hidden="true">
              <Icon name={gameIcon(id)} size={40} />
            </span>
            <span className="game-text">
              <strong>{name}</strong>
              <span>{body}</span>
              {stats[id] ? <span className="muted small">{t.solvedCount(stats[id])}</span> : null}
              {!plusApi.canPlay(id) && <span className="played-today small">
                  <Icon name="check" size={18} /> {t.dailyDone(name)}
                </span>}
            </span>
            <span className="btn primary">
              <Icon name="play" size={24} />
              {t.play}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
