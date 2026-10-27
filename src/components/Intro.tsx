import { useState } from 'react';
import type { Strings } from '../lib/i18n';
import { Icon } from './Icon';

// A short, friendly first-run tour. Three slides, each with a little animation
// that *shows* the gesture rather than only describing it. Shown once.
export default function Intro({ t, onDone }: { t: Strings; onDone: () => void }) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      key: 'cards',
      title: t.intro1Title,
      body: t.intro1Body,
      demo: (
        <div className="intro-demo cards" aria-hidden="true">
          <div className="demo-card c3" />
          <div className="demo-card c2" />
          <div className="demo-card c1">
            <span className="demo-year">1967</span>
            <span className="demo-line" />
            <span className="demo-line short" />
          </div>
          <div className="demo-next">
            <Icon name="next" size={22} /> {t.next}
          </div>
        </div>
      ),
    },
    {
      key: 'music',
      title: t.intro2Title,
      body: t.intro2Body,
      demo: (
        <div className="intro-demo music" aria-hidden="true">
          <span className="demo-vinyl">
            <span />
          </span>
          <span className="demo-wave w1" />
          <span className="demo-wave w2" />
          <span className="demo-wave w3" />
          <span className="demo-play">
            <Icon name="play" size={40} />
          </span>
        </div>
      ),
    },
    {
      key: 'streak',
      title: t.intro3Title,
      body: t.intro3Body,
      demo: (
        <div className="intro-demo streak" aria-hidden="true">
          <span className="demo-flame">
            <Icon name="flame" size={72} />
          </span>
          <span className="demo-count">3</span>
        </div>
      ),
    },
  ];

  const last = step === slides.length - 1;
  const s = slides[step];

  return (
    <div className="intro-overlay" role="dialog" aria-modal="true" aria-label={s.title}>
      <button className="intro-skip" onClick={onDone}>
        <Icon name="close" size={22} />
        {t.introSkip}
      </button>
      <div className="intro-stage">
        <div className="intro-slide" key={s.key}>
          {s.demo}
          <h2>{s.title}</h2>
          <p>{s.body}</p>
        </div>
      </div>
      <div className="intro-dots" aria-hidden="true">
        {slides.map((x, k) => (
          <span key={x.key} className={k === step ? 'dot on' : 'dot'} />
        ))}
      </div>
      <button className="btn primary big intro-next" onClick={() => (last ? onDone() : setStep(step + 1))}>
        <Icon name={last ? 'check' : 'next'} size={28} />
        {last ? t.introStart : t.next}
      </button>
    </div>
  );
}
