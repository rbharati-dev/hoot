// About Hoot, Your privacy and Contact us (text in lib/about.ts).
import { useEffect } from 'react';
import { ABOUT, CONTACT_EMAIL } from '../lib/about';
import type { Lang } from '../lib/data';
import { Icon } from './Icon';
import Logo from './Logo';

export default function About({ lang, section }: { lang: Lang; section?: 'about' | 'privacy' | 'contact' }) {
  const a = ABOUT[lang] ?? ABOUT.en;
  useEffect(() => {
    if (section && section !== 'about') document.getElementById(`about-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0 });
  }, [section]);
  return (
    <div className="about-page">
      <header className="about-head">
        <Logo size={64} />
        <h1>{a.title}</h1>
      </header>
      <section id="about-about" aria-labelledby="about-about-h">
        <h2 id="about-about-h">{a.about}</h2>
        {a.aboutBody.map(p => (
          <p key={p}>{p}</p>
        ))}
      </section>
      <section id="about-privacy" aria-labelledby="about-privacy-h">
        <h2 id="about-privacy-h" className="with-icon">
          <Icon name="lock" size={26} />
          {a.privacy}
        </h2>
        <p>{a.privacyIntro}</p>
        <dl className="privacy-list">
          {a.privacyPoints.map(([h, d]) => (
            <div key={h}>
              <dt>{h}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
        <p className="muted small">{a.updated}</p>
      </section>
      <section id="about-contact" aria-labelledby="about-contact-h">
        <h2 id="about-contact-h" className="with-icon">
          <Icon name="mail" size={26} />
          {a.contact}
        </h2>
        <p>{a.contactBody}</p>
        <a className="btn primary big" href={`mailto:${CONTACT_EMAIL}?subject=Hoot`}>
          <Icon name="mail" size={24} />
          {a.contactEmail}: {CONTACT_EMAIL}
        </a>
      </section>
    </div>
  );
}
