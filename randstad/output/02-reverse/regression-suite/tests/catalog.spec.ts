import { test, expect } from '@playwright/test';

// TEST-0001..0004 — Catalog browse golden master. Links: US-0001, FS-0001, RULE-0007.
const SHOP = process.env.BASE_URL_SHOP;

test.describe('Catalog (golden master)', () => {
  test.skip(!SHOP, 'Set BASE_URL_SHOP to run E2E against the running legacy app (start-tomcat.sh).');

  test('TEST-0001 landing renders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    // Golden assertion: capture/compare landing structure once app is up.
    expect(await page.content()).toContain('<body');
  });

  test('TEST-0002 browse a category', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): click first category link; assert product list renders with formatted prices (RULE-0007).
  });

  test('TEST-0003 product details', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): open a product; assert name/price/attributes/add-to-cart present (FS-0001).
  });

  test('TEST-0004 search returns results', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): submit search; assert matching products returned.
  });
});
