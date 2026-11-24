import type { Page } from '@playwright/test';

// News, Health, Memories, Reflections, Saved and Progress live under Discover
// (and the phone's More menu) since the life story took the main menu.
const TILE: Record<string, string> = { News: 'News', Health: 'Health and wellbeing', Memories: 'Memories of your years', Reflections: 'Reflections', Saved: 'Saved', Progress: 'Progress' };

export async function openPage(page: Page, name: keyof typeof TILE) {
  const wide = (page.viewportSize()?.width ?? 1280) >= 760;
  if (wide) await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Discover' }).click();
  else await page.getByRole('navigation', { name: 'Hoot' }).getByRole('button', { name: /Explore|Discover/ }).click();
  await page.locator('.discover-hub-tile', { hasText: TILE[name] }).click();
}
