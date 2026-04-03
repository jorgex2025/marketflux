import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model — Cart & Checkout
 */
export class CartPage {
  readonly page: Page;
  readonly items: Locator;
  readonly totalPrice: Locator;
  readonly checkoutBtn: Locator;
  readonly emptyMsg: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.locator('[data-testid="cart-item"]');
    this.totalPrice = page.locator('[data-testid="cart-total"]');
    this.checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i });
    this.emptyMsg = page.getByText(/your cart is empty/i);
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async removeItem(index = 0) {
    await this.items.nth(index).getByRole('button', { name: /remove/i }).click();
  }
}
