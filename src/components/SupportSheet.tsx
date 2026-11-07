// "Support the project": a warm note and one button to Stripe's donation page,
// where the person chooses any amount ($5, $10 and $25 are suggested here).
// US readers give in US dollars, everyone else in Canadian dollars.
import { useId, useRef } from 'react';
import type { Strings } from '../lib/i18n';
import { donationCurrency, donationsConfigured, startDonation } from '../lib/payments';
import { store } from '../lib/data';
import { useDialog } from './useDialog';
import { Icon } from './Icon';

export default function SupportSheet({ t, onClose }: { t: Strings; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  useDialog(box, onClose);
  const country = store.profile()?.country;
  const usd = donationCurrency(country) === 'usd';

  return (
    <div className="acct-backdrop" onClick={onClose}>
      <div ref={box} className="acct-sheet support-sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onClick={e => e.stopPropagation()}>
        <button className="acct-close" aria-label={t.close} onClick={onClose}>
          <Icon name="close" size={28} />
        </button>
        <p className="support-badge" aria-hidden="true">
          <Icon name="heart" size={36} />
        </p>
        <h2 id={`${id}-title`}>{t.supportTitle}</h2>
        <p className="support-body">{t.supportBody}</p>
        <p className="support-suggest">{t.supportSuggest(usd ? 'US$' : 'CA$')}</p>
        <button
          className="btn primary big acct-submit"
          disabled={!donationsConfigured}
          onClick={() => {
            startDonation(country);
            onClose();
          }}
        >
          <Icon name="heart" size={26} />
          {t.supportDonate}
        </button>
        <p className="muted small support-secure">{t.supportSecure}</p>
      </div>
    </div>
  );
}
