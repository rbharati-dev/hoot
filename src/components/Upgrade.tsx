// The Hoot Plus sheet: what Plus adds, a no-card free trial, and (once a
// payment provider is connected) the way to subscribe. Plain words, one price
// line, no pressure: older people distrust pushy upsells.
import { useEffect, useRef, useState } from 'react';
import { TRIAL_DAYS } from '../lib/plus';
import type { Strings } from '../lib/i18n';
import { paymentsConfigured, startSubscription, type Plan } from '../lib/payments';
import { usePlus } from './PlusProvider';
import { useAccount } from './AccountProvider';
import { Icon } from './Icon';

export default function Upgrade({ t, onClose }: { t: Strings; onClose: () => void }) {
  const { plus, trialDaysLeft, state, startTrial } = usePlus();
  const closeRef = useRef<HTMLButtonElement>(null);
  const trialUsed = !!state.trialStart;
  const { available, account } = useAccount();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="plus-backdrop" onClick={onClose}>
      <div className="plus-sheet" role="dialog" aria-modal="true" aria-labelledby="plus-title" onClick={e => e.stopPropagation()}>
        <button ref={closeRef} className="plus-close" aria-label={t.close} onClick={onClose}>
          <Icon name="close" size={28} />
        </button>
        <p className="plus-badge" aria-hidden="true">
          <Icon name="star" size={36} />
        </p>
        <h2 id="plus-title">{t.plusName}</h2>
        <p className="plus-tagline">{t.plusTagline}</p>
        <ul className="plus-features">
          {t.plusFeatures.map(f => (
            <li key={f}>
              <Icon name="check" size={22} className="feat-check" />
              {f}
            </li>
          ))}
        </ul>

        {plus ? (
          <p className="notice good plus-status" role="status">
            {trialDaysLeft > 0 ? t.plusTrialActive(trialDaysLeft) : t.plusActive}
          </p>
        ) : trialUsed ? (
          <p className="notice plus-status">{t.plusTrialOver}</p>
        ) : (
          <>
            <button className="btn primary big plus-trial" onClick={startTrial}>
              <Icon name="star" size={26} />
              {t.plusTrial(TRIAL_DAYS)}
            </button>
            <p className="muted small">{t.plusTrialNote}</p>
          </>
        )}
        {(!plus || trialDaysLeft > 0) && (
          <div className="plus-subscribe">
            <div className="plus-plans" role="group" aria-label={t.plusPlans}>
              {(['monthly', 'yearly'] as Plan[]).map(p => (
                <button key={p} type="button" className={plan === p ? 'chip active' : 'chip'} aria-pressed={plan === p} onClick={() => setPlan(p)}>
                  <strong>{p === 'monthly' ? t.plusPlanMonthly : t.plusPlanYearly}</strong>
                  <span className="muted small">{t.plusPriceTbd}</span>
                </button>
              ))}
            </div>
            {available && !account && <p className="notice plus-needs-account">{t.plusNeedsAccount}</p>}
            <button
              className="btn big plus-subscribe-btn"
              disabled={!paymentsConfigured}
              aria-describedby="plus-subscribe-soon"
              onClick={async () => {
                const r = await startSubscription(plan);
                if (!r.ok && r.reason !== 'not-configured') setFailed(true);
              }}
            >
              {t.plusSubscribe}
            </button>
            {!paymentsConfigured && (
              <p className="muted small" id="plus-subscribe-soon">
                {t.plusComingSoon}
              </p>
            )}
            {failed && <p className="notice" role="alert">{t.authErrors.unknown}</p>}
          </div>
        )}
        <p className="muted small plus-soon">{t.plusSubscribeSoon}</p>
      </div>
    </div>
  );
}
