/**
 * TC-ACCESS — Role-Based Access Control & Security
 *
 * Verifies that coach and admin routes are not accessible to regular users,
 * and that unauthenticated requests are always rejected.
 */
import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, signIn } from './helpers/auth';

// ─── Positive ────────────────────────────────────────────────────────────────

test.describe('ACCESS-P: Positive', () => {
  test('ACCESS-P-01 — /account page accessible for authenticated user', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/account');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    expect(page.url()).not.toContain('/auth');
  });


  test('ACCESS-P-03 — /become-a-coach form accessible for authenticated user', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/become-a-coach');
    await expect(page.locator('form, input').first()).toBeVisible({ timeout: 10_000 });
  });





  test('ACCESS-P-08 — Nav links present in header on authenticated pages', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/welcome');
    // Verify nav items: Results, Community, My coach
    await expect(page.locator('text=Results').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Community').first()).toBeVisible();
    await expect(page.locator('text=My coach').first()).toBeVisible();
    // Skill Path should NOT appear (removed in previous session)
    await expect(page.locator('header').getByText(/Skill Path/i)).toHaveCount(0);
  });
});

// ─── Negative ────────────────────────────────────────────────────────────────

test.describe('ACCESS-N: Negative', () => {
  test('ACCESS-N-01 — Regular user cannot access /coach dashboard', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/coach');
    await page.waitForTimeout(5_000);
    const url = page.url();
    // Should be redirected away or show access-denied
    const denied = await page.locator('text=/access|forbidden|not.*coach|permission/i').isVisible();
    expect(url.includes('/coach') && !denied ? false : true).toBe(true);
  });

  test('ACCESS-N-02 — Regular user cannot access /admin/dashboard', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(5_000);
    const url = page.url();
    const denied = await page.locator('text=/access|forbidden|not.*admin|permission/i').isVisible();
    expect(url.includes('/admin') && !denied ? false : true).toBe(true);
  });

  test('ACCESS-N-03 — Unauthenticated user cannot access /admin/coach-applications', async ({ page }) => {
    await page.goto('/admin/coach-applications');
    await page.waitForTimeout(4_000);
    expect(page.url()).toMatch(/\/auth/);
  });

  test('ACCESS-N-04 — Unauthenticated user cannot access /coach/user/some-id', async ({ page }) => {
    await page.goto('/coach/user/fake-user-id');
    await page.waitForTimeout(4_000);
    expect(page.url()).toMatch(/\/auth/);
  });

  test('ACCESS-N-05 — Unauthenticated user cannot access /my-coach', async ({ page }) => {
    await page.goto('/my-coach');
    await page.waitForTimeout(4_000);
    expect(page.url()).toMatch(/\/auth/);
  });

  test('ACCESS-N-06 — Unauthenticated user cannot access /account', async ({ page }) => {
    await page.goto('/account');
    await page.waitForTimeout(4_000);
    expect(page.url()).toMatch(/\/auth/);
  });

  test('ACCESS-N-07 — Completely unknown route returns 404 page', async ({ page }) => {
    await page.goto('/totally-unknown-route-xyz-12345');
    await page.waitForTimeout(2_000);
    await expect(
      page.locator('text=/404|not found|page.*not.*exist|oops/i').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('ACCESS-N-08 — /become-a-coach submit with empty fields is blocked', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.riley.email, TEST_ACCOUNTS.riley.password);
    await page.goto('/become-a-coach');
    await page.waitForTimeout(3_000);
    const submitBtn = page.locator('button[type="submit"], button:has-text("Apply"), button:has-text("Submit")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should not navigate away — validation should block it
      await page.waitForTimeout(1_000);
      expect(page.url()).toContain('/become-a-coach');
    }
  });
});
