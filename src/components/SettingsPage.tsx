import { useState } from 'react';
import { COUNTRIES, INTERESTS, shareFeedUrl, type Lang, type Profile, type Settings } from '../lib/data';
import { interestLabel, LANG_NAMES, type Strings } from '../lib/i18n';
import { REGIONS } from '../lib/regions';
import { Icon } from './Icon';
import AccountSection from './AccountSection';
import { useAccount } from './AccountProvider';
import type { AccountView } from './AccountSheet';

interface Props {
  t: Strings;
  settings: Settings;
  setSettings: (s: Settings) => void;
  profile: Profile;
  setProfile: (p: Profile | null) => void;
  openAccount: (v: AccountView) => void;
}

export default function SettingsPage({ t, settings, setSettings, profile, setProfile, openAccount }: Props) {
  const { available, account } = useAccount();
  const [copied, setCopied] = useState(false);
  const url = shareFeedUrl(profile, settings.lang);

  const update = (p: Partial<Profile>) => setProfile({ ...profile, ...p });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt(t.copyLink, url);
    }
  };

  return (
    <div className="settings">
      <h1 className="with-icon">
        <Icon name="settings" size={32} />
        {t.settings}
      </h1>

      <AccountSection t={t} lang={settings.lang} openAccount={openAccount} />

      <section>
        <h2 className="with-icon"><Icon name="textSize" size={28} />{t.textSize}</h2>
        <div className="segmented" role="group" aria-label={t.textSize}>
          {t.sizes.map((label, i) => (
            <button
              key={label}
              className={settings.textSize === i ? 'chip active' : 'chip'}
              aria-pressed={settings.textSize === i}
              onClick={() => setSettings({ ...settings, textSize: i as 0 | 1 | 2 })}
              style={{ fontSize: `${1 + i * 0.15}em` }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="with-icon"><Icon name="moon" size={28} />{t.darkMode}</h2>
        <div className="segmented" role="group" aria-label={t.darkMode}>
          {[false, true].map(v => (
            <button key={String(v)} className={settings.dark === v ? 'chip active' : 'chip'} aria-pressed={settings.dark === v} onClick={() => setSettings({ ...settings, dark: v })}>
              {v ? t.on : t.off}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="with-icon"><Icon name="contrast" size={28} />{t.highContrast}</h2>
        <p className="muted">{t.highContrastBody}</p>
        <div className="segmented" role="group" aria-label={t.highContrast}>
          {[false, true].map(v => (
            <button key={String(v)} className={(settings.contrast === true) === v ? 'chip active' : 'chip'} aria-pressed={(settings.contrast === true) === v} onClick={() => setSettings({ ...settings, contrast: v })}>
              {v ? t.on : t.off}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="with-icon"><Icon name="speaker" size={28} />{t.sound}</h2>
        <div className="segmented" role="group" aria-label={t.sound}>
          {[true, false].map(v => (
            <button key={String(v)} className={(settings.sound !== false) === v ? 'chip active' : 'chip'} aria-pressed={(settings.sound !== false) === v} onClick={() => setSettings({ ...settings, sound: v })}>
              {v ? t.on : t.off}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="with-icon"><Icon name="globe" size={28} />{t.language}</h2>
        <div className="segmented" role="group" aria-label={t.language}>
          {(Object.keys(LANG_NAMES) as Lang[]).map(l => (
            <button key={l} className={settings.lang === l ? 'chip active' : 'chip'} aria-pressed={settings.lang === l} onClick={() => setSettings({ ...settings, lang: l })}>
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="with-icon"><Icon name="person" size={28} />{t.aboutYou}</h2>
        <div className="field-row">
          <label>
            <span>{t.bornIn}</span>
            <input
              type="number"
              min={1925}
              max={2005}
              value={profile.born}
              onChange={e => {
                const b = Number(e.target.value);
                if (b >= 1925 && b <= 2005) update({ born: b });
              }}
            />
          </label>
          <label>
            <span>{t.countryQ}</span>
            <select value={profile.country} onChange={e => update({ country: e.target.value })}>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name[settings.lang]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.liveQ}</span>
            <select value={profile.region ?? ''} onChange={e => update({ region: e.target.value || undefined })}>
              <option value="">{t.liveNone}</option>
              <optgroup label={t.liveCanada}>
                {REGIONS.filter(r => r.country === 'ca').map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t.liveUk}>
                {REGIONS.filter(r => r.country === 'gb').map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>
        <p className="label with-icon">
          <Icon name="heart" size={22} />
          {t.interests}
        </p>
        <div className="checks">
          {INTERESTS.map(i => (
            <label key={i} className="check">
              <input
                type="checkbox"
                checked={profile.likes.includes(i)}
                onChange={e => update({ likes: e.target.checked ? [...profile.likes, i] : profile.likes.filter(x => x !== i) })}
              />
              <span>{interestLabel(t, i)}</span>
            </label>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={profile.hideHeavy} onChange={e => update({ hideHeavy: e.target.checked })} />
          <span>{t.hideHeavy}</span>
        </label>
      </section>

      <section>
        <h2 className="with-icon"><Icon name="share" size={28} />{t.shareFeed}</h2>
        <p className="muted">{t.shareFeedBody}</p>
        <input className="link-box" readOnly value={url} onFocus={e => e.target.select()} aria-label={t.shareFeed} />
        <div className="row">
          <button className="btn primary" onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={24} />
            {copied ? t.copied : t.copyLink}
          </button>
          <a className="btn" href={`mailto:?subject=${encodeURIComponent('Hoot')}&body=${encodeURIComponent(url)}`}>
            <Icon name="share" size={24} />
            {t.email}
          </a>
        </div>
      </section>

      <section>
        <p className="muted">{available ? t.privacyAccount : t.privacy}</p>
        {/* While signed in, Sign out (above) is the way to clear this device: it keeps the account copy safe. */}
        {!account && (
        <button
          className="btn quiet"
          onClick={() => {
            if (window.confirm(t.resetConfirm)) {
              try {
                Object.keys(localStorage)
                  .filter(k => k.startsWith('hoot.'))
                  .forEach(k => localStorage.removeItem(k));
              } catch {
                /* ignore */
              }
              setProfile(null);
            }
          }}
        >
          <Icon name="trash" size={24} />
          {t.resetAll}
        </button>
        )}
      </section>
    </div>
  );
}
