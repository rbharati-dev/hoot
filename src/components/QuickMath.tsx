import { useState } from 'react';
import { makeMath, type MathLevel, type MathProblem } from '../lib/quickmath';
import { store } from '../lib/data';
import { fmtTime, useCountdown } from '../lib/useTimer';
import { ding, nope } from '../lib/sound';
import type { Strings } from '../lib/i18n';
import { useGate, usePlus } from './PlusProvider';
import { Icon } from './Icon';

const ROUND = 8; // relaxed mode: a fixed set of problems
const SECONDS = 60; // timed mode: answer as many as you can

type Mode = 'relaxed' | 'timed';

export default function QuickMath({ t, onSolved }: { t: Strings; onSolved: () => void }) {
  const gate = useGate();
  const { plus, openUpgrade } = usePlus();
  const [mode, setMode] = useState<Mode>('relaxed');
  const [level, setLevel] = useState<MathLevel>('easy');
  const [p, setP] = useState<MathProblem>(() => makeMath('easy'));
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(() => store.records()['quickmath'] ?? null);
  const [record, setRecord] = useState(false);

  const finishTimed = () => {
    setRunning(false);
    setDone(true);
    setScore(s => {
      if (best === null || s > best) {
        setBest(s);
        setRecord(true);
        store.setRecords({ ...store.records(), quickmath: s });
      }
      return s;
    });
  };
  const left = useCountdown(SECONDS, mode === 'timed' && running && !done, finishTimed);

  const fresh = (l: MathLevel, m: Mode = mode) => {
    if (!gate()) return;
    setMode(m);
    setLevel(l);
    setP(makeMath(l));
    setPicked(null);
    setScore(0);
    setRound(1);
    setDone(false);
    setRecord(false);
    setRunning(m === 'timed');
  };

  const choose = (v: number) => {
    if (picked !== null) return;
    setPicked(v);
    const ok = v === p.answer;
    if (ok) {
      ding();
      setScore(s => s + 1);
    } else nope();
    if (mode === 'timed') {
      // Keep the round moving — brief pause to show right/wrong, then next.
      setTimeout(() => {
        setP(makeMath(level));
        setPicked(null);
        setRound(r => r + 1);
      }, 650);
    } else if (ok && round >= ROUND) {
      onSolved();
    }
  };

  const next = () => {
    if (round >= ROUND) {
      setDone(true);
      return;
    }
    setRound(r => r + 1);
    setP(makeMath(level));
    setPicked(null);
  };

  if (done) {
    return (
      <div className="minigame">
        <h1 className="with-icon">
        <Icon name="quickmath" size={32} />
        {t.quickmath}
      </h1>
        <p className="notice good" role="status">
          {mode === 'timed' ? `${t.timesUp} ${t.roundScore(score, round - 1)}` : t.roundScore(score, ROUND)}
          {record && ` · ${t.newRecord}`}
        </p>
        {best !== null && <p className="muted small">{t.bestScore(best)}</p>}
        <button className="btn primary big" onClick={() => fresh(level)}>
          <Icon name="refresh" size={28} />
          {t.newPuzzle}
        </button>
      </div>
    );
  }

  const correct = picked !== null && picked === p.answer;

  return (
    <div className="minigame">
      <h1 className="with-icon">
        <Icon name="quickmath" size={32} />
        {t.quickmath}
      </h1>
      <div className="segmented" role="group">
        {(['relaxed', 'timed'] as Mode[]).map(m => (
          <button key={m} className={mode === m ? 'chip active' : 'chip'} onClick={() => fresh(level, m)} aria-pressed={mode === m}>
            {m === 'timed' ? t.timed : t.relaxed}
          </button>
        ))}
      </div>
      <div className="segmented" role="group">
        {(['easy', 'medium', 'hard', 'expert'] as MathLevel[]).map(l => {
          const locked = l === 'expert' && !plus;
          const label = l === 'expert' ? t.levelExpert : t[l];
          return (
            <button
              key={l}
              className={level === l ? 'chip active' : 'chip'}
              onClick={() => (locked ? openUpgrade() : fresh(l))}
              aria-pressed={level === l}
              aria-label={locked ? `${label} – ${t.plusLocked}` : label}
            >
              {label}
              {locked && <Icon name="lock" size={18} />}
            </button>
          );
        })}
      </div>

      <div className="game-stats">
        {mode === 'timed' && <span className={left <= 10 ? 'timer low' : 'timer'}><Icon name="clock" size={22} /> {fmtTime(left)}</span>}
        <span className="muted">{t.roundScore(score, round - 1 + (picked !== null ? 1 : 0))}</span>
        {mode === 'timed' && best !== null && <span className="muted small">{t.bestScore(best)}</span>}
      </div>
      <p className="muted">{mode === 'timed' ? t.beatClock : t.quickmathHelp}</p>

      <p className="math-prompt" aria-label={p.prompt}>{p.prompt} =</p>

      <div className="quiz-options math">
        {p.options.map((o, i) => {
          const cls = ['btn big option', picked !== null && o === p.answer && 'right', picked === o && o !== p.answer && 'wrong'].filter(Boolean).join(' ');
          return (
            <button key={i} className={cls} onClick={() => choose(o)} disabled={picked !== null}>
              {o}
            </button>
          );
        })}
      </div>

      {mode === 'relaxed' && picked !== null && (
        <>
          <p className={correct ? 'notice good' : 'notice'} role="status">
            {correct ? t.correct : t.wrongWas(p.answer)}
          </p>
          <button className="btn primary big" onClick={next}>
            <Icon name={round >= ROUND ? 'check' : 'next'} size={28} />
            {round >= ROUND ? t.check : t.keepGoing}
          </button>
        </>
      )}
    </div>
  );
}
