import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, lang = 'en', size = { width: 1280, height: 900 }) {
  await page.setViewportSize(size);
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(l => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.seenTutorial', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
    localStorage.setItem('hoot.settings', JSON.stringify({ lang: l, textSize: 1, dark: false, sound: false }));
  }, lang);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  return errors;
}

test('the Health tab shows one tip at a time, with topics, Next and Back', async ({ page }) => {
  const errors = await open(page);
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Health' }).click();
  await expect(page.getByRole('heading', { name: 'Health', level: 1 })).toBeVisible();
  await expect(page.locator('.health-card h2')).toBeVisible();
  await expect(page.locator('.health-card .type')).toHaveText('Intimacy & desire');
  await expect(page.getByText('General information, not medical advice').first()).toBeVisible();
  await expect(page.getByText('General information, not medical advice')).toHaveCount(2); // at the top and under the tips

  const first = await page.locator('.health-card h2').textContent();
  await page.getByRole('button', { name: 'Next tip' }).click();
  await expect(page.locator('.health-card h2')).not.toHaveText(first!);
  await page.locator('.health-nav').getByRole('button', { name: 'Back' }).click();
  await expect(page.locator('.health-card h2')).toHaveText(first!);

  // A topic narrows the tips.
  await page.getByRole('button', { name: 'More topics' }).click();
  await page.getByRole('button', { name: 'Sleep', exact: true }).click();
  for (let k = 0; k < 4; k++) {
    await expect(page.locator('.health-card .type')).toHaveText('Sleep');
    await page.getByRole('button', { name: 'Next tip' }).click();
  }
  expect(errors).toEqual([]);
});

test('Health on a phone, in Spanish, without sideways scrolling', async ({ page }) => {
  await open(page, 'es', { width: 390, height: 844 });
  await page.getByRole('button', { name: 'Más' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Salud' }).click();
  await expect(page.getByRole('heading', { name: 'Salud', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Para ti' })).toBeVisible();
  await expect(page.locator('.health-card .type')).toHaveText('Intimidad y deseo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
