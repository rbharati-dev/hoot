// "Support the project": a warm note, three preset amounts and an amount of
// your own. Payments are not connected yet, so Continue stays off with a kind
// explanation; the chosen amount lives in this component only.
import { useId, useRef, useState } from 'react';
import type { Strings } from '../lib/i18n';
import { DONATION_PRESETS_CENTS, formatDollars, parseDonation } from '../lib/accountUi';
import { paymentsConfigured, startDonation } from '../lib/payments';
import { useDialog } from './useDialog';
import { Icon } from './Icon';

export default function SupportSheet({ t, onClose }: { t: Strings; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState<number | null>(1000);
  const [custom, setCustom] = useState('');
  const [touched, setTouched] = useState(false);
  const [failed, setFailed] = useState(false);
  const id = useId();
  useDialog(box, onClose);

  const customCents = custom.trim() ? parseDonation(custom) : null;
  const cents = custom.trim() ? customCents : preset;
  const customError = touched && custom.trim() !== '' && customCents === null;

  const go = async () => {
    if (cents == null) return;
    const r = await startDonation(cents);
    if (!r.ok && r.reason !== 'not-configured') setFailed(true);
  };

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

        <fieldset className="support-amounts">
          <legend>{t.supportChoose}</legend>
          <div className="support-presets">
            {DONATION_PRESETS_CENTS.map(c => (
              <button
                key={c}
                type="button"
                className={preset === c && !custom.trim() ? 'chip active' : 'chip'}
                aria-pressed={preset === c && !custom.trim()}
                onClick={() => {
                  setPreset(c);
                  setCustom('');
                  setTouched(false);
                }}
              >
                {formatDollars(c)}
              </button>
            ))}
          </div>
          <div className={customError ? 'acct-field has-error' : 'acct-field'}>
            <label htmlFor={`${id}-custom`}>{t.supportOtherLabel}</label>
            <div className="support-custom">
              <span aria-hidden="true">$</span>
              <input
                id={`${id}-custom`}
                inputMode="decimal"
                autoComplete="off"
                value={custom}
                onChange={e => {
                  setCustom(e.target.value);
                  setTouched(false);
                }}
                onBlur={() => setTouched(true)}
                aria-invalid={customError}
                aria-describedby={customError ? `${id}-err` : undefined}
              />
            </div>
            {customError && (
              <p className="acct-err" id={`${id}-err`} role="alert">
                <Icon name="warning" size={22} />
                <span>{t.supportAmountError}</span>
              </p>
            )}
          </div>
        </fieldset>

        <button className="btn primary big acct-submit" disabled={!paymentsConfigured || cents == null} aria-describedby={`${id}-soon`} onClick={go}>
          {t.supportContinue}
        </button>
        {!paymentsConfigured && (
          <p className="notice support-soon" id={`${id}-soon`}>
            {t.supportSoon}
          </p>
        )}
        {failed && <p className="notice" role="alert">{t.authErrors.unknown}</p>}
      </div>
    </div>
  );
}
