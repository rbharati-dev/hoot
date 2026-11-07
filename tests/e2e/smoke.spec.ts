import { expect, test, type Page } from '@playwright/test';

const offline = async (page: Page) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
};

test.beforeEach(async ({ page }) => {
  await offline(page);
  // Skip the first-run tour by default; one test below covers it explicitly.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hoot.seenIntro', 'true');
    } catch {
      /* ignore */
    }
  });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  (page as unknown as { errors: string[] }).errors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as unknown as { errors: string[] }).errors).toEqual([]);
});

test('a new visitor can sign up and browse memories', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.locator('.year-input').fill('1952');
  await page.getByRole('button', { name: 'Canada' }).click();
  await page.getByRole('button', { name: 'Show my memories' }).click();
  // Onboarding now lands on the Today home; open the full feed to browse.
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Memories' }).click();
  await expect(page.locator('.memory h2')).toBeVisible();
  await expect(page.locator('.year-now')).toHaveText('1957');
  await expect(page.locator('.memory h2')).toHaveText(/./);
  const first = await page.locator('.memory h2').textContent();
  await page.getByRole('button', { name: /Next memory/ }).click();
  await expect(page.locator('.memory h2')).not.toHaveText(first!);
  await page.getByRole('button', { name: /Back/ }).click();
  await expect(page.locator('.memory h2')).toHaveText(first!);
  // jump to a year with a top-hits playlist
  await page.locator('.jump select').selectOption('1967');
  await expect(page.locator('.year-now')).toHaveText('1967');
  // save a memory and find it in Saved
  await page.locator('.feed-stage').getByRole('button', { name: /^Save$/ }).click();
  await expect(page.locator('.feed-stage .btn.saved:visible')).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Saved' }).click();
  await expect(page.locator('.saved-list .memory')).toHaveCount(1);
});

test('a family share link opens straight into the feed in the right language', async ({ page }) => {
  await page.goto('/?born=1962&c=su&lang=ru');
  await expect(page.locator('.memory h2')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Воспоминания' })).toBeVisible();
  await expect(page.locator('.year-now')).toHaveText('1967');
});

test('the first-run tour shows and can be finished', async ({ page }) => {
  // Undo the global skip so the tour appears for this test.
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('hoot.seenIntro');
    } catch {
      /* ignore */
    }
  });
  await page.goto('/?born=1952&c=us');
  await expect(page.locator('.intro-overlay')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'One memory at a time' })).toBeVisible();
  await page.locator('.intro-next').click(); // → music
  await expect(page.getByRole('heading', { name: 'Hear the music' })).toBeVisible();
  await page.locator('.intro-next').click(); // → streak
  await page.locator('.intro-next').click(); // "Let's begin"
  await expect(page.locator('.intro-overlay')).toHaveCount(0);
  await expect(page.locator('.memory h2')).toBeVisible();
});

test('the Today home runs a daily set and counts a streak', async ({ page }) => {
  // Wikipedia is blocked in tests, so "on this day" is empty; the five come
  // from the curated feed, which is enough to finish and bump the streak.
  await page.goto('/?born=1952&c=us');
  await page.getByRole('navigation').getByRole('button', { name: 'Today' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByRole('button', { name: "Start today's five" }).click();
  // Advance through the set until it is finished. Steps are memory cards and
  // may end with a "name that tune" round; handle either.
  for (let n = 0; n < 7; n++) {
    const done = await page.getByText('Come back tomorrow', { exact: false }).isVisible().catch(() => false);
    if (done) break;
    const tuneOpt = page.locator('.tune-options .btn.option').first();
    if (await tuneOpt.isVisible().catch(() => false)) {
      await tuneOpt.click();
      await page.locator('.minigame.tune .btn.primary').click();
    } else {
      await page.locator('.feed-stage').getByRole('button', { name: /Next memory|today's five/ }).locator('visible=true').click();
    }
  }
  await expect(page.getByText('Come back tomorrow', { exact: false })).toBeVisible();
  await expect(page.locator('.streak-card')).toContainText('1');
});

test('every game opens and responds', async ({ page }) => {
  await page.goto('/?born=1952&c=us');
  await expect(page.locator('.memory h2')).toBeVisible();
  const open = async (name: string) => {
    await page.getByRole('navigation').getByRole('button', { name: 'Games' }).click();
    await page.locator('.game-tile', { hasText: name }).click();
  };

  await open('Memory quiz');
  await page.locator('.answers button').first().click();
  await expect(page.locator('.notice')).toBeVisible();

  await open('Crossword');
  await page.locator('.cw-cell input').first().click();
  await page.keyboard.type('A');
  await expect(page.locator('.cw-cell input').first()).toHaveValue('A');

  await open('Word search');
  await expect(page.locator('.ws-cell')).toHaveCount(100);

  await open('Sudoku');
  const empty = page.locator('.sudoku-grid .cell:not(.given)').first();
  await empty.click();
  await page.locator('.numpad .num', { hasText: /^5$/ }).click();
  await expect(empty).toHaveText('5');

  await open('Pattern puzzle');
  await page.locator('.quiz-options button').first().click();
  await expect(page.locator('.minigame .notice')).toBeVisible();

  await open('Quick math');
  await expect(page.locator('.math-prompt')).toBeVisible();
  await page.locator('.quiz-options.math button').first().click();
  await expect(page.locator('.minigame .notice')).toBeVisible();

  await open('Chess');
  await page.locator('button[aria-label^="e2"]').click();
  await page.locator('button[aria-label="e4"]').click();
  await expect(page.locator('button[aria-label^="e4"] .pc.white')).toBeVisible();
  await expect(page.locator('.status-line')).toHaveText(/Your move/, { timeout: 10_000 });
  await expect(page.locator('.board.chess .pc.black')).toHaveCount(16);

  await open('Checkers');
  await page.locator('.board.checkers .sq.movable').first().click();
  await page.locator('.board.checkers .sq.target').first().click();
  await expect(page.locator('.status-line')).toHaveText(/Your move/, { timeout: 10_000 });
});

test('settings change text size and language', async ({ page }) => {
  await page.goto('/?born=1952&c=ca');
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Largest' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-size', '2');
  await page.getByRole('button', { name: 'Français' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Souvenirs' })).toBeVisible();
});

test('switching country replaces the feed and never shows the old country', async ({ page }) => {
  // Start as USSR and load a couple of years into the feed's cache.
  await page.goto('/?born=1955&c=su&lang=en');
  await expect(page.locator('.memory h2')).toBeVisible();
  await page.locator('.jump select').selectOption('1970');
  await expect(page.locator('.year-now')).toHaveText('1970');
  const soviet = await page.locator('.memory').textContent();

  // Switch to Canada in Settings, then return to the feed.
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).click();
  await page.locator('.field-row select').selectOption('ca');
  await page.getByRole('navigation').getByRole('button', { name: 'Memories' }).click();
  await expect(page.locator('.memory h2')).toBeVisible();

  // Every year — including 1970, which was cached under USSR — must now be
  // Canadian. Walk a few years and assert no Cyrillic leaks into the feed.
  for (const y of ['1970', '1965', '1972'] as const) {
    await page.locator('.jump select').selectOption(y);
    await expect(page.locator('.year-now')).toHaveText(y);
    await expect(page.locator('.memory h2')).toBeVisible();
    const text = (await page.locator('.memory').textContent()) ?? '';
    expect(/[Ѐ-ӿ]/.test(text), `Cyrillic leaked into Canadian feed at ${y}`).toBe(false);
  }
  expect(soviet).toBeTruthy(); // sanity: we did see USSR content first
});

test('Reflections live in their own tab, not the memory feed', async ({ page }) => {
  await page.goto('/?born=1952&c=ca&lang=en');
  // The feed should no longer contain Reflection-type cards.
  await page.getByRole('navigation').getByRole('button', { name: 'Memories' }).click();
  await expect(page.locator('.memory h2')).toBeVisible();
  // The Reflections tab exists and shows a wisdom card with navigation.
  await page.getByRole('navigation').getByRole('button', { name: 'Reflections' }).click();
  await expect(page.locator('.reflections .memory h2')).toBeVisible();
  const first = await page.locator('.reflections .memory h2').textContent();
  await page.locator('.reflections .actions .btn.primary').click();
  await expect(page.locator('.reflections .memory h2')).not.toHaveText(first!);
});

test('onboarding lets you pick interests', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.locator('.year-input').fill('1950');
  await page.getByRole('button', { name: 'United States' }).click();
  // The interest grid is present; pick a couple.
  await expect(page.locator('.interest-grid')).toBeVisible();
  await page.locator('.interest', { hasText: 'Music' }).click();
  await page.locator('.interest', { hasText: 'Space' }).click();
  await page.getByRole('button', { name: 'Show my memories' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('the News tab loads and ranks the day\'s stories', async ({ page }) => {
  // Serve a small fixed news feed so the test is deterministic and offline.
  await page.route('**/content/news/*.json', r =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        built: new Date().toISOString(),
        stories: [
          { id: 's1', title: 'A big world story', summary: 'Something important happened.', source: 'BBC News', url: 'https://example.com/1', topic: 'world', published: new Date().toISOString(), importance: 9 },
          { id: 's2', title: 'A music story', summary: 'A beloved singer returns.', source: 'The Guardian', url: 'https://example.com/2', topic: 'music', published: new Date().toISOString(), importance: 3 },
        ],
      }),
    }),
  );
  await page.goto('/?born=1952&c=ca&likes=music&lang=en');
  await page.getByRole('navigation').getByRole('button', { name: 'News' }).click();
  await expect(page.getByRole('heading', { name: 'News', exact: true })).toBeVisible();
  await expect(page.locator('.news-card')).toHaveCount(2);
  // Music interest should float the music story to the top.
  await expect(page.locator('.news-card h2').first()).toHaveText('A music story');
  await expect(page.locator('.news-card a', { hasText: 'Read full story' }).first()).toHaveAttribute('href', 'https://example.com/2');
});

test('a crash shows the recovery screen, not a blank page', async ({ page }) => {
  (page as unknown as { errors: string[] }).errors = []; // this test crashes on purpose
  page.removeAllListeners('pageerror');
  await page.goto('/?crashtest=1');
  await expect(page.getByRole('alert')).toContainText('Something went wrong');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('on a phone, the bottom bar replaces the top tabs and More opens Help', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?born=1955&c=ca&lang=en');
  const bar = page.locator('.bottom-nav, nav').filter({ has: page.getByRole('button', { name: 'More' }) });
  await expect(bar.getByRole('button', { name: 'Games' })).toBeVisible();
  await bar.getByRole('button', { name: 'More' }).click();
  const sheet = page.getByRole('dialog', { name: 'More' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('heading', { name: 'Help' })).toBeVisible();
  await expect(sheet).toBeHidden();
});

test('on a wide screen the memory buttons sit beside the card; narrower, under it', async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.seenTutorial', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
  });
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Memories' }).click();
  await expect(page.locator('.memory h2')).toBeVisible();
  await page.waitForTimeout(1300); // let the disc finish sliding in
  const card = (await page.locator('.memory').boundingBox())!;
  const next = (await page.getByRole('button', { name: /Next memory/ }).boundingBox())!;
  const save = (await page.getByRole('button', { name: /^Save$/ }).boundingBox())!;
  // The Next disc sits half out of the card's right edge.
  expect(Math.abs(next.x - (card.x + card.width))).toBeLessThan(30);
  expect(next.x + next.width).toBeGreaterThan(card.x + card.width + 60);
  expect(save.x + save.width).toBeLessThan(card.x);
  expect(next.y + next.height).toBeLessThan(950); // visible without scrolling
  const first = await page.locator('.memory h2').textContent();
  await page.getByRole('button', { name: /Next memory/ }).click();
  await expect(page.locator('.memory h2')).not.toHaveText(first!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1000, height: 900 });
  const card2 = (await page.locator('.memory').boundingBox())!;
  const next2 = (await page.getByRole('button', { name: /Next memory/ }).boundingBox())!;
  expect(next2.y).toBeGreaterThan(card2.y + 100); // back inside the card, at the bottom
  expect(next2.x + next2.width).toBeLessThanOrEqual(card2.x + card2.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the welcome screen shows a game, a health study and a headline, and Play opens the game', async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.route(/\/content\/research\//, r => r.fulfill({ json: { stories: [{ id: 'n1', title: 'Walking keeps the brain young', summary: 'A study of walking later in life, long enough to show.', image: '', source: 'ScienceDaily', url: 'https://example.org/1', topic: 'memory', published: new Date().toISOString() }] } }));
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.seenTutorial', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
  });
  await page.goto('/');
  const also = page.getByRole('region', { name: 'Also on Hoot' });
  await expect(also.getByText('A game for you')).toBeVisible();
  await expect(also.getByText('Walking keeps the brain young')).toBeVisible();
  await expect(also.getByText("Today's headline")).toBeVisible();
  await expect(also.getByText('A thought for today')).toBeVisible();
  const name = (await also.locator('.discover-tile h3').first().textContent())!.trim();
  await also.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByRole('button', { name: 'All games' }).first()).toBeVisible(); // inside the game
  expect(name.length).toBeGreaterThan(2);
  await page.getByRole('button', { name: 'All games' }).first().click();
  await expect(page.locator('.game-list')).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Today' }).first().click();
  await also.getByRole('button', { name: 'More on Health' }).click();
  await expect(page.getByRole('heading', { name: 'Health', level: 1 })).toBeVisible();
});

test('after a week of use, Hoot gently asks for support once, on the welcome screen', async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.clock.install();
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.seenTutorial', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
    if (!localStorage.getItem('hoot.usage'))
      localStorage.setItem('hoot.usage', JSON.stringify({ days: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'], minutes: 40 }));
  });
  await page.goto('/');
  const sheet = page.getByRole('dialog', { name: 'Support Hoot' });
  await page.clock.runFor(10_000);
  await expect(sheet).toBeHidden(); // not straight away
  await page.clock.runFor(6_000);
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("You've visited Hoot on 8 days");
  await sheet.getByRole('button', { name: 'Not now' }).click();
  await expect(sheet).toBeHidden();
  // Not again on the next visit the same day.
  await page.reload();
  await page.clock.runFor(30_000);
  await expect(sheet).toBeHidden();
});

test('a newcomer is never asked for support', async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.clock.install();
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.seenTutorial', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
  });
  await page.goto('/');
  await page.clock.runFor(60_000);
  await expect(page.getByRole('dialog', { name: 'Support Hoot' })).toBeHidden();
});
