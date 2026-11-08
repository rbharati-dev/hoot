// Health: fresh research news (new studies on sleep, caffeine, sitting,
// supplements, new drugs...) mixed with practical, results-first tips, one
// card at a time, in the reader's language. "For you" leads with the newest
// studies; "New research" shows only studies; a topic button narrows both.
// General information only — tips that need a professional say so, and
// studies done only in animals are labelled as such.
import { useEffect, useMemo, useState } from 'react';
import { HEALTH_TOPICS, byInterest, healthFeed, inTopic, healthMix, healthNews, healthTips, type HealthItem, type HealthStory, type HealthTip, type Lang } from '../lib/data';
import { seededRandom, dayKeyOf } from '../lib/prefs';
import type { Strings } from '../lib/i18n';
import Loading from './Loading';
import NextDisc from './NextDisc';
import { ReadButton } from './MemoryCard';
import { loadHealthPhotos, photoFor, photoSrc, type HealthPhoto } from '../lib/healthPhotos';
import { Icon } from './Icon';

/** Topic buttons shown before "More topics": the ones people ask about most. */
const LEAD = 5;

export default function Health({ t, lang }: { t: Strings; lang: Lang }) {
  const [tips, setTips] = useState<HealthTip[] | null>(null);
  const [stories, setStories] = useState<HealthStory[]>([]);
  const [topic, setTopic] = useState<string>('all');
  const [i, setI] = useState(0);
  const [allTopics, setAllTopics] = useState(false);

  useEffect(() => {
    let live = true;
    setTips(null);
    healthTips(lang).then(async list => {
      // A language file that can't load falls back to English.
      const got = list.length ? list : await healthTips('en');
      if (live) setTips(got);
    });
    healthNews(lang).then(async list => {
      const got = list.length ? list : await healthNews('en');
      if (live) setStories(got);
    });
    return () => {
      live = false;
    };
  }, [lang]);

  // A fresh order each day (and a different one per visit to a topic).
  const list = useMemo((): HealthItem[] => {
    if (!tips) return [];
    const rnd = seededRandom(`${dayKeyOf(new Date())}|health|${topic}|${Math.random()}`);
    // Sexual health shows only under Intimacy & desire (never in For you or New research).
    if (topic === 'news') return inTopic(stories, 'news').map(story => ({ kind: 'story', story }));
    if (topic === 'all') return healthFeed(byInterest(inTopic(stories, 'all')), healthMix(inTopic(tips, 'all'), rnd));
    return healthFeed(inTopic(stories, topic), healthMix(inTopic(tips, topic), rnd));
  }, [tips, stories, topic]);

  const topics = useMemo(() => HEALTH_TOPICS.filter(x => tips?.some(tip => tip.topic === x)), [tips]);

  if (!tips) return <Loading label={t.loading} />;
  if (!list.length) return <p className="muted">{t.noContent}</p>;

  const item = list[i % list.length];
  const key = item.kind === 'story' ? item.story.id : item.tip.id;
  const go = (d: number) => {
    setI(n => (n + d + list.length) % list.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const pick = (x: string) => {
    setTopic(x);
    setI(0);
  };

  return (
    <div className="health">
      <div className="health-head">
        <h1 className="with-icon">
          <Icon name="health" size={32} />
          {t.health}
        </h1>
        <p className="muted">{t.healthIntro}</p>
        <p className="health-disclaimer top">{t.healthDisclaimer}</p>
      </div>

      <div className="health-topics" role="group" aria-label={t.health}>
        {['all', ...(stories.length ? ['news'] : []), ...(allTopics ? topics : topics.slice(0, LEAD))].filter((x, k, a) => a.indexOf(x) === k).concat(!allTopics && topic !== 'all' && !topics.slice(0, LEAD).includes(topic as never) ? [topic] : []).map(x => (
          <button key={x} className={'chip' + (topic === x ? ' active' : '')} aria-pressed={topic === x} onClick={() => pick(x)}>
            {x === 'all' ? t.healthForYou : x === 'news' ? t.healthNew : (t.healthTopics[x] ?? x)}
          </button>
        ))}
        <button className="chip more" aria-expanded={allTopics} onClick={() => setAllTopics(v => !v)}>
          <Icon name={allTopics ? 'prev' : 'grid'} size={20} />
          {allTopics ? t.healthLess : t.healthMore}
        </button>
      </div>

      <div className="feed-stage">
        {item.kind === 'story' ? (
          <StoryCard key={key} story={item.story} t={t} lang={lang} onNext={() => go(1)} />
        ) : (
          <TipCard key={key} tip={item.tip} t={t} lang={lang} onNext={() => go(1)} />
        )}
        <NextDisc animKey={key} label={item.kind === 'story' ? t.healthNewsNext : t.healthNext} onClick={() => go(1)} />
      </div>

      <div className="row health-nav">
        <button className="btn" onClick={() => go(-1)}>
          <Icon name="back" size={24} />
          {t.back}
        </button>
      </div>

      <p className="muted small health-disclaimer">{t.healthDisclaimer}</p>
    </div>
  );
}

function ago(t: Strings, iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 864e5);
  if (!(days >= 1)) return t.healthToday;
  return days === 1 ? t.healthYesterday : t.healthDaysAgo(days);
}

function StoryCard({ story, t, lang, onNext }: { story: HealthStory; t: Strings; lang: Lang; onNext: () => void }) {
  const [img, setImg] = useState(!!story.image);
  return (
    <article className="memory health-card health-story" aria-live="polite">
      {img ? (
        <img className="health-photo" src={story.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImg(false)} onLoad={e => e.currentTarget.naturalWidth < 1200 && setImg(false)} />
      ) : (
        <TopicPhoto topic={story.topic} id={story.id} t={t} />
      )}
      <div className="memory-body">
        <p className="meta">
          <span className="type new">
            <Icon name="science" size={18} />
            {t.healthNew}
          </span>
          <span>
            {story.source} · {ago(t, story.published)}
          </span>
        </p>
        <h2 lang={story.en ? 'en' : undefined}>{story.title}</h2>
        <p className="memory-text" lang={story.en ? 'en' : undefined}>
          {story.summary}
        </p>
        {story.animal && <p className="health-animal muted">{t.healthAnimal}</p>}
        {story.en && lang !== 'en' && <p className="muted small">{t.healthEnglish}</p>}
        <div className="actions">
          <ReadButton t={t} lang={lang} text={`${story.title}. ${story.summary}`} />
          <a className="btn" href={story.url} target="_blank" rel="noopener noreferrer">
            <Icon name="link" size={24} />
            {t.healthRead}
          </a>
          <button className="btn primary big next" onClick={onNext}>
            <Icon name="next" size={28} />
            {t.healthNewsNext}
          </button>
        </div>
      </div>
    </article>
  );
}

function TopicPhoto({ topic, id, t }: { topic: string; id: string; t: Strings }) {
  const [photo, setPhoto] = useState<HealthPhoto | null>(null);
  const [ok, setOk] = useState(true);
  useEffect(() => {
    let live = true;
    loadHealthPhotos().then(l => live && setPhoto(l ? photoFor(l, topic, id) : null));
    return () => {
      live = false;
    };
  }, [id, topic]);
  if (!photo || !ok) return null;
  const src = photoSrc(photo);
  return (
    <figure className="health-photo-wrap">
      <img className="health-photo" src={src.src} srcSet={src.srcSet} sizes="(min-width: 960px) 900px, 100vw" alt="" loading="lazy" onError={() => setOk(false)} />
      <figcaption className="photo-credit">
        <a href={photo.source} target="_blank" rel="noopener noreferrer">
          {t.photo}: {photo.by} · {photo.license}
        </a>
      </figcaption>
    </figure>
  );
}

function TipCard({ tip, t, lang, onNext }: { tip: HealthTip; t: Strings; lang: Lang; onNext: () => void }) {
  return (
    <article className="memory health-card health-tip" aria-live="polite">
      <TopicPhoto topic={tip.topic} id={tip.id} t={t} />
      <div className="memory-body">
        <p className="meta">
          <span className="type">{t.healthTopics[tip.topic] ?? tip.topic}</span>
        </p>
        <h2 lang={tip.en ? 'en' : undefined}>{tip.title}</h2>
        <p className="memory-text" lang={tip.en ? 'en' : undefined}>
          {tip.text}
        </p>
        {tip.doctor && (
          <p className="health-doctor">
            <Icon name="person" size={22} />
            <span>{t.healthDoctor}</span>
          </p>
        )}
        {tip.en && lang !== 'en' && <p className="muted small">{t.healthEnglish}</p>}
        <div className="actions">
          <ReadButton t={t} lang={lang} text={`${tip.title}. ${tip.text}`} />
          <button className="btn primary big next" onClick={onNext}>
            <Icon name="next" size={28} />
            {t.healthNext}
          </button>
        </div>
      </div>
    </article>
  );
}
