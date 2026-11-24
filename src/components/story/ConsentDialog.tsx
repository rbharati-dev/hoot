import { useEffect, useRef } from 'react';
import { setAiConsent } from '../../lib/story/store';
import type { StoryStrings } from '../../lib/story/strings-en';

/** Asked once, before any recording or text is sent to an outside service. */
export default function ConsentDialog({ s, onAnswer }: { s: StoryStrings; onAnswer: (yes: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal?.();
  }, []);
  return (
    <dialog ref={ref} className="consent" aria-labelledby="consent-t" onCancel={() => onAnswer(false)}>
      <h2 id="consent-t">{s.consentTitle}</h2>
      <p>{s.consentBody}</p>
      <div className="row">
        <button
          className="btn primary"
          onClick={() => {
            void setAiConsent(Date.now());
            onAnswer(true);
          }}
        >
          {s.consentYes}
        </button>
        <button className="btn" onClick={() => onAnswer(false)}>
          {s.consentNo}
        </button>
      </div>
    </dialog>
  );
}
