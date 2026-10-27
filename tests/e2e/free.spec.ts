import { expect, test, type Page } from '@playwright/test';

// Everything in Hoot is free: no daily round limits, no Upgrade sheet, every
// month of the progress letter open, printing allowed.

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

test('games can be played again and again on the same day', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/');
  await gamesTab(page).click();
  for (let i = 0; i < 3; i++) {
    await tile(page, 'Sudoku').click();
    await expect(page.getByRole('heading', { name: 'Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: /All games/ }).click();
  }
  await expect(tile(page, 'Sudoku')).not.toContainText('free Sudoku');
  await tile(page, 'Crossword').click();
  await page.getByRole('button', { name: 'New puzzle' }).click();
  await expect(page.getByRole('heading', { name: 'Crossword' })).toBeVisible();
  await expect(page.getByText(/played today's free/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('there is no Plus badge or Upgrade sheet anywhere', async ({ page }) => {
  // Someone whose old trial ended long ago is not limited either.
  await setup(page, { 'hoot.plus': { trialStart: '2020-01-01' } });
  await page.goto('/');
  await gamesTab(page).click();
  await expect(page.locator('.plus-chip')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Hoot Plus' })).toHaveCount(0);
  await tile(page, 'Hangman').click();
  await page.getByRole('button', { name: /All games/ }).click();
  await tile(page, 'Hangman').click();
  await expect(page.getByRole('heading', { name: 'Hangman' })).toBeVisible();
});

test('the progress letter counts what was played; earlier months and printing are open', async ({ page }) => {
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

  const title = page.locator('.month-title');
  const now = await title.innerText();
  await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(title).not.toHaveText(now);
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(title).toHaveText(now);
  await page.evaluate(() => (window.print = () => ((window as unknown as { printed: boolean }).printed = true)));
  await page.getByRole('button', { name: /Print this letter/ }).click();
  expect(await page.evaluate(() => (window as unknown as { printed?: boolean }).printed)).toBe(true);
  await expect(page.getByRole('dialog', { name: 'Hoot Plus' })).toHaveCount(0);
  expect(errors).toEqual([]);
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
