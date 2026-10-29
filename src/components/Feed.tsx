import Loading from './Loading';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { arrange, curatedYear, feedYears, shareCardUrl, store, withoutDuplicates, worthShowing, type Card, type Lang, type Profile } from '../lib/data';
import { hasLive, liveYear } from '../lib/live';
import { localizeCards } from '../lib/localize';
import type { Strings } from '../lib/i18n';
import MemoryCard from './MemoryCard';
import { Icon, IconButton } from './Icon';
import { dayKeyOf, rankCards, readPrefs, recordSignal, seededRandom } from '../lib/prefs';

interface Props {
  t: Strings;
  lang: Lang;
  profile: Profile;
  focusCard: string | null;
  clearFocus: () => void;
  openSettings: () => void;
}

interface At {
  year: number;
  i: number;
}

function readAt(): At | null {
  try {
    const raw = localStorage.getItem('hoot.at');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeAt(at: At) {
  try {
    localStorage.setItem('hoot.at', JSON.stringify(at));
  } catch {
    /* ignore */
  }
}

export default function Feed({ t, lang, profile, focusCard, clearFocus, openSettings }: Props) {
  const years = useMemo(() => feedYears(profile), [profile]);
  const [chunks, setChunks] = useState<Record<number, Card[]>>({});
  const [hidden, setHidden] = useState<string[]>(() => store.hidden());
  const [savedIds, setSavedIds] = useState<string[]>(() => store.saved().map(c => c.id));
  const [at, setAt] = useState<At>(() => {
    const a = readAt();
    return a && years.includes(a.year) && store.position() !== 0 ? a : { year: years[0], i: 0 };
  });
  const [ended, setEnded] = useState(false);
  const [copied, setCopied] = useState(false);
  const loading = useRef(new Set<number>());
  const countryRef = useRef(`${profile.country}|${lang}`);

  // Changing country must not show the old country's cached cards: the per-year
  // cache is keyed by year only, so clear it (and reset position) on a switch.
  useEffect(() => {
    // Reload when the country OR the reading language changes.
    const key = `${profile.country}|${lang}`;
    if (countryRef.current === key) return;
    countryRef.current = key;
    loading.current.clear();
    setChunks({});
    setAt({ year: years[0], i: 0 });
    setEnded(false);
  }, [profile.country, lang, years]);

  const load = useCallback(
    async (y: number) => {
      if (loading.current.has(y)) return;
      loading.current.add(y);
      const [curated, live] = await Promise.all([curatedYear(profile.country, y), hasLive(profile.country) ? liveYear(profile.country, y) : Promise.resolve([])]);
      const shown = await localizeCards([...curated, ...withoutDuplicates(curated, live)].filter(worthShowing), lang);
      // Within the year, the person's favourites come first (with some
      // variety and discovery); the years themselves stay chronological.
      const rnd = seededRandom(`${dayKeyOf(new Date())}|${profile.country}|${profile.born}|${y}`);
      setChunks(c => ({ ...c, [y]: rankCards(arrange(shown, profile), readPrefs(), profile.likes, rnd) }));
    },
    [profile, lang],
  );

  // Load the current year and the one after it.
  useEffect(() => {
    load(at.year);
    const next = years[years.indexOf(at.year) + 1];
    if (next) load(next);
  }, [at.year, years, load]);

  // Opened from a shared single-memory link.
  useEffect(() => {
    if (!focusCard) return;
    const y = Number(focusCard.match(/-(\d{4})-/)?.[1]);
    if (!years.includes(y)) {
      clearFocus();
      return;
    }
    if (!chunks[y]) {
      load(y);
      return;
    }
    const i = chunks[y].findIndex(c => c.id === focusCard);
    setAt({ year: y, i: Math.max(0, i) });
    clearFocus();
  }, [focusCard, chunks, years, load, clearFocus]);

  const list = useMemo(() => (chunks[at.year] ?? []).filter(c => !hidden.includes(c.id)), [chunks, at.year, hidden]);

  useEffect(() => {
    writeAt(at);
    store.setPosition(1);
  }, [at]);

  // When the current card appeared, to tell a quick skip from a good read.
  const shown = useRef<{ id: string; at: number } | null>(null);
  const curId = list[Math.min(at.i, list.length - 1)]?.id;
  useEffect(() => {
    shown.current = curId ? { id: curId, at: Date.now() } : null;
  }, [curId]);

  const next = useCallback(() => {
    setCopied(false);
    const cur = list[Math.min(at.i, list.length - 1)];
    if (cur && shown.current?.id === cur.id) recordSignal({ kind: 'view', card: cur, ms: Date.now() - shown.current.at });
    if (at.i + 1 < list.length) return setAt({ year: at.year, i: at.i + 1 });
    const ny = years[years.indexOf(at.year) + 1];
    if (ny) setAt({ year: ny, i: 0 });
    else setEnded(true);
  }, [at, list, years]);

  const back = useCallback(() => {
    setCopied(false);
    if (ended) return setEnded(false);
    if (at.i > 0) return setAt({ year: at.year, i: at.i - 1 });
    const py = years[years.indexOf(at.year) - 1];
    if (py) setAt({ year: py, i: Math.max(0, (chunks[py]?.length ?? 1) - 1) });
  }, [at, years, chunks, ended]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, iframe')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back]);

  // Braces matter: newer browsers return a Promise from scrollTo, and an
  // effect must return nothing or a cleanup function.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [at, ended]);

  // A year that turned out empty: move on automatically.
  useEffect(() => {
    if (chunks[at.year] && list.length === 0) {
      const ny = years[years.indexOf(at.year) + 1];
      if (ny) setAt({ year: ny, i: 0 });
      else setEnded(true);
    }
  }, [chunks, at.year, list.length, years]);

  if (ended) {
    return (
      <div className="empty">
        <h2>{t.endTitle}</h2>
        <p>{t.endBody}</p>
        <div className="row">
          <button
            className="btn primary"
            onClick={() => {
              setEnded(false);
              setAt({ year: years[0], i: 0 });
            }}
          >
            <Icon name="refresh" size={24} />
            {t.startOver}
          </button>
          <IconButton icon="back" label={t.back} onClick={back} />
        </div>
      </div>
    );
  }

  if (!years.length) {
    return (
      <div className="empty">
        <p>{t.noContent}</p>
        <button className="btn" onClick={openSettings}>
          {t.changeDetails}
        </button>
      </div>
    );
  }

  const card = list[Math.min(at.i, list.length - 1)];

  const top = (
    <div className="feed-top">
      <span className="muted year-head">
        <Icon name="memories" size={28} />
        <strong className="year-now">{at.year}</strong>
      </span>
      <label className="jump">
        <span>{t.jumpYear}</span>
        <select value={at.year} onChange={e => setAt({ year: Number(e.target.value), i: 0 })}>
          {years.map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  if (!card) {
    return (
      <div className="feed">
        {top}
        <Loading label={t.loading} />
      </div>
    );
  }

  const isSaved = savedIds.includes(card.id);
  const toggleSave = () => {
    const saved = store.saved();
    const updated = isSaved ? saved.filter(c => c.id !== card.id) : [card, ...saved];
    store.setSaved(updated);
    setSavedIds(updated.map(c => c.id));
    recordSignal({ kind: isSaved ? 'unsave' : 'save', card });
  };
  const notForMe = () => {
    const h = [...hidden, card.id];
    store.setHidden(h);
    setHidden(h);
    recordSignal({ kind: 'hide', card });
  };
  const share = async () => {
    const url = shareCardUrl(card, profile, lang);
    recordSignal({ kind: 'share', card });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt(t.copyLink, url);
    }
  };

  const nextBtn = (cls: string) => (
    <button className={`btn primary big next ${cls}`} onClick={next}>
      <Icon name="next" size={28} />
      {t.next}
    </button>
  );
  const backBtn = <IconButton icon="back" label={t.back} onClick={back} disabled={at.i === 0 && at.year === years[0]} />;
  const saveBtn = (
    <button className={isSaved ? 'btn saved' : 'btn'} onClick={toggleSave} aria-pressed={isSaved}>
      <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} size={24} />
      {isSaved ? t.savedDone : t.save}
    </button>
  );
  const shareBtn = <IconButton icon={copied ? 'check' : 'share'} label={copied ? t.copied : t.share} onClick={share} />;
  const hideBtn = <IconButton icon="eyeOff" label={t.notForMe} onClick={notForMe} />;

  return (
    <div className="feed">
      {top}
      {/* On wide screens the buttons sit beside the card (CSS shows one set or the other). */}
      <div className="feed-stage">
        <div className="feed-rail left">
          <div className="feed-rail-inner">
            <button className="btn rail-btn" onClick={back} disabled={at.i === 0 && at.year === years[0]}>
              <Icon name="back" size={26} />
              {t.back}
            </button>
            <button className={'btn rail-btn' + (isSaved ? ' saved' : '')} onClick={toggleSave} aria-pressed={isSaved}>
              <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} size={26} />
              {isSaved ? t.savedDone : t.save}
            </button>
            <button className="btn rail-btn" onClick={share}>
              <Icon name={copied ? 'check' : 'share'} size={26} />
              {copied ? t.copied : t.share}
            </button>
            <button className="btn rail-btn" onClick={notForMe}>
              <Icon name="eyeOff" size={26} />
              {t.notForMe}
            </button>
          </div>
        </div>
        <MemoryCard key={card.id} t={t} lang={lang} card={card} age={card.year - profile.born}>
          <div className="actions">
            {nextBtn('')}
            <div className="row">
              {backBtn}
              {saveBtn}
              {shareBtn}
              {hideBtn}
            </div>
          </div>
        </MemoryCard>
        <div className="feed-rail right">
          <div className="feed-rail-inner">{nextBtn('rail-next')}</div>
        </div>
      </div>
    </div>
  );
}
