/**
 * TC-AUTH — Authentication
 *
 * Covers sign-in, sign-up, and protected-route enforcement.
 */
import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, signIn, expectRedirectToAuth } from './helpers/auth';

// ─── Positive ────────────────────────────────────────────────────────────────

test.describe('AUTH-P: Positive', () => {
  test('AUTH-P-01 — Home page loads without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Be:More|insight/i);
    // Should not redirect to /auth
    expect(page.url()).not.toContain('/auth');
  });

  test('AUTH-P-02 — /auth page renders sign-in form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('AUTH-P-03 — Valid credentials redirect to app', async ({ page }) => {
    const { email, password } = TEST_ACCOUNTS.alex;
    await signIn(page, email, password);
    // Should land somewhere inside the app
    expect(page.url()).not.toContain('/auth');
  });

  test('AUTH-P-03b — "Continue as guest" signs in without an email and opens Aura', async ({ page }) => {
    // Needs "Allow anonymous sign-ins" enabled on the Supabase project.
    await page.goto('/auth');
    await page.click('#agree');
    await page.click('button:has-text("Continue as guest")');
    await page.waitForURL(/\/aura/, { timeout: 15_000 });
    expect(page.url()).toContain('/aura');
  });

  test('AUTH-P-03d — Guest start is blocked until the age and terms box is ticked', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button:has-text("Continue as guest")');
    await expect(page.locator('#agree-error')).toBeVisible();
    expect(page.url()).toContain('/auth');
  });


  test('AUTH-P-03c — Google sign-in is hidden while disabled', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('button:has-text("Continue with Google")')).toHaveCount(0);
  });

  test('AUTH-P-04 — "Get started" switches to the sign-up form', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button:has-text("Get started")');
    // In sign-up mode the toggle offers "Sign in" instead
    await expect(page.locator('button:has-text("Sign in")').last()).toBeVisible({ timeout: 5_000 });
  });

  test('AUTH-P-05 — /aura sends signed-out users to /auth', async ({ page }) => {
    await page.goto('/aura');
    // Aura saves progress to the user's account, so it requires sign-in first
    await page.waitForURL('/auth', { timeout: 10_000 });
  });
});

test.describe('AUTH-C: Cookie consent', () => {
  // Start with no saved cookie choice so the banner shows.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('AUTH-C-01 — Cookie banner offers Reject all as well as Accept all', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('button:has-text("Reject all")')).toBeVisible();
    await page.click('button:has-text("Reject all")');
    await expect(page.locator('button:has-text("Accept all")')).toHaveCount(0);
  });
});

// ─── Negative ────────────────────────────────────────────────────────────────

test.describe('AUTH-N: Negative', () => {
  test('AUTH-N-01 — Wrong password shows error message', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', TEST_ACCOUNTS.alex.email);
    await page.fill('input[type="password"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid|incorrect|wrong|credential/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('AUTH-N-02 — Non-existent email shows error', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'nobody@doesnotexist.invalid');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid|not found|no account/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('AUTH-N-03 — Malformed email rejected before submit', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    // Native browser validation OR custom error
    const invalid = await page.locator('input[type="email"]').evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    const errorVisible = await page.locator('text=/invalid|format|email/i').isVisible().catch(() => false);
    expect(invalid || errorVisible).toBe(true);
  });

  test('AUTH-N-04 — /welcome redirects unauthenticated user to /auth', async ({ page }) => {
    await expectRedirectToAuth(page, '/welcome');
  });

  test('AUTH-N-05 — /path redirects unauthenticated user to /auth', async ({ page }) => {
    await expectRedirectToAuth(page, '/path');
  });

  test('AUTH-N-06 — /my-coach redirects unauthenticated user to /auth', async ({ page }) => {
    await expectRedirectToAuth(page, '/my-coach');
  });

  test('AUTH-N-07 — Sign-up with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button:has-text("Get started")');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    // Fill confirm field with different value
    const confirmField = page.locator('input[placeholder*="onfirm"], input[name*="confirm"]').first();
    if (await confirmField.isVisible()) {
      await confirmField.fill('DifferentPassword!');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/match|password/i').first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('AUTH-N-08 — Sign-up with weak password shows error', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button:has-text("Get started")');
    await page.fill('input[type="email"]', 'weakpass@example.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/weak|short|password|characters/i').first()).toBeVisible({ timeout: 8_000 });
  });
});
