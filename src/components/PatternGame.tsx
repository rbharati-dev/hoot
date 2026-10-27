import { useState } from 'react';
import { useGate } from './PlusProvider';
import { makePattern, type Pattern } from '../lib/pattern';
import { store } from '../lib/data';
import { fmtTime, useCountdown } from '../lib/useTimer';
import { ding, nope } from '../lib/sound';
import type { Strings } from '../lib/i18n';
import { Icon } from './Icon';

const ROUND = 5; // relaxed: a fixed set
const SECONDS = 60; // timed: as many as you can

type Mode = 'relaxed' | 'timed';

export default function PatternGame({ t, onSolved }: { t: Strings; onSolved: () => void }) {
  const gate = useGate();
  const [mode, setMode] = useState<Mode>('relaxed');
  const [p, setP] = useState<Pattern>(() => makePattern());
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(() => store.records()['pattern'] ?? null);
  const [record, setRecord] = useState(false);

  const finishTimed = () => {
    setRunning(false);
    setDone(true);
    setScore(s => {
      if (best === null || s > best) {
        setBest(s);
        setRecord(true);
        store.setRecords({ ...store.records(), pattern: s });
      }
      return s;
    });
  };
  const left = useCountdown(SECONDS, mode === 'timed' && running && !done, finishTimed, picked !== null);

  const start = (m: Mode) => {
    if (!gate()) return;
    setMode(m);
    setP(makePattern());
    setPicked(null);
    setScore(0);
    setRound(1);
    setDone(false);
    setRecord(false);
    setRunning(m === 'timed');
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === p.answer;
    if (ok) {
      ding();
      setScore(s => s + 1);
    } else nope();
    if (mode === 'relaxed' && ok && round >= ROUND) {
      onSolved();
    }
  };

  const next = () => {
    if (mode === 'relaxed' && round >= ROUND) {
      setDone(true);
      return;
    }
    setRound(r => r + 1);
    setP(makePattern());
    setPicked(null);
  };

  if (done) {
    return (
      <div className="minigame">
        <h1 className="with-icon">
        <Icon name="pattern" size={32} />
        {t.pattern}
      </h1>
        <p className="notice good" role="status">
          {mode === 'timed' ? `${t.timesUp} ${t.roundScore(score, round - 1)}` : t.roundScore(score, ROUND)}
          {record && ` · ${t.newRecord}`}
        </p>
        {best !== null && <p className="muted small">{t.bestScore(best)}</p>}
        <button className="btn primary big" onClick={() => start(mode)}>
          <Icon name="refresh" size={28} />
          {t.newPuzzle}
        </button>
      </div>
    );
  }

  const prompt = p.kind === 'odd' ? t.patternOdd : t.patternNext;
  const correct = picked !== null && picked === p.answer;

  return (
    <div className="minigame">
      <h1 className="with-icon">
        <Icon name="pattern" size={32} />
        {t.pattern}
      </h1>
      <div className="segmented" role="group">
        {(['relaxed', 'timed'] as Mode[]).map(m => (
          <button key={m} className={mode === m ? 'chip active' : 'chip'} onClick={() => start(m)} aria-pressed={mode === m}>
            {m === 'timed' ? t.timed : t.relaxed}
          </button>
        ))}
      </div>
      <div className="game-stats">
        {mode === 'timed' && <span className={left <= 10 ? 'timer low' : 'timer'}><Icon name="clock" size={22} /> {fmtTime(left)}</span>}
        <span className="muted">{t.roundScore(score, round - 1 + (picked !== null ? 1 : 0))}</span>
        {mode === 'timed' && best !== null && <span className="muted small">{t.bestScore(best)}</span>}
      </div>
      {mode === 'timed' && <p className="muted">{t.beatClock}</p>}

      {p.kind === 'next' && (
        <div className="pattern-seq" aria-label={prompt}>
          {p.items.map((n, i) => (
            <span key={i} className="pattern-cell">{n}</span>
          ))}
          <span className="pattern-cell q">?</span>
        </div>
      )}

      <p className="quiz-q">{prompt}</p>

      <div className="quiz-options">
        {p.options.map((o, i) => {
          const cls = ['btn big option', picked !== null && i === p.answer && 'right', picked === i && i !== p.answer && 'wrong'].filter(Boolean).join(' ');
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={picked !== null}>
              {o}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <>
          <p className={correct ? 'notice good' : 'notice'} role="status">
            {correct ? t.correct : t.wrongWas(p.options[p.answer])} {t.patternRule(p.rule)}
          </p>
          <button className="btn primary big" onClick={next}>
            <Icon name={mode === 'relaxed' && round >= ROUND ? 'check' : 'next'} size={28} />
            {mode === 'relaxed' && round >= ROUND ? t.check : t.keepGoing}
          </button>
        </>
      )}
    </div>
  );
}
