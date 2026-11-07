import Loading from './Loading';
import { useEffect, useState } from 'react';
import { loadLocalNews, loadNews, rankNews, type LocalFeed, type NewsStory, type Lang, type Profile } from '../lib/data';
import { interestLabel, type Strings } from '../lib/i18n';
import { ReadButton } from './MemoryCard';
import { Icon } from './Icon';
import { recordSignal } from '../lib/prefs';

// A calm, finite news feed — the day's most important stories, ranked to the
// reader's interests. One story per card, scrolled through like a short reel,
// each linking out to the original source. Never the full article.
export default function News({ t, lang, profile }: { t: Strings; lang: Lang; profile: Profile }) {
  const [local, setLocal] = useState<LocalFeed | null>(null);
  useEffect(() => {
    let live = true;
    setLocal(null);
    if (profile.region) loadLocalNews(profile.region).then(f => live && setLocal(f));
    return () => {
      live = false;
    };
  }, [profile.region]);
  const [stories, setStories] = useState<NewsStory[] | null>(null);
  const [built, setBuilt] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadNews(lang).then(feed => {
      if (!live) return;
      setStories(feed ? rankNews(feed.stories, profile.likes, 12) : []);
      setBuilt(feed?.built ?? null);
    });
    return () => {
      live = false;
    };
  }, [profile.likes, lang]);

  if (stories === null) return <Loading label={t.loading} />;

  if (!stories.length) {
    return (
      <div className="news">
        <h1 className="with-icon">
          <Icon name="news" size={32} />
          {t.news}
        </h1>
        <p className="muted">{t.newsNone}</p>
      </div>
    );
  }

  const updated = built
    ? new Date(built).toLocaleString(lang, { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })
    : null;

  // Pretty label for a topic chip, reusing interest names where they exist.
  const topicAlias: Record<string, string> = { world: 'news', film: 'films', entertainment: 'films' };
  const topicLabel = (topic: string) => {
    const key = topicAlias[topic] ?? topic;
    const label = interestLabel(t, key);
    return label === key ? key.charAt(0).toUpperCase() + key.slice(1) : label;
  };

  return (
    <div className="news">
      <div className="news-head">
        <h1 className="with-icon">
          <Icon name="news" size={32} />
          {t.news}
        </h1>
        <p className="muted">{t.newsIntro}</p>
        {updated && <p className="muted small">{t.newsAsOf(updated)}</p>}
      </div>
      {profile.region ? (
        local && local.stories.length > 0 && (
          <section className="news-local" aria-labelledby="news-local-h">
            <h2 id="news-local-h" className="with-icon">
              <Icon name="pin" size={26} />
              {t.nearYou(local.region)}
            </h2>
            <ul>
              {local.stories.slice(0, 4).map(s => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={() => recordSignal({ kind: 'news', topic: 'local' })}>
                    <strong>{s.title}</strong>
                    {s.summary && <span className="muted">{s.summary}</span>}
                    <span className="news-source">{s.source}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      ) : (
        <p className="muted small news-local-hint">{t.nearYouHint}</p>
      )}
      <div className="news-feed">
        {stories.map((s, i) => {
          const lead = i === 0 && !!s.image;
          const photo = s.image && (
            <div className="news-photo">
              <img src={s.image} alt="" loading="lazy" onError={e => ((e.currentTarget.closest('.news-photo') as HTMLElement).style.display = 'none')} />
            </div>
          );
          const body = (
            <>
              <span className="news-topic">{topicLabel(s.topic)}</span>
              <h2>{s.title}</h2>
              {s.summary && <p className="news-summary">{s.summary}</p>}
              <p className="news-source">{s.source}</p>
              <div className="news-actions">
                <a className="btn primary big" href={s.url} target="_blank" rel="noopener noreferrer" onClick={() => recordSignal({ kind: 'news', topic: s.topic })}>
                  <Icon name="forward" size={26} />
                  {t.readFull}
                </a>
                <ReadButton t={t} lang={lang} text={`${s.title}. ${s.summary ?? ''}`} />
              </div>
            </>
          );
          return (
            <article className={lead ? 'news-card lead' : 'news-card'} key={s.id}>
              {photo}
              {lead ? <div className="news-body">{body}</div> : body}
            </article>
          );
        })}
      </div>
    </div>
  );
}
