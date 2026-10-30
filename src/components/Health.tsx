// Health: practical, results-first tips for later life, one at a time, in the
// reader's language. "For you" mixes topics, leading with what people ask
// about most (intimacy, menopause, energy, sleep); a topic button narrows it.
// General information only — tips that need a professional say so.
import { useEffect, useMemo, useState } from 'react';
import { HEALTH_TOPICS, healthMix, healthTips, type HealthTip, type Lang } from '../lib/data';
import { seededRandom, dayKeyOf } from '../lib/prefs';
import type { Strings } from '../lib/i18n';
import Loading from './Loading';
import NextDisc from './NextDisc';
import { Icon } from './Icon';

/** Topic buttons shown before "More topics": the ones people ask about most. */
const LEAD = 5;

export default function Health({ t, lang }: { t: Strings; lang: Lang }) {
  const [tips, setTips] = useState<HealthTip[] | null>(null);
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
    return () => {
      live = false;
    };
  }, [lang]);

  // A fresh order each day (and a different one per visit to a topic).
  const list = useMemo(() => {
    if (!tips) return [];
    const rnd = seededRandom(`${dayKeyOf(new Date())}|health|${topic}|${Math.random()}`);
    return topic === 'all' ? healthMix(tips, rnd) : healthMix(tips.filter(x => x.topic === topic), rnd);
  }, [tips, topic]);

  const topics = useMemo(() => HEALTH_TOPICS.filter(x => tips?.some(tip => tip.topic === x)), [tips]);

  if (!tips) return <Loading label={t.loading} />;
  if (!list.length) return <p className="muted">{t.noContent}</p>;

  const tip = list[i % list.length];
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
      </div>

      <div className="health-topics" role="group" aria-label={t.health}>
        {['all', ...(allTopics ? topics : topics.slice(0, LEAD))].filter((x, k, a) => a.indexOf(x) === k).concat(!allTopics && topic !== 'all' && !topics.slice(0, LEAD).includes(topic as never) ? [topic] : []).map(x => (
          <button key={x} className={'chip' + (topic === x ? ' active' : '')} aria-pressed={topic === x} onClick={() => pick(x)}>
            {x === 'all' ? t.healthForYou : (t.healthTopics[x] ?? x)}
          </button>
        ))}
        <button className="chip more" aria-expanded={allTopics} onClick={() => setAllTopics(v => !v)}>
          <Icon name={allTopics ? 'prev' : 'grid'} size={20} />
          {allTopics ? t.healthLess : t.healthMore}
        </button>
      </div>

      <div className="feed-stage">
        <article className="memory health-card" key={tip.id} aria-live="polite">
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
              <button className="btn primary big next" onClick={() => go(1)}>
                <Icon name="next" size={28} />
                {t.healthNext}
              </button>
            </div>
          </div>
        </article>
        <NextDisc animKey={tip.id} label={t.healthNext} onClick={() => go(1)} />
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
