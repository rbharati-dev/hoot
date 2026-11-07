import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, lang = 'en', size = { width: 1280, height: 900 }, news: unknown[] = []) {
  await page.setViewportSize(size);
  // Research news changes every few hours; tests pin it.
  await page.route(/\/content\/research\//, r => r.fulfill({ json: { stories: news } }));
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
  await expect(page.locator('.health-card .type')).toHaveText('Menopause'); // "For you" leads with menopause; intimacy stays under its own button
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
  await expect(page.locator('.health-card .type')).toHaveText('Menopausia');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('new research leads the Health tab, with its source, a link out and an animal-study note', async ({ page }) => {
  const now = new Date().toISOString();
  const story = (n: number, animal = false) => ({ id: 'n' + n, title: 'Study number ' + n, summary: 'Researchers found something people will want to read about, in a long enough summary.', image: '', source: 'ScienceDaily', url: 'https://example.org/' + n, topic: 'sleep', published: now, animal });
  const errors = await open(page, 'en', undefined, [story(1, true), story(2), story(3)]);
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Health' }).click();
  await expect(page.locator('.health-card h2')).toHaveText('Study number 1');
  await expect(page.locator('.health-story .meta')).toContainText('ScienceDaily · Today');
  await expect(page.getByText('Early research in animals')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read the full story' })).toHaveAttribute('href', 'https://example.org/1');
  await page.locator('.health-card').getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.health-card h2')).toHaveText('Study number 2');
  await page.locator('.health-card').getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.health-card .type')).toHaveText('Menopause'); // then a tip
  await page.getByRole('button', { name: 'New research' }).click();
  await expect(page.locator('.health-card h2')).toHaveText('Study number 1');
  expect(errors).toEqual([]);
});

test('sexual health appears only under Intimacy & desire, never in For you or New research', async ({ page }) => {
  const now = new Date().toISOString();
  const errors = await open(page, 'en', undefined, [
    { id: 'n1', title: 'Libido study', summary: 'A study about sex later in life, long enough to show here.', image: '', source: 'S', url: 'https://example.org/1', topic: 'mood', published: now, intimate: true },
    { id: 'n2', title: 'Walking study', summary: 'A study about walking later in life, long enough to show here.', image: '', source: 'S', url: 'https://example.org/2', topic: 'strength', published: now },
  ]);
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Health' }).click();
  // Walk well into "For you": no intimacy tips, no flagged study.
  for (let k = 0; k < 12; k++) {
    await expect(page.locator('.health-card h2')).not.toHaveText('Libido study');
    const type = await page.locator('.health-card .type').textContent();
    expect(type).not.toContain('Intimacy');
    await page.locator('.next-disc').click();
  }
  await page.getByRole('button', { name: 'New research' }).click();
  await expect(page.locator('.health-card h2')).toHaveText('Walking study');
  await page.locator('.next-disc').click();
  await expect(page.locator('.health-card h2')).toHaveText('Walking study'); // the only one
  await page.getByRole('button', { name: 'Intimacy & desire' }).click();
  await expect(page.locator('.health-card h2')).toHaveText('Libido study');
  expect(errors).toEqual([]);
});
