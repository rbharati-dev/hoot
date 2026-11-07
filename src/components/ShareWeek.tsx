// "Share my week with family" button (Progress page, and the welcome screen
// on weekends): opens the share sheet with this week's summary.
import { useState } from 'react';
import type { Strings } from '../lib/i18n';
import { myWeek, weekText } from '../lib/week';
import ShareSheet from './ShareSheet';
import { Icon } from './Icon';

export default function ShareWeek({ t, className = 'btn' }: { t: Strings; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        <Icon name="family" size={24} />
        {t.weekShare}
      </button>
      {open && <ShareSheet t={t} title="" url="https://hootdaily.com" heading={t.weekShare} text={weekText(t, myWeek())} onClose={() => setOpen(false)} />}
    </>
  );
}
