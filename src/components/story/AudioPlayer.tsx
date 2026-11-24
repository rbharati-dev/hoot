import { useEffect, useRef, useState } from 'react';
import { fileGet } from '../../lib/story/idb';
import type { Recording } from '../../lib/story/types';
import type { StoryStrings } from '../../lib/story/strings-en';

/** The recording's audio: from this device, or (signed in) from private cloud storage. */
export function useAudioUrl(rec: Recording | undefined, uid: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!rec) return;
    let made: string | null = null;
    let live = true;
    (async () => {
      let blob = await fileGet(rec.id).catch(() => undefined);
      if (!blob && rec.inCloud && uid) {
        const { cloud } = await import('../../lib/cloud/firebase');
        const st = await import('firebase/storage');
        const { app } = await cloud();
        blob = await st.getBlob(st.ref(st.getStorage(app), `users/${uid}/recordings/${rec.id}`)).catch(() => undefined);
      }
      if (blob && live) {
        made = URL.createObjectURL(blob);
        setUrl(made);
      }
    })();
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [rec?.id, rec?.inCloud, uid, rec]);
  return url;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

/** The browser's own audio controls (accessible everywhere) plus a clear speed choice. */
export default function AudioPlayer({ s, rec, uid, label }: { s: StoryStrings; rec: Recording; uid: string | null; label: string }) {
  const url = useAudioUrl(rec, uid);
  const ref = useRef<HTMLAudioElement>(null);
  const [speed, setSpeed] = useState(1);
  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed, url]);
  if (!url) return null;
  return (
    <div className="audio-player">
      <audio ref={ref} controls src={url} preload="metadata" aria-label={label} />
      <label className="speed">
        <span>{s.speed}</span>
        <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
          {SPEEDS.map(v => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
