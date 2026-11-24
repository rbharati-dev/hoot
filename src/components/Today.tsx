import MoreYours from './MoreYours';
import type { AccountResult, AccountView } from './AccountSheet';
import { useEffect, useRef, useState } from 'react';
import { byInterest, healthNews, inTopic, loadNews, localized, reflections, store, type Card, type HealthStory, type Lang, type NewsStory, type Profile } from '../lib/data';
import { gameToSuggest } from '../lib/discover';
import { todaysOrder } from '../lib/reflDeck';
import { readActivity, type GameId } from '../lib/activity';
import { gameList } from './Games';
import InstallCard from './InstallCard';
import ShareWeek from './ShareWeek';
import { myWeek } from '../lib/week';
import { gameIcon } from './Icon';
import { completeToday, getStreak, isTodayDone, todaysSet, tuneRound, type DailySet, type Streak } from '../lib/daily';
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
  /** A brand-new visitor: start the five straight away, with a first tip. */
  firstRun?: boolean;
  onFirstRunStarted?: () => void;
  onProfile?: (p: Profile) => void;
  /** Shown inside the story home page: no page heading of its own. */
  embedded?: boolean;
  openAccount?: (v: AccountView, after?: (r?: AccountResult) => void) => void;
}

export default function Today({ t, lang, profile, browseAll, openGames, openGame, openHealth, openNews, openReflections, firstRun, onFirstRunStarted, onProfile, openAccount, embedded }: Props) {
  const [streak, setStreak] = useState<Streak>(() => getStreak());
  const [set, setSet] = useState<DailySet | null>(null); // the day's run, once started
  const [i, setI] = useState(0); // step index across memories then the tune
  const [doneToday, setDoneToday] = useState(() => isTodayDone());
  const [finished, setFinished] = useState(false);
  const [swappedTune, setSwappedTune] = useState(false);


  // "Today on Hoot": a game not played in a while, one health study, one headline.
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
        // (Studies in people first: a mouse study is a poor front-page pick.)
        const ranked = byInterest(inTopic(list, 'all'));
        const people = ranked.filter(x => !x.animal && !/\b(mice|mouse|rats?|worms|flies)\b/i.test(x.title));
        const top = (people.length >= 5 ? people : ranked).slice(0, 10);
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

  const swaps = useRef(0); // how many times the song game has swapped songs
  const start = async () => {
    swaps.current = 0;
    const s = await todaysSet(profile, store.hidden(), lang);
    setSet(s);
    setI(0);
    setFinished(false);
    window.scrollTo({ top: 0 });
  };

  const [tip, setTip] = useState(!!firstRun);
  useEffect(() => {
    if (!firstRun) return;
    start();
    onFirstRunStarted?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setTip(false);
      setI(i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finish();
    }
  };

  const localDate = new Date().toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' });

  // ---- "Today on Hoot": one row per section, the whole row is the button ----
  const info = gameList(t).find(g => g[0] === suggest.game);
  const row = (key: string, icon: string, kind: string, title: string, onClick?: () => void, sub?: string, en?: boolean) => (
    <li key={key}>
      <button className="today-row" onClick={onClick}>
        <span className="today-row-icon" aria-hidden="true">
          <Icon name={icon} size={28} />
        </span>
        <span className="today-row-text">
          <span className="today-row-kind">{kind}</span>
          <span className="today-row-title" lang={en ? 'en' : undefined}>
            {title}
          </span>
          {sub && <span className="today-row-sub muted">{sub}</span>}
        </span>
        <Icon name="forward" size={24} />
      </button>
    </li>
  );
  const rows = (
    <section className="today-list" aria-labelledby="today-list-title">
      <h2 id="today-list-title" className="with-icon">
        <Icon name="sparkle" size={26} />
        {t.todayOnHoot}
      </h2>
      <ul>
        {info &&
          row('game', gameIcon(suggest.game), t.discoverGame, info[1], () => (openGame ? openGame(suggest.game) : openGames()), suggest.daysAgo === null ? t.discoverNever : suggest.daysAgo > 0 ? t.discoverPlayedAgo(suggest.daysAgo) : t.discoverFresh)}
        {study && row('health', 'health', t.discoverHealth, study.title, openHealth, study.source, study.en)}
        {headline && row('news', 'news', t.discoverNews, headline.title, openNews, headline.source)}
        {thought && row('thought', 'reflections', t.discoverReflection, localized(thought, lang).title, openReflections, thought.era)}
      </ul>
      {week && (
        <div className="today-week">
          <p>
            <Icon name="family" size={22} /> {t.weekTileBody}
          </p>
          <ShareWeek t={t} className="btn" />
        </div>
      )}
    </section>
  );

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
              // Swap in another song, twice at most; if none can play, end the
              // set kindly rather than cycling through song after song.
              swaps.current++;
              const next = swaps.current <= 2 ? await tuneRound(profile, lang) : null;
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
        {tip && i === 0 && (
          <p className="first-tip" role="note">
            <Icon name="lightbulb" size={24} />
            {t.firstTip}
          </p>
        )}
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
        {rows}
        {onProfile && <MoreYours t={t} profile={profile} onProfile={onProfile} openAccount={openAccount} />}
        <button className="btn quiet" onClick={browseAll}>
          {t.browseAll}
          <Icon name="forward" size={22} />
        </button>
      </div>
    );
  }

  // ---- home ----
  return (
    <div className="today">
      {!embedded && (
        <div className="today-head">
          <p className="muted today-date">{localDate}</p>
          <h1 className="with-icon">
            <Icon name="today" size={32} />
            {t.welcomeBack}
          </h1>
        </div>
      )}

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
      {rows}

    </div>
  );
}
