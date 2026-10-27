// Help page: expandable quick answers.
import type { Strings } from '../lib/i18n';
import type { Lang } from '../lib/data';
import { TUTORIAL_TEXT } from '../lib/tutorialText';
import { Icon } from './Icon';

export default function Help({ t, lang = 'en', onTutorial }: { t: Strings; lang?: Lang; onTutorial?: () => void }) {
  const tut = TUTORIAL_TEXT[lang].ui;
  return (
    <div className="help">
      <h1 className="with-icon">
        <Icon name="help" size={32} />
        {t.help}
      </h1>
      <p className="muted">{t.helpIntro}</p>
      {onTutorial && (
        <div className="help-tutorial">
          <button className="btn primary big" onClick={onTutorial}>
            <Icon name="play" size={26} />
            {tut.watch}
          </button>
          <p className="muted small">{tut.watchHint}</p>
        </div>
      )}
      <div className="help-list">
        {t.helpFaq.map(([q, a], i) => (
          <details key={i} className="help-item">
            <summary>
              <span className="help-q">{q}</span>
              <span className="help-toggle" aria-hidden="true" />
            </summary>
            <p className="help-a">{a}</p>
          </details>
        ))}
      </div>
      <p className="help-more">{t.helpMore}</p>
    </div>
  );
}
