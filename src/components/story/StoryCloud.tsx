import { useEffect, useRef } from 'react';
import { useAccount } from '../AccountProvider';
import { useStory, useStoryLoaded } from '../../lib/story/store';
import { syncStories } from '../../lib/story/cloud';
import { pumpUploads, stopWatching } from '../../lib/story/process';

/**
 * Keeps the person's stories in step with their account while they are signed
 * in: copies changes a few seconds after they happen, uploads finished
 * recordings (when that is switched on) and follows their processing.
 * Renders nothing.
 */
export default function StoryCloud({ lang }: { lang: string }) {
  const { account } = useAccount();
  const loaded = useStoryLoaded();
  const story = useStory();
  const uid = account?.uid ?? null;
  const timer = useRef<number | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!uid || !loaded) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        await syncStories(uid);
        await pumpUploads(uid, lang);
      } catch {
        /* offline or not allowed: try again on the next change */
      } finally {
        busy.current = false;
      }
    }, 2500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [uid, loaded, story, lang]);

  useEffect(() => () => stopWatching(), [uid]);
  return null;
}
