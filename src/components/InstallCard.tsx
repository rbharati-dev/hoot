import { count } from '../lib/telemetry';
// The welcome screen's "Put Hoot on your phone" guide (see lib/install).
import { useEffect, useState } from 'react';
import type { Strings } from '../lib/i18n';
import { canPromptInstall, installDone, installLater, offerInstall, onInstallReady, platform, promptInstall } from '../lib/install';
import { Icon } from './Icon';

export default function InstallCard({ t }: { t: Strings }) {
  const [show, setShow] = useState(() => offerInstall());
  const [canPrompt, setCanPrompt] = useState(canPromptInstall());
  useEffect(() => {
    const off = onInstallReady(() => setCanPrompt(true));
    return () => {
      off();
    };
  }, []);
  if (!show) return null;
  const p = platform();
  return (
    <section className="install-card" aria-labelledby="install-title">
      <div className="install-icon" aria-hidden="true">
        <img src="/icons/icon-192.png" alt="" width={56} height={56} />
      </div>
      <div className="install-body">
        <h2 id="install-title">{p === 'desktop' ? t.installTitleDesktop : t.installTitle}</h2>
        <p>{t.installWhy}</p>
        {canPrompt ? (
          <button
            className="btn primary"
            onClick={async () => {
              count('install.prompt');
              if (await promptInstall()) (setShow(false), count('install.accepted'));
            }}
          >
            <Icon name="download" size={22} />
            {t.installButton}
          </button>
        ) : (
          <ol className="install-steps">
            {(p === 'ios' ? t.installStepsIos : p === 'android' ? t.installStepsAndroid : t.installStepsDesktop).map(s => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
        <div className="install-later">
          <button
            className="btn quiet"
            onClick={() => {
              installLater();
              setShow(false);
            }}
          >
            {t.supportNotNow}
          </button>
          <button
            className="btn quiet"
            onClick={() => {
              installDone();
              setShow(false);
            }}
          >
            {t.installHave}
          </button>
        </div>
      </div>
    </section>
  );
}
