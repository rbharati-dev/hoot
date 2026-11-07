// What syncs to the person's account, and how each piece merges.
// Anything not listed here stays on this device only: caches (hoot.live.*),
// the feed position, today's set, and videos that failed HERE (a video
// blocked in one country may play in another).
import { activityLog, anyTrue, bests, counters, idList, idSet, lastChange, plusState, recentList, streak, weights, fields, type Rule } from './merge';

export interface SyncKey {
  key: string; // localStorage key
  rule: Rule;
  /** Clear this key from the device when the person signs out. */
  personal: boolean;
}

export const SYNC_KEYS: SyncKey[] = [
  { key: 'hoot.profile', rule: lastChange, personal: true },
  { key: 'hoot.settings', rule: lastChange, personal: false },
  { key: 'hoot.saved', rule: idList, personal: true },
  { key: 'hoot.hidden', rule: idSet, personal: true },
  { key: 'hoot.games', rule: counters, personal: true },
  { key: 'hoot.records', rule: bests(['wordsearch', 'sudoku', 'crossword', 'solitaire']), personal: true },
  { key: 'hoot.streak', rule: streak, personal: true },
  { key: 'hoot.activity', rule: activityLog, personal: true },
  { key: 'hoot.plus', rule: plusState, personal: true },
  { key: 'hoot.seenIntro', rule: anyTrue, personal: false },
  { key: 'hoot.seenTutorial', rule: anyTrue, personal: false },
  { key: 'hoot.coached', rule: idSet, personal: false },
  { key: 'hoot.reflSeen', rule: idSet, personal: true },
  { key: 'hoot.prefs', rule: fields({ w: weights, n: counters }), personal: true },
  ...['en', 'ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne'].map(l => ({ key: `hoot.recentWords.${l}`, rule: recentList(120), personal: true })),
];

export const SYNC_KEY_NAMES = SYNC_KEYS.map(k => k.key);
export const ruleFor = (key: string) => SYNC_KEYS.find(k => k.key === key)?.rule;

/** Firestore document ids can't contain '/'; ours never do, but keep them tidy. */
export const docId = (key: string) => key.replace(/[^\w.-]/g, '_');
