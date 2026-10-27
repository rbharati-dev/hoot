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
          <SyncLine t={t} lang={lang} />
          <div className="row">
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
