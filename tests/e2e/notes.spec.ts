import { test, expect } from '@playwright/test';

test('write what you remember under a memory, and find it in My memory book', async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.seenTutorial', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
  });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Memories' }).click();
  const card = page.locator('.memory').first();
  const title = (await card.locator('h2').textContent())!.trim();
  await card.getByRole('button', { name: 'What do you remember?' }).click();
  await card.getByLabel('What do you remember?').fill('I watched this with my dad on our first colour TV.');
  await card.getByRole('button', { name: 'Save note' }).click();
  await expect(card.locator('.note-box blockquote')).toHaveText('I watched this with my dad on our first colour TV.');
  await expect(card.getByText('Saved to your memory book.')).toBeVisible();

  // It survives a reload and shows in the book.
  await page.reload();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Saved' }).click();
  const book = page.getByRole('region', { name: 'My memory book' });
  await expect(book.getByRole('heading', { name: title })).toBeVisible();
  await expect(book).toContainText('first colour TV');
  await expect(book.getByRole('button', { name: 'Print my memory book' })).toBeVisible();
  expect(errors).toEqual([]);
});
