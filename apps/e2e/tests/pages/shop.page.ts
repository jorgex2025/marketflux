import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model — Shop (catalog, search, product detail)
 */
export class ShopPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly productCards: Locator;
  readonly addToCartBtn: Locator;
  readonly cartIcon: Locator;
  readonly cartCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('searchbox');
    this.productCards = page.locator('[data-testid="product-card"]');
    this.addToCartBtn = page.getByRole('button', { name: /add to cart/i });
    this.cartIcon = page.getByRole('link', { name: /cart/i });
    this.cartCount = page.locator('[data-testid="cart-count"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  async openProduct(index = 0) {
    await this.productCards.nth(index).click();
  }
}
