// The "Your account" part of Settings, and the saved/offline/problem line
// that the account sheet shares with it.
import { useEffect, useState } from 'react';
import type { Lang } from '../lib/data';
import type { Strings } from '../lib/i18n';
import { relativeTime } from '../lib/accountUi';
import { useAccount } from './AccountProvider';
import type { AccountView } from './AccountSheet';
import { Icon } from './Icon';

/** "Your progress is saved · Last saved: 5 minutes ago", or what is wrong. */
export function SyncLine({ t, lang }: { t: Strings; lang: Lang }) {
  const { status, lastSynced, syncNow } = useAccount();
  const [now, setNow] = useState(() => Date.now()); // keeps "5 minutes ago" fresh
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const headline =
    status === 'syncing' ? { icon: 'refresh', text: t.acctSaving, cls: '' } : status === 'offline' ? { icon: 'warning', text: t.acctOffline, cls: 'warn' } : status === 'error' ? { icon: 'warning', text: t.acctProblem, cls: 'warn' } : { icon: 'check', text: t.acctSavedOk, cls: 'ok' };

  return (
    <div className="acct-sync">
      <p className={`acct-sync-head ${headline.cls}`} role="status">
        <Icon name={headline.icon} size={24} />
        <span>{headline.text}</span>
      </p>
      <p className="muted small acct-last">{lastSynced ? t.acctLastSaved(relativeTime(lastSynced, Math.max(now, lastSynced), lang)) : t.acctNeverSaved}</p>
      {status === 'error' && (
        <button className="btn" onClick={() => void syncNow()}>
          <Icon name="refresh" size={22} />
          {t.acctTryAgain}
        </button>
      )}
    </div>
  );
}

/** "Please confirm your email" with Send again / I've confirmed it. Email accounts only. */
export function VerifyNotice({ t }: { t: Strings }) {
  const { account, resendVerification, refreshVerified } = useAccount();
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'still' | 'error'>('idle');
  if (!account || account.provider !== 'password' || account.emailVerified || !account.email) return null;
  const act = async (f: () => Promise<'sent' | 'still' | 'idle'>) => {
    if (state === 'busy') return;
    setState('busy');
    try {
      setState(await f());
    } catch {
      setState('error');
    }
  };
  return (
    <div className="notice acct-verify" role="region" aria-label={t.acctVerifyTitle}>
      <p className="with-icon">
        <Icon name="warning" size={24} />
        <strong>{t.acctVerifyTitle}</strong>
      </p>
      <p>{t.acctVerifyBody(account.email)}</p>
      {state === 'sent' && (
        <p className="acct-verify-msg" role="status">
          {t.acctVerifySent}
        </p>
      )}
      {state === 'still' && (
        <p className="acct-verify-msg" role="status">
          {t.acctVerifyStill}
        </p>
      )}
      {state === 'error' && (
        <p className="acct-err" role="alert">
          <Icon name="warning" size={22} />
          <span>{t.acctProblemShort}</span>
        </p>
      )}
      <div className="row">
        <button className="btn primary" disabled={state === 'busy'} onClick={() => void act(async () => ((await refreshVerified()) ? 'idle' : 'still'))}>
          {t.acctVerifyDone}
        </button>
        <button
          className="btn"
          disabled={state === 'busy'}
          onClick={() =>
            void act(async () => {
              await resendVerification();
              return 'sent';
            })
          }
        >
          {t.acctVerifyResend}
        </button>
      </div>
    </div>
  );
}

export default function AccountSection({ t, lang, openAccount }: { t: Strings; lang: Lang; openAccount: (v: AccountView) => void }) {
  const { available, ready, account } = useAccount();
  if (!available || !ready) return null;

  return (
    <section className="acct-section" aria-labelledby="acct-sec-title">
      <h2 id="acct-sec-title" className="with-icon">
        <Icon name="person" size={28} />
        {t.acctTitle}
      </h2>
      {account ? (
        <>
          <p className="acct-who">
            <strong>{account.name ?? account.email}</strong>
            {account.name && account.email && <span className="muted"> {account.email}</span>}
          </p>
          <VerifyNotice t={t} />
          <SyncLine t={t} lang={lang} />
          <div className="row">
            {account.provider === 'password' && (
              <button className="btn" onClick={() => openAccount('password')}>
                {t.acctChangePw}
              </button>
            )}
            <button className="btn" onClick={() => openAccount('signout')}>
              {t.acctSignOut}
            </button>
            <button className="btn quiet" onClick={() => openAccount('delete')}>
              {t.acctDelete}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted">{t.acctWhy}</p>
          <div className="row">
            <button className="btn primary" onClick={() => openAccount('signup')}>
              {t.acctCreate}
            </button>
            <button className="btn" onClick={() => openAccount('signin')}>
              {t.acctSignIn}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
