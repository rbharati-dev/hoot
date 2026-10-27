// Videos that failed to play on this device (blocked in this country, removed,
// or not embeddable). Remembered so the app stops offering them here.
const KEY = 'hoot.badVideos';

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function isBadVideo(id: string | undefined): boolean {
  return !!id && read().includes(id);
}

export function markBadVideo(id: string) {
  try {
    const list = read().filter(x => x !== id);
    list.unshift(id);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
  } catch {
    /* storage blocked: nothing to remember */
  }
}
