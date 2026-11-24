import { useState } from 'react';
import { Icon } from '../Icon';
import type { Profile } from '../../lib/data';
import type { StoryStrings } from '../../lib/story/strings-en';
import { CATEGORIES } from '../../lib/story/questions';
import { setAiConsent, setOffLimits, setStyle, useStory } from '../../lib/story/store';
import { storyBackendOn, usageReport } from '../../lib/story/cloud';
import type { EditStyle } from '../../lib/story/types';

/** Settings for the life story: name, topics to avoid, editing, consent, privacy, and the owner's usage report. */
export default function StorySettings({ s, profile, setProfile, uid }: { s: StoryStrings; profile: Profile; setProfile: (p: Profile) => void; uid: string | null }) {
  const story = useStory();
  const [report, setReport] = useState<Record<string, number | string> | null>(null);
  const [reportErr, setReportErr] = useState(false);
  const toggle = (c: string) => void setOffLimits(story.offLimits.includes(c) ? story.offLimits.filter(x => x !== c) : [...story.offLimits, c]);
  return (
    <section className="settings-block story-settings" aria-labelledby="ss-title">
      <h2 id="ss-title" className="with-icon">
        <Icon name="book" size={26} /> {s.storySettings}
      </h2>
      <label className="field">
        <span>{s.nameQ}</span>
        <input className="text-input" maxLength={40} value={profile.name ?? ''} onChange={e => setProfile({ ...profile, name: e.target.value.slice(0, 40) })} />
      </label>

      <fieldset className="field">
        <legend>{s.offLimitsLabel}</legend>
        <p className="muted">{s.offLimitsHint}</p>
        <div className="chip-row">
          {CATEGORIES.map(c => (
            <button key={c} className={story.offLimits.includes(c) ? 'chip active' : 'chip'} aria-pressed={story.offLimits.includes(c)} onClick={() => toggle(c)}>
              {story.offLimits.includes(c) && <Icon name="eyeOff" size={18} />} {(s as unknown as Record<string, string>)[`cat_${c}`]}
            </button>
          ))}
        </div>
      </fieldset>

      {storyBackendOn() && (
        <>
          <label className="field">
            <span>{s.defaultStyle}</span>
            <select value={story.style} onChange={e => void setStyle(e.target.value as EditStyle)}>
              <option value="own_words">{s.styleOwn}</option>
              <option value="polished">{s.stylePolished}</option>
              <option value="book">{s.styleBook}</option>
            </select>
          </label>
          <p>{story.aiConsentAt ? s.aiConsentOn : s.aiConsentOff}</p>
          {story.aiConsentAt && (
            <button className="btn" onClick={() => void setAiConsent(undefined)}>
              {s.withdrawConsent}
            </button>
          )}
        </>
      )}

      <h3>{s.privacyTitle}</h3>
      <ul className="privacy-points">
        {s.privacyPoints.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>

      {uid && storyBackendOn() && (
        <details className="admin-report">
          <summary>{s.usageAdmin}</summary>
          <button
            className="btn small-btn"
            onClick={() =>
              void usageReport().then(
                r => setReport(r),
                () => setReportErr(true),
              )
            }
          >
            <Icon name="refresh" size={18} /> {s.usageAdmin}
          </button>
          {reportErr && <p className="muted">—</p>}
          {report && (
            <dl className="report">
              {Object.entries(report).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{typeof v === 'number' ? Math.round(v * 1000) / 1000 : v}</dd>
                </div>
              ))}
            </dl>
          )}
        </details>
      )}
    </section>
  );
}
