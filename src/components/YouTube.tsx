// YouTube player that can tell us when a video won't play.
//
// A plain <iframe> embed fails silently: a video blocked in the viewer's
// country, removed, or not allowed to be embedded just shows YouTube's own
// "Video unavailable" screen, and the person keeps waiting for a song that
// never starts. The IFrame Player API reports those cases (onError 2/5/100/
// 101/150), so the app can react: say so in the reader's language, skip to
// another song, and remember the video so it isn't offered again here.
import { useEffect, useRef } from 'react';
import { markBadVideo } from '../lib/videos';

interface YTPlayer {
  playVideo(): void;
  destroy(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) resolve(window.YT);
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = () => {
        apiPromise = null;
        reject(new Error('youtube api'));
      };
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

interface Props {
  id?: string;
  list?: string;
  title: string;
  /** The video can't play here (blocked, removed, not embeddable) or never loaded. */
  onUnavailable: () => void;
}

const LOAD_TIMEOUT = 12000; // no player at all after this long → treat as unavailable

export default function YouTube({ id, list, title, onUnavailable }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const failRef = useRef(onUnavailable);
  failRef.current = onUnavailable;

  useEffect(() => {
    let player: YTPlayer | null = null;
    let done = false;
    const fail = (bad: boolean) => {
      if (done) return;
      done = true;
      if (bad && id) markBadVideo(id);
      failRef.current();
    };
    const timer = window.setTimeout(() => fail(false), LOAD_TIMEOUT);
    loadApi()
      .then(YT => {
        if (done || !host.current) return;
        const el = document.createElement('div');
        host.current.replaceChildren(el);
        player = new YT.Player(el, {
          host: 'https://www.youtube-nocookie.com',
          videoId: id,
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, ...(list ? { listType: 'playlist', list } : {}) },
          events: {
            onReady: (e: { target: YTPlayer }) => {
              window.clearTimeout(timer);
              e.target.playVideo();
            },
            // 2 bad id · 5 HTML5 error · 100 removed/private · 101/150 not embeddable or blocked in this country
            onError: () => {
              window.clearTimeout(timer);
              fail(true);
            },
          },
        });
      })
      .catch(() => {
        window.clearTimeout(timer);
        fail(false);
      });
    return () => {
      done = true;
      window.clearTimeout(timer);
      try {
        player?.destroy();
      } catch {
        /* already gone */
      }
    };
  }, [id, list]);

  return <div className="yt-host" ref={host} title={title} />;
}
