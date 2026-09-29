/**
 * TC-COACH — Coach login, auto-matching and two-way messaging.
 *
 * Uses the test coach (drew) and client (alex) from tests/.test-accounts.local.json.
 * The test coach is kept at max_clients = 0 so real users are never matched to him;
 * this suite opens his capacity for its own run (via the linked Supabase CLI) and
 * closes it again afterwards.
 */
import { execSync } from 'node:child_process';
import { test, expect, Browser, Page } from '@playwright/test';
import { TEST_ACCOUNTS, signIn } from './helpers/auth';
import { answerAboutYou, completeCheckIns, pickGoal, startFreshAura, welcomeToGoal } from './helpers/aura';

const COACH = TEST_ACCOUNTS.drew;
const CLIENT = TEST_ACCOUNTS.alex;

function setCoachCapacity(max: number) {
  const email = COACH.email.replace(/'/g, "''");
  execSync(
    `npx supabase db query --linked "update public.coach_profiles set max_clients = ${max} ` +
    `where user_id = (select id from auth.users where email = '${email}');"`,
    { stdio: 'ignore' },
  );
}

async function newPage(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage();
}

test.describe.serial('COACH: matching and messaging', () => {
  let client: Page;
  let coach: Page;
  const hello = `Hello coach ${Date.now()}`;
  const reply = `Welcome aboard ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    setCoachCapacity(5);
    client = await newPage(browser);
    coach = await newPage(browser);
  });

  // Always close the test coach to real clients again, even if a test failed.
  test.afterAll(() => setCoachCapacity(0));

  test('COACH-01 — Coach signs in and lands on the coach portal', async () => {
    await signIn(coach, COACH.email, COACH.password);
    await coach.waitForURL('/coach', { timeout: 15_000 });
    await expect(coach.locator('h1:has-text("Your clients")')).toBeVisible();
  });

  test('COACH-02 — Client choosing a human coach is matched automatically', async () => {
    await signIn(client, CLIENT.email, CLIENT.password);
    await startFreshAura(client);
    await welcomeToGoal(client, 'Alex');
    await pickGoal(client, 'Get promoted');
    await answerAboutYou(client, ['Confidence'], 'GB', 'Manchester');
    await client.click('button:has-text("That’s right, start check-ins")', { timeout: 30_000 });
    await completeCheckIns(client);
    await client.click('button:has-text("See my path options")', { timeout: 30_000 });
    await client.locator('button:has-text("Choose this path")').nth(2).click(); // Coach-guided
    await client.click('button:has-text("Continue")');
    await client.click('button:has-text("Today")');
    await client.click('button:has-text("With a human coach")');
    await client.click('button:has-text("I’m committing to this")', { timeout: 90_000 });
    await client.waitForURL('/welcome', { timeout: 20_000 });
    await expect(client.locator('text=Your Coach')).toBeVisible({ timeout: 10_000 });
  });

  test('COACH-03 — Coach sees the new client with goal and location', async () => {
    await coach.reload();
    const row = coach.locator('li', { hasText: 'Get promoted' }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText('Manchester');
  });

  test('COACH-04 — Messages flow both ways without reloading', async () => {
    await client.goto('/my-coach');
    await client.fill('#thread-draft', hello);
    await client.keyboard.press('Enter');

    await coach.locator('li', { hasText: 'Get promoted' }).first().getByRole('button', { name: /Message/ }).click();
    await expect(coach.locator(`text=${hello}`)).toBeVisible({ timeout: 15_000 });

    await coach.fill('#thread-draft', reply);
    await coach.keyboard.press('Enter');
    await expect(client.locator(`text=${reply}`)).toBeVisible({ timeout: 15_000 }); // realtime
  });

  test('COACH-05 — Non-coach visiting /coach is redirected', async () => {
    await client.goto('/coach');
    await client.waitForURL('/welcome', { timeout: 10_000 });
  });
});
