import { useRef, useState } from 'react';
import { Icon } from '../Icon';
import type { Memory } from '../../lib/story/types';
import type { StoryStrings } from '../../lib/story/strings-en';
import { chapterById, photosOf } from '../../lib/story/store';
import { clock } from '../../lib/story/stats';
import { chapterTitle, dateLabel, excerpt, memoryTitle, secondsOf } from './ui';
import { useAudioUrl } from './AudioPlayer';
import PhotoThumb from './PhotoThumb';

/** A saved memory in a list: title, photo, chapter, date, length, a few words, play and open. */
export default function MemoryCard({ s, m, uid, onOpen }: { s: StoryStrings; m: Memory; uid: string | null; onOpen: (id: string) => void }) {
  const first = m.recordings.find(r => r.status !== 'recording');
  const url = useAudioUrl(first, uid);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const photo = photosOf(m)[0];
  const secs = secondsOf(m);
  const when = dateLabel(s, m);
  const toggle = () => {
    if (!url) return;
    if (!audio.current) {
      audio.current = new Audio(url);
      audio.current.onended = () => setPlaying(false);
    }
    if (playing) audio.current.pause();
    else void audio.current.play();
    setPlaying(!playing);
  };
  return (
    <article className="memory-card-s">
      {photo && <PhotoThumb id={photo.id} alt={photo.caption ?? ''} />}
      <div className="mc-body">
        <p className="mc-meta">
          <span>{chapterTitle(s, chapterById(m.chapterId))}</span>
          {when && <span>{when}</span>}
          {secs > 0 && (
            <span>
              <Icon name="mic" size={16} /> {clock(secs)}
            </span>
          )}
        </p>
        <h3 className="mc-title">{memoryTitle(s, m)}</h3>
        {excerpt(m) && <p className="mc-excerpt">{excerpt(m)}</p>}
        <div className="mc-actions">
          {url && (
            <button className="btn small-btn" onClick={toggle} aria-pressed={playing}>
              <Icon name={playing ? 'pause' : 'play'} size={20} />
              {playing ? s.pauseAudio : s.play}
            </button>
          )}
          <button className="btn small-btn" onClick={() => onOpen(m.id)}>
            <Icon name="book" size={20} />
            {s.view}
          </button>
        </div>
      </div>
    </article>
  );
}
