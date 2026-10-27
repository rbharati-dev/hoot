import { expect, test, type Page } from '@playwright/test';

// Chess, end to end in a real browser: the board's geometry at many screen
// sizes (normal and fullscreen), and play — selecting, moving, the computer's
// reply, take back, levels, play again.

async function openChess(page: Page, size?: { width: number; height: number }) {
  if (size) await page.setViewportSize(size);
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
    localStorage.setItem('hoot.plus', JSON.stringify({ paidUntil: '2999-12-31' }));
  });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Games' }).last().click();
  await page.locator('.game-tile', { hasText: 'Chess' }).click();
  await expect(page.locator('.board .sq')).toHaveCount(64);
  return errors;
}

const sq = (page: Page, name: string) => page.locator(`.board .sq[aria-label^="${name}"]`);
const pieces = (page: Page) => page.locator('.board .pc');
const status = (page: Page) => page.getByRole('status').first();
const takeBack = (page: Page) => page.getByRole('button', { name: /Take back/ });

/** Make a move and wait until the computer has really answered it. */
async function play(page: Page, from: string, to: string, timeout = 15_000) {
  await sq(page, from).click();
  await sq(page, to).click();
  await expect(status(page)).toHaveText('The computer is thinking…', { timeout: 2_000 }).catch(() => {});
  await expect(takeBack(page)).toBeEnabled({ timeout });
  await expect(status(page)).not.toHaveText('The computer is thinking…');
}

async function geometry(page: Page) {
  return page.evaluate(() => {
    const board = document.querySelector('.board')!.getBoundingClientRect();
    const cells = [...document.querySelectorAll('.board .sq')].map(e => e.getBoundingClientRect());
    const pcs = [...document.querySelectorAll('.board .pc')].map(e => {
      const r = e.getBoundingClientRect();
      const cell = e.closest('.sq')!.getBoundingClientRect();
      return r.height <= cell.height + 1 && r.width <= cell.width + 1;
    });
    return {
      board: { w: board.width, h: board.height, left: board.left, right: board.right },
      widths: cells.map(r => r.width),
      heights: cells.map(r => r.height),
      piecesFit: pcs.every(Boolean),
      pageWidth: document.documentElement.clientWidth,
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
}

function expectSquareBoard(g: Awaited<ReturnType<typeof geometry>>) {
  const spread = (a: number[]) => Math.max(...a) - Math.min(...a);
  expect(spread(g.widths), 'all squares equally wide').toBeLessThan(1.5);
  expect(spread(g.heights), 'all squares equally tall').toBeLessThan(1.5);
  expect(Math.abs(g.widths[0] - g.heights[0]), 'squares are square').toBeLessThan(1);
  expect(Math.abs(g.board.w - g.board.h), 'board is square').toBeLessThan(1);
  expect(g.board.w, 'board is a usable size').toBeGreaterThanOrEqual(250);
  expect(g.piecesFit, 'every piece fits inside its square').toBe(true);
  expect(g.board.right, 'board fits across the page').toBeLessThanOrEqual(g.pageWidth + 1);
  expect(g.hScroll, 'no sideways scrolling').toBe(false);
}

const SIZES = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1000, height: 1250 }, // the tall window from the bug report
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 844, height: 390 }, // phone held sideways
  { width: 320, height: 568 },
];

for (const size of SIZES) {
  test(`board squares are equal and square at ${size.width}×${size.height}`, async ({ page }) => {
    const errors = await openChess(page, size);
    expectSquareBoard(await geometry(page));
    expect(errors).toEqual([]);
  });

  test(`board squares stay equal in fullscreen at ${size.width}×${size.height}`, async ({ page }) => {
    const errors = await openChess(page, size);
    await page.locator('.fs-btn').click();
    await expect(page.locator('.boardgame.fullscreen')).toBeVisible();
    const g = await geometry(page);
    expectSquareBoard(g);
    // Fullscreen should use the extra room where there is some.
    if (size.height >= 800 && size.width >= 800) expect(g.board.w).toBeGreaterThanOrEqual(480);
    expect(errors).toEqual([]);
  });
}

test('fullscreen opens and closes, and keeps the game', async ({ page }) => {
  await openChess(page);
  await sq(page, 'e2').click();
  await sq(page, 'e4').click();
  await page.locator('.fs-btn').click();
  await expect(page.locator('.boardgame.fullscreen')).toBeVisible();
  await expect(sq(page, 'e4')).toHaveAttribute('aria-label', /e4 wp/);
  await page.locator('.fs-btn').click();
  await expect(page.locator('.boardgame.fullscreen')).toHaveCount(0);
  await expect(sq(page, 'e4')).toHaveAttribute('aria-label', /e4 wp/);
});

test('starts in the standard position with your move', async ({ page }) => {
  const errors = await openChess(page);
  await expect(pieces(page)).toHaveCount(32);
  await expect(status(page)).toHaveText('Your move.');
  for (const [s, p] of [['a1', 'wr'], ['e1', 'wk'], ['d1', 'wq'], ['e8', 'bk'], ['d8', 'bq'], ['h7', 'bp'], ['b1', 'wn']])
    await expect(sq(page, s)).toHaveAttribute('aria-label', `${s} ${p}`);
  await expect(page.getByRole('button', { name: /Take back/ })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('selecting a pawn shows exactly its legal squares', async ({ page }) => {
  await openChess(page);
  await sq(page, 'e2').click();
  await expect(sq(page, 'e2')).toHaveClass(/\bsel\b/);
  await expect(page.locator('.board .sq.target')).toHaveCount(2);
  await expect(sq(page, 'e3')).toHaveClass(/\btarget\b/);
  await expect(sq(page, 'e4')).toHaveClass(/\btarget\b/);
});

test('a knight shows its two opening squares; switching pieces moves the selection', async ({ page }) => {
  await openChess(page);
  await sq(page, 'g1').click();
  await expect(page.locator('.board .sq.target')).toHaveCount(2);
  await expect(sq(page, 'f3')).toHaveClass(/\btarget\b/);
  await expect(sq(page, 'h3')).toHaveClass(/\btarget\b/);
  await sq(page, 'd2').click();
  await expect(sq(page, 'g1')).not.toHaveClass(/\bsel\b/);
  await expect(sq(page, 'd2')).toHaveClass(/\bsel\b/);
});

test('tapping the selected piece again puts it down; tapping an empty square too', async ({ page }) => {
  await openChess(page);
  await sq(page, 'e2').click();
  await sq(page, 'e2').click();
  await expect(page.locator('.board .sq.sel')).toHaveCount(0);
  await sq(page, 'e2').click();
  await sq(page, 'a5').click();
  await expect(page.locator('.board .sq.sel')).toHaveCount(0);
});

test('black pieces cannot be picked up', async ({ page }) => {
  await openChess(page);
  await sq(page, 'e7').click();
  await expect(page.locator('.board .sq.sel')).toHaveCount(0);
  await expect(page.locator('.board .sq.target')).toHaveCount(0);
});

test('an illegal square does nothing', async ({ page }) => {
  await openChess(page);
  await sq(page, 'e2').click();
  await sq(page, 'e5').click();
  await expect(sq(page, 'e2')).toHaveAttribute('aria-label', 'e2 wp');
  await expect(sq(page, 'e5')).toHaveAttribute('aria-label', 'e5');
  await expect(status(page)).toHaveText('Your move.');
});

test('you move, the computer replies, and both moves show', async ({ page }) => {
  const errors = await openChess(page);
  await play(page, 'e2', 'e4');
  await expect(sq(page, 'e4')).toHaveAttribute('aria-label', 'e4 wp');
  await expect(sq(page, 'e2')).toHaveAttribute('aria-label', 'e2');
  await expect(status(page)).toHaveText('Your move.');
  // The computer moved one black piece: still 32 pieces, and its move is highlighted.
  await expect(pieces(page)).toHaveCount(32);
  await expect(page.locator('.board .sq.last')).toHaveCount(2);
  const blackMoved = await page.evaluate(() => {
    const start = ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];
    return start.filter(s => !document.querySelector(`.board .sq[aria-label^="${s} b"]`)).length;
  });
  expect(blackMoved).toBe(1);
  await expect(page.getByRole('button', { name: /Take back/ })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('Take back is not offered while the computer is still to answer', async ({ page }) => {
  await openChess(page);
  await page.getByRole('button', { name: 'Hard' }).click();
  await sq(page, 'e2').click();
  await sq(page, 'e4').click();
  await expect(takeBack(page)).toBeDisabled();
  await expect(status(page)).toHaveText('The computer is thinking…');
  await expect(takeBack(page)).toBeEnabled({ timeout: 15_000 });
});

test('the board ignores clicks while the computer is thinking', async ({ page }) => {
  await openChess(page);
  await sq(page, 'd2').click();
  await sq(page, 'd4').click();
  await sq(page, 'e2').click(); // during the reply
  await expect(page.locator('.board .sq.sel')).toHaveCount(0);
  await expect(status(page)).toHaveText('Your move.', { timeout: 10_000 });
});

test('Take back returns to exactly the starting position', async ({ page }) => {
  await openChess(page);
  await play(page, 'e2', 'e4');
  await page.getByRole('button', { name: /Take back/ }).click();
  await expect(pieces(page)).toHaveCount(32);
  await expect(sq(page, 'e2')).toHaveAttribute('aria-label', 'e2 wp');
  await expect(sq(page, 'e4')).toHaveAttribute('aria-label', 'e4');
  await expect(page.locator('.board .sq[aria-label$=" bp"]')).toHaveCount(8);
  for (const s of ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7']) await expect(sq(page, s)).toHaveAttribute('aria-label', `${s} bp`);
  await expect(page.getByRole('button', { name: /Take back/ })).toBeDisabled();
  await expect(page.locator('.board .sq.last')).toHaveCount(0);
});

test('several moves, then several take backs, step back one move pair at a time', async ({ page }) => {
  await openChess(page);
  let played = 0;
  for (const [a, b] of [['g1', 'f3'], ['b1', 'c3'], ['g2', 'g3']]) {
    // Only play it if it is still legal after the computer's replies.
    await sq(page, a).click();
    if (!(await sq(page, b).getAttribute('class'))?.includes('target')) {
      await sq(page, a).click(); // put it down again
      continue;
    }
    await sq(page, b).click();
    await expect(takeBack(page)).toBeEnabled({ timeout: 15_000 });
    played++;
  }
  expect(played).toBeGreaterThanOrEqual(2);
  for (let i = 0; i < played; i++) await takeBack(page).click();
  await expect(takeBack(page)).toBeDisabled();
  await expect(sq(page, 'g1')).toHaveAttribute('aria-label', 'g1 wn');
  await expect(sq(page, 'b1')).toHaveAttribute('aria-label', 'b1 wn');
  await expect(pieces(page)).toHaveCount(32);
});

test('the Hard level keeps the page responsive while it thinks', async ({ page }) => {
  const errors = await openChess(page);
  await page.getByRole('button', { name: 'Hard' }).click();
  await sq(page, 'e2').click();
  await sq(page, 'e4').click();
  // Count animation frames while it thinks: a frozen page draws almost none.
  const frames = await page.evaluate(
    () =>
      new Promise<number>(resolve => {
        let n = 0;
        const t0 = performance.now();
        const tick = () => {
          n++;
          if (performance.now() - t0 < 400) requestAnimationFrame(tick);
          else resolve(n);
        };
        requestAnimationFrame(tick);
      }),
  );
  expect(frames).toBeGreaterThan(10);
  await expect(status(page)).toHaveText('Your move.', { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('each level can be chosen and answers a move', async ({ page }) => {
  await openChess(page);
  for (const [lvl, from, to] of [['Medium', 'd2', 'd4'], ['Hard', 'c2', 'c3'], ['Easy', 'h2', 'h3']]) {
    await page.getByRole('button', { name: lvl, exact: true }).click();
    await expect(page.getByRole('button', { name: lvl, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await sq(page, from).click();
    if (!(await sq(page, to).getAttribute('class'))?.includes('target')) continue;
    await sq(page, to).click();
    await expect(status(page)).toHaveText(/Your move\.|You win|draw/i, { timeout: 15_000 });
  }
});

test('Play again starts a fresh game', async ({ page }) => {
  await openChess(page);
  await play(page, 'e2', 'e4');
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(sq(page, 'e2')).toHaveAttribute('aria-label', 'e2 wp');
  await expect(sq(page, 'e4')).toHaveAttribute('aria-label', 'e4');
  await expect(page.getByRole('button', { name: /Take back/ })).toBeDisabled();
});

test('Play again during the computer’s turn does not let its old answer land', async ({ page }) => {
  await openChess(page);
  await page.getByRole('button', { name: 'Hard' }).click();
  await sq(page, 'e2').click();
  await sq(page, 'e4').click();
  await page.getByRole('button', { name: 'Play again' }).click();
  await page.waitForTimeout(2500); // longer than any reply
  await expect(pieces(page)).toHaveCount(32);
  await expect(page.locator('.board .sq.last')).toHaveCount(0);
  for (const s of ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7']) await expect(sq(page, s)).toHaveAttribute('aria-label', `${s} bp`);
  await expect(status(page)).toHaveText('Your move.');
});

test('Play again starts a fresh game as often as you like', async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Games' }).last().click();
  await page.locator('.game-tile', { hasText: 'Chess' }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.board')).toBeVisible();
  await expect(page.getByText(/played today's free/)).toHaveCount(0);
});

test('the board works by keyboard', async ({ page }) => {
  await openChess(page);
  await sq(page, 'e2').focus();
  await page.keyboard.press('Enter');
  await expect(sq(page, 'e2')).toHaveClass(/\bsel\b/);
  await sq(page, 'e4').focus();
  await page.keyboard.press('Enter');
  await expect(sq(page, 'e4')).toHaveAttribute('aria-label', 'e4 wp');
});

test('dark mode and high contrast keep the board square', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hoot.settings', JSON.stringify({ lang: 'en', textSize: 2, dark: true, sound: false, contrast: true })));
  await openChess(page, { width: 1280, height: 800 });
  expectSquareBoard(await geometry(page));
  await page.locator('.fs-btn').click();
  expectSquareBoard(await geometry(page));
});
