import { expect, test, type Page } from '@playwright/test';

// The Hoot Plus journey end to end: the free daily round, the "come back
// tomorrow" screen, the Upgrade sheet, the no-card trial, unlocked levels,
// and the progress letter.

const PROFILE = { born: 1955, country: 'ca', likes: [], hideHeavy: false };

async function setup(page: Page, extra: Record<string, unknown> = {}) {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(
    ([profile, more]) => {
      localStorage.setItem('hoot.seenIntro', 'true');
      localStorage.setItem('hoot.profile', JSON.stringify(profile));
      for (const [k, v] of Object.entries(more as Record<string, unknown>)) localStorage.setItem(k, JSON.stringify(v));
    },
    [PROFILE, extra] as const,
  );
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}

const gamesTab = (page: Page) => page.getByRole('navigation').getByRole('button', { name: 'Games' });
const tile = (page: Page, name: string) => page.locator('.game-tile', { hasText: name });

test('a free player gets one round of a game per day, then a friendly stop', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/');
  await gamesTab(page).click();
  await tile(page, 'Sudoku').click();
  await expect(page.getByRole('heading', { name: 'Sudoku' })).toBeVisible();

  // Back to the list: the tile now says it was played today.
  await page.getByRole('button', { name: /All games/ }).click();
  await expect(tile(page, 'Sudoku')).toContainText("You've played today's free Sudoku.");

  // Opening it again shows the daily-done screen, not the game.
  await tile(page, 'Sudoku').click();
  await expect(page.getByRole('heading', { name: "You've played today's free Sudoku." })).toBeVisible();
  await expect(page.locator('.sudoku-grid, .grid')).toHaveCount(0);

  // Other games are still free today.
  await page.getByRole('button', { name: 'Choose another game' }).click();
  await tile(page, 'Crossword').click();
  await expect(page.getByRole('heading', { name: 'Crossword' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('starting another round inside a game uses the allowance too', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/');
  await gamesTab(page).click();
  await tile(page, 'Crossword').click();
  await page.getByRole('button', { name: 'New puzzle' }).click();
  await expect(page.getByRole('heading', { name: "You've played today's free Crossword." })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the Upgrade sheet offers a no-card trial that unlocks unlimited play', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/');
  await gamesTab(page).click();
  await tile(page, 'Hangman').click();
  await page.getByRole('button', { name: /All games/ }).click();
  await tile(page, 'Hangman').click();
  await page.getByRole('button', { name: 'See Hoot Plus' }).click();

  const sheet = page.getByRole('dialog', { name: 'Hoot Plus' });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('No card needed');
  await sheet.getByRole('button', { name: 'Try it free for 14 days' }).click();
  await expect(sheet).toContainText('14 days left');
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();

  // Now Hangman opens again, as often as they like.
  await page.getByRole('button', { name: /All games/ }).click();
  await tile(page, 'Hangman').click();
  await expect(page.getByRole('heading', { name: 'Hangman' })).toBeVisible();
  // The trial survives a reload.
  await page.reload();
  await gamesTab(page).click();
  await expect(page.locator('.plus-chip')).toContainText('14 days left');
  expect(errors).toEqual([]);
});

test('Escape closes the Upgrade sheet', async ({ page }) => {
  await setup(page);
  await page.goto('/');
  await gamesTab(page).click();
  await page.locator('.plus-chip').click();
  await expect(page.getByRole('dialog', { name: 'Hoot Plus' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Hoot Plus' })).toBeHidden();
});

test('an ended trial is not offered again', async ({ page }) => {
  await setup(page, { 'hoot.plus': { trialStart: '2020-01-01' } });
  await page.goto('/');
  await gamesTab(page).click();
  await page.locator('.plus-chip').click();
  const sheet = page.getByRole('dialog', { name: 'Hoot Plus' });
  await expect(sheet).toContainText('Your free trial has ended');
  await expect(sheet.getByRole('button', { name: /Try it free/ })).toHaveCount(0);
});

test('a paid player is never limited', async ({ page }) => {
  await setup(page, { 'hoot.plus': { paidUntil: '2999-12-31' } });
  await page.goto('/');
  await gamesTab(page).click();
  for (let i = 0; i < 3; i++) {
    await tile(page, 'Word search').click();
    await expect(page.getByRole('heading', { name: 'Word search' })).toBeVisible();
    await page.getByRole('button', { name: /All games/ }).click();
  }
  await expect(page.locator('.plus-chip')).toContainText('Hoot Plus');
});

test('the progress letter counts what was played, and earlier months need Plus', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/');
  await gamesTab(page).click();
  await tile(page, 'Sudoku').click();
  await page.getByRole('button', { name: /All games/ }).click();
  await tile(page, 'Crossword').click();
  await page.getByRole('button', { name: /All games/ }).click();

  await page.getByRole('button', { name: 'My progress' }).click();
  await expect(page.getByRole('heading', { name: 'My progress' })).toBeVisible();
  const stats = page.locator('.report-stats li');
  await expect(stats.nth(0)).toHaveText(/^\s*1\s*day active\s*$/);
  await expect(stats.nth(1)).toHaveText(/^\s*2\s*rounds played\s*$/);
  await expect(page.locator('.highlights')).toContainText('Your first month with Hoot');
  await expect(page.locator('.cal .cal-day.active')).toHaveCount(1);
  await expect(page.locator('.by-game li')).toHaveCount(2);
  await expect(page.getByText('This is a record of your play, not a medical test.')).toBeVisible();

  // Previous month and printing are Plus.
  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(page.getByRole('dialog', { name: 'Hoot Plus' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Print this letter/ }).click();
  await expect(page.getByRole('dialog', { name: 'Hoot Plus' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('with Plus, earlier months open and the next-month button stops at today', async ({ page }) => {
  await setup(page, { 'hoot.plus': { paidUntil: '2999-12-31' } });
  await page.goto('/');
  await gamesTab(page).click();
  await page.getByRole('button', { name: 'My progress' }).click();
  const title = page.locator('.month-title');
  const now = await title.innerText();
  await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(title).not.toHaveText(now);
  await expect(page.getByRole('dialog', { name: 'Hoot Plus' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(title).toHaveText(now);
});

test('the progress page reads in the chosen language', async ({ page }) => {
  await setup(page, { 'hoot.settings': { lang: 'fr', textSize: 1, dark: false, sound: true } });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Jeux' }).click();
  await page.locator('.games-head-actions .btn').first().click();
  // Month name is French (e.g. "octobre 2026").
  await expect(page.locator('.month-title')).toHaveText(/janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre/i);
});

test('on a phone, My progress is in the More sheet', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'My progress' }).click();
  await expect(page.getByRole('heading', { name: 'My progress' })).toBeVisible();
});
