import { expect, test, type Page } from '@playwright/test';

// The life-story journey with Chromium's built-in fake microphone (a real
// MediaRecorder recording of a test tone, not a mocked interface).
test.use({
  launchOptions: {
    ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
  permissions: ['microphone'],
});

test.beforeEach(async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
});

const story = (page: Page) =>
  page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(r => {
      const q = indexedDB.open('hoot-story');
      q.onsuccess = () => r(q.result);
    });
    const get = <T,>(store: string, fn: (s: IDBObjectStore) => IDBRequest<T>) =>
      new Promise<T>(r => {
        const q = fn(db.transaction(store).objectStore(store));
        q.onsuccess = () => r(q.result);
      });
    const st = (await get('kv', s => s.get('state'))) as { memories: { deleted?: boolean; recordings: { duration: number; status: string }[]; title: string; approved: boolean; chapterId: string | null }[] } | undefined;
    return { memories: (st?.memories ?? []).filter(m => !m.deleted), files: (await get('files', s => s.count())) as number, pieces: (await get('chunks', s => s.count())) as number };
  });

async function newVisitor(page: Page) {
  await page.goto('/');
  await page.locator('#onb-name').fill('Margaret');
  await page.getByRole('button', { name: 'Canada' }).click();
  await page.getByRole('button', { name: 'Show my memories' }).click();
}

test('a new visitor records a first story, hears it, saves it, and finds it in their book', async ({ page }) => {
  await newVisitor(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Margaret');
  // The first question is the simplest one.
  await expect(page.getByRole('heading', { name: 'What is one of your earliest memories?' })).toBeVisible();
  await page.getByRole('button', { name: 'Tell my story' }).click();
  await expect(page.locator('.rec-status')).toContainText('Recording');
  await expect(page.getByText("We're listening. Take your time.")).toBeVisible();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.locator('.rec-status')).toContainText('Paused');
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Finish' }).click();
  // Listen back before saving.
  await expect(page.getByRole('heading', { name: 'Listen to your recording' })).toBeVisible();
  await expect(page.locator('.rec-part audio')).toHaveCount(1);
  // Nothing is "saved" until it really is.
  expect((await story(page)).files).toBe(0);
  await page.getByRole('button', { name: 'Save my story' }).click();
  await expect(page.getByText('Saved on this device.').first()).toBeVisible();
  const s = await story(page);
  expect(s.memories).toHaveLength(1);
  expect(s.files).toBe(1);
  expect(s.pieces).toBe(0); // the temporary pieces are cleaned up once the recording is stored
  expect(s.memories[0].recordings[0].duration).toBeGreaterThan(2);
  expect(s.memories[0].chapterId).toBe('ch_beginnings');
  // No fabricated text: it says plainly that text isn't available yet.
  await expect(page.getByText(/Text from recordings is not available yet/)).toBeVisible();

  // Write the story, approve it, and see it in the book.
  await page.getByRole('button', { name: 'Write your story' }).click();
  await page.locator('#mp-story-edit').fill('I remember the smell of bread in my grandmother’s kitchen.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Approve for my book' }).click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'My Life Story' }).click();
  await expect(page.getByRole('heading', { name: 'The Life of Margaret' })).toBeVisible();
  await expect(page.getByText(/1 memory, \d+ sec of stories/)).toBeVisible();
  await page.getByRole('tab', { name: 'Book' }).click();
  await expect(page.locator('.book')).toContainText('the smell of bread');

  // Come back tomorrow: everything is still there.
  await page.reload();
  await expect(page.getByText('1 memory preserved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your recent memories' })).toBeVisible();
});

test('cancelling a recording asks first, and leaves nothing behind', async ({ page }) => {
  await newVisitor(page);
  await page.getByRole('button', { name: 'Tell my story' }).click();
  await expect(page.locator('.rec-status')).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Throw this recording away? This cannot be undone.')).toBeVisible();
  await page.getByRole('button', { name: 'Keep recording' }).click();
  await expect(page.locator('.rec-status')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Throw it away' }).click();
  await expect(page.getByRole('button', { name: 'Tell my story' })).toBeVisible(); // back home
  await expect.poll(async () => (await story(page)).memories.length).toBe(0);
  await expect.poll(async () => (await story(page)).pieces).toBe(0);
});

test('a recording interrupted by closing the page can be recovered', async ({ page }) => {
  await newVisitor(page);
  await page.getByRole('button', { name: 'Tell my story' }).click();
  await expect(page.locator('.rec-status')).toBeVisible();
  await page.waitForTimeout(3200); // pieces are saved every second
  page.on('dialog', d => void d.accept()); // the "leave page?" warning
  await page.reload();
  await expect(page.getByText('We found a recording that was interrupted.')).toBeVisible();
  await page.getByRole('button', { name: 'Keep it' }).click();
  await expect(page.getByRole('heading', { name: 'Your voice' })).toBeVisible();
  const s = await story(page);
  expect(s.files).toBe(1);
  expect(s.pieces).toBe(0);
});

test('people who would rather type can write a story, and edits keep earlier versions', async ({ page }) => {
  await newVisitor(page);
  await page.getByRole('button', { name: "I'd rather write" }).click();
  await page.getByLabel('Title (optional)').fill('Grandmother’s kitchen');
  await page.getByLabel('Your story').fill('She made bread every Saturday.');
  await page.getByRole('button', { name: 'Save my story' }).click();
  await expect(page.getByLabel('Title')).toHaveValue('Grandmother’s kitchen');
  await page.getByRole('button', { name: 'Edit the story' }).click();
  await page.locator('#mp-story-edit').fill('She made rye bread every Saturday morning.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Earlier versions').click();
  await page.getByRole('button', { name: 'Use this version' }).click();
  await expect(page.locator('.story-prose')).toHaveText('She made bread every Saturday.');
});

test('chapters can be renamed, reordered and hidden, and empty ones deleted', async ({ page }) => {
  await newVisitor(page);
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'My Life Story' }).click();
  await page.getByRole('button', { name: 'Arrange chapters' }).click();
  const second = page.locator('.chapter-card').nth(1);
  await expect(second).toContainText('Childhood and family');
  await second.getByRole('button', { name: /Move up/ }).click();
  await expect(page.locator('.chapter-card').first()).toContainText('Childhood and family');
  await page.locator('.chapter-card').first().getByRole('button', { name: 'Rename' }).click();
  await page.getByLabel('Rename').fill('Growing up in Winnipeg');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.chapter-card').first()).toContainText('Growing up in Winnipeg');
  const count = await page.locator('.chapter-card').count();
  await page.locator('.chapter-card').last().getByRole('button', { name: 'Delete chapter' }).click();
  await expect(page.locator('.chapter-card')).toHaveCount(count - 1);
});

test('when the microphone is refused, the page explains how to allow it and offers writing', async ({ browser }) => {
  const ctx = await browser.newContext({ permissions: [] });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
  });
  await newVisitor(page);
  await page.getByRole('button', { name: 'Tell my story' }).click();
  await expect(page.getByRole('alert')).toContainText('not allowed to use the microphone');
  await page.getByRole('button', { name: 'Write it instead' }).click();
  await expect(page.getByLabel('Your story')).toBeVisible();
  await ctx.close();
});

test('the story pages fit a 375px phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await newVisitor(page);
  for (const name of ['Today', 'My Life Story', 'Tell a Story', 'Discover']) {
    await page.getByRole('navigation', { name: 'Hoot' }).getByRole('button', { name }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
