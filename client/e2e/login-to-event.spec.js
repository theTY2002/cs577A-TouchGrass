/**
 * E2E: Login → Feed → Click "View details" on first event.
 * Requires: Vite dev server on :5174 (no backend).
 * Run: npm run test:e2e
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174';

test('travel from login to event details', async ({ page }) => {
  // 1. Root URL sends anonymous users to login (no sign-up flow yet)
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(`${BASE_URL}/login`);

  // 2. Fill login form (placeholder auth accepts any email/password)
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/password/i).fill('password123');

  // 3. Submit login
  await page.getByRole('button', { name: /log in/i }).click();

  // 4. Should land on Feed
  await expect(page).toHaveURL(`${BASE_URL}/feed`);
  await expect(page.getByRole('main')).toBeVisible();

  // 5. Wait for event cards to load, then click first "View details"
  const viewDetailsBtn = page.getByRole('button', { name: /view details/i }).first();
  await viewDetailsBtn.waitFor({ state: 'visible' });
  await viewDetailsBtn.click();

  // 6. Should be on event details page
  await expect(page).toHaveURL(/\/event\/[^/]+/);
  await expect(page.getByRole('button', { name: /back to feed/i })).toBeVisible();
});
