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

const openSolitaire = async (page: Page, games = 'Games', name = 'Solitaire') => {
  await page.getByRole('button', { name: games }).last().click();
  await page.locator('.game-tile', { hasText: name }).click();
};

test('Solitaire explains itself step by step, and one tap moves a card', async ({ page }) => {
  const errors = await open(page);
  await openSolitaire(page);
  const how = page.locator('.sol-how');
  await expect(how).toBeVisible();
  await expect(how.locator('li')).toHaveCount(7);
  await expect(how).toContainText('a red 6 goes on a black 7');
  await expect(how).toContainText('Only a King can go into an empty column');

  // The deck: 24 cards; tapping turns one over.
  await expect(page.getByRole('button', { name: 'Deck: 24 left' })).toBeVisible();
  await page.getByRole('button', { name: 'Deck: 24 left' }).click();
  await expect(page.getByRole('button', { name: 'Deck: 23 left' })).toBeVisible();

  // Tap every face-up card until one moves by itself: a move changes the board
  // with a single tap (no second tap, no double click).
  const snapshot = () => page.locator('.solitaire').evaluate(el => [...el.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).join('|'));
  let moved = false;
  for (let turn = 0; turn < 24 && !moved; turn++) {
    const cards = page.locator('.sol-card:not(.down), .sol-pile.waste:not([disabled])');
    const n = await cards.count();
    for (let i = 0; i < n && !moved; i++) {
      const before = await snapshot();
      await cards.nth(i).click();
      moved = (await snapshot()) !== before;
      if (!moved) await expect(page.locator('.sol-msg')).toContainText(/cannot move|No card can move/);
    }
    if (!moved) await page.locator('.sol-pile.stock').click();
  }
  expect(moved).toBe(true);

  // Undo puts it back.
  const after = await snapshot();
  await page.getByRole('button', { name: 'Undo' }).click();
  expect(await snapshot()).not.toBe(after);
  expect(errors).toEqual([]);
});

test('face-down cards say what to do, and the deck starts again when it runs out', async ({ page }) => {
  await open(page);
  await openSolitaire(page);
  await page.getByRole('button', { name: 'Face-down card' }).first().click({ position: { x: 20, y: 10 } });
  await expect(page.locator('.sol-msg')).toContainText('turn over by themselves');
  for (let i = 0; i < 24; i++) await page.locator('.sol-pile.stock').click();
  await expect(page.getByRole('button', { name: 'Start the deck again' })).toBeVisible();
  await page.getByRole('button', { name: 'Start the deck again' }).click();
  await expect(page.getByRole('button', { name: 'Deck: 24 left' })).toBeVisible();
});

test('Solitaire in French, and on a phone with no sideways scrolling', async ({ page }) => {
  await open(page, 'fr', { width: 390, height: 844 });
  await page.getByRole('button', { name: 'Jeux' }).last().click();
  await page.locator('.game-tile', { hasText: 'Réussite' }).click();
  await expect(page.locator('.sol-how summary')).toHaveText('Comment jouer');
  await expect(page.locator('.sol-how')).toContainText('un 6 rouge sur un 7 noir');
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
