// Photos for health tips: openly licensed (CC0 / CC BY / CC BY-SA / public
// domain) pictures from Wikimedia Commons, at least 1800px wide, chosen by
// hand per topic (public/photos/health/photos.json lists each one's author,
// licence and source page). Each tip always gets the same photo.
export interface HealthPhoto {
  f: string;
  by: string;
  license: string;
  source: string;
}
interface Library {
  photos: Record<string, HealthPhoto[]>;
  borrow: Record<string, string[]>;
}
let lib: Promise<Library | null> | null = null;
export function loadHealthPhotos(): Promise<Library | null> {
  lib ??= fetch('/photos/health/photos.json')
    .then(r => (r.ok ? (r.json() as Promise<Library>) : null))
    .catch(() => null);
  return lib;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** Pure: the photo for a tip (its topic's photos, plus close neighbours' for thin topics). */
export function photoFor(library: Library, topic: string, id: string): HealthPhoto | null {
  const own = library.photos[topic] ?? [];
  const pool = own.length >= 4 ? own : [...own, ...(library.borrow[topic] ?? []).flatMap(t => library.photos[t] ?? [])];
  return pool.length ? pool[hash(id) % pool.length] : null;
}
export const photoSrc = (p: HealthPhoto) => ({ src: `/photos/health/${p.f}-900.jpg`, srcSet: `/photos/health/${p.f}-900.jpg 900w, /photos/health/${p.f}.jpg 1800w` });
