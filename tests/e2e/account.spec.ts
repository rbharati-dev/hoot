import { expect, test, type Page } from '@playwright/test';

// Accounts, support and payment placeholders.
//
// Two builds are covered by one file:
//  - ACCOUNTS ON  (playwright.account.config.ts): the emulator build. Real
//    sign-in code against the Firebase Auth emulator; usernames and synced
//    progress live in an in-browser fake (see vite.emulator.config.ts).
//  - ACCOUNTS OFF (the normal config): the plain build, where nothing about
//    accounts may be visible.
// Tests that don't depend on accounts run in both.

const ON = !!process.env.HOOT_ACCOUNTS;
const AUTH_EMULATOR = 'http://127.0.0.1:9099';

const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const newEmail = () => `person.${uniq()}@example.com`;
const newName = () => `owl${uniq()}`.slice(0, 18);
const PASSWORD = 'correct horse battery';

interface Seed {
  profile?: boolean;
  local?: Record<string, unknown>; // extra hoot.* values
  fake?: Record<string, string>; // fake backend switches / data
}

/** A visitor with a profile (or without), on a given page. Seeds once per tab, not on reload. */
async function visit(page: Page, seed: Seed = {}) {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(
    ([s]) => {
      const seed = s as Seed;
      try {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem('hoot.seenIntro', 'true');
        localStorage.setItem('hoot.seenTutorial', 'true');
        if (seed.profile !== false) localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
        for (const [k, v] of Object.entries(seed.local ?? {})) localStorage.setItem(k, JSON.stringify(v));
        for (const [k, v] of Object.entries(seed.fake ?? {})) localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [seed] as const,
  );
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  return errors;
}

const dialog = (page: Page, name: string) => page.getByRole('dialog', { name });
const local = (page: Page, key: string) => page.evaluate(k => localStorage.getItem(k), key);
const settingsTab = (page: Page) => page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Settings' });
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

async function openSignUp(page: Page) {
  await settingsTab(page).click();
  await page.locator('.acct-section').getByRole('button', { name: 'Create account' }).click();
  await expect(dialog(page, 'Create account')).toBeVisible();
  return dialog(page, 'Create account');
}

async function fillSignUp(sheet: ReturnType<typeof dialog>, v: { username: string; email: string; password: string }) {
  await sheet.getByLabel('Username').fill(v.username);
  await sheet.getByLabel('Email').fill(v.email);
  await sheet.getByLabel('Password', { exact: true }).fill(v.password);
}

/** Create an account from Settings and close the welcome note. Returns its credentials. */
async function createAccount(page: Page, who = { username: newName(), email: newEmail(), password: PASSWORD }) {
  const sheet = await openSignUp(page);
  await fillSignUp(sheet, who);
  await sheet.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: `Welcome, ${who.username}!` })).toBeVisible();
  return who;
}

// ---------------------------------------------------------------- both builds

test.describe('Support the project', () => {
  test('the footer button opens a warm sheet with amounts, and Continue stays off', async ({ page }) => {
    const errors = await visit(page);
    await page.locator('.foot').getByRole('button', { name: 'Support the project' }).click();
    const sheet = dialog(page, 'Support Hoot');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Hoot is free and has no ads');

    const cont = sheet.getByRole('button', { name: 'Continue' });
    await expect(cont).toBeDisabled();
    await expect(sheet).toContainText('Payments are coming soon — thank you!');

    // Presets are a single choice.
    for (const amount of ['$5', '$10', '$25']) {
      await sheet.getByRole('button', { name: amount, exact: true }).click();
      await expect(sheet.getByRole('button', { name: amount, exact: true })).toHaveAttribute('aria-pressed', 'true');
    }
    await expect(sheet.getByRole('button', { name: '$5', exact: true })).toHaveAttribute('aria-pressed', 'false');

    // A custom amount replaces the preset and is checked (shown after leaving the field).
    const custom = sheet.getByLabel('Another amount, in dollars');
    for (const bad of ['abc', '0', '0.99', '1001', '12.345', '-5', '1e3']) {
      await custom.fill(bad);
      await custom.blur();
      await expect(sheet.getByRole('alert')).toContainText('from $1 to $1,000');
    }
    for (const good of ['1', '12', '12.5', '12,50', '$25', '1000']) {
      await custom.fill(good);
      await custom.blur();
      await expect(sheet.getByRole('alert')).toHaveCount(0);
    }
    await expect(sheet.getByRole('button', { name: '$25', exact: true })).toHaveAttribute('aria-pressed', 'false');
    // Choosing a preset clears the custom amount.
    await sheet.getByRole('button', { name: '$10', exact: true }).click();
    await expect(custom).toHaveValue('');
    await expect(cont).toBeDisabled();

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('it is on every page', async ({ page }) => {
    await visit(page);
    for (const tab of ['News', 'Games', 'Help']) {
      await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: tab }).click();
      await expect(page.locator('.foot').getByRole('button', { name: 'Support the project' })).toBeVisible();
    }
  });

  test('works in another language', async ({ page }) => {
    await visit(page, { local: { 'hoot.settings': { lang: 'de', textSize: 1, dark: false, sound: true } } });
    await page.locator('.foot').getByRole('button', { name: 'Projekt unterstützen' }).click();
    const sheet = dialog(page, 'Hoot unterstützen');
    await expect(sheet).toContainText('Zahlungen sind bald möglich');
  });
});

// --------------------------------------------------------------- accounts OFF

test.describe('accounts not configured', () => {
  test.skip(ON, 'normal build only');

  test('nothing about accounts appears anywhere', async ({ page }) => {
    const errors = await visit(page);
    await expect(page.getByRole('button', { name: 'Account', exact: true })).toHaveCount(0);
    await settingsTab(page).click();
    await expect(page.locator('.acct-section')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Your account' })).toHaveCount(0);
    await expect(page.locator('.foot')).toContainText('Hoot has no accounts and no ads');
    expect(errors).toEqual([]);
  });

  test('the phone More sheet has no Account row, and onboarding has no account step', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visit(page);
    await page.getByRole('button', { name: 'More' }).click();
    await expect(dialog(page, 'More')).toBeVisible();
    await expect(dialog(page, 'More').getByRole('button', { name: 'Account' })).toHaveCount(0);
  });

  test('onboarding ends without an account offer', async ({ page }) => {
    await visit(page, { profile: false });
    await expect(page.getByRole('button', { name: 'I already have an account' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Canada' }).click();
    await page.getByRole('button', { name: 'Show my memories' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});

// ---------------------------------------------------------------- accounts ON

test.describe('accounts', () => {
  test.skip(!ON, 'needs the Firebase emulator build');

  test('entry points: top bar icon, Settings section, footer text', async ({ page }) => {
    const errors = await visit(page);
    const icon = page.getByRole('button', { name: 'Account', exact: true });
    await expect(icon).toBeVisible();
    await expect(page.locator('.foot')).toContainText('Without an account');
    await icon.click();
    await expect(dialog(page, 'Sign in')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page, 'Sign in')).toBeHidden();

    await settingsTab(page).click();
    const section = page.locator('.acct-section');
    await expect(section).toContainText('Your account');
    await expect(section).toContainText('Save your progress and use Hoot on any device.');
    await section.getByRole('button', { name: 'Sign in' }).click();
    await expect(dialog(page, 'Sign in')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('create account: every problem is explained next to its field', async ({ page }) => {
    await visit(page);
    const sheet = await openSignUp(page);
    // Rules are visible before anything is typed.
    await expect(sheet).toContainText('3 to 20 letters or numbers');
    await expect(sheet).toContainText('At least 8 characters');
    await expect(sheet.getByLabel('Username')).toBeFocused();

    // Nothing filled in.
    await sheet.getByRole('button', { name: 'Create account' }).click();
    await expect(sheet.locator('#acct-username-err')).toContainText('Usernames have 3 to 20 letters or numbers');
    await expect(sheet.locator('#acct-email-err')).toContainText('check your email address');
    await expect(sheet.locator('#acct-password-err')).toContainText('too short');
    await expect(sheet.getByLabel('Username')).toBeFocused();
    await expect(sheet.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true');

    // Each rule on its own.
    await fillSignUp(sheet, { username: 'a!', email: 'not-an-email', password: 'short' });
    await sheet.getByRole('button', { name: 'Create account' }).click();
    await expect(sheet.locator('#acct-username-err')).toBeVisible();
    await expect(sheet.locator('#acct-email-err')).toBeVisible();
    await expect(sheet.locator('#acct-password-err')).toBeVisible();

    await fillSignUp(sheet, { username: 'ab', email: newEmail(), password: PASSWORD });
    await sheet.getByRole('button', { name: 'Create account' }).click();
    await expect(sheet.locator('#acct-username-err')).toBeVisible();
    await expect(sheet.locator('#acct-email-err')).toHaveCount(0);
    await expect(sheet.locator('#acct-password-err')).toHaveCount(0);

    // Underscore pairs and edges are not allowed either.
    for (const bad of ['_bad', 'bad_', 'ba..d', 'ab cd']) {
      await sheet.getByLabel('Username').fill(bad);
      await sheet.getByRole('button', { name: 'Create account' }).click();
      await expect(sheet.locator('#acct-username-err')).toBeVisible();
    }
  });

  test('password strength hint and show/hide', async ({ page }) => {
    await visit(page);
    const sheet = await openSignUp(page);
    const pw = sheet.getByLabel('Password', { exact: true });
    await expect(pw).toHaveAttribute('type', 'password');
    await expect(pw).toHaveAttribute('autocomplete', 'new-password');
    await expect(sheet.getByLabel('Email')).toHaveAttribute('autocomplete', 'email');
    await expect(sheet.getByLabel('Username')).toHaveAttribute('autocomplete', 'username');

    await pw.fill('abc');
    await expect(sheet).toContainText('Password strength: Too short');
    await pw.fill('abcdefgh');
    await expect(sheet).toContainText('Password strength: Fine');
    await pw.fill('correct horse battery');
    await expect(sheet).toContainText('Password strength: Strong');

    await sheet.getByRole('button', { name: 'Show password' }).click();
    await expect(pw).toHaveAttribute('type', 'text');
    await expect(pw).toHaveValue('correct horse battery');
    await sheet.getByRole('button', { name: 'Hide password' }).click();
    await expect(pw).toHaveAttribute('type', 'password');
  });

  test('inputs are big and labelled', async ({ page }) => {
    await visit(page);
    const sheet = await openSignUp(page);
    for (const label of ['Username', 'Email']) {
      const box = await sheet.getByLabel(label).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(56);
    }
    expect((await sheet.getByLabel('Password', { exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(56);
    expect((await sheet.getByRole('button', { name: 'Show password' }).boundingBox())!.width).toBeGreaterThanOrEqual(48);
  });

  test('create account merges this device\'s progress, then shows in Settings', async ({ page }) => {
    const errors = await visit(page, { local: { 'hoot.saved': [{ id: 'guest-card' }] } });
    const who = await createAccount(page);
    const welcome = page.getByRole('dialog');
    await expect(welcome).toContainText('Your progress on this device was added to your account');
    await welcome.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const section = page.locator('.acct-section');
    await expect(section).toContainText(who.username);
    await expect(section).toContainText(who.email);
    await expect(section).toContainText('Your progress is saved');
    await expect(section).toContainText(/Last saved: (now|\d+ (second|minute)s? ago)/);
    await expect(section.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(section.getByRole('button', { name: 'Delete account' })).toBeVisible();
    expect(JSON.parse((await local(page, 'hoot.saved'))!)).toEqual([{ id: 'guest-card' }]);
    expect(await local(page, 'hoot.sync.owner')).not.toBeNull();
    // The top bar icon now opens the account page.
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    const sheet = dialog(page, 'Your account');
    await expect(sheet).toContainText(who.username);
    await expect(sheet).toContainText('Your progress is saved');
    expect(errors).toEqual([]);
  });

  test('a duplicate email is refused kindly, and a taken username too', async ({ page, request }) => {
    const email = newEmail();
    const r = await request.post(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, { data: { email, password: PASSWORD, returnSecureToken: true } });
    expect(r.ok()).toBe(true);
    await visit(page, { local: { 'hoot.saved': [{ id: 'guest-card' }] }, fake: { 'fake.db': JSON.stringify({ usernames: { maria: 'somebody-else' } }) } });
    const sheet = await openSignUp(page);

    await fillSignUp(sheet, { username: newName(), email, password: PASSWORD });
    await sheet.getByRole('button', { name: 'Create account' }).click();
    await expect(sheet.locator('#acct-email-err')).toContainText('There is already an account with that email');
    await expect(sheet.getByLabel('Email')).toBeFocused();

    // A taken username: say so, keep the sheet, and lose nothing.
    await fillSignUp(sheet, { username: 'Maria', email: newEmail(), password: PASSWORD });
    await sheet.getByRole('button', { name: 'Create account' }).click();
    await expect(sheet.locator('#acct-username-err')).toContainText('Someone already has that username');
    expect(await local(page, 'hoot.sync.owner')).toBeNull();

    // Trying again with a free name still works, and this device's progress is still there.
    await sheet.getByLabel('Username').fill(newName());
    await sheet.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('dialog')).toContainText('Your progress on this device was added to your account');
    expect(JSON.parse((await local(page, 'hoot.saved'))!)).toEqual([{ id: 'guest-card' }]);
  });

  test('keyboard only: open, fill, submit with Enter', async ({ page }) => {
    await visit(page);
    await page.getByRole('button', { name: 'Account', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(dialog(page, 'Sign in')).toBeVisible();
    // Sign in -> "Create account" link, by keyboard.
    const sheet = dialog(page, 'Sign in');
    await sheet.getByRole('button', { name: 'Create account' }).focus();
    await page.keyboard.press('Enter');
    await expect(dialog(page, 'Create account')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeFocused();

    const who = { username: newName(), email: newEmail() };
    await page.keyboard.type(who.username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(who.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog').getByRole('heading', { name: `Welcome, ${who.username}!` })).toBeVisible();
    // Focus lands inside the sheet; Enter on Continue closes it.
    await page.getByRole('button', { name: 'Continue' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Tab stays inside the sheet and Escape closes it, returning focus', async ({ page }) => {
    await visit(page);
    const icon = page.getByRole('button', { name: 'Account', exact: true });
    await icon.focus();
    await page.keyboard.press('Enter');
    const sheet = dialog(page, 'Sign in');
    await expect(sheet).toBeVisible();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await sheet.evaluate((el: HTMLElement) => el.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(icon).toBeFocused();
  });

  test('sign in: wrong password, then the right one; double clicks do one sign-in', async ({ page }) => {
    const email = newEmail();
    const r = await page.request.post(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, { data: { email, password: PASSWORD, returnSecureToken: true } });
    expect(r.ok()).toBe(true);
    await visit(page);
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    const sheet = dialog(page, 'Sign in');
    await expect(sheet.getByLabel('Password', { exact: true })).toHaveAttribute('autocomplete', 'current-password');

    // Empty.
    await sheet.getByRole('button', { name: 'Sign in' }).click();
    await expect(sheet.locator('#acct-email-err')).toBeVisible();
    await expect(sheet.locator('#acct-password-err')).toContainText('Please enter your password');

    await sheet.getByLabel('Email').fill(email);
    await sheet.getByLabel('Password', { exact: true }).fill('not the password');
    await sheet.getByLabel('Password', { exact: true }).press('Enter');
    await expect(sheet.getByRole('alert')).toContainText('That email and password do not match');
    await expect(sheet.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await sheet.getByLabel('Password', { exact: true }).fill(PASSWORD);
    const signIn = sheet.getByRole('button', { name: 'Sign in' });
    await signIn.dblclick();
    await expect(page.getByRole('dialog').getByRole('heading', { name: /^(Welcome, |You are signed in)/ })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('.acct-top.signed')).toBeVisible();
  });

  test('the same email unknown to us gets the same wrong-password answer', async ({ page }) => {
    await visit(page);
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    const sheet = dialog(page, 'Sign in');
    await sheet.getByLabel('Email').fill(newEmail());
    await sheet.getByLabel('Password', { exact: true }).fill('whatever you like');
    await sheet.getByRole('button', { name: 'Sign in' }).click();
    await expect(sheet.getByRole('alert')).toContainText('That email and password do not match');
  });

  test('forgot password: the same confirmation whether or not the email has an account', async ({ page }) => {
    const known = newEmail();
    await page.request.post(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, { data: { email: known, password: PASSWORD, returnSecureToken: true } });
    await visit(page);
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    await dialog(page, 'Sign in').getByRole('button', { name: 'Forgot your password?' }).click();
    const sheet = dialog(page, 'Forgot your password?');
    await expect(sheet).toContainText('we will send you a link');

    await sheet.getByRole('button', { name: 'Send me the link' }).click();
    await expect(sheet.locator('#acct-email-err')).toBeVisible(); // empty is a typo, not a leak

    const words = 'If an account exists for that email, we sent a link.';
    await sheet.getByLabel('Email').fill(known);
    await sheet.getByLabel('Email').press('Enter');
    await expect(sheet.getByRole('status')).toContainText(words);
    const first = await sheet.getByRole('status').textContent();

    await sheet.getByLabel('Email').fill(newEmail());
    await sheet.getByRole('button', { name: 'Send me the link' }).click();
    await expect(sheet.getByRole('status')).toHaveText(first!);

    await sheet.getByRole('button', { name: 'Back to sign in' }).click();
    await expect(dialog(page, 'Sign in')).toBeVisible();
  });

  test('sign out: explains, can be cancelled, clears the device and returns to the welcome screen', async ({ page }) => {
    await visit(page, { local: { 'hoot.saved': [{ id: 'guest-card' }] } });
    const who = await createAccount(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    // Let the first save settle so there is nothing to lose.
    await expect(page.locator('.acct-section')).toContainText('Your progress is saved');

    await page.locator('.acct-section').getByRole('button', { name: 'Sign out' }).click();
    const sheet = dialog(page, 'Sign out of Hoot?');
    await expect(sheet).toContainText('Your progress stays safe in your account');
    await expect(sheet).toContainText('removed from this device');
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page, 'Your account')).toBeVisible();
    expect(await local(page, 'hoot.saved')).not.toBeNull();

    await dialog(page, 'Your account').getByRole('button', { name: 'Sign out' }).click();
    await page.getByRole('button', { name: 'Yes, sign out' }).click();

    // Back to the very start, with a note that stays until closed.
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('You are signed out. Your progress is safe in your account.');
    expect(await local(page, 'hoot.saved')).toBeNull();
    expect(await local(page, 'hoot.profile')).toBeNull();
    expect(await local(page, 'hoot.sync.owner')).toBeNull();
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByRole('status')).toHaveCount(0);

    // Signing in again brings everything back, without a reload.
    await page.getByRole('button', { name: 'I already have an account' }).click();
    const signin = dialog(page, 'Sign in');
    await signin.getByLabel('Email').fill(who.email);
    await signin.getByLabel('Password', { exact: true }).fill('wrong wrong wrong');
    await signin.getByRole('button', { name: 'Sign in' }).click();
    await expect(signin.getByRole('alert')).toContainText('do not match');
    await signin.getByLabel('Password', { exact: true }).fill(who.password);
    await signin.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: `Welcome, ${who.username}!` })).toBeVisible();
    // The synced profile arrived: the app is already showing the main screens behind the sheet.
    await expect(page.locator('.acct-section')).toContainText(who.username);
    await page.getByRole('button', { name: 'Continue' }).click();
    expect(JSON.parse((await local(page, 'hoot.saved'))!)).toEqual([{ id: 'guest-card' }]);
  });

  test('signing in on a device that holds someone else\'s progress says so, and never mixes them', async ({ page }) => {
    const email = newEmail();
    const r = await page.request.post(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, { data: { email, password: PASSWORD, returnSecureToken: true } });
    expect(r.ok()).toBe(true);
    await visit(page, { local: { 'hoot.sync.owner': 'some-other-account', 'hoot.saved': [{ id: 'theirs' }] } });
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    const s = dialog(page, 'Sign in');
    await s.getByLabel('Email').fill(email);
    await s.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await s.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('dialog')).toContainText(`This device now shows ${email}'s progress.`);
    await expect(page.getByRole('dialog')).not.toContainText('was added to your account');
    await page.getByRole('button', { name: 'Continue' }).click();
    expect(await local(page, 'hoot.saved')).toBeNull(); // theirs is gone, and nothing of theirs went into this account
  });

  test('a save that fails shows a clear problem with Try again; signing out warns', async ({ page }) => {
    await visit(page, { fake: { 'fake.fail': '1' } });
    await createAccount(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    const section = page.locator('.acct-section');
    await expect(section).toContainText('We could not save your progress just now');
    await expect(section.getByRole('button', { name: 'Try again' })).toBeVisible();

    await section.getByRole('button', { name: 'Sign out' }).click();
    const sheet = dialog(page, 'Sign out of Hoot?');
    await expect(sheet).toContainText('Your latest progress has not been saved yet');
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await page.keyboard.press('Escape');

    // The backend comes back: Try again fixes it.
    await page.evaluate(() => localStorage.removeItem('fake.fail'));
    await section.getByRole('button', { name: 'Try again' }).click();
    await expect(section).toContainText('Your progress is saved');
    await expect(section.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  });

  test('offline shows the offline message', async ({ page, context }) => {
    await visit(page);
    await createAccount(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('.acct-section')).toContainText('Your progress is saved');
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('online'))); // triggers a sync attempt while offline
    await expect(page.locator('.acct-section')).toContainText('You are offline');
    await context.setOffline(false);
  });

  test('delete account: needs the box and the password, then removes everything', async ({ page }) => {
    await visit(page, { local: { 'hoot.saved': [{ id: 'guest-card' }] } });
    const who = await createAccount(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('.acct-section').getByRole('button', { name: 'Delete account' }).click();
    const sheet = dialog(page, 'Delete your account?');
    await expect(sheet).toContainText('permanently deletes your account');

    const del = sheet.getByRole('button', { name: 'Delete my account forever' });
    await sheet.getByLabel('Your password').fill(PASSWORD);
    await del.click();
    await expect(sheet.getByRole('alert')).toContainText('Please tick the box');

    await sheet.getByLabel('I understand this deletes my progress forever').check();
    await sheet.getByLabel('Your password').fill('');
    await del.click();
    await expect(sheet.locator('#acct-password-err')).toContainText('Please enter your password');

    await sheet.getByLabel('Your password').fill('not my password');
    await del.click();
    await expect(sheet.locator('#acct-password-err')).toContainText('That password is not right');
    await expect(sheet).toBeVisible();

    await sheet.getByLabel('Your password').fill(PASSWORD);
    await del.click();
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Your account has been deleted.');
    expect(await local(page, 'hoot.sync.owner')).toBeNull();

    // The account is really gone.
    await page.getByRole('button', { name: 'I already have an account' }).click();
    const s = dialog(page, 'Sign in');
    await s.getByLabel('Email').fill(who.email);
    await s.getByLabel('Password', { exact: true }).fill(who.password);
    await s.getByRole('button', { name: 'Sign in' }).click();
    await expect(s.getByRole('alert')).toContainText('do not match');
  });

  test('stays signed in after the page is reloaded', async ({ page }) => {
    const errors = await visit(page);
    const who = await createAccount(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.reload();
    await settingsTab(page).click();
    await expect(page.locator('.acct-section')).toContainText(who.username);
    await expect(page.locator('.acct-section').getByRole('button', { name: 'Sign out' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a new account is asked to confirm its email; clicking the link clears the notice', async ({ page }) => {
    const errors = await visit(page);
    const who = await createAccount(page);
    // The welcome note says where the link went.
    await expect(page.getByRole('dialog')).toContainText(`We sent a link to ${who.email}`);
    await page.getByRole('button', { name: 'Continue' }).click();

    const section = page.locator('.acct-section');
    const notice = section.getByRole('region', { name: 'Please confirm your email' });
    await expect(notice).toBeVisible();

    // Not clicked yet: "I have confirmed it" says so kindly.
    await notice.getByRole('button', { name: 'I have confirmed it' }).click();
    await expect(notice.getByRole('status')).toContainText('Not confirmed yet');

    // Sending again works.
    await notice.getByRole('button', { name: 'Send the link again' }).click();
    await expect(notice.getByRole('status')).toContainText('Sent.');

    // Two verification emails exist; click the newest link (as the mail app would).
    const codes = await (await page.request.get(`${AUTH_EMULATOR}/emulator/v1/projects/demo-hoot/oobCodes`)).json();
    const mine = (codes.oobCodes as { email: string; requestType: string; oobLink: string }[]).filter(c => c.email === who.email && c.requestType === 'VERIFY_EMAIL');
    expect(mine.length).toBeGreaterThanOrEqual(2);
    // The link brings them back to Hoot afterwards.
    expect(decodeURIComponent(mine.at(-1)!.oobLink)).toContain('verified=1');
    await page.request.get(mine.at(-1)!.oobLink);

    // Coming back through the link's "continue" address: the app notices on
    // its own and tidies the address bar.
    await page.goto('/?verified=1');
    await settingsTab(page).click();
    await expect(page.locator('.acct-section')).toContainText(who.username);
    await expect(section.getByRole('region', { name: 'Please confirm your email' })).toHaveCount(0);
    await expect(page).not.toHaveURL(/verified=1/);
    expect(errors).toEqual([]);
  });

  test('"I have confirmed it" picks up a confirmation made elsewhere', async ({ page }) => {
    const errors = await visit(page);
    const who = await createAccount(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    const section = page.locator('.acct-section');
    const notice = section.getByRole('region', { name: 'Please confirm your email' });
    await expect(notice).toBeVisible();
    const codes = await (await page.request.get(`${AUTH_EMULATOR}/emulator/v1/projects/demo-hoot/oobCodes`)).json();
    const link = (codes.oobCodes as { email: string; requestType: string; oobLink: string }[]).filter(c => c.email === who.email && c.requestType === 'VERIFY_EMAIL').at(-1)!.oobLink;
    await page.request.get(link);
    await notice.getByRole('button', { name: 'I have confirmed it' }).click();
    await expect(section.getByRole('region', { name: 'Please confirm your email' })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('change password: needs the right current one, then the new one signs in', async ({ page }) => {
    const errors = await visit(page);
    const who = await createAccount(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('.acct-section').getByRole('button', { name: 'Change password' }).click();
    const sheet = dialog(page, 'Change password');
    await expect(sheet.getByLabel('Current password')).toBeFocused();

    // Empty and too short are explained next to their fields.
    await sheet.getByRole('button', { name: 'Change password' }).click();
    await expect(sheet.locator('#acct-password-err')).toBeVisible();
    await expect(sheet.locator('#acct-newpw-err')).toContainText('too short');

    // Wrong current password.
    await sheet.getByLabel('Current password').fill('not my password');
    await sheet.getByLabel('New password').fill('a brand new password');
    await sheet.getByRole('button', { name: 'Change password' }).click();
    await expect(sheet.locator('#acct-password-err')).toContainText('That password is not right');
    await expect(sheet.getByLabel('Current password')).toBeFocused();

    // Right one.
    await sheet.getByLabel('Current password').fill(who.password);
    await sheet.getByLabel('New password').press('Enter');
    await expect(sheet.getByRole('status')).toContainText('Your password has been changed.');
    await sheet.getByRole('button', { name: 'Continue' }).click();
    await expect(dialog(page, 'Your account')).toBeVisible();
    await page.keyboard.press('Escape');

    // The old password no longer works; the new one does.
    const signInWith = (password: string) =>
      page.request.post(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, { data: { email: who.email, password, returnSecureToken: true } });
    expect((await signInWith(who.password)).ok()).toBe(false);
    expect((await signInWith('a brand new password')).ok()).toBe(true);
    expect(errors).toEqual([]);
  });

  test('onboarding ends with an optional, equally prominent account offer', async ({ page }) => {
    await visit(page, { profile: false });
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Canada' }).click();
    await page.getByRole('button', { name: 'Show my memories' }).click();
    await expect(page.getByRole('heading', { name: 'Save your progress?' })).toBeVisible();
    const create = page.getByRole('button', { name: 'Create account' });
    const notNow = page.getByRole('button', { name: 'Not now' });
    const [a, b] = [await create.boundingBox(), await notNow.boundingBox()];
    expect(Math.abs(a!.height - b!.height)).toBeLessThan(2);
    expect(b!.height).toBeGreaterThanOrEqual(56);

    await notNow.click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    expect(await local(page, 'hoot.profile')).not.toBeNull();
  });

  test('onboarding: creating the account keeps the choices just made', async ({ page }) => {
    await visit(page, { profile: false });
    await page.getByRole('button', { name: 'Start' }).click();
    await page.locator('.year-input').fill('1948');
    await page.getByRole('button', { name: 'Canada' }).click();
    await page.getByRole('button', { name: 'Show my memories' }).click();
    await page.getByRole('button', { name: 'Create account' }).click();
    const sheet = dialog(page, 'Create account');
    await fillSignUp(sheet, { username: newName(), email: newEmail(), password: PASSWORD });
    await sheet.getByRole('button', { name: 'Create account' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    expect(JSON.parse((await local(page, 'hoot.profile'))!).born).toBe(1948);
    await settingsTab(page).click();
    await expect(page.locator('.acct-section')).toContainText('Your progress is saved');
  });

  test('Google: the button is there and starts the provider flow, and a failure is explained', async ({ page }) => {
    // Firebase's popup flow loads Google's own script, which can't be driven
    // here (and isn't reachable from every test machine): block it, so the
    // outcome is the same everywhere, and check that the flow was started.
    await page.route(/apis\.google\.com/, r => r.abort());
    await visit(page);
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    const sheet = dialog(page, 'Sign in');
    const google = sheet.getByRole('button', { name: 'Continue with Google' });
    await expect(google).toBeVisible();
    await expect(google.locator('svg')).toBeVisible(); // Google's own "G"
    const started = page.waitForRequest(/apis\.google\.com/);
    await google.click();
    await started;
    // It never leaves the person stuck: the button comes back with a plain message.
    await expect(sheet.getByRole('alert')).toBeVisible({ timeout: 20_000 });
    await expect(google).toBeEnabled();
    await expect(sheet.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('other languages: the account sheet speaks the person\'s language', async ({ page }) => {
    await visit(page, { local: { 'hoot.settings': { lang: 'fr', textSize: 1, dark: false, sound: true } } });
    await page.getByRole('button', { name: 'Compte', exact: true }).click();
    const sheet = dialog(page, 'Se connecter');
    await sheet.getByRole('button', { name: 'Se connecter' }).click();
    await expect(sheet.locator('#acct-email-err')).toContainText('Veuillez vérifier votre adresse e-mail');
    await expect(sheet.locator('#acct-password-err')).toContainText('Veuillez saisir votre mot de passe');
  });

  test('dark mode and high contrast keep the sheet readable', async ({ page }) => {
    await visit(page, { local: { 'hoot.settings': { lang: 'en', textSize: 2, dark: true, sound: true, contrast: true } } });
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    const sheet = dialog(page, 'Sign in');
    await sheet.getByRole('button', { name: 'Sign in' }).click();
    await expect(sheet.locator('#acct-email-err')).toBeVisible();
    const [bg, fg] = await sheet.evaluate(el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]);
    expect(bg).not.toBe(fg);
    await noSideScroll(page);
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('Account lives in the More sheet; sheets never scroll sideways', async ({ page }) => {
      const errors = await visit(page);
      await expect(page.locator('.acct-top')).toBeHidden();
      await page.getByRole('button', { name: 'More' }).click();
      await dialog(page, 'More').getByRole('button', { name: 'Account' }).click();
      const sheet = dialog(page, 'Sign in');
      await expect(sheet).toBeVisible();
      await noSideScroll(page);
      expect((await sheet.boundingBox())!.width).toBeLessThanOrEqual(390);

      await sheet.getByRole('button', { name: 'Create account' }).click();
      const up = dialog(page, 'Create account');
      await up.getByRole('button', { name: 'Create account' }).click(); // errors showing
      await expect(up.locator('#acct-username-err')).toBeVisible();
      await noSideScroll(page);
      await up.getByLabel('Password', { exact: true }).fill('a long enough password');
      await noSideScroll(page);
      await page.keyboard.press('Escape');

      await page.locator('.foot').getByRole('button', { name: 'Support the project' }).scrollIntoViewIfNeeded();
      await page.locator('.foot').getByRole('button', { name: 'Support the project' }).click();
      await expect(dialog(page, 'Support Hoot')).toBeVisible();
      await noSideScroll(page);
      expect(errors).toEqual([]);
    });

    test('the signed-in Settings section fits a phone', async ({ page }) => {
      await visit(page);
      await page.getByRole('button', { name: 'More' }).click();
      await dialog(page, 'More').getByRole('button', { name: 'Settings' }).click();
      await page.locator('.acct-section').getByRole('button', { name: 'Create account' }).click();
      const sheet = dialog(page, 'Create account');
      const who = { username: newName(), email: newEmail(), password: PASSWORD };
      await fillSignUp(sheet, who);
      await sheet.getByRole('button', { name: 'Create account' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.locator('.acct-section')).toContainText('Your progress is saved');
      await noSideScroll(page);
    });
  });
});
