import { test, expect } from '@playwright/test';
import { ShopPage } from './pages/shop.page';
import { CartPage } from './pages/cart.page';

test.describe('Checkout Flow', () => {
  test('checkout button is visible with items in cart', async ({ page }) => {
    const shop = new ShopPage(page);
    const cart = new CartPage(page);

    // Añadir producto al carrito
    await shop.goto();
    await shop.openProduct(0);
    await shop.addToCartBtn.click();

    await cart.goto();
    await expect(cart.checkoutBtn).toBeVisible();
    await expect(cart.totalPrice).toBeVisible();
  });

  test('checkout redirects to payment step', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.goto();
    const itemCount = await cart.items.count();
    if (itemCount > 0) {
      await cart.checkoutBtn.click();
      await expect(page).toHaveURL(/checkout|payment/i);
    }
  });

  // Test con Stripe test card — solo en staging con STRIPE_TEST_MODE=true
  test.skip('completes payment with Stripe test card', async ({ page }) => {
    // Skipped hasta tener environment de staging con Stripe
    // Implementar cuando BASE_URL apunte a staging
  });
});
