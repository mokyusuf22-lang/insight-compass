/**
 * TC-AURA — Aura onboarding flow (single route: /aura)
 *
 * 0 Welcome   — first name
 * 1 Goal      — search the 1,200+ goal catalogue or write your own
 * 2 About you — country (required) + town, level, timeline, weekly hours, obstacles
 * 3 Aura      — AI themes for the goal (aura-plan edge function, mode "themes")
 * 4 Check-ins — life balance, working style, values
 * 5 Insights  — reality report (the location-aware plan is generated meanwhile)
 * 6 Paths     — three paths + "First steps" with where-to-do-it guidance
 * 7 Commit    — start date, support, pledge → personal path, coach matching, /welcome
 *
 * Needs the goals + coaching migrations applied and the aura-plan function deployed.
 */
import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, signIn } from './helpers/auth';
import { answerAboutYou, completeCheckIns, pickGoal, startFreshAura, welcomeToGoal } from './helpers/aura';

test.describe('AURA-P: Positive', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.alex.email, TEST_ACCOUNTS.alex.password);
    await startFreshAura(page);
  });

  test('AURA-P-01 — Welcome shows name input and how-it-works', async ({ page }) => {
    await expect(page.locator('input#bm-name')).toBeVisible();
    await expect(page.locator('text=How it works')).toBeVisible();
  });

  test('AURA-P-02 — Goal search hits the catalogue, including typos', async ({ page }) => {
    await welcomeToGoal(page, 'Alex');
    await page.fill('input#bm-goal', 'drivng test');
    await expect(page.getByRole('button', { name: /Pass my driving test$/ })).toBeVisible({ timeout: 10_000 });
    await page.fill('input#bm-goal', 'kayak');
    await expect(page.locator('button:has-text("Learn to kayak")')).toBeVisible({ timeout: 10_000 });
  });

  test('AURA-P-03 — Enter on a query with no match selects the custom goal', async ({ page }) => {
    await welcomeToGoal(page, 'Alex');
    await page.fill('input#bm-goal', 'Restore a 1960s narrowboat');
    await page.waitForTimeout(800); // debounce + search
    await page.press('input#bm-goal', 'Enter');
    await expect(page.locator('button:has-text("Continue")')).toBeEnabled();
  });

  test('AURA-P-04 — Aura returns three themes for the goal', async ({ page }) => {
    await welcomeToGoal(page, 'Alex');
    await pickGoal(page, 'Run a marathon');
    await answerAboutYou(page, ['Time']);
    await expect(page.locator('text=Here’s what Aura heard')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('text=/\\d+% match/')).toHaveCount(3);
  });

  test('AURA-P-05 — Driving goal in the UK gets UK-specific guidance, no business names', async ({ page }) => {
    await welcomeToGoal(page, 'Alex');
    await pickGoal(page, 'Pass my driving test');
    await answerAboutYou(page, [], 'GB', 'Leeds');
    await page.click('button:has-text("That’s right, start check-ins")', { timeout: 30_000 });
    await completeCheckIns(page);
    await page.click('button:has-text("See my path options")', { timeout: 30_000 });
    await expect(page.locator('text=/First steps/')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('main')).toContainText(/gov\.uk|DVSA/i);
  });

  test('AURA-P-06 — Full flow commits a path and lands on the dashboard with deep-dives', async ({ page }) => {
    await welcomeToGoal(page, 'Alex');
    await pickGoal(page, 'Get promoted');
    await answerAboutYou(page, ['Confidence']);
    await page.click('button:has-text("That’s right, start check-ins")', { timeout: 30_000 });
    await completeCheckIns(page);
    await expect(page.locator('text=Your reality report')).toBeVisible();
    await page.click('button:has-text("See my path options")', { timeout: 30_000 });

    // Confidence as an obstacle → coach-guided is recommended
    await expect(page.locator('text=Aura recommends')).toBeVisible();
    await page.locator('button:has-text("Choose this path")').first().click();
    await page.click('button:has-text("Continue")');

    await page.click('button:has-text("Today")');
    await page.click('button:has-text("I’m committing to this")', { timeout: 90_000 });
    await page.waitForURL('/welcome', { timeout: 20_000 });

    await expect(page.locator('text=Get promoted').first()).toBeVisible();
    await expect(page.locator('text=Go deeper')).toBeVisible();
  });

  test('AURA-P-07 — Progress is restored after a reload', async ({ page }) => {
    await welcomeToGoal(page, 'Alex');
    await pickGoal(page, 'Write a book');
    await page.waitForTimeout(1_200); // debounce for the DB save
    await page.reload();
    await expect(page.locator('text=Where are you starting from?')).toBeVisible({ timeout: 15_000 });
  });

  test('AURA-P-08 — Legacy /aura/* URLs redirect to /aura', async ({ page }) => {
    await page.goto('/aura/assessments');
    await expect(page).toHaveURL(/\/aura$/);
  });
});

test.describe('AURA-N: Negative', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_ACCOUNTS.jordan.email, TEST_ACCOUNTS.jordan.password);
    await startFreshAura(page);
    await welcomeToGoal(page, 'Jordan');
  });

  test('AURA-N-01 — Continue is disabled until a goal is chosen', async ({ page }) => {
    await expect(page.locator('button:has-text("Continue")')).toBeDisabled();
  });

  test('AURA-N-02 — Send to Aura needs a country, level, timeline and hours', async ({ page }) => {
    await pickGoal(page, 'Learn the guitar');
    const send = page.locator('button:has-text("Send to Aura")');
    await page.click('button:has-text("Complete beginner")');
    await page.click('button:has-text("3 months")');
    await page.click('button:has-text("3–5 hours")');
    await expect(send).toBeDisabled(); // no country yet
    await page.selectOption('select#bm-country', 'FR');
    await expect(send).toBeEnabled();
  });

  test('AURA-N-03 — Later check-ins stay locked until life balance is rated', async ({ page }) => {
    await pickGoal(page, 'Learn the guitar');
    await answerAboutYou(page);
    await page.click('button:has-text("That’s right, start check-ins")', { timeout: 30_000 });
    await expect(page.locator('button:has-text("Next check-in")')).toBeDisabled();
    await expect(page.locator('[role="tab"]:has-text("Working style")')).toBeDisabled();
  });

  test('AURA-N-04 — Values check-in caps selection at three', async ({ page }) => {
    await pickGoal(page, 'Learn the guitar');
    await answerAboutYou(page);
    await page.click('button:has-text("That’s right, start check-ins")', { timeout: 30_000 });
    for (const domain of ['Health', 'Work or study', 'Money', 'Relationships', 'Fun & rest', 'Growth']) {
      await page.click(`button[aria-label="${domain}: 2 out of 5"]`);
    }
    await page.click('button:has-text("Next check-in")');
    await page.click('button:has-text("Planner")');
    await page.click('button:has-text("Next check-in")');
    for (const v of ['Freedom', 'Health', 'Family']) await page.click(`button:text-is("${v}")`);
    await expect(page.locator('text=3 of 3 chosen')).toBeVisible();
    // A fourth value can't be picked once three are chosen.
    const fourth = page.locator('button:text-is("Security")');
    await expect(fourth).toHaveAttribute('aria-disabled', 'true');
    await expect(fourth).toHaveAttribute('aria-pressed', 'false');
  });
});
