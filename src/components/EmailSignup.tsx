// Settings → "Morning email": sign up (daily or weekly) or stop it.
import { useId, useState } from 'react';
import type { Strings } from '../lib/i18n';
import type { Lang } from '../lib/data';
import { emailAvailable, mySub, subscribe, unsubscribe, validEmail, type Freq } from '../lib/emailSignup';
import { count } from '../lib/telemetry';
import { Icon } from './Icon';

export default function EmailSignup({ t, lang, accountEmail }: { t: Strings; lang: Lang; accountEmail?: string | null }) {
  const [sub, setSub] = useState(() => mySub());
  const [email, setEmail] = useState(accountEmail ?? '');
  const [freq, setFreq] = useState<Freq>('daily');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error' | 'invalid'>('idle');
  const id = useId();
  if (!emailAvailable()) return null;
  return (
    <section className="email-signup" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="with-icon">
        <Icon name="mail" size={28} />
        {t.emailTitle}
      </h2>
      <p>{t.emailBody}</p>
      {sub ? (
        <>
          <p className="notice good" role="status">
            {state === 'sent' ? t.emailCheck : t.emailSignedUp(sub.email)}
          </p>
          <button
            className="btn"
            onClick={async () => {
              await unsubscribe(sub.token);
              count('email.unsubscribe.app');
              setSub(null);
              setState('idle');
            }}
          >
            {t.emailStop}
          </button>
        </>
      ) : (
        <form
          onSubmit={async e => {
            e.preventDefault();
            if (!validEmail(email)) return setState('invalid');
            setState('busy');
            const ok = await subscribe(email, freq, lang);
            if (ok) {
              count(`email.signup.${freq}`);
              setSub(mySub());
              setState('sent');
            } else setState('error');
          }}
        >
          <label className="field">
            <span>{t.emailAddress}</span>
            <input type="email" autoComplete="email" value={email} onChange={e => (setEmail(e.target.value), setState('idle'))} required />
          </label>
          <fieldset className="email-freq">
            {(['daily', 'weekly'] as const).map(f => (
              <label key={f} className="radio">
                <input type="radio" name={`${id}-freq`} checked={freq === f} onChange={() => setFreq(f)} />
                {f === 'daily' ? t.emailDaily : t.emailWeekly}
              </label>
            ))}
          </fieldset>
          {state === 'invalid' && <p className="notice warn" role="alert">{t.emailInvalid}</p>}
          {state === 'error' && <p className="notice warn" role="alert">{t.emailError}</p>}
          <button className="btn primary" type="submit" disabled={state === 'busy'}>
            <Icon name="mail" size={22} />
            {t.emailSignup}
          </button>
        </form>
      )}
    </section>
  );
}
