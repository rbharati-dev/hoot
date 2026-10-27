import { expect, test, type Page } from '@playwright/test';

const STEPS = 19;

test.beforeEach(async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  (page as unknown as { errors: string[] }).errors = errors;
});
test.afterEach(async ({ page }) => {
  expect((page as unknown as { errors: string[] }).errors).toEqual([]);
});

// Sign up through onboarding, then get past the old 3-slide intro.
async function newUser(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.locator('.year-input').fill('1952');
  await page.getByRole('button', { name: 'Canada' }).click();
  await page.getByRole('button', { name: 'Show my memories' }).click();
  const intro = page.locator('.intro-overlay');
  if (await intro.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i++) await page.locator('.intro-next').click();
  }
}


test('a new user sees the tutorial, can walk every step, go back, and finish', async ({ page }) => {
  await newUser(page);
  const tut = page.locator('.tut');
  await expect(tut).toBeVisible();
  await expect(page.getByTestId('tutorial-step')).toHaveText(`Step 1 of ${STEPS}`);
  await expect(tut.getByRole('heading', { name: 'Welcome to Hoot' })).toBeFocused();
  for (let n = 2; n <= STEPS; n++) {
    await tut.getByRole('button', { name: /^Next/ }).click();
    await expect(page.getByTestId('tutorial-step')).toHaveText(`Step ${n} of ${STEPS}`);
    await expect(tut.locator('h2')).toBeFocused();
    expect(await tut.locator('.td').count()).toBe(1);
  }
  await expect(tut.locator('h2')).toHaveText("You're ready");
  await tut.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('tutorial-step')).toHaveText(`Step ${STEPS - 1} of ${STEPS}`);
  await tut.getByRole('button', { name: /^Next/ }).click();
  await tut.getByRole('button', { name: 'Start using Hoot' }).click();
  await expect(tut).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.tut')).toHaveCount(0);
});

test('Skip closes the tutorial and it does not come back', async ({ page }) => {
  await newUser(page);
  await page.locator('.tut').getByRole('button', { name: 'Skip' }).click();
  await expect(page.locator('.tut')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.tut')).toHaveCount(0);
  await expect(page.locator('.intro-overlay')).toHaveCount(0);
});

test('Help has a Watch the tutorial button, and arrows and Escape work', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hoot.seenIntro', 'true'));
  await page.goto('/?born=1952&c=us');
  await expect(page.locator('.tut')).toHaveCount(0); // existing users are not interrupted
  await page.getByRole('navigation').getByRole('button', { name: 'Help' }).click();
  await page.getByRole('button', { name: 'Watch the tutorial' }).click();
  const tut = page.locator('.tut');
  await expect(page.getByTestId('tutorial-step')).toHaveText(`Step 1 of ${STEPS}`);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('tutorial-step')).toHaveText(`Step 2 of ${STEPS}`);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('tutorial-step')).toHaveText(`Step 2 of ${STEPS}`);
  await page.keyboard.press('Escape');
  await expect(tut).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Help' })).toBeVisible();
});

test('on a phone the tutorial fits without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('hoot.seenIntro', 'true'));
  await page.goto('/?born=1952&c=us');
  await page.getByRole('navigation', { name: 'Hoot' }).getByRole('button', { name: 'More' }).click();
  await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'Help' }).click();
  await page.getByRole('button', { name: 'Watch the tutorial' }).click();
  const tut = page.locator('.tut');
  for (let n = 1; n <= STEPS; n++) {
    const over = await page.evaluate(() => {
      const el = document.querySelector('.tut') as HTMLElement;
      const main = document.querySelector('.tut-main') as HTMLElement;
      return {
        doc: document.documentElement.scrollWidth - window.innerWidth,
        tut: el.scrollWidth - el.clientWidth,
        main: main.scrollWidth - main.clientWidth,
      };
    });
    expect(over, `step ${n}`).toEqual({ doc: 0, tut: 0, main: 0 });
    const next = tut.getByRole('button', { name: /^Next|Start using/ });
    expect((await next.boundingBox())!.height).toBeGreaterThanOrEqual(60);
    await expect(next).toBeInViewport();
    if (n < STEPS) await next.click();
  }
});

test('"How to play" inside a game opens that game’s tutorial step', async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
    localStorage.setItem('hoot.plus', JSON.stringify({ paidUntil: '2999-12-31' }));
  });
  await page.goto('/');
  for (const game of ['Sudoku', 'Chess', 'Word search', 'Crossword']) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Games' }).click();
    await page.locator('.game-tile', { hasText: game }).click();
    await page.getByRole('button', { name: /How to play/ }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg).toBeVisible();
    await expect(dlg.getByRole('heading').first()).toContainText(game);
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
  }
});

test('the desktop menu is icons with their names available', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
  });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const name of ['Today', 'News', 'Memories', 'Reflections', 'Games', 'Saved', 'Settings', 'Help']) {
    const b = nav.getByRole('button', { name });
    await expect(b).toBeVisible();
    await expect(b.locator('svg')).toHaveCount(1);
    await expect(b).toHaveText(''); // icon only
  }
  await nav.getByRole('button', { name: 'Games' }).click();
  await expect(nav.getByRole('button', { name: 'Games' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Games', level: 1 })).toBeVisible();
});
