// Share a memory the way people actually send things: WhatsApp, email or a
// text message, each opening with a short note and the link already written;
// or copy the link. Where the phone has its own share menu, "More ways" opens it.
import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Strings } from '../lib/i18n';
import { useDialog } from './useDialog';
import { Icon } from './Icon';

/** The ready-to-send links for each way of sharing (pure, for tests). */
export function shareTargets(title: string, url: string, t: Pick<Strings, 'shareMessage' | 'shareSubject'>) {
  const text = `${t.shareMessage} ${title}\n${url}`;
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(t.shareSubject)}&body=${encodeURIComponent(text)}`,
    // iPhones want "sms:&body=", everything else "sms:?body=".
    sms: `sms:${ios ? '&' : '?'}body=${encodeURIComponent(text)}`,
    text,
  };
}

export default function ShareSheet({ t, title, url, onClose, onShared }: { t: Strings; title: string; url: string; onClose: () => void; onShared?: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const id = useId();
  useDialog(box, onClose);
  const to = shareTargets(title, url, t);
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    onShared?.();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt(t.copyLink, url);
    }
  };
  const native = async () => {
    onShared?.();
    try {
      await navigator.share({ title, text: `${t.shareMessage} ${title}`, url });
      onClose();
    } catch {
      /* closed the menu: stay here */
    }
  };

  // Rendered on the page itself, so the card's animation can't trap it.
  return createPortal(
    <div className="acct-backdrop" onClick={onClose}>
      <div ref={box} className="acct-sheet share-sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onClick={e => e.stopPropagation()}>
        <button className="acct-close" aria-label={t.close} onClick={onClose}>
          <Icon name="close" size={28} />
        </button>
        <h2 id={`${id}-title`}>{t.share}</h2>
        <p className="muted">{t.shareHow}</p>
        <div className="share-ways">
          <a className="btn big share-way wa" href={to.whatsapp} target="_blank" rel="noopener noreferrer" onClick={onShared}>
            <Icon name="chat" size={30} />
            {t.shareWhatsApp}
          </a>
          <a className="btn big share-way" href={to.email} onClick={onShared}>
            <Icon name="mail" size={30} />
            {t.shareEmail}
          </a>
          <a className="btn big share-way" href={to.sms} onClick={onShared}>
            <Icon name="message" size={30} />
            {t.shareText}
          </a>
          <button className="btn big share-way" onClick={copy}>
            <Icon name={copied ? 'check' : 'link'} size={30} />
            {copied ? t.copied : t.copyLink}
          </button>
          {canNative && (
            <button className="btn big share-way" onClick={native}>
              <Icon name="more" size={30} />
              {t.shareMore}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
