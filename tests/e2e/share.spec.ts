import { test, expect } from '@playwright/test';

test('Share opens WhatsApp, email and text-message options with the note and link filled in', async ({ page }) => {
  await page.route(/wikipedia\.org|wikidata\.org|ytimg\.com|youtube/, r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('hoot.seenIntro', 'true');
    localStorage.setItem('hoot.seenTutorial', 'true');
    localStorage.setItem('hoot.profile', JSON.stringify({ born: 1955, country: 'ca', likes: [], hideHeavy: false }));
  });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Memories' }).first().click();
  await page.getByRole('button', { name: 'Share this memory' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Share this memory' });
  await expect(sheet).toBeVisible();
  const wa = await sheet.getByRole('link', { name: 'WhatsApp' }).getAttribute('href');
  expect(wa).toMatch(/^https:\/\/wa\.me\/\?text=/);
  expect(decodeURIComponent(wa!)).toContain("Thought you'd enjoy this memory on Hoot:");
  expect(decodeURIComponent(wa!)).toContain('card=');
  const mail = await sheet.getByRole('link', { name: 'Email' }).getAttribute('href');
  expect(mail).toMatch(/^mailto:\?subject=A%20memory%20for%20you%20from%20Hoot&body=/);
  expect(await sheet.getByRole('link', { name: 'Text message' }).getAttribute('href')).toMatch(/^sms:[?&]body=/);
  await expect(sheet.getByRole('button', { name: 'Copy link' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  expect(errors).toEqual([]);
});
