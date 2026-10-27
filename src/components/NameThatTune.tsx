import { useEffect, useState } from 'react';
import YouTube from './YouTube';
import { localized, type Lang } from '../lib/data';
import type { Tune } from '../lib/daily';
import { ding, nope } from '../lib/sound';
import { Icon, IconButton } from './Icon';
import type { Strings } from '../lib/i18n';
import { recordSignal } from '../lib/prefs';

interface Props {
  t: Strings;
  lang: Lang;
  tune: Tune;
  onDone: () => void;
  doneLabel: string;
  /** Icon shown before the finish button's word. */
  doneIcon?: string;
  /** This song can't play here: swap in another one. */
  onUnavailable: () => void;
  /** Start playing straight away (used when we've just swapped songs). */
  autoPlay?: boolean;
}

export default function NameThatTune({ t, lang, tune, onDone, doneLabel, doneIcon = 'refresh', onUnavailable, autoPlay }: Props) {
  const [playing, setPlaying] = useState(!!autoPlay);
  const [picked, setPicked] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const { answer, choices } = tune;
  const correct = picked === answer.id;

  // A new song arrived: reset the round.
  useEffect(() => {
    setPicked(null);
    setSkipping(false);
  }, [answer.id]);

  // Tell them briefly, then bring the next song — never leave them waiting.
  const unavailable = () => {
    if (skipping) return;
    setSkipping(true);
    window.setTimeout(onUnavailable, 1400);
  };

  return (
    <div className="minigame tune">
      <h1 className="with-icon">
        <Icon name="tune" size={32} />
        {t.nameTune}
      </h1>
      <p className="muted">{t.nameTuneBody}</p>

      {playing ? (
        <div className="video tune-video">
          {!skipping && <YouTube key={answer.id} id={answer.yt} list={answer.pl} title={t.nameTune} onUnavailable={unavailable} />}
          {/* Until they answer, cover the player so the YouTube title doesn't
              give the song away — they hear it, they don't see the name. */}
          {!picked && (
            <div className="tune-cover" aria-hidden="true">
              <span className="vinyl spinning">
                <span />
              </span>
              <span className="tune-listening">
                <Icon name="music" size={32} />
              </span>
            </div>
          )}
        </div>
      ) : (
        <button className="video poster record tune-poster" onClick={() => { setPlaying(true); recordSignal({ kind: 'play', card: answer }); }} aria-label={t.play}>
          <span className="vinyl" aria-hidden="true">
            <span />
          </span>
          <span className="play" aria-hidden="true">
            <Icon name="play" size={44} />
          </span>
          <span className="play-label">{t.play}</span>
        </button>
      )}

      {skipping && (
        <p className="notice" role="status">
          {t.songSkipping}
        </p>
      )}
      {playing && !picked && !skipping && (
        <IconButton className="skip-song" icon="next" label={t.skipSong} onClick={onUnavailable} />
      )}

      <p className="quiz-q">{t.nameTunePrompt}</p>

      <div className="quiz-options tune-options">
        {choices.map(c => {
          const title = localized(c, lang).title;
          const cls = ['btn big option', picked && c.id === answer.id && 'right', picked === c.id && c.id !== answer.id && 'wrong'].filter(Boolean).join(' ');
          return (
            <button key={c.id} className={cls} onClick={() => { if (!picked) { setPicked(c.id); c.id === answer.id ? ding() : nope(); } }} disabled={!!picked}>
              {title}
            </button>
          );
        })}
      </div>

      {picked && (
        <>
          <p className={correct ? 'notice good' : 'notice'} role="status">
            {correct ? t.nameTuneCorrect : t.nameTuneWrong(localized(answer, lang).title)}
          </p>
          <button className="btn primary big" onClick={onDone}>
            <Icon name={doneIcon} size={28} />
            {doneLabel}
          </button>
        </>
      )}
    </div>
  );
}
