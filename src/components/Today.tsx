import Loading from './Loading';
import { useEffect, useRef, useState } from 'react';
import { byInterest, healthNews, inTopic, loadFeed, loadNews, localized, reflections, store, type Card, type HealthStory, type Lang, type NewsStory, type Profile } from '../lib/data';
import { gameToSuggest } from '../lib/discover';
import { todaysOrder } from '../lib/reflDeck';
import { readActivity, type GameId } from '../lib/activity';
import { gameList } from './Games';
import InstallCard from './InstallCard';
import ShareWeek from './ShareWeek';
import { myWeek } from '../lib/week';
import { gameIcon } from './Icon';
import { completeToday, getStreak, isTodayDone, onThisDay, todaysSet, tuneRound, type DailySet, type Streak } from '../lib/daily';
import { win } from '../lib/sound';
import type { Strings } from '../lib/i18n';
import MemoryCard from './MemoryCard';
import NextDisc from './NextDisc';
import NameThatTune from './NameThatTune';
import { Icon } from './Icon';
import { recordSignal } from '../lib/prefs';

interface Props {
  t: Strings;
  lang: Lang;
  profile: Profile;
  browseAll: () => void;
  openGames: () => void;
  openGame?: (g: GameId) => void;
  openHealth?: () => void;
  openNews?: () => void;
  openReflections?: () => void;
}

export default function Today({ t, lang, profile, browseAll, openGames, openGame, openHealth, openNews, openReflections }: Props) {
  const [otd, setOtd] = useState<Card | null | undefined>(undefined); // undefined = loading
  const [fallback, setFallback] = useState<Card | null>(null); // a home memory when there's no on-this-day event
  const [streak, setStreak] = useState<Streak>(() => getStreak());
  const [set, setSet] = useState<DailySet | null>(null); // the day's run, once started
  const [i, setI] = useState(0); // step index across memories then the tune
  const [doneToday, setDoneToday] = useState(() => isTodayDone());
  const [finished, setFinished] = useState(false);
  const [swappedTune, setSwappedTune] = useState(false);

  useEffect(() => {
    let live = true;
    onThisDay(profile, new Date(), lang).then(async c => {
      if (!live) return;
      setOtd(c);
      // No event from their country today? Show one of their own memories,
      // chosen for the day, rather than a foreign "on this day".
      if (!c) {
        const feed = await loadFeed(profile);
        if (!live || !feed.length) return;
        const now = new Date();
        const dayNum = now.getFullYear() * 1000 + Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 864e5);
        setFallback(feed[dayNum % feed.length] ?? feed[0]);
      }
    });
    return () => {
      live = false;
    };
  }, [profile, lang]);

  // "Also on Hoot": a game not played in a while, one health study, one headline.
  const [suggest] = useState(() => gameToSuggest(readActivity(), new Date()));
  const [study, setStudy] = useState<HealthStory | null>(null);
  const [headline, setHeadline] = useState<NewsStory | null>(null);
  const [thought, setThought] = useState<Card | null>(null);
  // Weekends, once there's something to tell: invite the family.
  const [week] = useState(() => {
    const d = new Date().getDay();
    const w = myWeek();
    return (d === 0 || d === 6) && (w.solved > 0 || w.days > 2 || !!w.note);
  });
  useEffect(() => {
    let live = true;
    const day = Math.floor(Date.now() / 864e5);
    healthNews(lang)
      .then(async list => (list.length ? list : healthNews('en')))
      .then(list => {
        // One of the ten most interesting recent studies, a different one each day.
        const top = byInterest(inTopic(list, 'all')).slice(0, 10);
        if (live && top.length) setStudy(top[day % top.length]);
      });
    // The same reflection the Reflections tab opens on today.
    reflections().then(cards => {
      const first = todaysOrder(cards.map(c => c.id))[0];
      if (live) setThought(cards.find(c => c.id === first) ?? null);
    });
    loadNews(lang).then(feed => {
      const top = feed?.stories.slice().sort((a, b) => b.importance - a.importance)[0];
      if (live && top) setHeadline(top);
    });
    return () => {
      live = false;
    };
  }, [lang]);

  const start = async () => {
    const s = await todaysSet(profile, store.hidden(), lang);
    setSet(s);
    setI(0);
    setFinished(false);
  };

  // Total steps = memory cards, plus one if there's a tune round to finish on.
  const steps = set ? set.memories.length + (set.tune ? 1 : 0) : 0;

  const finish = () => {
    win();
    setStreak(completeToday());
    setDoneToday(true);
    setFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When the current memory appeared, to tell a quick skip from a good read.
  const shownAt = useRef<{ i: number; at: number } | null>(null);
  useEffect(() => {
    shownAt.current = { i, at: Date.now() };
  }, [i, set]);

  const next = () => {
    if (!set) return;
    const cur = set.memories[i];
    if (cur && shownAt.current?.i === i) recordSignal({ kind: 'view', card: cur, ms: Date.now() - shownAt.current.at });
    if (i + 1 < steps) {
      setI(i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finish();
    }
  };

  const localDate = new Date().toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' });

  // ---- running through the set ----
  if (set && !finished) {
    const onTune = set.tune && i >= set.memories.length;
    const counter = (
      <div className="feed-top">
        <span className="muted">
          <Icon name="play" size={18} /> <strong className="year-now">{t.todaysSet}</strong> · {i + 1} {t.of} {steps}
        </span>
      </div>
    );
    if (onTune && set.tune) {
      return (
        <div className="feed">
          {counter}
          <NameThatTune
            t={t}
            lang={lang}
            tune={set.tune}
            onDone={finish}
            doneLabel={t.setDone}
            doneIcon="check"
            autoPlay={swappedTune}
            onUnavailable={async () => {
              // Swap in another song; if none can play, end the set kindly.
              const next = await tuneRound(profile, lang);
              if (next) {
                setSwappedTune(true);
                setSet(s => (s ? { ...s, tune: next } : s));
              } else finish();
            }}
          />
        </div>
      );
    }
    const card = set.memories[i];
    return (
      <div className="feed">
        {counter}
        <div className="feed-stage">
          <MemoryCard key={card.id} t={t} lang={lang} card={card} age={card.year - profile.born}>
            <div className="actions">
              <button className="btn primary big next" onClick={next}>
                <Icon name={i + 1 < steps ? 'next' : 'check'} size={28} />
                {i + 1 < steps ? t.next : t.setDone}
              </button>
            </div>
          </MemoryCard>
          <NextDisc animKey={card.id} label={i + 1 < steps ? t.next : t.setDone} icon={i + 1 < steps ? 'next' : 'check'} onClick={next} />
        </div>
      </div>
    );
  }

  // ---- completion ----
  if (finished) {
    return (
      <div className="today">
        <div className="streak-card big">
          <span className="streak-flame" aria-hidden="true">
            <Icon name="flame" size={36} />
          </span>
          <strong>{t.streakDays(streak.count)}</strong>
          {streak.best > 1 && <span className="muted">{t.bestStreak(streak.best)}</span>}
        </div>
        <h1 className="with-icon">
          <Icon name="check" size={32} />
          {t.setDone}
        </h1>
        <p className="muted">{t.comeBackTomorrow}</p>
        <div className="row">
          <button className="btn primary" onClick={openGames}>
            <Icon name="games" size={24} />
            {t.games}
          </button>
          <button className="btn" onClick={browseAll}>
            <Icon name="memories" size={24} />
            {t.browseAll}
          </button>
        </div>
      </div>
    );
  }

  // ---- home ----
  return (
    <div className="today">
      <div className="today-head">
        <p className="muted today-date">{localDate}</p>
        <h1 className="with-icon">
          <Icon name="today" size={32} />
          {t.welcomeBack}
        </h1>
      </div>

      <section className="today-hero" aria-labelledby="today-hero-title">
        <div className="hero-top">
          <h2 id="today-hero-title" className="with-icon">
            <Icon name="play" size={26} />
            {t.todaysSet}
          </h2>
          {streak.count > 0 ? (
            <div className="streak-card" aria-label={t.streakDays(streak.count)}>
              <span className="streak-flame" aria-hidden="true">
                <Icon name="flame" size={28} />
              </span>
              <strong>{t.streakDays(streak.count)}</strong>
            </div>
          ) : (
            <p className="streak-start muted">{t.startStreak}</p>
          )}
        </div>
        {doneToday ? (
          <>
            <p className="hero-done">
              <Icon name="check" size={24} /> {t.setDone}
            </p>
            <p className="muted">{t.comeBackTomorrow}</p>
            <button className="btn big hero-start" onClick={start}>
              <Icon name="refresh" size={28} />
              {t.resumeSet}
            </button>
          </>
        ) : (
          <>
            <p className="hero-body">{t.todaysSetBody}</p>
            <button className="btn primary big hero-start" onClick={start}>
              <Icon name="play" size={28} />
              {t.startSet}
            </button>
          </>
        )}
      </section>
      <InstallCard t={t} />
      <section className="discover" aria-labelledby="discover-title">
        <h2 id="discover-title" className="with-icon">
          <Icon name="sparkle" size={26} />
          {t.alsoOnHoot}
        </h2>
        <div className="discover-grid">
          {(() => {
            const info = gameList(t).find(g => g[0] === suggest.game);
            if (!info) return null;
            return (
              <article className="discover-tile">
                <p className="discover-kind">
                  <Icon name="games" size={20} />
                  {t.discoverGame}
                </p>
                <h3 className="with-icon">
                  <Icon name={gameIcon(suggest.game)} size={30} />
                  {info[1]}
                </h3>
                <p className="muted">{suggest.daysAgo === null ? t.discoverNever : suggest.daysAgo > 0 ? t.discoverPlayedAgo(suggest.daysAgo) : t.discoverFresh}</p>
                <div className="discover-actions">
                  <button className="btn primary" onClick={() => (openGame ? openGame(suggest.game) : openGames())}>
                    <Icon name="play" size={22} />
                    {t.discoverPlay}
                  </button>
                  <button className="btn quiet" onClick={openGames}>
                    {t.allGames}
                    <Icon name="forward" size={20} />
                  </button>
                </div>
              </article>
            );
          })()}
          {study && (
            <article className="discover-tile">
              <p className="discover-kind">
                <Icon name="health" size={20} />
                {t.discoverHealth}
              </p>
              <h3 lang={study.en ? 'en' : undefined}>{study.title}</h3>
              <p className="muted discover-src">{study.source}</p>
              <div className="discover-actions">
                <button className="btn" onClick={openHealth}>
                  {t.discoverHealthMore}
                  <Icon name="forward" size={20} />
                </button>
              </div>
            </article>
          )}
          {headline && (
            <article className="discover-tile">
              <p className="discover-kind">
                <Icon name="news" size={20} />
                {t.discoverNews}
              </p>
              <h3>{headline.title}</h3>
              <p className="muted discover-src">{headline.source}</p>
              <div className="discover-actions">
                <button className="btn" onClick={openNews}>
                  {t.discoverNewsMore}
                  <Icon name="forward" size={20} />
                </button>
              </div>
            </article>
          )}
          {week && (
            <article className="discover-tile">
              <p className="discover-kind">
                <Icon name="family" size={20} />
                {t.weekTile}
              </p>
              <p>{t.weekTileBody}</p>
              <div className="discover-actions">
                <ShareWeek t={t} className="btn primary" />
              </div>
            </article>
          )}
          {thought && (
            <article className="discover-tile">
              <p className="discover-kind">
                <Icon name="reflections" size={20} />
                {t.discoverReflection}
              </p>
              <h3>{localized(thought, lang).title}</h3>
              {thought.era && <p className="muted discover-src">{thought.era}</p>}
              <div className="discover-actions">
                <button className="btn" onClick={openReflections}>
                  {t.discoverReflectionMore}
                  <Icon name="forward" size={20} />
                </button>
              </div>
            </article>
          )}
        </div>
      </section>

      <section className="today-block">
        <h2 className="with-icon">
          <Icon name="calendar" size={26} />
          {otd ? t.onThisDay : t.aMemory}
        </h2>
        {otd === undefined ? (
          <Loading label={t.loading} />
        ) : otd ? (
          <MemoryCard t={t} lang={lang} card={otd} age={otd.year - profile.born} />
        ) : fallback ? (
          <>
            <p className="muted">{t.onThisDayNone}</p>
            <MemoryCard t={t} lang={lang} card={fallback} age={fallback.year - profile.born} />
          </>
        ) : (
          <p className="muted">{t.onThisDayNone}</p>
        )}
      </section>

      <button className="btn quiet" onClick={browseAll}>
        {t.browseAll}
        <Icon name="forward" size={22} />
      </button>

    </div>
  );
}
