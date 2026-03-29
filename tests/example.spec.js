const { test, expect } = require('@playwright/test');

test('example test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.*/);
});