// Small pure helpers for the account and support screens (unit tested).
import { MIN_PASSWORD } from './cloud/auth';

/** "2 minutes ago", "yesterday", "now": in the person's language, no extra strings needed. */
export function relativeTime(then: number, now: number, lang: string): string {
  let rtf: Intl.RelativeTimeFormat;
  try {
    rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  } catch {
    rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  }
  const sec = Math.round((then - now) / 1000); // negative = in the past
  const abs = Math.abs(sec);
  if (abs < 45) return rtf.format(0, 'second');
  if (abs < 45 * 60) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 22 * 3600) return rtf.format(Math.round(sec / 3600), 'hour');
  if (abs < 26 * 86400) return rtf.format(Math.round(sec / 86400), 'day');
  if (abs < 320 * 86400) return rtf.format(Math.round(sec / (30 * 86400)), 'month');
  return rtf.format(Math.round(sec / (365 * 86400)), 'year');
}

/** 0 too short, 1 fine, 2 good, 3 strong. A simple hint, never a rule. */
export function passwordStrength(p: string): 0 | 1 | 2 | 3 {
  if (p.length < MIN_PASSWORD) return 0;
  if (/^(.)\1*$/.test(p)) return 1;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(p)).length;
  if (p.length >= 16 || (p.length >= 12 && classes >= 2)) return 3;
  if (p.length >= 12 || classes >= 3) return 2;
  return 1;
}

export const DONATION_PRESETS_CENTS = [500, 1000, 2500];
export const DONATION_MIN_CENTS = 100;
export const DONATION_MAX_CENTS = 100_000;

/**
 * Read an amount typed in dollars: whole or with 1–2 decimals ("12", "12.5",
 * "12,50", "$25", "1,000"). Returns cents, or null if it is not a valid
 * amount between $1 and $1,000.
 */
export function parseDonation(text: string): number | null {
  let s = text.trim().replace(/^\$\s*/, '').replace(/\s*\$$/, '');
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, ''); // 1,000 or 1.000
  const m = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const cents = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || 0);
  return cents >= DONATION_MIN_CENTS && cents <= DONATION_MAX_CENTS ? cents : null;
}

export const formatDollars = (cents: number) => `$${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2)}`;
