import { useEffect, useState } from 'react';
import { hasVoiceFor, onVoicesChanged, speak, stop } from '../lib/speech';
import { localized, wikiInfo, wikiPageUrl, type Card, type Lang, type WikiInfo } from '../lib/data';
import { typeLabel } from '../lib/i18n';
import YouTube from './YouTube';
import NoteBox from './NoteBox';
import { Icon, IconButton } from './Icon';
import { isBadVideo } from '../lib/videos';
import type { Strings } from '../lib/i18n';
import { recordSignal } from '../lib/prefs';

interface Props {
  t: Strings;
  lang: Lang;
  card: Card;
  age: number;
  hideAge?: boolean; // Reflections show a timeless thought, not the reader's age
  children?: React.ReactNode; // action buttons
}

function Video({ id, list, title, t, onUnavailable, onPlay }: { id?: string; list?: string; title: string; t: Strings; onUnavailable: () => void; onPlay?: () => void }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div className="video">
        <YouTube id={id} list={list} title={title} onUnavailable={onUnavailable} />
      </div>
    );
  }
  return (
    <button className={list ? 'video poster record' : 'video poster'} onClick={() => { setPlaying(true); onPlay?.(); }} aria-label={`${t.play}: ${title}`}>
      {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />}
      {list && (
        <span className="vinyl" aria-hidden="true">
          <span />
        </span>
      )}
      <span className="play" aria-hidden="true">
        <Icon name="play" size={44} />
      </span>
      <span className="play-label">{t.play}</span>
    </button>
  );
}

function Era({ type }: { type: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let g;
  if (type === 'music' || type === 'song')
    g = (<><circle cx="40" cy="40" r="28" {...p} /><circle cx="40" cy="40" r="9" {...p} /><circle cx="40" cy="40" r="18" {...p} opacity=".4" /></>);
  else if (type === 'tv')
    g = (<><rect x="10" y="22" width="60" height="42" rx="6" {...p} /><rect x="17" y="29" width="34" height="28" rx="4" {...p} /><circle cx="60" cy="38" r="3" {...p} /><circle cx="60" cy="50" r="3" {...p} /><path d="M28 22 L20 10M52 22 L60 10" {...p} /></>);
  else if (type === 'film' || type === 'movie')
    g = (<><circle cx="40" cy="40" r="28" {...p} /><circle cx="40" cy="40" r="5" {...p} /><circle cx="40" cy="24" r="5" {...p} /><circle cx="40" cy="56" r="5" {...p} /><circle cx="24" cy="40" r="5" {...p} /><circle cx="56" cy="40" r="5" {...p} /></>);
  else if (type === 'sport' || type === 'sports')
    g = (<><circle cx="40" cy="40" r="28" {...p} /><path d="M12 40h56M40 12c-14 14-14 42 0 56M40 12c14 14 14 42 0 56" {...p} /></>);
  else if (type === 'space' || type === 'science')
    g = (<><path d="M40 8c10 10 14 24 10 40H30C26 32 30 18 40 8z" {...p} /><circle cx="40" cy="30" r="5" {...p} /><path d="M30 48l-10 12 12-4M50 48l10 12-12-4M40 52v14" {...p} /></>);
  else if (type === 'politics' || type === 'news')
    g = (<><rect x="12" y="14" width="56" height="52" rx="4" {...p} /><path d="M20 26h40M20 36h18M20 44h18M20 52h18" {...p} /><rect x="44" y="36" width="16" height="18" rx="2" {...p} /></>);
  else if (type === 'everyday' || type === 'culture')
    g = (<><path d="M16 30h40v14a18 18 0 0 1-18 18h-4A18 18 0 0 1 16 44z" {...p} /><path d="M56 34h6a6 6 0 0 1 0 14h-8" {...p} /><path d="M28 10c-4 5 4 6 0 12M40 10c-4 5 4 6 0 12" {...p} opacity=".6" /></>);
  else
    g = (<><rect x="8" y="16" width="64" height="48" rx="5" {...p} /><path d="M44 24v32M52 30h12M52 38h12" {...p} /><path d="M16 28h20M16 38h20M16 48h12" {...p} /></>);
  return (
    <svg className="era-art" viewBox="0 0 80 80" width="96" height="96" aria-hidden="true" focusable="false">
      {g}
    </svg>
  );
}

// Each kind of memory has its own picture in the badge.
const TYPE_ICON: Record<string, string> = {
  music: 'music', song: 'music', film: 'film', movie: 'film', tv: 'tv', sport: 'sport', sports: 'sport', space: 'space', science: 'science',
  politics: 'politics', news: 'news', culture: 'culture', everyday: 'everyday', cricket: 'cricket', wisdom: 'wisdom',
};

export function ReadButton({ t, lang, text, onRead }: { t: Strings; lang: Lang; text: string; onRead?: () => void }) {
  const [reading, setReading] = useState(false);
  // Only offer it when this device has a voice for the reading language;
  // voices often load a moment after the page, so listen for them.
  const [voice, setVoice] = useState(() => hasVoiceFor(lang));
  useEffect(() => {
    setVoice(hasVoiceFor(lang));
    return onVoicesChanged(() => setVoice(hasVoiceFor(lang)));
  }, [lang]);
  useEffect(() => {
    setReading(false);
    return () => stop();
  }, [text, lang]);
  if (!voice) return null;
  const toggle = () => {
    if (reading) {
      stop();
      setReading(false);
    } else {
      setReading(true);
      onRead?.();
      speak(text, lang, () => setReading(false));
    }
  };
  return <IconButton className={reading ? 'read-btn reading' : 'read-btn'} icon={reading ? 'pause' : 'speaker'} label={reading ? t.stopReading : t.readAloud} pressed={reading} onClick={toggle} />;
}

export default function MemoryCard({ t, lang, card, age, hideAge, children }: Props) {
  const { title, text } = localized(card, lang);
  const host = card.host ?? 'en.wikipedia.org';
  const [info, setInfo] = useState<WikiInfo>({ pageUrl: wikiPageUrl(card.wiki, host) });
  const [imgOk, setImgOk] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    setImgOk(true);
    setLoaded(false);
    setInfo({ pageUrl: wikiPageUrl(card.wiki, host) });
    wikiInfo(card.wiki, host).then(async i => {
      // No free photo of the song itself? Borrow one of the artist.
      if (!i.image && card.photo) {
        const p = await wikiInfo(card.photo, host);
        if (p.image) i = { ...i, image: p.image, imagePage: p.imagePage };
      }
      if (live) setInfo(i);
    });
    return () => {
      live = false;
    };
  }, [card.wiki, card.photo, host]);

  const showPhoto = info.image && imgOk;

  // Songs play inside the card. A video that turns out to be blocked here (or
  // was already found to be) is replaced by a plain note, never a dead player
  // and never a link out to YouTube.
  const [videoFailed, setVideoFailed] = useState(false);
  useEffect(() => setVideoFailed(false), [card.id]);
  const hasVideo = !!(card.yt || card.pl) && !videoFailed && !isBadVideo(card.yt);
  const isMusic = card.type === 'music' || card.type === 'song';
  const unplayable = isMusic && !hasVideo;

  return (
    <article className="memory" aria-labelledby={`title-${card.id}`}>
      {hasVideo ? (
        // Music and clips lead with the player — it's the heart of the card.
        <Video id={card.yt} list={card.pl} title={title} t={t} onUnavailable={() => setVideoFailed(true)} onPlay={() => recordSignal({ kind: 'play', card })} />
      ) : showPhoto ? (
        // The whole photo is always shown: portrait or landscape, nothing is
        // cropped. A soft, blurred copy fills the space around it.
        <figure className={loaded ? 'photo ready' : 'photo'}>
          <img className="backdrop" src={info.image} alt="" aria-hidden="true" />
          <img className="main" src={info.image} alt="" onLoad={() => setLoaded(true)} onError={() => setImgOk(false)} />
        </figure>
      ) : (
        <div className="photo placeholder" aria-hidden="true">
          <Era type={card.type} />
          <span>{card.year}</span>
        </div>
      )}
      <div className="memory-body">
        <p className="meta">
          <span className="type">
            <Icon name={TYPE_ICON[card.type] ?? 'memories'} size={18} />
            {typeLabel(t, card.type)}
          </span>
          <span>
            {card.era ? (
              card.era
            ) : (
              <>
                {card.date ? `${card.date}, ` : ''}
                {card.year}
                {!hideAge && ` · ${t.youWere(age)}`}
              </>
            )}
          </span>
        </p>
        <h2 id={`title-${card.id}`} className={title.length > 80 ? 'long' : ''}>
          {title}
        </h2>
        <p className="memory-text">{text}</p>
        {unplayable && (
          <p className="notice small" role="status">
            {t.songUnavailable}
          </p>
        )}
        <ReadButton t={t} lang={lang} text={`${title}. ${text}`} onRead={() => recordSignal({ kind: 'read', card })} />
        <NoteBox t={t} card={card} title={title} />
        <p className="credits">
          <a href={info.pageUrl} target="_blank" rel="noopener noreferrer" onClick={() => recordSignal({ kind: 'source', card })}>
            <Icon name="link" size={16} />
            {t.source}
          </a>
          {showPhoto && info.imagePage && (
            <>
              {' · '}
              <a href={info.imagePage} target="_blank" rel="noopener noreferrer">
                <Icon name="link" size={16} />
                {t.photo}
              </a>
            </>
          )}
        </p>
        {children}
      </div>
    </article>
  );
}
