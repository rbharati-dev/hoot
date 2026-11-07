// "My progress": the monthly brain-fitness letter. Free users see the current
// month; Hoot Plus adds earlier months and a printable copy. Celebrates play
// and consistency; never medical claims.
import { useMemo, useState } from 'react';
import { readActivity } from '../lib/activity';
import { gridCells, monthReport, nextMonth, prevMonth } from '../lib/report';
import { gameName, type Strings } from '../lib/i18n';
import type { Lang } from '../lib/data';
import { usePlus } from './PlusProvider';
import ShareWeek from './ShareWeek';
import { Icon, gameIcon } from './Icon';

const locale = (lang: Lang) => (lang === 'en' ? 'en-US' : lang);
// "17 days active" under a big "17": show the words without repeating the number.
const label = (text: string, n: number) => text.replace(String(n), '').replace(/\s{2,}/g, ' ').trim();

export default function Progress({ t, lang }: { t: Strings; lang: Lang }) {
  const now = useMemo(() => new Date(), []);
  const { plus, openUpgrade } = usePlus();
  const [at, setAt] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const log = useMemo(() => readActivity(), []);
  const r = useMemo(() => monthReport(log, at.year, at.month, now), [log, at, now]);
  const isCurrent = at.year === now.getFullYear() && at.month === now.getMonth() + 1;
  const title = new Date(at.year, at.month - 1, 1).toLocaleDateString(locale(lang), { month: 'long', year: 'numeric' });
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale(lang), { weekday: 'narrow' })); // Jan 1 2024 = Monday
  const maxRounds = Math.max(1, ...r.games.map(g => g.rounds));
  const name = (g: Parameters<typeof gameName>[1]) => gameName(t, g);

  const goPrev = () => (plus ? setAt(prevMonth(at.year, at.month)) : openUpgrade());
  const goNext = () => !isCurrent && setAt(nextMonth(at.year, at.month));
  const print = () => (plus ? window.print() : openUpgrade());

  return (
    <div className="progress">
      <header className="progress-head">
        <h1 className="with-icon">
          <Icon name="progress" size={32} />
          {t.progress}
        </h1>
        <p className="muted">{t.progressIntro}</p>
        <ShareWeek t={t} className="btn primary" />
      </header>

      <div className="progress-month" role="group" aria-label={title}>
        <button className="btn month-step" onClick={goPrev} aria-label={t.reportPrev}>
          <Icon name="prev" size={28} />
          {!plus && <Icon name="lock" size={18} className="lock" />}
        </button>
        <h2 className="month-title">{title}</h2>
        <button className="btn month-step" onClick={goNext} disabled={isCurrent} aria-label={t.reportNext}>
          <Icon name="forward" size={28} />
        </button>
      </div>

      <article className="letter">
        <p className="letter-greeting">{t.reportGreeting}</p>
        {r.empty ? (
          <p>{t.reportEmpty}</p>
        ) : (
          <>
            <ul className="report-stats">
              <li><strong>{r.activeDays}</strong><span>{label(t.reportActiveDays(r.activeDays), r.activeDays)}</span></li>
              <li><strong>{r.rounds}</strong><span>{label(t.reportRounds(r.rounds), r.rounds)}</span></li>
              <li><strong>{r.solved}</strong><span>{label(t.reportSolved(r.solved), r.solved)}</span></li>
            </ul>
            <ul className="highlights">
              {r.highlights.map((h, i) => (
                <li key={i}>{t.reportHighlight(h, name)}</li>
              ))}
            </ul>
          </>
        )}

        <h3 className="with-icon">
          <Icon name="calendar" size={22} />
          {t.reportCalendar}
        </h3>
        <div className="cal" role="table" aria-label={t.reportCalendar}>
          {weekdays.map((w, i) => (
            <span key={`w${i}`} className="cal-wd" aria-hidden="true">{w}</span>
          ))}
          {gridCells(r).map((c, i) =>
            c ? (
              <span
                key={c.key}
                className={['cal-day', c.active && 'active', c.rounds >= 3 && 'busy', c.five && 'five', c.future && 'future'].filter(Boolean).join(' ')}
                title={c.active ? t.reportRounds(c.rounds) : undefined}
              >
                {c.day}
              </span>
            ) : (
              <span key={`b${i}`} className="cal-blank" aria-hidden="true" />
            ),
          )}
        </div>

        <ul className="cal-key">
          <li><span className="cal-day active" aria-hidden="true" />{t.calKeyActive}</li>
          <li><span className="cal-day busy" aria-hidden="true" />{t.calKeyBusy}</li>
          <li><span className="cal-day five" aria-hidden="true" />{t.calKeyFive}</li>
        </ul>

        {r.games.length > 0 && (
          <>
            <h3 className="with-icon">
              <Icon name="games" size={22} />
              {t.reportByGame}
            </h3>
            <ul className="by-game">
              {r.games.map(g => (
                <li key={g.game}>
                  <span className="bg-name">
                    <Icon name={gameIcon(g.game)} size={22} />
                    {name(g.game)}
                  </span>
                  <span className="bg-bar" aria-hidden="true">
                    <span style={{ width: `${(g.rounds / maxRounds) * 100}%` }} />
                  </span>
                  <span className="bg-num">{t.reportRounds(g.rounds)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="muted small not-medical">{t.progressNotMedical}</p>
      </article>

      <div className="row progress-actions">
        <button className="btn primary big" onClick={print}>
          <Icon name="print" size={28} />
          {t.reportPrint}
          {!plus && <Icon name="lock" size={20} className="lock" />}
        </button>
      </div>
      {!plus && <p className="muted small">{t.reportPastLocked}</p>}
    </div>
  );
}
