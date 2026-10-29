import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, lang = 'en', size = { width: 1280, height: 900 }, firstTime = false) {
  await page.setViewportSize(size);
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(l => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.seenTutorial', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
    localStorage.setItem('hoot.settings', JSON.stringify({ lang: l.lang, textSize: 1, dark: false, sound: false }));
    if (!l.firstTime && !sessionStorage.getItem('coach-test')) localStorage.setItem('hoot.coached', JSON.stringify(['solitaire']));
  }, { lang, firstTime });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  return errors;
}

const openSolitaire = async (page: Page, games = 'Games', name = 'Solitaire') => {
  await page.getByRole('button', { name: games }).last().click();
  await page.locator('.game-tile', { hasText: name }).click();
};

test('Solitaire: a short hint, and one tap moves a card', async ({ page }) => {
  const errors = await open(page);
  await openSolitaire(page);
  await expect(page.locator('.solitaire')).toContainText('Build the four piles up from Ace to King.');
  await expect(page.locator('.coach')).toHaveCount(0); // already shown before

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
  await expect(page.locator('.solitaire')).toContainText('Montez les quatre piles');
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('the first time only, a walkthrough on the real cards shows what to tap', async ({ page }) => {
  const errors = await open(page, 'en', { width: 1280, height: 900 }, true);
  await openSolitaire(page);
  const bubble = page.locator('.coach-bubble');
  await expect(page.locator('.coach-ring')).toBeVisible();
  await expect(page.locator('.coach-finger')).toBeVisible();

  // Step: tap the card it points at; the card moves and the walkthrough moves on.
  if ((await bubble.textContent())!.includes('Tap this card')) {
    const ring = (await page.locator('.coach-ring').boundingBox())!;
    const before = await page.locator('.solitaire').innerHTML();
    await page.mouse.click(ring.x + ring.width / 2, ring.y + 18);
    expect(await page.locator('.solitaire').innerHTML()).not.toBe(before);
  }
  // Step: the deck.
  await expect(bubble).toContainText('Tap the deck');
  await page.locator('.sol-pile.stock').click();
  // Step: the suit piles, then Got it.
  if ((await bubble.textContent())!.includes('Tap this card')) {
    const ring = (await page.locator('.coach-ring').boundingBox())!;
    await page.mouse.click(ring.x + ring.width / 2, ring.y + 18);
  }
  await expect(bubble).toContainText('Aces go up here');
  await bubble.getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('.coach')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('hoot.coached'))).toContain('solitaire');

  // Opening the game again: no walkthrough.
  await page.evaluate(() => sessionStorage.setItem('coach-test', '1'));
  await page.getByRole('button', { name: /All games/ }).click();
  await openSolitaire(page);
  await expect(page.locator('.sol-tableau')).toBeVisible();
  await expect(page.locator('.coach')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the walkthrough can be skipped, and is not shown to someone who already played', async ({ page }) => {
  await open(page, 'en', { width: 390, height: 844 }, true);
  await openSolitaire(page);
  await expect(page.locator('.coach-bubble')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('.coach-bubble').getByRole('button', { name: 'Skip' }).click();
  await expect(page.locator('.coach')).toHaveCount(0);
});

test('someone who played Solitaire before the walkthrough existed does not get it', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hoot.activity', JSON.stringify({ '2026-01-05': { games: { solitaire: { started: 3, solved: 1 } } } })));
  await open(page, 'en', { width: 1280, height: 900 }, true);
  await openSolitaire(page);
  await expect(page.locator('.sol-tableau')).toBeVisible();
  await expect(page.locator('.coach')).toHaveCount(0);
});
