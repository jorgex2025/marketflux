const { test, expect } = require('@playwright/test');

test.describe('Marketplace', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Marketplace/i);
  });

  test('should display search bar', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[type="text"], input[placeholder*="buscar"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible({ timeout: 10000 });
  });
});
