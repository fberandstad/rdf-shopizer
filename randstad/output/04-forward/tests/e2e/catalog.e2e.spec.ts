import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Golden master TEST-0001..0004 against the modern React storefront (FS-0001).
test.describe('Catalog (new app)', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('TEST-0001 catalog landing renders seeded products', async ({ page }) => {
    await expect(page.getByText('Wireless Headphones')).toBeVisible();
    await expect(page.getByText('The Pragmatic Programmer')).toBeVisible();
    // Price is formatted server value, shown localized.
    await expect(page.getByText(/€\s?79\.99/)).toBeVisible();
  });

  test('TEST-0002 browse by category filters products', async ({ page }) => {
    await page.getByRole('button', { name: /^Books/ }).click();
    await expect(page.getByText('The Pragmatic Programmer')).toBeVisible();
    await expect(page.getByText('Wireless Headphones')).toHaveCount(0);
  });

  test('TEST-0003 product details show name, price, attributes, add-to-cart', async ({ page }) => {
    await page.getByRole('button', { name: /Wireless Headphones/ }).click();
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
    await expect(page.getByText('SKU: EL-001')).toBeVisible();
    await expect(page.getByText(/€\s?79\.99/)).toBeVisible();
  });

  test('TEST-0004 search returns matching products', async ({ page }) => {
    await page.getByPlaceholder('Search products...').fill('Charger');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('USB-C Charger 65W')).toBeVisible();
    await expect(page.getByText('Wireless Headphones')).toHaveCount(0);
  });
});
