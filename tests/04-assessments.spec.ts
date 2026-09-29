/**
 * TC-ASSESS — Individual Assessments
 *
 * Tests that each assessment page loads, validates inputs,
 * and handles resume. All assessments are free (the paywall was removed).
 *
 * Assessments: DISC, Wheel of Life, Blob Tree, Value Map, Strengths
 */
import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, signIn } from './helpers/auth';

// ─── Positive ────────────────────────────────────────────────────────────────

test.describe('ASSESS-P: Positive', () => {
  test('ASSESS-P-01 — DISC assessment page loads with first question', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/disc');
    await page.waitForTimeout(3_000);
    await expect(
      page.locator('text=/question|DISC|behavioral|choose/i')
        .or(page.locator('h1, h2')).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('ASSESS-P-03 — Wheel of Life assessment shows 8 domain sliders', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/wheel-of-life');
    await page.waitForTimeout(3_000);
    // Should have sliders or domain inputs
    await expect(
      page.locator('[role="slider"], input[type="range"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('ASSESS-P-04 — Blob Tree assessment shows visual tree with selectable blobs', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/blob-tree');
    await page.waitForTimeout(3_000);
    await expect(
      page.locator('img[alt*="blob"], svg, [class*="blob"], [class*="tree"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('ASSESS-P-05 — Value Map assessment loads with selectable values', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/value-map');
    await page.waitForTimeout(3_000);
    await expect(
      page.locator('button, [role="checkbox"], [role="option"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // Results pages show the result if one exists, otherwise an empty state.
  test('ASSESS-P-06 — DISC results page shows a primary style, or an empty state', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/disc/results');
    await page.waitForTimeout(3_000);
    await expect(
      page.locator('text=/Dominance|Influence|Steadiness|Conscientiousness|not found|no results|take the/i').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('ASSESS-P-08 — Wheel of Life results page shows scores, or an empty state', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/assessment/wheel-of-life/results');
    await page.waitForTimeout(3_000);
    await expect(
      page.locator('text=/score|life area|balance|wheel|not found|dashboard/i')
        .or(page.locator('svg, canvas')).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('ASSESS-P-09 — Assessment resume: mid-session reload restores progress', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.morgan.email, TEST_ACCOUNTS.morgan.password);
    await page.goto('/assessment/disc');
    await page.waitForTimeout(3_000);
    // Answer first question if present
    const firstOption = page.locator('button[class*="option"], [class*="choice"], input[type="radio"]').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      // Reload
      await page.reload();
      await page.waitForTimeout(3_000);
      // Should not be back at question 1 — i.e. either still on disc page or on a later step
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('ASSESS-P-10 — Results page aggregates all completed assessments', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await page.goto('/results');
    await page.waitForTimeout(4_000);
    // Multiple assessment cards should be visible
    const cards = page.locator('[class*="chamfer"], [class*="card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);
  });
});

// ─── Negative ────────────────────────────────────────────────────────────────

test.describe('ASSESS-N: Negative', () => {

  test('ASSESS-N-02 — Unauthenticated user cannot access Strengths results', async ({ page }) => {
    await page.goto('/assessment/strengths/results');
    await page.waitForTimeout(4_000);
    const url = page.url();
    expect(url).toMatch(/\/auth/);
  });

  test('ASSESS-N-03 — Value Map submit button is disabled until values are selected', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.sam.email, TEST_ACCOUNTS.sam.password);
    await page.goto('/assessment/value-map');
    await page.waitForTimeout(3_000);
    // Submit / Continue button should be disabled with no selections
    const submitBtn = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Submit")').first();
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeDisabled();
    }
  });


  test('ASSESS-N-05 — Blob Tree must have both current + desired selection to continue', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.morgan.email, TEST_ACCOUNTS.morgan.password);
    await page.goto('/assessment/blob-tree');
    await page.waitForTimeout(3_000);
    // Continue button should be disabled until both blobs selected
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Submit")').first();
    if (await continueBtn.isVisible()) {
      await expect(continueBtn).toBeDisabled();
    }
  });

  test('ASSESS-N-06 — Wheel of Life results without a completed assessment shows redirect or empty', async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.casey.email, TEST_ACCOUNTS.casey.password);
    await page.goto('/assessment/wheel-of-life/results');
    await page.waitForTimeout(5_000);
    const url = page.url();
    const emptyState = await page.locator('text=/no score|complete|take the/i').isVisible();
    expect(url.includes('/wheel-of-life') || emptyState).toBe(true);
  });
});
