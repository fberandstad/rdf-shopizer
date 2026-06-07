import { test, expect } from '@playwright/test';

// TEST-0005..0008 — Cart golden master. Links: FS-0002, RULE-0001/0002/0003/0005/0007.
const SHOP = process.env.BASE_URL_SHOP;

test.describe('Shopping cart (golden master)', () => {
  test.skip(!SHOP, 'Set BASE_URL_SHOP to run E2E (start-tomcat.sh).');

  test('TEST-0005 add valid product to cart', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): add product+qty+attrs; assert mini-cart count++ and server-computed totals (RULE-0007).
  });

  test('TEST-0006 reject invalid quantity', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): submit qty<=0; assert rejection/error and cart unchanged (RULE-0003).
  });

  test('TEST-0007 same SKU+options merges line', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): add same SKU twice; assert single line with summed quantity (RULE-0005).
  });

  test('TEST-0008 update/remove recomputes totals', async ({ page }) => {
    await page.goto('/');
    // TODO(golden): change qty/remove; assert totals recomputed (FS-0002).
  });
});
