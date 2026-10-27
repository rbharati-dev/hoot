import { useEffect, useState } from 'react';
import { COUNTRIES, INTERESTS, contentIndex, store, type Lang, type Profile } from '../lib/data';
import { interestLabel, LANG_NAMES, type Strings } from '../lib/i18n';
import Logo from './Logo';
import { Icon } from './Icon';
import { useAccount } from './AccountProvider';
import type { AccountResult, AccountView } from './AccountSheet';

interface Props {
  t: Strings;
  lang: Lang;
  setLang: (l: Lang) => void;
  onDone: (p: Profile) => void;
  /** Open the account sheet; `after` runs when it closes. */
  openAccount: (v: AccountView, after?: (r?: AccountResult) => void) => void;
}

export default function Onboarding({ t, lang, setLang, onDone, openAccount }: Props) {
  const { available: accountsOn, ready, account } = useAccount();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [born, setBorn] = useState(1955);
  const [country, setCountry] = useState<string | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const toggleLike = (i: string) => setLikes(ls => (ls.includes(i) ? ls.filter(x => x !== i) : [...ls, i]));

  useEffect(() => {
    contentIndex().then(ix => setAvailable(Object.keys(ix)));
  }, []);

  const pickCountry = (code: string) => {
    setCountry(code);
    const c = COUNTRIES.find(x => x.code === code);
    if (c && lang === 'en' && c.lang !== 'en') setLang(c.lang);
  };

  const langSwitch = (
    <div className="lang-switch" role="group" aria-label="Language">
      {(Object.keys(LANG_NAMES) as Lang[]).map(l => (
        <button key={l} className={l === lang ? 'chip active' : 'chip'} onClick={() => setLang(l)} aria-pressed={l === lang}>
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  );

  if (step === 0) {
    return (
      <div className="onboard">
        {langSwitch}
        <div className="welcome">
          <Logo size={88} />
          <h1>Hoot</h1>
          <p className="lead">{t.tagline}</p>
          <p className="muted">{t.welcomeBody}</p>
          <button className="btn primary big" onClick={() => setStep(1)}>
            {t.start}
          </button>
          {accountsOn && ready && !account && (
            <button className="btn quiet" onClick={() => openAccount('signin')}>
              {t.acctHave}
            </button>
          )}
        </div>
      </div>
    );
  }

  const profile = (): Profile => ({ born, country: country ?? '', likes, hideHeavy: false });

  // Optional last step: keep the progress in an account. Skippable, equally prominent.
  if (step === 2) {
    return (
      <div className="onboard">
        {langSwitch}
        <div className="welcome acct-offer">
          <Logo size={72} />
          <h1>{t.acctSaveQ}</h1>
          <p className="lead small-lead">{t.acctSaveBody}</p>
          <div className="acct-offer-actions">
            <button
              className="btn primary big"
              onClick={() => {
                // The account starts from what was just chosen, so keep it on this device first.
                store.setProfile(profile());
                openAccount('signup', r => {
                  if (r) onDone(store.profile() ?? profile());
                });
              }}
            >
              {t.acctCreate}
            </button>
            <button className="btn big" onClick={() => onDone(profile())}>
              {t.acctNotNow}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard">
      {langSwitch}
      <form
        className="setup"
        onSubmit={e => {
          e.preventDefault();
          if (!country) return;
          if (accountsOn && ready && !account) setStep(2);
          else onDone(profile());
        }}
      >
        <fieldset>
          <legend>{t.bornQ}</legend>
          <div className="stepper">
            <button type="button" className="btn round" onClick={() => setBorn(b => Math.max(1925, b - 1))} aria-label="−1">
              <Icon name="prev" size={28} />
            </button>
            <input
              className="year-input"
              type="number"
              inputMode="numeric"
              min={1925}
              max={2005}
              value={born}
              onChange={e => setBorn(Number(e.target.value) || 1955)}
              aria-label={t.bornQ}
            />
            <button type="button" className="btn round" onClick={() => setBorn(b => Math.min(2005, b + 1))} aria-label="+1">
              <Icon name="forward" size={28} />
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{t.countryQ}</legend>
          <p className="muted small">{t.countryHint}</p>
          <div className="country-list">
            {COUNTRIES.map(c => {
              const ready = available.includes(c.code);
              return (
                <button
                  type="button"
                  key={c.code}
                  disabled={!ready}
                  className={country === c.code ? 'country active' : 'country'}
                  aria-pressed={country === c.code}
                  onClick={() => pickCountry(c.code)}
                >
                  <span>{c.name[lang]}</span>
                  {!ready && <span className="soon">{t.comingSoon}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend>{t.interestsQ}</legend>
          <p className="muted small">{t.interestsHint}</p>
          <div className="interest-grid">
            {INTERESTS.map(i => (
              <button
                type="button"
                key={i}
                className={likes.includes(i) ? 'interest active' : 'interest'}
                aria-pressed={likes.includes(i)}
                onClick={() => toggleLike(i)}
              >
                {likes.includes(i) && <Icon name="check" size={20} />}
                {interestLabel(t, i)}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="btn primary big" type="submit" disabled={!country}>
          <Icon name="next" size={28} />
          {t.showMemories}
        </button>
      </form>
    </div>
  );
}
