import { useEffect, useState } from 'react';
import { fileGet } from '../../lib/story/idb';

/** A photograph kept on this device. */
export default function PhotoThumb({ id, alt, className = 'mc-photo' }: { id: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let made: string | null = null;
    void fileGet(id).then(b => {
      if (b) {
        made = URL.createObjectURL(b);
        setUrl(made);
      }
    });
    return () => {
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);
  return url ? <img className={className} src={url} alt={alt} /> : <span className={`${className} ph-empty`} aria-hidden="true" />;
}
