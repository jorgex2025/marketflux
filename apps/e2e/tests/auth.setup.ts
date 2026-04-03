import { test as setup, expect } from '@playwright/test';
import path from 'path';

const buyerFile = path.join(__dirname, '../.auth/buyer.json');
const sellerFile = path.join(__dirname, '../.auth/seller.json');

// ── Setup: Buyer ─────────────────────────────────────────────────
setup('authenticate as buyer', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(process.env.TEST_BUYER_EMAIL ?? 'buyer@test.com');
  await page.getByLabel('Password').fill(process.env.TEST_BUYER_PASSWORD ?? 'Test1234!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\//);
  await page.context().storageState({ path: buyerFile });
});

// ── Setup: Seller ────────────────────────────────────────────────
setup('authenticate as seller', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(process.env.TEST_SELLER_EMAIL ?? 'seller@test.com');
  await page.getByLabel('Password').fill(process.env.TEST_SELLER_PASSWORD ?? 'Test1234!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\//);
  await page.context().storageState({ path: sellerFile });
});
