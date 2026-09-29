/**
 * TC-BEMORE — Dashboard, skill path and deep-dive assessment access.
 *
 * The old gated Be:More flow (/onboarding → … → /commit) was replaced by /aura
 * (see 02-aura-flow.spec.ts); these tests cover what remains of it.
 */
import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, signIn } from './helpers/auth';

// ─── Positive ────────────────────────────────────────────────────────────────

test.describe('BEMORE-P: Positive', () => {



  test('BEMORE-P-04 — /assessment/wheel-of-life loads', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/wheel-of-life');
    await page.waitForTimeout(3_000);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('BEMORE-P-05 — /assessment/blob-tree loads', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/blob-tree');
    await page.waitForTimeout(3_000);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('BEMORE-P-06 — /assessment/value-map loads', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/value-map');
    await page.waitForTimeout(3_000);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('BEMORE-P-07 — /welcome dashboard renders for authenticated user', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/welcome');
    await expect(page.locator('text=/Welcome back|Welcome/i').first()).toBeVisible({ timeout: 15_000 });
  });






});

// ─── Negative ────────────────────────────────────────────────────────────────

test.describe('BEMORE-N: Negative', () => {
  test('BEMORE-N-01 — Unauthenticated user cannot access /welcome', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForURL('/auth', { timeout: 10_000 });
    expect(page.url()).toContain('/auth');
  });

  test('BEMORE-N-02 — Unauthenticated user cannot access /path', async ({ page }) => {
    await page.goto('/path');
    await page.waitForURL('/auth', { timeout: 10_000 });
    expect(page.url()).toContain('/auth');
  });






  test('BEMORE-N-08 — Direct URL to 404 route shows Not Found page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-at-all');
    await page.waitForTimeout(2_000);
    await expect(
      page.locator('text=/404|not found|page.*not.*exist/i').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
