import { describe, expect, it } from 'vitest';
import { STRINGS } from '../../src/lib/i18n';
import { DONATION_PRESETS_CENTS, formatDollars, parseDonation, passwordStrength, relativeTime } from '../../src/lib/accountUi';
import { DONATION_LINKS, donationCurrency, startSubscription } from '../../src/lib/payments';
import { problemOf, type AuthProblem } from '../../src/lib/cloud/auth';

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 5, 15, 12, 0, 0);

describe('relativeTime', () => {
  it('says "now" for the last few seconds', () => {
    expect(relativeTime(NOW - 5_000, NOW, 'en')).toBe('now');
    expect(relativeTime(NOW, NOW, 'en')).toBe('now');
  });
  it('counts minutes, hours and days in English', () => {
    expect(relativeTime(NOW - 5 * MIN, NOW, 'en')).toBe('5 minutes ago');
    expect(relativeTime(NOW - MIN, NOW, 'en')).toBe('1 minute ago');
    expect(relativeTime(NOW - 3 * HOUR, NOW, 'en')).toBe('3 hours ago');
    expect(relativeTime(NOW - DAY, NOW, 'en')).toBe('yesterday');
    expect(relativeTime(NOW - 4 * DAY, NOW, 'en')).toBe('4 days ago');
    expect(relativeTime(NOW - 60 * DAY, NOW, 'en')).toBe('2 months ago');
  });
  it('uses the language of the reader', () => {
    expect(relativeTime(NOW - 5 * MIN, NOW, 'fr')).toBe('il y a 5 minutes');
    expect(relativeTime(NOW - 5 * MIN, NOW, 'de')).toBe('vor 5 Minuten');
    expect(relativeTime(NOW - DAY, NOW, 'es')).toBe('ayer');
  });
  it('works for every language Hoot has, and never returns an empty string', () => {
    for (const lang of Object.keys(STRINGS)) {
      for (const ago of [0, 30_000, 10 * MIN, 5 * HOUR, 2 * DAY, 90 * DAY, 800 * DAY]) {
        expect(relativeTime(NOW - ago, NOW, lang).length).toBeGreaterThan(0);
      }
    }
  });
  it('does not crash on an unknown language', () => {
    expect(relativeTime(NOW - 5 * MIN, NOW, 'xx-not-a-lang')).toMatch(/5 minutes ago/);
  });
});

describe('passwordStrength', () => {
  it('is 0 when too short', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abc12!X')).toBe(0);
  });
  it('rises with length and variety', () => {
    expect(passwordStrength('abcdefgh')).toBe(1);
    expect(passwordStrength('aaaaaaaaaaaaaaaaaaaa')).toBe(1); // length alone, repeated, is not strong
    expect(passwordStrength('Abcdef1!')).toBe(2);
    expect(passwordStrength('abcdefghijkl')).toBe(2);
    expect(passwordStrength('correct horse battery')).toBe(3);
    expect(passwordStrength('Abcdef1!ghij')).toBe(3);
  });
});

describe('parseDonation', () => {
  it('accepts whole dollars and 1–2 decimals, in cents', () => {
    expect(parseDonation('5')).toBe(500);
    expect(parseDonation('12')).toBe(1200);
    expect(parseDonation('12.5')).toBe(1250);
    expect(parseDonation('12.50')).toBe(1250);
    expect(parseDonation('12,50')).toBe(1250);
    expect(parseDonation('0.07')).toBe(null); // below $1
    expect(parseDonation('1.07')).toBe(107);
    expect(parseDonation('19.99')).toBe(1999);
  });
  it('allows a dollar sign, spaces and thousands separators', () => {
    expect(parseDonation(' $25 ')).toBe(2500);
    expect(parseDonation('$ 25')).toBe(2500);
    expect(parseDonation('1,000')).toBe(100_000);
    expect(parseDonation('1.000')).toBe(100_000);
  });
  it('keeps to $1 – $1,000', () => {
    expect(parseDonation('1')).toBe(100);
    expect(parseDonation('1000')).toBe(100_000);
    expect(parseDonation('1000.00')).toBe(100_000);
    expect(parseDonation('0')).toBe(null);
    expect(parseDonation('0.99')).toBe(null);
    expect(parseDonation('1000.01')).toBe(null);
    expect(parseDonation('1001')).toBe(null);
    expect(parseDonation('2,500')).toBe(null);
  });
  it('rejects anything that is not an amount', () => {
    for (const bad of ['', ' ', 'abc', '12.345', '-5', '1e3', '12.', '.5', '1,2,3', '5 dollars', 'Infinity', '12,5,0', '𝟑']) {
      expect(parseDonation(bad), JSON.stringify(bad)).toBe(null);
    }
  });
  it('presets are all valid amounts', () => {
    expect(DONATION_PRESETS_CENTS).toEqual([500, 1000, 2500]);
    for (const c of DONATION_PRESETS_CENTS) expect(parseDonation(String(c / 100))).toBe(c);
  });
  it('formats dollars without needless cents', () => {
    expect(formatDollars(500)).toBe('$5');
    expect(formatDollars(1250)).toBe('$12.50');
  });
});

describe('payments', () => {
  it('donations go to Stripe: US dollars for the US, Canadian dollars for everyone else', () => {
    expect(donationCurrency('us')).toBe('usd');
    for (const c of ['ca', 'gb', 'in', 'np', undefined, null]) expect(donationCurrency(c)).toBe('cad');
    expect(DONATION_LINKS.cad).toMatch(/^https:\/\/buy\.stripe\.com\//);
    expect(DONATION_LINKS.usd).toMatch(/^https:\/\/buy\.stripe\.com\//);
    expect(DONATION_LINKS.cad).not.toBe(DONATION_LINKS.usd);
  });
  it('subscriptions are not configured (Hoot is free)', async () => {
    expect(await startSubscription('monthly')).toEqual({ ok: false, reason: 'not-configured' });
    expect(await startSubscription('yearly')).toEqual({ ok: false, reason: 'not-configured' });
  });
});

describe('account strings', () => {
  const PROBLEMS: AuthProblem[] = [
    'invalid-email', 'weak-password', 'email-in-use', 'wrong-password', 'username-taken', 'username-invalid', 'too-many-attempts',
    'offline', 'popup-closed', 'popup-blocked', 'needs-recent-login', 'account-exists-other-method', 'unavailable', 'unknown',
  ];
  it('every language explains every problem, in its own words', () => {
    for (const [lang, t] of Object.entries(STRINGS)) {
      for (const p of PROBLEMS) {
        const text = t.authErrors[p];
        expect(text, `${lang}/${p}`).toBeTruthy();
        if (lang !== 'en') expect(text, `${lang}/${p} is still English`).not.toBe(STRINGS.en.authErrors[p]);
      }
      expect(Object.keys(t.authErrors).sort()).toEqual([...PROBLEMS].sort());
    }
  });
  it('the password rule in the text matches the real minimum', () => {
    for (const t of Object.values(STRINGS)) expect(t.acctPasswordHelp(8)).toContain('8');
    expect(STRINGS.en.authErrors['weak-password']).toContain('8');
  });
  it('every language has all the account strings, none left in English', () => {
    const en = STRINGS.en as unknown as Record<string, unknown>;
    const keys = Object.keys(en).filter(k => /^(acct|support|plusPlan|plusSubscribe$|plusComingSoon|plusNeedsAccount|plusPriceTbd|privacyAccount)/.test(k));
    expect(keys.length).toBeGreaterThan(60);
    for (const [lang, t] of Object.entries(STRINGS)) {
      if (lang === 'en') continue;
      for (const k of keys) {
        const v = (t as unknown as Record<string, unknown>)[k];
        expect(v, `${lang}.${k}`).toBeDefined();
        // Short words can be the same in two languages (Account, Password, Email).
        if (typeof v === 'string' && String(en[k]).length > 8) expect(v, `${lang}.${k} equals English`).not.toBe(en[k]);
      }
    }
  });
  it('the Forgot-password confirmation never claims an account exists', () => {
    expect(STRINGS.en.acctResetSent.startsWith('If an account exists')).toBe(true);
  });
  it('Firebase error codes map to the problems the screens explain', () => {
    expect(problemOf({ code: 'auth/email-already-in-use' })).toBe('email-in-use');
    expect(problemOf({ code: 'auth/invalid-credential' })).toBe('wrong-password');
    expect(problemOf({ code: 'auth/network-request-failed' })).toBe('offline');
    expect(problemOf({ code: 'auth/something-new' })).toBe('unknown');
  });
});
