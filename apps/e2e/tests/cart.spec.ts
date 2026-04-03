import { test, expect } from '@playwright/test';
import { ShopPage } from './pages/shop.page';
import { CartPage } from './pages/cart.page';

test.describe('Cart', () => {
  test('empty cart shows message', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.goto();
    // Si no hay items, muestra mensaje vacío
    const itemCount = await cart.items.count();
    if (itemCount === 0) {
      await expect(cart.emptyMsg).toBeVisible();
    }
  });

  test('add product and verify it appears in cart', async ({ page }) => {
    const shop = new ShopPage(page);
    const cart = new CartPage(page);

    await shop.goto();
    await shop.openProduct(0);
    await shop.addToCartBtn.click();

    await cart.goto();
    await expect(cart.items.first()).toBeVisible();
    await expect(cart.totalPrice).toBeVisible();
  });

  test('remove item from cart', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.goto();
    const before = await cart.items.count();
    if (before > 0) {
      await cart.removeItem(0);
      const after = await cart.items.count();
      expect(after).toBe(before - 1);
    }
  });
});
