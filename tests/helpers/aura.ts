import { Page, expect } from '@playwright/test';

/** Open a fresh Aura session (discards any in-progress one) and land on the welcome screen. */
export async function startFreshAura(page: Page) {
  await page.goto('/aura?new=1');
  await page.waitForSelector('input#bm-name', { timeout: 20_000 });
}

export async function welcomeToGoal(page: Page, name: string) {
  await page.fill('input#bm-name', name);
  await page.click('button:has-text("Let’s start")');
  await expect(page.locator('input#bm-goal')).toBeVisible();
}

/** Searches the catalogue for the goal, picks it and continues to About you. */
export async function pickGoal(page: Page, label: string) {
  await page.fill('input#bm-goal', label);
  // Cards read "<category><label>", so match on the label at the end (avoids "…first time" variants).
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.getByRole('button', { name: new RegExp(`${escaped}$`) })
    .filter({ hasNotText: 'Use my own words' }).first()
    .click({ timeout: 15_000 });
  await page.click('button:has-text("Continue")');
  await expect(page.locator('text=Where are you starting from?')).toBeVisible();
}

export async function answerAboutYou(page: Page, obstacles: string[] = [], countryCode = 'GB', city = 'Leeds') {
  await page.selectOption('select#bm-country', countryCode);
  if (city) await page.fill('input#bm-city', city);
  await page.click('button:has-text("Complete beginner")');
  await page.click('button:has-text("3 months")');
  await page.click('button:has-text("3–5 hours")');
  for (const o of obstacles) await page.click(`button[aria-pressed]:text-is("${o}")`);
  await page.click('button:has-text("Send to Aura")');
}

export async function completeCheckIns(page: Page) {
  for (const domain of ['Health', 'Work or study', 'Money', 'Relationships', 'Fun & rest', 'Growth']) {
    await page.click(`button[aria-label="${domain}: 3 out of 5"]`);
  }
  await page.click('button:has-text("Next check-in")');
  await page.click('button:has-text("Steady")');
  await page.click('button:has-text("Next check-in")');
  await page.click('button:text-is("Growth")');
  await page.click('button:has-text("See my insights")');
}
