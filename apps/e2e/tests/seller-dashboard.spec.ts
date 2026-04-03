import { test, expect } from '@playwright/test';
import { SellerDashboardPage } from './pages/seller-dashboard.page';

// Estos tests corren con storageState del seller
test.use({ storageState: '.auth/seller.json' });

test.describe('Seller Dashboard', () => {
  test('dashboard loads for authenticated seller', async ({ page }) => {
    const dashboard = new SellerDashboardPage(page);
    await dashboard.goto();
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(dashboard.revenueCard).toBeVisible({ timeout: 10_000 });
  });

  test('orders table is visible', async ({ page }) => {
    const dashboard = new SellerDashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.ordersTable).toBeVisible();
  });

  test('can navigate to add product', async ({ page }) => {
    const dashboard = new SellerDashboardPage(page);
    await dashboard.goto();
    await dashboard.addProductBtn.click();
    await expect(page).toHaveURL(/products\/new|products\/create/i);
  });
});
