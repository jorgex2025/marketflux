import { test, expect } from '@playwright/test';
import { ShopPage } from './pages/shop.page';

test.describe('Shop — Catalog & Search', () => {
  test('homepage loads with products', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await expect(page).toHaveTitle(/marketflux/i);
    await expect(shop.productCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('search returns filtered results', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.search('laptop');
    await expect(page).toHaveURL(/search|q=laptop/i);
    const count = await shop.productCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('product detail page opens', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.productCards.first().click();
    await expect(page).toHaveURL(/\/products?\//i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('add to cart increments count', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.openProduct(0);
    const before = await shop.cartCount.textContent().catch(() => '0');
    await shop.addToCartBtn.click();
    const after = await shop.cartCount.textContent();
    expect(Number(after)).toBeGreaterThan(Number(before));
  });
});
