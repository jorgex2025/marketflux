import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model — Seller Dashboard
 */
export class SellerDashboardPage {
  readonly page: Page;
  readonly revenueCard: Locator;
  readonly ordersTable: Locator;
  readonly productsTable: Locator;
  readonly addProductBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.revenueCard = page.locator('[data-testid="revenue-card"]');
    this.ordersTable = page.locator('[data-testid="orders-table"]');
    this.productsTable = page.locator('[data-testid="products-table"]');
    this.addProductBtn = page.getByRole('button', { name: /add product/i });
  }

  async goto() {
    await this.page.goto('/vendor/dashboard');
  }
}
