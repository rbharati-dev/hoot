import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToasts, dismissToast, onToasts, toast, toastMs, type ToastItem } from '../../src/lib/toast';

describe('toasts', () => {
  let seen: ToastItem[] = [];
  beforeEach(() => {
    clearToasts();
    onToasts(x => (seen = x));
  });
  it('shows a message and lets it be dismissed', () => {
    const id = toast('Saved.');
    expect(seen.map(x => x.text)).toEqual(['Saved.']);
    dismissToast(id);
    expect(seen).toEqual([]);
  });
  it('does not stack the same message, and keeps at most three', () => {
    toast('A');
    toast('A');
    expect(seen).toHaveLength(1);
    toast('B');
    toast('C');
    toast('D');
    expect(seen.map(x => x.text)).toEqual(['B', 'C', 'D']);
  });
  it('goes away by itself, and errors stay longer', () => {
    vi.useFakeTimers();
    toast('Saved.');
    vi.advanceTimersByTime(toastMs('Saved.', 'good') + 10);
    expect(seen).toEqual([]);
    vi.useRealTimers();
    expect(toastMs('x', 'bad')).toBeGreaterThan(toastMs('x', 'good'));
    expect(toastMs('x'.repeat(500), 'bad')).toBeLessThanOrEqual(9000);
  });
});
