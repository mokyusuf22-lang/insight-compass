import { Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Test-account credentials live in a git-ignored local file (the repo is public).
// Format: { "alex": { "name", "email", "password" }, ..., "drew": {...} }  — drew is the test coach.
const ACCOUNTS_FILE = join(process.cwd(), 'tests', '.test-accounts.local.json');

interface TestAccount { name: string; email: string; password: string }
type Slug = 'alex' | 'jordan' | 'riley' | 'sam' | 'morgan' | 'casey' | 'drew';

function loadAccounts(): Record<Slug, TestAccount> {
  if (!existsSync(ACCOUNTS_FILE)) {
    throw new Error(`Missing ${ACCOUNTS_FILE}. Ask the project owner for the test-account file; it is never committed.`);
  }
  return JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'));
}

export const TEST_ACCOUNTS = loadAccounts();

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.waitForSelector('[data-testid="auth-form"], input[type="email"]');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Users land on /aura or /welcome; coaches and admins on /coach.
  await page.waitForURL(/\/(welcome|aura|coach)/, { timeout: 15_000 });
}

export async function signOut(page: Page) {
  // Open account dropdown and click log out
  const dropdownTrigger = page.locator('header button').filter({ hasText: '@' }).or(
    page.locator('header [role="button"]').last()
  );
  await dropdownTrigger.click();
  await page.click('text=Log out');
  await page.waitForURL('/');
}

export async function expectRedirectToAuth(page: Page, url: string) {
  await page.goto(url);
  await page.waitForURL('/auth', { timeout: 10_000 });
}
