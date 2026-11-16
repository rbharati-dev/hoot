import { useState } from 'react';
import { INTERESTS, type Profile } from '../lib/data';
import { interestLabel, type Strings } from '../lib/i18n';
import { toast } from '../lib/toast';
import { Icon } from './Icon';
import { useAccount } from './AccountProvider';
import type { AccountResult, AccountView } from './AccountSheet';

// After the first five: the questions the first screen no longer asks. All
// optional. Shown only for what is still missing (birth city, interests, an
// account), so it fades away once answered.
export default function MoreYours({
  t,
  profile,
  onProfile,
  openAccount,
}: {
  t: Strings;
  profile: Profile;
  onProfile: (p: Profile) => void;
  openAccount?: (v: AccountView, after?: (r?: AccountResult) => void) => void;
}) {
  const { available, ready, account } = useAccount();
  const [askCity] = useState(() => !profile.city);
  const [askLikes] = useState(() => !profile.likes.length);
  const [city, setCity] = useState('');
  const [likes, setLikes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const offerAccount = !!openAccount && available && ready && !account;
  if (!askCity && !askLikes && !offerAccount) return null;

  const toggle = (i: string) => setLikes(ls => (ls.includes(i) ? ls.filter(x => x !== i) : [...ls, i]));
  const save = () => {
    const next: Profile = { ...profile, ...(city.trim() ? { city: city.trim().slice(0, 80) } : {}), ...(likes.length ? { likes } : {}) };
    onProfile(next);
    setSaved(true);
    toast(t.toastSettings);
  };

  return (
    <section className="more-yours" aria-labelledby="more-yours-title">
      <h2 id="more-yours-title" className="with-icon">
        <Icon name="sparkle" size={26} />
        {t.moreYoursTitle}
      </h2>
      {(askCity || askLikes) && !saved && (
        <>
          <p className="muted">{t.moreYoursBody}</p>
          {askCity && (
            <div className="field">
              <label htmlFor="more-city">{t.cityQ}</label>
              <input id="more-city" className="text-input" type="text" autoComplete="off" maxLength={80} value={city} onChange={e => setCity(e.target.value)} />
            </div>
          )}
          {askLikes && (
            <fieldset>
              <legend>{t.interestsQ}</legend>
              <div className="interest-grid">
                {INTERESTS.map(i => (
                  <button type="button" key={i} className={likes.includes(i) ? 'interest active' : 'interest'} aria-pressed={likes.includes(i)} onClick={() => toggle(i)}>
                    {likes.includes(i) && <Icon name="check" size={20} />}
                    {interestLabel(t, i)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <button className="btn primary" onClick={save} disabled={!city.trim() && !likes.length}>
            <Icon name="check" size={24} />
            {t.moreYoursSave}
          </button>
        </>
      )}
      {offerAccount && (
        <div className="more-yours-acct">
          <h3>{t.acctSaveQ}</h3>
          <p className="muted">{t.acctSaveBody}</p>
          <button className="btn" onClick={() => openAccount?.('signup')}>
            <Icon name="person" size={24} />
            {t.acctCreate}
          </button>
        </div>
      )}
    </section>
  );
}
