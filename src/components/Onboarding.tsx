import { useEffect, useState } from 'react';
import { COUNTRIES, contentIndex, type Lang, type Profile } from '../lib/data';
import { LANG_NAMES, type Strings } from '../lib/i18n';
import Logo from './Logo';
import { Icon } from './Icon';
import { useAccount } from './AccountProvider';
import type { AccountResult, AccountView } from './AccountSheet';

// First visit: one screen, two questions (year and country), then straight
// into today's five. Everything else (birth city, interests, an account) is
// offered after the first five, once Hoot has shown what it is for.

interface Props {
  t: Strings;
  lang: Lang;
  setLang: (l: Lang) => void;
  onDone: (p: Profile) => void;
  /** Open the account sheet; `after` runs when it closes. */
  openAccount: (v: AccountView, after?: (r?: AccountResult) => void) => void;
  /** The life-story message and the optional name question. */
  slogan?: string;
  nameQ?: string;
}

export default function Onboarding({ t, lang, setLang, onDone, openAccount, slogan, nameQ }: Props) {
  const [name, setName] = useState('');
  const { available: accountsOn, ready, account } = useAccount();
  const [born, setBorn] = useState(1955);
  const [country, setCountry] = useState<string | null>(null);
  const [available, setAvailable] = useState<string[]>([]);

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

  const profile = (): Profile => ({ born, country: country ?? '', likes: [], hideHeavy: false, ...(name.trim() ? { name: name.trim().slice(0, 40) } : {}) });

  return (
    <div className="onboard">
      {langSwitch}
      <form
        className="setup"
        aria-labelledby="onboard-title"
        onSubmit={e => {
          e.preventDefault();
          if (!country) return;
          onDone(profile());
        }}
      >
        <header className="onboard-head">
          <Logo size={64} />
          <div>
            <h1 id="onboard-title">Hoot</h1>
            <p className="lead small-lead">{slogan ?? t.tagline}</p>
          </div>
        </header>
        {nameQ && (
          <div className="field">
            <label htmlFor="onb-name">{nameQ}</label>
            <input id="onb-name" className="text-input" autoComplete="given-name" maxLength={40} value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
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

        <button className="btn primary big" type="submit" disabled={!country}>
          <Icon name="next" size={28} />
          {t.showMemories}
        </button>
        {accountsOn && ready && !account && (
          <button type="button" className="btn quiet" onClick={() => openAccount('signin')}>
            {t.acctHave}
          </button>
        )}
      </form>
    </div>
  );
}
