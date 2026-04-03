import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/auth.page';

test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // sin auth

  test('shows sign-in form', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await expect(page).toHaveTitle(/sign in|login/i);
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
    await expect(auth.submitBtn).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login('invalid@email.com', 'wrongpassword');
    await expect(auth.errorMsg).toBeVisible();
  });

  test('redirects to dashboard after login', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login(
      process.env.TEST_BUYER_EMAIL ?? 'buyer@test.com',
      process.env.TEST_BUYER_PASSWORD ?? 'Test1234!',
    );
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test('sign-up creates account and redirects', async ({ page }) => {
    const ts = Date.now();
    await page.goto('/sign-up');
    await page.getByLabel('Name').fill(`Test User ${ts}`);
    await page.getByLabel('Email').fill(`test+${ts}@marketflux.dev`);
    await page.getByLabel('Password').fill('Test1234!');
    await page.getByRole('button', { name: /sign up|create/i }).click();
    await expect(page).not.toHaveURL(/sign-up/);
  });
});
