import { useEffect, useState } from 'react';
import { dismissToast, onToasts, type ToastItem } from '../lib/toast';
import { Icon } from './Icon';

// Shows toasts at the bottom of the screen (above the phone menu). Polite live
// region (not role=status, which the games use for their own messages), so a screen reader reads each one out without stealing focus.
export default function Toaster({ closeLabel }: { closeLabel: string }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => onToasts(setItems), []);
  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {items.map(x => (
        <div key={x.id} className={`toast ${x.kind}`}>
          <Icon name={x.kind === 'bad' ? 'warning' : 'check'} size={24} />
          <span>{x.text}</span>
          <button className="toast-x" onClick={() => dismissToast(x.id)} aria-label={closeLabel}>
            <Icon name="close" size={20} />
          </button>
        </div>
      ))}
    </div>
  );
}
